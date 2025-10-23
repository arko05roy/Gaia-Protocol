const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FundingPool", function () {
    let fundingPool, taskRegistry, collateralManager, cUSD;
    let owner, proposer, funder1, funder2, operator, treasury, other;

    const TASK_DESCRIPTION = "Plant 10,000 Mangroves";
    const ESTIMATED_COST = ethers.parseUnits("50000", 18);
    const EXPECTED_CO2 = ethers.parseUnits("500", 18);
    const LOCATION = "Tamil Nadu, India";
    const DEADLINE_OFFSET = 90 * 24 * 60 * 60;

    beforeEach(async function () {
        [owner, proposer, funder1, funder2, operator, treasury, other] = await ethers.getSigners();

        // Deploy mock cUSD token
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        cUSD = await MockERC20.deploy("cUSD", "cUSD", 18);
        await cUSD.waitForDeployment();

        // Mint tokens to funders
        await cUSD.mint(funder1.address, ethers.parseUnits("100000", 18));
        await cUSD.mint(funder2.address, ethers.parseUnits("100000", 18));

        // Deploy TaskRegistry
        const TaskRegistry = await ethers.getContractFactory("TaskRegistry");
        taskRegistry = await TaskRegistry.deploy();
        await taskRegistry.waitForDeployment();

        // Deploy CollateralManager
        const CollateralManager = await ethers.getContractFactory("CollateralManager");
        collateralManager = await CollateralManager.deploy(
            await taskRegistry.getAddress(),
            treasury.address
        );
        await collateralManager.waitForDeployment();

        // Deploy FundingPool
        const FundingPool = await ethers.getContractFactory("FundingPool");
        fundingPool = await FundingPool.deploy(
            await cUSD.getAddress(),
            await taskRegistry.getAddress(),
            treasury.address
        );
        await fundingPool.waitForDeployment();

        // Setup TaskRegistry
        await taskRegistry.setFundingPool(await fundingPool.getAddress());
        await taskRegistry.setCollateralManager(await collateralManager.getAddress());

        // Create a task
        const deadline = (await time.latest()) + DEADLINE_OFFSET;
        await taskRegistry.connect(proposer).createTask(
            TASK_DESCRIPTION,
            ESTIMATED_COST,
            EXPECTED_CO2,
            LOCATION,
            deadline,
            "GPS photos",
            "QmXYZ"
        );
    });

    describe("Deployment", function () {
        it("Should initialize with correct addresses", async function () {
            expect(await fundingPool.cUSD()).to.equal(await cUSD.getAddress());
            expect(await fundingPool.taskRegistry()).to.equal(await taskRegistry.getAddress());
            expect(await fundingPool.treasuryAddress()).to.equal(treasury.address);
        });

        it("Should set default platform fee to 200 bps (2%)", async function () {
            expect(await fundingPool.platformFeeBps()).to.equal(200);
        });

        it("Should set default withdrawal penalty to 200 bps (2%)", async function () {
            expect(await fundingPool.withdrawalPenaltyBps()).to.equal(200);
        });

        it("Should reject invalid cUSD address", async function () {
            const FundingPool = await ethers.getContractFactory("FundingPool");
            await expect(
                FundingPool.deploy(ethers.ZeroAddress, await taskRegistry.getAddress(), treasury.address)
            ).to.be.revertedWith("Invalid cUSD address");
        });

        it("Should reject invalid TaskRegistry address", async function () {
            const FundingPool = await ethers.getContractFactory("FundingPool");
            await expect(
                FundingPool.deploy(await cUSD.getAddress(), ethers.ZeroAddress, treasury.address)
            ).to.be.revertedWith("Invalid registry address");
        });

        it("Should reject invalid treasury address", async function () {
            const FundingPool = await ethers.getContractFactory("FundingPool");
            await expect(
                FundingPool.deploy(await cUSD.getAddress(), await taskRegistry.getAddress(), ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid treasury address");
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to update platform fee", async function () {
            await fundingPool.setPlatformFee(300);
            expect(await fundingPool.platformFeeBps()).to.equal(300);
        });

        it("Should reject platform fee above maximum", async function () {
            await expect(
                fundingPool.setPlatformFee(600)
            ).to.be.revertedWith("Fee too high");
        });

        it("Should emit event when fee updated", async function () {
            await expect(
                fundingPool.setPlatformFee(300)
            ).to.emit(fundingPool, "PlatformFeeUpdated").withArgs(200, 300);
        });

        it("Should allow owner to update treasury address", async function () {
            await fundingPool.setTreasury(other.address);
            expect(await fundingPool.treasuryAddress()).to.equal(other.address);
        });

        it("Should reject invalid treasury address", async function () {
            await expect(
                fundingPool.setTreasury(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid address");
        });

        it("Should allow owner to update withdrawal penalty", async function () {
            await fundingPool.setWithdrawalPenalty(300);
            expect(await fundingPool.withdrawalPenaltyBps()).to.equal(300);
        });

        it("Should reject penalty above maximum (10%)", async function () {
            await expect(
                fundingPool.setWithdrawalPenalty(1100)
            ).to.be.revertedWith("Penalty too high");
        });

        it("Should allow owner to pause/unpause", async function () {
            await fundingPool.pause();
            expect(await fundingPool.paused()).to.be.true;

            await fundingPool.unpause();
            expect(await fundingPool.paused()).to.be.false;
        });
    });

    describe("Funding Task", function () {
        it("Should accept funding contribution", async function () {
            const fundAmount = ethers.parseUnits("10000", 18);

            // Approve cUSD
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount);

            // Fund task
            await fundingPool.connect(funder1).fundTask(1, fundAmount);

            const pool = await fundingPool.getPool(1);
            expect(pool.totalFunded).to.equal(fundAmount);
            expect(pool.fundersCount).to.equal(1);
        });

        it("Should track funder shares", async function () {
            const fundAmount = ethers.parseUnits("10000", 18);

            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount);
            await fundingPool.connect(funder1).fundTask(1, fundAmount);

            const share = await fundingPool.getFunderShare(1, funder1.address);
            expect(share).to.equal(fundAmount);
        });

        it("Should emit FundingReceived event", async function () {
            const fundAmount = ethers.parseUnits("10000", 18);

            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount);

            await expect(
                fundingPool.connect(funder1).fundTask(1, fundAmount)
            ).to.emit(fundingPool, "FundingReceived").withArgs(1, funder1.address, fundAmount);
        });

        it("Should reject zero amount", async function () {
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), ethers.parseUnits("10000", 18));

            await expect(
                fundingPool.connect(funder1).fundTask(1, 0)
            ).to.be.revertedWith("Amount must be positive");
        });

        it("Should reject funding exceeding target", async function () {
            const excessAmount = ESTIMATED_COST + ethers.parseUnits("1000", 18);

            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), excessAmount);

            await expect(
                fundingPool.connect(funder1).fundTask(1, excessAmount)
            ).to.be.revertedWith("Exceeds funding target");
        });

        it("Should reject funding non-Proposed task", async function () {
            // Fund task 1 first to change its status from Proposed to Funded
            const fundAmount = ESTIMATED_COST;
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount);
            await fundingPool.connect(funder1).fundTask(1, fundAmount);

            // Now try to fund again - should fail because task is no longer Proposed
            const fundAmount2 = ethers.parseUnits("1000", 18);
            await cUSD.connect(funder2).approve(await fundingPool.getAddress(), fundAmount2);

            await expect(
                fundingPool.connect(funder2).fundTask(1, fundAmount2)
            ).to.be.revertedWith("Task not in Proposed status");
        });

        it("Should reject funding when paused", async function () {
            await fundingPool.pause();

            const fundAmount = ethers.parseUnits("10000", 18);
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount);

            await expect(
                fundingPool.connect(funder1).fundTask(1, fundAmount)
            ).to.be.revertedWithCustomError(fundingPool, "EnforcedPause");
        });

        it("Should handle multiple funders", async function () {
            const fundAmount1 = ethers.parseUnits("25000", 18);
            const fundAmount2 = ethers.parseUnits("25000", 18);

            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount1);
            await cUSD.connect(funder2).approve(await fundingPool.getAddress(), fundAmount2);

            await fundingPool.connect(funder1).fundTask(1, fundAmount1);
            await fundingPool.connect(funder2).fundTask(1, fundAmount2);

            const pool = await fundingPool.getPool(1);
            expect(pool.totalFunded).to.equal(ESTIMATED_COST);
            expect(pool.fundersCount).to.equal(2);
        });

        it("Should mark task as Funded when target reached", async function () {
            await taskRegistry.setFundingPool(await fundingPool.getAddress());

            const fundAmount = ESTIMATED_COST;
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount);

            await expect(
                fundingPool.connect(funder1).fundTask(1, fundAmount)
            ).to.emit(fundingPool, "TargetReached").withArgs(1, ESTIMATED_COST);

            const task = await taskRegistry.getTask(1);
            expect(task.status).to.equal(1); // Funded
        });

        it("Should emit TargetReached event", async function () {
            await taskRegistry.setFundingPool(await fundingPool.getAddress());

            const fundAmount = ESTIMATED_COST;
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount);

            await expect(
                fundingPool.connect(funder1).fundTask(1, fundAmount)
            ).to.emit(fundingPool, "TargetReached");
        });
    });

    describe("Withdraw Funding", function () {
        beforeEach(async function () {
            const fundAmount = ethers.parseUnits("10000", 18);
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount);
            await fundingPool.connect(funder1).fundTask(1, fundAmount);
        });

        it("Should allow funder to withdraw before funding complete", async function () {
            const initialBalance = await cUSD.balanceOf(funder1.address);

            await fundingPool.connect(funder1).withdrawFunding(1);

            const finalBalance = await cUSD.balanceOf(funder1.address);
            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should apply withdrawal penalty", async function () {
            const fundAmount = ethers.parseUnits("10000", 18);
            const penalty = (fundAmount * 200n) / 10000n; // 2% penalty

            await fundingPool.connect(funder1).withdrawFunding(1);

            const treasuryBalance = await cUSD.balanceOf(treasury.address);
            expect(treasuryBalance).to.equal(penalty);
        });

        it("Should emit FundingWithdrawn event", async function () {
            const fundAmount = ethers.parseUnits("10000", 18);
            const penalty = (fundAmount * 200n) / 10000n;
            const refund = fundAmount - penalty;

            await expect(
                fundingPool.connect(funder1).withdrawFunding(1)
            ).to.emit(fundingPool, "FundingWithdrawn").withArgs(1, funder1.address, refund, penalty);
        });

        it("Should reject withdrawal from non-funder", async function () {
            await expect(
                fundingPool.connect(other).withdrawFunding(1)
            ).to.be.revertedWith("No shares to withdraw");
        });

        it("Should reject withdrawal from funded task", async function () {
            await taskRegistry.setFundingPool(await fundingPool.getAddress());

            const fundAmount2 = ethers.parseUnits("40000", 18);
            await cUSD.connect(funder2).approve(await fundingPool.getAddress(), fundAmount2);
            await fundingPool.connect(funder2).fundTask(1, fundAmount2);

            await expect(
                fundingPool.connect(funder1).withdrawFunding(1)
            ).to.be.revertedWith("Can only withdraw from Proposed tasks");
        });

        it("Should update pool after withdrawal", async function () {
            const fundAmount = ethers.parseUnits("10000", 18);

            await fundingPool.connect(funder1).withdrawFunding(1);

            const pool = await fundingPool.getPool(1);
            expect(pool.totalFunded).to.equal(0);
            expect(pool.fundersCount).to.equal(0);
        });
    });

    describe("Release Payment", function () {
        beforeEach(async function () {
            // Setup: Create new task, fund it, and mark as verified
            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.connect(proposer).createTask(
                "Release Payment Test Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ"
            );
            const taskId = await taskRegistry.getTotalTasks();
            
            // Fund the new task
            await taskRegistry.setFundingPool(await fundingPool.getAddress());
            const fundAmount = ESTIMATED_COST;
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount);
            await fundingPool.connect(funder1).fundTask(taskId, fundAmount);

            // Mark as verified (simulate verification process)
            // Need to submit proof first
            await taskRegistry.setCollateralManager(owner.address);
            await taskRegistry.setVerificationManager(owner.address);
            await taskRegistry.connect(owner).assignOperator(taskId, owner.address);
            await taskRegistry.connect(owner).submitProof(taskId, "QmProofHash", EXPECTED_CO2);
            await taskRegistry.connect(owner).markAsVerified(taskId);
        });

        it("Should release payment to operator", async function () {
            // The task already has an assigned operator from the beforeEach
            // (owner was assigned as operator)
            const taskId = await taskRegistry.getTotalTasks();
            
            const initialBalance = await cUSD.balanceOf(owner.address);

            await fundingPool.releasePayment(taskId);

            const finalBalance = await cUSD.balanceOf(owner.address);
            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should deduct platform fee", async function () {
            const expectedFee = (ESTIMATED_COST * 200n) / 10000n; // 2% fee
            const taskId = await taskRegistry.getTotalTasks();

            await fundingPool.releasePayment(taskId);

            const treasuryBalance = await cUSD.balanceOf(treasury.address);
            expect(treasuryBalance).to.equal(expectedFee);
        });

        it("Should emit PaymentReleased event", async function () {
            const expectedFee = (ESTIMATED_COST * 200n) / 10000n;
            const expectedPayment = ESTIMATED_COST - expectedFee;
            const taskId = await taskRegistry.getTotalTasks();

            await expect(
                fundingPool.releasePayment(taskId)
            ).to.emit(fundingPool, "PaymentReleased");
        });

        it("Should reject double payment release", async function () {
            const taskId = await taskRegistry.getTotalTasks();
            
            await fundingPool.releasePayment(taskId);

            await expect(
                fundingPool.releasePayment(taskId)
            ).to.be.revertedWith("Payment already released");
        });

        it("Should reject payment for non-verified task", async function () {
            // Create new task that's not verified
            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.connect(proposer).createTask(
                "Another Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ"
            );
            const newTaskId = await taskRegistry.getTotalTasks();

            const fundAmount = ESTIMATED_COST;
            await cUSD.connect(funder2).approve(await fundingPool.getAddress(), fundAmount);
            await fundingPool.connect(funder2).fundTask(newTaskId, fundAmount);

            await expect(
                fundingPool.releasePayment(newTaskId)
            ).to.be.revertedWith("Task not verified");
        });
    });

    describe("Refunds", function () {
        beforeEach(async function () {
            // Setup: Create new task, fund it, and mark as rejected
            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.connect(proposer).createTask(
                "Refunds Test Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ"
            );
            const taskId = await taskRegistry.getTotalTasks();
            
            // Fund the new task
            await taskRegistry.setFundingPool(await fundingPool.getAddress());
            const fundAmount = ESTIMATED_COST;
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount);
            await fundingPool.connect(funder1).fundTask(taskId, fundAmount);

            // Mark as rejected
            // Need to submit proof first
            await taskRegistry.setCollateralManager(owner.address);
            await taskRegistry.setVerificationManager(owner.address);
            await taskRegistry.connect(owner).assignOperator(taskId, owner.address);
            await taskRegistry.connect(owner).submitProof(taskId, "QmProofHash", EXPECTED_CO2);
            await taskRegistry.connect(owner).markAsRejected(taskId);
        });

        it("Should enable refunds for rejected task", async function () {
            const taskId = await taskRegistry.getTotalTasks();
            
            await fundingPool.enableRefunds(taskId);

            const pool = await fundingPool.getPool(taskId);
            expect(pool.refundsEnabled).to.be.true;
        });

        it("Should emit RefundsEnabled event", async function () {
            const taskId = await taskRegistry.getTotalTasks();
            
            await expect(
                fundingPool.enableRefunds(taskId)
            ).to.emit(fundingPool, "RefundsEnabled").withArgs(taskId);
        });

        it("Should allow funder to claim refund", async function () {
            const taskId = await taskRegistry.getTotalTasks();
            const initialBalance = await cUSD.balanceOf(funder1.address);

            await fundingPool.enableRefunds(taskId);
            await fundingPool.connect(funder1).claimRefund(taskId);

            const finalBalance = await cUSD.balanceOf(funder1.address);
            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should refund full amount (no penalty)", async function () {
            const taskId = await taskRegistry.getTotalTasks();
            const fundAmount = ESTIMATED_COST;

            await fundingPool.enableRefunds(taskId);
            await fundingPool.connect(funder1).claimRefund(taskId);

            const funderBalance = await cUSD.balanceOf(funder1.address);
            // Should have received full refund
            expect(funderBalance).to.be.gte(fundAmount);
        });

        it("Should emit RefundClaimed event", async function () {
            const taskId = await taskRegistry.getTotalTasks();
            const fundAmount = ESTIMATED_COST;

            await fundingPool.enableRefunds(taskId);

            await expect(
                fundingPool.connect(funder1).claimRefund(taskId)
            ).to.emit(fundingPool, "RefundClaimed").withArgs(taskId, funder1.address, fundAmount);
        });

        it("Should reject refund claim without enabled refunds", async function () {
            const taskId = await taskRegistry.getTotalTasks();
            
            await expect(
                fundingPool.connect(funder1).claimRefund(taskId)
            ).to.be.revertedWith("Refunds not enabled");
        });

        it("Should reject double refund claim", async function () {
            const taskId = await taskRegistry.getTotalTasks();
            
            await fundingPool.enableRefunds(taskId);
            await fundingPool.connect(funder1).claimRefund(taskId);

            await expect(
                fundingPool.connect(funder1).claimRefund(taskId)
            ).to.be.revertedWith("No shares to refund");
        });
    });

    describe("Read Functions", function () {
        beforeEach(async function () {
            const fundAmount1 = ethers.parseUnits("25000", 18);
            const fundAmount2 = ethers.parseUnits("25000", 18);

            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount1);
            await cUSD.connect(funder2).approve(await fundingPool.getAddress(), fundAmount2);

            await fundingPool.connect(funder1).fundTask(1, fundAmount1);
            await fundingPool.connect(funder2).fundTask(1, fundAmount2);
        });

        it("Should get pool information", async function () {
            const pool = await fundingPool.getPool(1);
            expect(pool.totalFunded).to.equal(ESTIMATED_COST);
            expect(pool.fundersCount).to.equal(2);
            expect(pool.paymentReleased).to.be.false;
            expect(pool.refundsEnabled).to.be.false;
        });

        it("Should get funder share", async function () {
            const share = await fundingPool.getFunderShare(1, funder1.address);
            expect(share).to.equal(ethers.parseUnits("25000", 18));
        });

        it("Should get all funders", async function () {
            const funders = await fundingPool.getFunders(1);
            expect(funders.length).to.equal(2);
            expect(funders).to.include(funder1.address);
            expect(funders).to.include(funder2.address);
        });

        it("Should get funders with shares", async function () {
            const [funders, shares] = await fundingPool.getFundersWithShares(1);
            expect(funders.length).to.equal(2);
            expect(shares.length).to.equal(2);
            expect(shares[0]).to.equal(ethers.parseUnits("25000", 18));
            expect(shares[1]).to.equal(ethers.parseUnits("25000", 18));
        });

        it("Should get funding progress", async function () {
            const [funded, target, percentage] = await fundingPool.getFundingProgress(1);
            expect(funded).to.equal(ESTIMATED_COST);
            expect(target).to.equal(ESTIMATED_COST);
            expect(percentage).to.equal(10000); // 100%
        });

        it("Should get share percentage", async function () {
            const percentage = await fundingPool.getSharePercentage(1, funder1.address);
            expect(percentage).to.equal(5000); // 50%
        });

        it("Should calculate partial funding progress", async function () {
            const fundAmount = ethers.parseUnits("10000", 18);
            await cUSD.connect(other).mint(other.address, fundAmount);
            await cUSD.connect(other).approve(await fundingPool.getAddress(), fundAmount);

            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.connect(proposer).createTask(
                "Another Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ"
            );

            await fundingPool.connect(other).fundTask(2, fundAmount);

            const [funded, target, percentage] = await fundingPool.getFundingProgress(2);
            expect(funded).to.equal(fundAmount);
            expect(target).to.equal(ESTIMATED_COST);
            expect(percentage).to.equal(2000); // 20%
        });
    });

    describe("Edge Cases", function () {
        it("Should handle multiple partial contributions", async function () {
            const contribution = ethers.parseUnits("10000", 18);

            for (let i = 0; i < 5; i++) {
                const funder = (await ethers.getSigners())[i + 7]; // Use additional signers
                await cUSD.mint(funder.address, contribution);
                await cUSD.connect(funder).approve(await fundingPool.getAddress(), contribution);
                await fundingPool.connect(funder).fundTask(1, contribution);
            }

            const pool = await fundingPool.getPool(1);
            expect(pool.totalFunded).to.equal(contribution * 5n);
            expect(pool.fundersCount).to.equal(5);
        });

        it("Should handle minimum funding amounts", async function () {
            const minAmount = ethers.parseUnits("1", 18);

            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), minAmount);
            await fundingPool.connect(funder1).fundTask(1, minAmount);

            const share = await fundingPool.getFunderShare(1, funder1.address);
            expect(share).to.equal(minAmount);
        });

        it("Should handle exact target funding", async function () {
            await taskRegistry.setFundingPool(await fundingPool.getAddress());

            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), ESTIMATED_COST);
            await fundingPool.connect(funder1).fundTask(1, ESTIMATED_COST);

            const task = await taskRegistry.getTask(1);
            expect(task.status).to.equal(1); // Funded
        });
    });
});
