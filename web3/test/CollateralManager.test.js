const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CollateralManager", function () {
    let collateralManager, taskRegistry;
    let owner, operator1, operator2, treasury, other;

    const TASK_DESCRIPTION = "Plant 10,000 Mangroves";
    const ESTIMATED_COST = ethers.parseEther("100"); // 100 ether
    const EXPECTED_CO2 = ethers.parseUnits("500", 18);
    const LOCATION = "Tamil Nadu, India";
    const DEADLINE_OFFSET = 90 * 24 * 60 * 60;
    const MINIMUM_STAKE = ethers.parseEther("1");

    beforeEach(async function () {
        [owner, operator1, operator2, treasury, other] = await ethers.getSigners();

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

        // Setup TaskRegistry
        await taskRegistry.setCollateralManager(await collateralManager.getAddress());

        // Create a task
        const deadline = (await time.latest()) + DEADLINE_OFFSET;
        await taskRegistry.createTask(
            TASK_DESCRIPTION,
            ESTIMATED_COST,
            EXPECTED_CO2,
            LOCATION,
            deadline,
            "GPS photos",
            "QmXYZ"
        );

        // Mark task as Funded (using owner as FundingPool)
        await taskRegistry.setFundingPool(owner.address);
        await taskRegistry.connect(owner).markAsFunded(1);
    });

    describe("Deployment", function () {
        it("Should initialize with correct addresses", async function () {
            expect(await collateralManager.taskRegistry()).to.equal(await taskRegistry.getAddress());
            expect(await collateralManager.treasuryAddress()).to.equal(treasury.address);
        });

        it("Should set default minimum stake percentage to 10%", async function () {
            expect(await collateralManager.minimumStakePercentage()).to.equal(1000);
        });

        it("Should set default minimum operator stake to 1 ether", async function () {
            expect(await collateralManager.minimumOperatorStake()).to.equal(MINIMUM_STAKE);
        });

        it("Should reject invalid TaskRegistry address", async function () {
            const CollateralManager = await ethers.getContractFactory("CollateralManager");
            await expect(
                CollateralManager.deploy(ethers.ZeroAddress, treasury.address)
            ).to.be.revertedWith("Invalid registry address");
        });

        it("Should reject invalid treasury address", async function () {
            const CollateralManager = await ethers.getContractFactory("CollateralManager");
            await expect(
                CollateralManager.deploy(await taskRegistry.getAddress(), ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid treasury address");
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to set verification manager", async function () {
            await collateralManager.setVerificationManager(other.address);
            expect(await collateralManager.verificationManagerAddress()).to.equal(other.address);
        });

        it("Should reject invalid verification manager address", async function () {
            await expect(
                collateralManager.setVerificationManager(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid address");
        });

        it("Should allow owner to update minimum stake percentage", async function () {
            await collateralManager.setMinimumStakePercentage(1500); // 15%
            expect(await collateralManager.minimumStakePercentage()).to.equal(1500);
        });

        it("Should reject stake percentage above 50%", async function () {
            await expect(
                collateralManager.setMinimumStakePercentage(5100)
            ).to.be.revertedWith("Max 50%");
        });

        it("Should allow owner to update minimum operator stake", async function () {
            const newMinimum = ethers.parseEther("2");
            await collateralManager.setMinimumOperatorStake(newMinimum);
            expect(await collateralManager.minimumOperatorStake()).to.equal(newMinimum);
        });

        it("Should allow owner to ban operator", async function () {
            await collateralManager.banOperator(operator1.address, "Fraud detected");

            const [isApproved] = await collateralManager.getOperatorInfo(operator1.address);
            expect(isApproved).to.be.false;
        });

        it("Should allow owner to pause/unpause", async function () {
            await collateralManager.pause();
            expect(await collateralManager.paused()).to.be.true;

            await collateralManager.unpause();
            expect(await collateralManager.paused()).to.be.false;
        });
    });

    describe("Operator Registration", function () {
        it("Should register operator with sufficient stake", async function () {
            const stakeAmount = ethers.parseEther("2");

            await collateralManager.connect(operator1).registerOperator({ value: stakeAmount });

            const [isApproved, availableStake, totalStake] = await collateralManager.getOperatorInfo(operator1.address);
            expect(isApproved).to.be.true;
            expect(availableStake).to.equal(stakeAmount);
            expect(totalStake).to.equal(stakeAmount);
        });

        it("Should emit OperatorRegistered event", async function () {
            const stakeAmount = ethers.parseEther("2");

            await expect(
                collateralManager.connect(operator1).registerOperator({ value: stakeAmount })
            ).to.emit(collateralManager, "OperatorRegistered").withArgs(operator1.address, stakeAmount);
        });

        it("Should reject registration with insufficient stake", async function () {
            const insufficientStake = ethers.parseEther("0.5");

            await expect(
                collateralManager.connect(operator1).registerOperator({ value: insufficientStake })
            ).to.be.revertedWith("Insufficient stake");
        });

        it("Should reject double registration", async function () {
            const stakeAmount = ethers.parseEther("2");

            await collateralManager.connect(operator1).registerOperator({ value: stakeAmount });

            await expect(
                collateralManager.connect(operator1).registerOperator({ value: stakeAmount })
            ).to.be.revertedWith("Already registered");
        });

        it("Should reject registration when paused", async function () {
            await collateralManager.pause();

            const stakeAmount = ethers.parseEther("2");

            await expect(
                collateralManager.connect(operator1).registerOperator({ value: stakeAmount })
            ).to.be.revertedWithCustomError(collateralManager, "EnforcedPause");
        });
    });

    describe("Stake Management", function () {
        beforeEach(async function () {
            const stakeAmount = ethers.parseEther("10");
            await collateralManager.connect(operator1).registerOperator({ value: stakeAmount });
        });

        it("Should allow operator to add stake", async function () {
            const additionalStake = ethers.parseEther("5");

            await collateralManager.connect(operator1).addStake({ value: additionalStake });

            const [, availableStake, totalStake] = await collateralManager.getOperatorInfo(operator1.address);
            expect(availableStake).to.equal(ethers.parseEther("15"));
            expect(totalStake).to.equal(ethers.parseEther("15"));
        });

        it("Should emit StakeAdded event", async function () {
            const additionalStake = ethers.parseEther("5");

            await expect(
                collateralManager.connect(operator1).addStake({ value: additionalStake })
            ).to.emit(collateralManager, "StakeAdded").withArgs(operator1.address, additionalStake);
        });

        it("Should reject adding zero stake", async function () {
            await expect(
                collateralManager.connect(operator1).addStake({ value: 0 })
            ).to.be.revertedWith("Amount must be positive");
        });

        it("Should reject adding stake for non-registered operator", async function () {
            await expect(
                collateralManager.connect(other).addStake({ value: ethers.parseEther("1") })
            ).to.be.revertedWith("Not registered");
        });

        it("Should allow operator to withdraw stake", async function () {
            const withdrawAmount = ethers.parseEther("2");
            const initialBalance = await ethers.provider.getBalance(operator1.address);

            const tx = await collateralManager.connect(operator1).withdrawStake(withdrawAmount);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const finalBalance = await ethers.provider.getBalance(operator1.address);
            expect(finalBalance).to.be.closeTo(initialBalance + withdrawAmount - gasUsed, ethers.parseEther("0.01"));
        });

        it("Should emit StakeWithdrawn event", async function () {
            const withdrawAmount = ethers.parseEther("2");

            await expect(
                collateralManager.connect(operator1).withdrawStake(withdrawAmount)
            ).to.emit(collateralManager, "StakeWithdrawn").withArgs(operator1.address, withdrawAmount);
        });

        it("Should reject withdrawal below minimum stake", async function () {
            const withdrawAmount = ethers.parseEther("9.5");

            await expect(
                collateralManager.connect(operator1).withdrawStake(withdrawAmount)
            ).to.be.revertedWith("Below minimum stake");
        });

        it("Should allow full withdrawal and deregister", async function () {
            const fullStake = ethers.parseEther("10");

            await collateralManager.connect(operator1).withdrawStake(fullStake);

            const [isApproved] = await collateralManager.getOperatorInfo(operator1.address);
            expect(isApproved).to.be.false;
        });
    });

    describe("Task Staking", function () {
        beforeEach(async function () {
            const stakeAmount = ethers.parseEther("10"); // Sufficient for 10% of 100 ether
            await collateralManager.connect(operator1).registerOperator({ value: stakeAmount });
            
            // Ensure task is marked as Funded
            // The outer beforeEach should have already done this, but we'll do it again to be safe
            await taskRegistry.setFundingPool(owner.address);
            try {
                await taskRegistry.connect(owner).markAsFunded(1);
            } catch (e) {
                // Task might already be Funded, that's ok
            }
        });

        it("Should stake for task and assign operator", async function () {
            await collateralManager.connect(operator1).stakeForTask(1);

            const task = await taskRegistry.getTask(1);
            expect(task.assignedOperator).to.equal(operator1.address);
            expect(task.status).to.equal(2); // InProgress
        });

        it("Should emit StakedForTask event", async function () {
            const requiredStake = (ESTIMATED_COST * 1000n) / 10000n; // 10%

            await expect(
                collateralManager.connect(operator1).stakeForTask(1)
            ).to.emit(collateralManager, "StakedForTask").withArgs(1, operator1.address, requiredStake);
        });

        it("Should lock required stake", async function () {
            const requiredStake = (ESTIMATED_COST * 1000n) / 10000n;

            await collateralManager.connect(operator1).stakeForTask(1);

            const [, availableStake] = await collateralManager.getOperatorInfo(operator1.address);
            expect(availableStake).to.equal(ethers.parseEther("10") - requiredStake);
        });

        it("Should reject staking for non-Funded task", async function () {
            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.createTask(
                "Another Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ"
            );

            await expect(
                collateralManager.connect(operator1).stakeForTask(2)
            ).to.be.revertedWith("Task not funded");
        });

        it("Should reject staking for already assigned task", async function () {
            // First operator stakes for task 1
            await collateralManager.connect(operator1).stakeForTask(1);

            // Verify task is assigned to operator1
            let task = await taskRegistry.getTask(1);
            expect(task.assignedOperator).to.equal(operator1.address);
            
            // Second operator tries to stake for same task (which is now InProgress)
            const stakeAmount = ethers.parseEther("10");
            await collateralManager.connect(operator2).registerOperator({ value: stakeAmount });
            
            await expect(
                collateralManager.connect(operator2).stakeForTask(1)
            ).to.be.revertedWith("Task not funded");
        });

        it("Should reject staking with insufficient available stake", async function () {
            // Withdraw most of the stake
            await collateralManager.connect(operator1).withdrawStake(ethers.parseEther("9"));

            await expect(
                collateralManager.connect(operator1).stakeForTask(1)
            ).to.be.revertedWith("Insufficient available stake");
        });

        it("Should reject staking from non-registered operator", async function () {
            await expect(
                collateralManager.connect(other).stakeForTask(1)
            ).to.be.revertedWith("Not registered operator");
        });

        it("Should reject staking when paused", async function () {
            await collateralManager.pause();

            await expect(
                collateralManager.connect(operator1).stakeForTask(1)
            ).to.be.revertedWithCustomError(collateralManager, "EnforcedPause");
        });
    });

    describe("Stake Release and Slashing", function () {
        beforeEach(async function () {
            const stakeAmount = ethers.parseEther("10");
            await collateralManager.connect(operator1).registerOperator({ value: stakeAmount });
            await collateralManager.setVerificationManager(owner.address);
            await collateralManager.connect(operator1).stakeForTask(1);
        });

        it("Should release stake after successful verification", async function () {
            const requiredStake = (ESTIMATED_COST * 1000n) / 10000n;
            const initialAvailable = ethers.parseEther("10") - requiredStake;

            await collateralManager.releaseStake(1);

            const [, availableStake] = await collateralManager.getOperatorInfo(operator1.address);
            expect(availableStake).to.equal(ethers.parseEther("10"));
        });

        it("Should emit StakeReleased event", async function () {
            const requiredStake = (ESTIMATED_COST * 1000n) / 10000n;

            await expect(
                collateralManager.releaseStake(1)
            ).to.emit(collateralManager, "StakeReleased").withArgs(1, operator1.address, requiredStake);
        });

        it("Should slash stake for failed verification", async function () {
            const requiredStake = (ESTIMATED_COST * 1000n) / 10000n;

            await collateralManager.slashStake(1, 10000, "Failed verification");

            const [, availableStake, totalStake] = await collateralManager.getOperatorInfo(operator1.address);
            expect(availableStake).to.equal(0);
            expect(totalStake).to.equal(0);
        });

        it("Should send slashed amount to treasury", async function () {
            const requiredStake = (ESTIMATED_COST * 1000n) / 10000n;
            const initialBalance = await ethers.provider.getBalance(treasury.address);

            await collateralManager.slashStake(1, 10000, "Failed verification");

            const finalBalance = await ethers.provider.getBalance(treasury.address);
            expect(finalBalance).to.equal(initialBalance + requiredStake);
        });

        it("Should emit StakeSlashed event", async function () {
            const requiredStake = (ESTIMATED_COST * 1000n) / 10000n;

            await expect(
                collateralManager.slashStake(1, 10000, "Failed verification")
            ).to.emit(collateralManager, "StakeSlashed").withArgs(1, operator1.address, requiredStake, "Failed verification");
        });

        it("Should partially slash stake", async function () {
            const requiredStake = (ESTIMATED_COST * 1000n) / 10000n;
            const slashAmount = requiredStake / 2n;

            await collateralManager.slashStake(1, 5000, "Partial failure");

            const [, availableStake] = await collateralManager.getOperatorInfo(operator1.address);
            expect(availableStake).to.equal(ethers.parseEther("10") - slashAmount);
        });

        it("Should ban operator on full slash", async function () {
            await collateralManager.slashStake(1, 10000, "Fraud");

            const [isApproved] = await collateralManager.getOperatorInfo(operator1.address);
            expect(isApproved).to.be.false;
        });

        it("Should emit OperatorBanned event on full slash", async function () {
            await expect(
                collateralManager.slashStake(1, 10000, "Fraud")
            ).to.emit(collateralManager, "OperatorBanned").withArgs(operator1.address, "Fraud");
        });

        it("Should reject invalid slash percentage", async function () {
            await expect(
                collateralManager.slashStake(1, 10001, "Invalid")
            ).to.be.revertedWith("Invalid percentage");
        });
    });

    describe("Read Functions", function () {
        beforeEach(async function () {
            const stakeAmount = ethers.parseEther("10");
            await collateralManager.connect(operator1).registerOperator({ value: stakeAmount });
        });

        it("Should get operator info", async function () {
            const [isApproved, availableStake, totalStake] = await collateralManager.getOperatorInfo(operator1.address);
            expect(isApproved).to.be.true;
            expect(availableStake).to.equal(ethers.parseEther("10"));
            expect(totalStake).to.equal(ethers.parseEther("10"));
        });

        it("Should get task stake info", async function () {
            await collateralManager.connect(operator1).stakeForTask(1);

            const stakeInfo = await collateralManager.getTaskStake(1);
            expect(stakeInfo.operator).to.equal(operator1.address);
            expect(stakeInfo.status).to.equal(1); // Locked
        });

        it("Should calculate required stake", async function () {
            const requiredStake = await collateralManager.getRequiredStake(1);
            const expectedStake = (ESTIMATED_COST * 1000n) / 10000n;
            expect(requiredStake).to.equal(expectedStake);
        });

        it("Should check if operator can accept task", async function () {
            const [canAccept, reason] = await collateralManager.canAcceptTask(operator1.address, 1);
            expect(canAccept).to.be.true;
            expect(reason).to.equal("");
        });

        it("Should reject if operator not registered", async function () {
            const [canAccept, reason] = await collateralManager.canAcceptTask(other.address, 1);
            expect(canAccept).to.be.false;
            expect(reason).to.equal("Not registered operator");
        });

        it("Should reject if task not funded", async function () {
            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.createTask(
                "Another Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ"
            );

            const [canAccept, reason] = await collateralManager.canAcceptTask(operator1.address, 2);
            expect(canAccept).to.be.false;
            expect(reason).to.equal("Task not funded");
        });

        it("Should reject if insufficient stake", async function () {
            await collateralManager.connect(operator1).withdrawStake(ethers.parseEther("9"));

            const [canAccept, reason] = await collateralManager.canAcceptTask(operator1.address, 1);
            expect(canAccept).to.be.false;
            expect(reason).to.equal("Insufficient available stake");
        });

        it("Should get locked stake amount", async function () {
            await collateralManager.connect(operator1).stakeForTask(1);

            const lockedStake = await collateralManager.getLockedStake(operator1.address);
            const requiredStake = (ESTIMATED_COST * 1000n) / 10000n;
            expect(lockedStake).to.equal(requiredStake);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle multiple operators", async function () {
            const stakeAmount = ethers.parseEther("10");

            await collateralManager.connect(operator1).registerOperator({ value: stakeAmount });
            await collateralManager.connect(operator2).registerOperator({ value: stakeAmount });

            const [isApproved1] = await collateralManager.getOperatorInfo(operator1.address);
            const [isApproved2] = await collateralManager.getOperatorInfo(operator2.address);

            expect(isApproved1).to.be.true;
            expect(isApproved2).to.be.true;
        });

        it("Should handle large stake amounts", async function () {
            const largeStake = ethers.parseEther("1000");

            await collateralManager.connect(operator1).registerOperator({ value: largeStake });

            const [, availableStake] = await collateralManager.getOperatorInfo(operator1.address);
            expect(availableStake).to.equal(largeStake);
        });

        it("Should handle minimum stake boundary", async function () {
            const minStake = MINIMUM_STAKE;

            await collateralManager.connect(operator1).registerOperator({ value: minStake });

            const [isApproved] = await collateralManager.getOperatorInfo(operator1.address);
            expect(isApproved).to.be.true;
        });
    });
});
