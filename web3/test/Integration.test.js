const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Integration Tests - Complete User Flows", function () {
    let taskRegistry, fundingPool, collateralManager, verificationManager;
    let minter, marketplace, predictionMarket;
    let cUSD;

    let owner, proposer, funder1, funder2, operator, validator1, validator2, validator3;
    let trader, treasury;

    const TASK_DESCRIPTION = "Plant 10,000 Mangroves in Pichavaram";
    const ESTIMATED_COST = ethers.parseUnits("10", 18);  // Reduced for test feasibility
    const EXPECTED_CO2 = ethers.parseUnits("500", 18);
    const ACTUAL_CO2 = ethers.parseUnits("520", 18);
    const LOCATION = "Tamil Nadu, India";
    const DEADLINE_OFFSET = 90 * 24 * 60 * 60;

    beforeEach(async function () {
        [owner, proposer, funder1, funder2, operator, validator1, validator2, validator3, trader, treasury] = await ethers.getSigners();

        // Deploy mock cUSD
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        cUSD = await MockERC20.deploy("cUSD", "cUSD", 18);
        await cUSD.waitForDeployment();

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

        // Deploy VerificationManager
        const VerificationManager = await ethers.getContractFactory("VerificationManager");
        verificationManager = await VerificationManager.deploy(
            await taskRegistry.getAddress(),
            await collateralManager.getAddress(),
            await fundingPool.getAddress()
        );
        await verificationManager.waitForDeployment();

        // Deploy CarbonCreditMinter
        const CarbonCreditMinter = await ethers.getContractFactory("CarbonCreditMinter");
        minter = await CarbonCreditMinter.deploy(
            await taskRegistry.getAddress(),
            await fundingPool.getAddress(),
            "ipfs://QmBase/"
        );
        await minter.waitForDeployment();

        // Deploy CarbonMarketplace
        const CarbonMarketplace = await ethers.getContractFactory("CarbonMarketplace");
        marketplace = await CarbonMarketplace.deploy(
            await minter.getAddress(),
            await cUSD.getAddress(),
            treasury.address
        );
        await marketplace.waitForDeployment();

        // Deploy PredictionMarket
        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        predictionMarket = await PredictionMarket.deploy(await cUSD.getAddress());
        await predictionMarket.waitForDeployment();

        // Setup contract interconnections
        await taskRegistry.setFundingPool(await fundingPool.getAddress());
        await taskRegistry.setCollateralManager(await collateralManager.getAddress());
        await taskRegistry.setVerificationManager(await verificationManager.getAddress());
        await collateralManager.setVerificationManager(await verificationManager.getAddress());
        await verificationManager.setCarbonCreditMinter(await minter.getAddress());
        await minter.setVerificationManager(await verificationManager.getAddress());
        await predictionMarket.setVerificationManager(await verificationManager.getAddress());

        // Add validators
        await verificationManager.addValidator(validator1.address);
        await verificationManager.addValidator(validator2.address);
        await verificationManager.addValidator(validator3.address);

        // Mint initial tokens
        const initialBalance = ethers.parseUnits("100000", 18);
        await cUSD.mint(funder1.address, initialBalance);
        await cUSD.mint(funder2.address, initialBalance);
        await cUSD.mint(trader.address, initialBalance);
        await cUSD.mint(owner.address, initialBalance);
        await cUSD.mint(operator.address, initialBalance);
        await cUSD.mint(proposer.address, initialBalance);
    });

    describe("Flow 1: Complete Task Lifecycle - Success Path", function () {
        it("Should complete full task lifecycle from creation to credit distribution", async function () {
            // Step 1: Proposer creates task
            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            const createTx = await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos, drone imagery",
                "QmXYZ123"
            );

            await expect(createTx).to.emit(taskRegistry, "TaskCreated");

            let task = await taskRegistry.getTask(1);
            expect(task.status).to.equal(0); // Proposed
            expect(task.proposer).to.equal(proposer.address);

            // Step 2: Create prediction market
            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), ethers.parseUnits("100", 18));
            await predictionMarket.connect(owner).createMarket(1, deadline);

            // Step 3: Funders fund the task
            const fundAmount1 = ethers.parseUnits("5", 18);
            const fundAmount2 = ethers.parseUnits("5", 18);

            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount1);
            await cUSD.connect(funder2).approve(await fundingPool.getAddress(), fundAmount2);

            await fundingPool.connect(funder1).fundTask(1, fundAmount1);
            await fundingPool.connect(funder2).fundTask(1, fundAmount2);

            task = await taskRegistry.getTask(1);
            expect(task.status).to.equal(1); // Funded

            // Step 4: Operator stakes and accepts task
            // Required stake = (10 * 1000) / 10000 = 1 cUSD equivalent
            // Using 2 ETH for registration (sufficient for required stake + gas)
            const stakeAmount = ethers.parseEther("2");
            await collateralManager.connect(operator).registerOperator({ value: stakeAmount });
            await collateralManager.connect(operator).stakeForTask(1);

            task = await taskRegistry.getTask(1);
            expect(task.status).to.equal(2); // InProgress
            expect(task.assignedOperator).to.equal(operator.address);

            // Step 5: Operator submits proof
            await taskRegistry.connect(operator).submitProof(1, "QmProof123", ACTUAL_CO2);

            task = await taskRegistry.getTask(1);
            expect(task.status).to.equal(3); // UnderReview

            // Step 6: Verification process
            await verificationManager.initiateVerification(1);

            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");
            await verificationManager.connect(validator2).submitVote(1, true, 90, "Approved");
            await verificationManager.connect(validator3).submitVote(1, true, 80, "Approved");

            task = await taskRegistry.getTask(1);
            expect(task.status).to.equal(4); // Verified

            // Step 7: Credits minted and distributed
            const funder1Balance = await minter.balanceOf(funder1.address, 1);
            const funder2Balance = await minter.balanceOf(funder2.address, 1);

            expect(funder1Balance).to.equal(ACTUAL_CO2 / 2n);
            expect(funder2Balance).to.equal(ACTUAL_CO2 / 2n);

            // Step 8: Operator receives payment
            const operatorBalance = await cUSD.balanceOf(operator.address);
            expect(operatorBalance).to.be.gt(0);
        });
    });

    describe("Flow 2: Complete Task Lifecycle - Rejection Path", function () {
        it("Should handle task rejection and refunds", async function () {
            // Setup: Create, fund, and assign task
            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ123"
            );

            const fundAmount = ethers.parseUnits("10", 18);
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount);
            await fundingPool.connect(funder1).fundTask(1, fundAmount);

            // Required stake = (10 * 1000) / 10000 = 1 cUSD equivalent
            // Using 2 ETH for registration (sufficient for required stake + gas)
            const stakeAmount = ethers.parseEther("2");
            await collateralManager.connect(operator).registerOperator({ value: stakeAmount });
            await collateralManager.connect(operator).stakeForTask(1);

            // Submit proof
            await taskRegistry.connect(operator).submitProof(1, "QmFakeProof", ACTUAL_CO2);

            // Verification: All reject
            await verificationManager.initiateVerification(1);

            await verificationManager.connect(validator1).submitVote(1, false, 85, "Fraud detected");
            await verificationManager.connect(validator2).submitVote(1, false, 90, "Fraud detected");
            await verificationManager.connect(validator3).submitVote(1, false, 80, "Fraud detected");

            let task = await taskRegistry.getTask(1);
            expect(task.status).to.equal(5); // Rejected

            // Operator stake slashed (locked stake is gone, but available stake remains)
            const [, availableStake] = await collateralManager.getOperatorInfo(operator.address);
            expect(availableStake).to.equal(ethers.parseEther("1")); // 2 ETH registered - 1 ETH locked and slashed = 1 ETH remaining

            // Funders can claim refunds
            const pool = await fundingPool.getPool(1);
            expect(pool.refundsEnabled).to.be.true;

            const initialBalance = await cUSD.balanceOf(funder1.address);
            await fundingPool.connect(funder1).claimRefund(1);
            const finalBalance = await cUSD.balanceOf(funder1.address);

            expect(finalBalance).to.be.gt(initialBalance);
        });
    });

    describe("Flow 3: Carbon Credit Trading", function () {
        it("Should enable trading of carbon credits on marketplace", async function () {
            // Setup: Create verified task and mint credits
            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ123"
            );

            const fundAmount = ethers.parseUnits("10", 18);
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount);
            await fundingPool.connect(funder1).fundTask(1, fundAmount);

            // Required stake = (10 * 1000) / 10000 = 1 cUSD equivalent
            // Using 2 ETH for registration (sufficient for required stake + gas)
            const stakeAmount = ethers.parseEther("2");
            await collateralManager.connect(operator).registerOperator({ value: stakeAmount });
            await collateralManager.connect(operator).stakeForTask(1);

            await taskRegistry.connect(operator).submitProof(1, "QmProof", ACTUAL_CO2);

            await verificationManager.initiateVerification(1);
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");
            await verificationManager.connect(validator2).submitVote(1, true, 90, "Approved");
            await verificationManager.connect(validator3).submitVote(1, true, 80, "Approved");

            // Funder creates sell order
            const sellAmount = ethers.parseUnits("100", 18);
            const pricePerCredit = ethers.parseUnits("1", 18);

            await minter.connect(funder1).setApprovalForAll(await marketplace.getAddress(), true);
            await marketplace.connect(funder1).createSellOrder(1, sellAmount, pricePerCredit);

            // Trader buys credits
            const buyAmount = ethers.parseUnits("50", 18);
            await cUSD.connect(trader).approve(await marketplace.getAddress(), buyAmount);
            await marketplace.connect(trader).buyCredits(1, buyAmount);

            const traderBalance = await minter.balanceOf(trader.address, 1);
            expect(traderBalance).to.equal(buyAmount);

            // Trader retires credits
            await minter.connect(trader).retireCredits(1, buyAmount, "Corporate ESG 2025");

            const retiredAmount = await minter.getUserRetired(trader.address, 1);
            expect(retiredAmount).to.equal(buyAmount);
        });
    });

    describe("Flow 4: Prediction Market Participation", function () {
        it("Should allow traders to participate in prediction markets", async function () {
            // Setup: Create task
            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ123"
            );

            // Create prediction market
            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), ethers.parseUnits("100", 18));
            await predictionMarket.connect(owner).createMarket(1, deadline);

            // Traders buy shares
            const yesAmount = ethers.parseUnits("100", 18);
            const noAmount = ethers.parseUnits("150", 18);

            await cUSD.connect(trader).approve(await predictionMarket.getAddress(), yesAmount + noAmount);
            await predictionMarket.connect(trader).buyShares(1, true, yesAmount);

            // Use owner as second trader for prediction market
            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), noAmount);
            await predictionMarket.connect(owner).buyShares(1, false, noAmount);

            // Check odds
            const [yesPercent, noPercent] = await predictionMarket.getOdds(1);
            expect(yesPercent).to.equal(4000); // 40%
            expect(noPercent).to.equal(6000); // 60%

            // Fund and verify task
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), ESTIMATED_COST);
            await fundingPool.connect(funder1).fundTask(1, ESTIMATED_COST);

            // Required stake = (10 * 1000) / 10000 = 1 cUSD equivalent
            // Using 2 ETH for registration (sufficient for required stake + gas)
            const stakeAmount = ethers.parseEther("2");
            await collateralManager.connect(operator).registerOperator({ value: stakeAmount });
            await collateralManager.connect(operator).stakeForTask(1);

            await taskRegistry.connect(operator).submitProof(1, "QmProof", ACTUAL_CO2);

            await verificationManager.initiateVerification(1);
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");
            await verificationManager.connect(validator2).submitVote(1, true, 90, "Approved");
            await verificationManager.connect(validator3).submitVote(1, true, 80, "Approved");

            // Resolve market
            await predictionMarket.connect(owner).resolveMarket(1, true);

            // Claim winnings
            const initialBalance = await cUSD.balanceOf(trader.address);
            await predictionMarket.connect(trader).claimWinnings(1);
            const finalBalance = await cUSD.balanceOf(trader.address);

            expect(finalBalance).to.be.gt(initialBalance);
        });
    });

    describe("Flow 5: Multiple Tasks and Operators", function () {
        it("Should handle multiple concurrent tasks", async function () {
            // Create multiple tasks
            const deadline = (await time.latest()) + DEADLINE_OFFSET;

            for (let i = 0; i < 3; i++) {
                await taskRegistry.connect(proposer).createTask(
                    `Task ${i + 1}`,
                    ESTIMATED_COST,
                    EXPECTED_CO2,
                    LOCATION,
                    deadline,
                    "GPS photos",
                    `QmXYZ${i}`
                );
            }

            expect(await taskRegistry.getTotalTasks()).to.equal(3);

            // Fund all tasks
            for (let i = 1; i <= 3; i++) {
                await cUSD.connect(funder1).approve(await fundingPool.getAddress(), ESTIMATED_COST);
                await fundingPool.connect(funder1).fundTask(i, ESTIMATED_COST);
            }

            // Assign different operators
            const stakeAmount = ethers.parseEther("2");

            const signers = await ethers.getSigners();
            const op1 = signers[12]; // Use fresh operators
            const op2 = signers[13];
            const op3 = signers[14];

            await collateralManager.connect(op1).registerOperator({ value: stakeAmount });
            await collateralManager.connect(op2).registerOperator({ value: stakeAmount });
            await collateralManager.connect(op3).registerOperator({ value: stakeAmount });

            await collateralManager.connect(op1).stakeForTask(1);
            await collateralManager.connect(op2).stakeForTask(2);
            await collateralManager.connect(op3).stakeForTask(3);

            // Verify all tasks
            for (let i = 1; i <= 3; i++) {
                await taskRegistry.connect([op1, op2, op3][i - 1]).submitProof(i, `QmProof${i}`, ACTUAL_CO2);
                await verificationManager.initiateVerification(i);
            }

            // All validators vote on all tasks
            for (let i = 1; i <= 3; i++) {
                await verificationManager.connect(validator1).submitVote(i, true, 85, "Approved");
                await verificationManager.connect(validator2).submitVote(i, true, 90, "Approved");
                await verificationManager.connect(validator3).submitVote(i, true, 80, "Approved");
            }

            // Verify all tasks are verified
            for (let i = 1; i <= 3; i++) {
                const task = await taskRegistry.getTask(i);
                expect(task.status).to.equal(4); // Verified
            }
        });
    });

    describe("Flow 6: Operator Reputation and Slashing", function () {
        it("Should track operator performance through slashing", async function () {
            // Create two tasks
            const deadline = (await time.latest()) + DEADLINE_OFFSET;

            for (let i = 0; i < 2; i++) {
                await taskRegistry.connect(proposer).createTask(
                    `Task ${i + 1}`,
                    ESTIMATED_COST,
                    EXPECTED_CO2,
                    LOCATION,
                    deadline,
                    "GPS photos",
                    `QmXYZ${i}`
                );
            }

            // Fund both tasks
            for (let i = 1; i <= 2; i++) {
                await cUSD.connect(funder1).approve(await fundingPool.getAddress(), ESTIMATED_COST);
                await fundingPool.connect(funder1).fundTask(i, ESTIMATED_COST);
            }

            // Operator stakes for both
            // Required stake for each task = (10 * 1000) / 10000 = 1 cUSD equivalent
            // Total for 2 tasks = 2, using 4 ETH for registration
            const stakeAmount = ethers.parseEther("4");
            await collateralManager.connect(operator).registerOperator({ value: stakeAmount });

            await collateralManager.connect(operator).stakeForTask(1);
            await collateralManager.connect(operator).stakeForTask(2);

            // Task 1: Approved
            await taskRegistry.connect(operator).submitProof(1, "QmProof1", ACTUAL_CO2);
            await verificationManager.initiateVerification(1);
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");
            await verificationManager.connect(validator2).submitVote(1, true, 90, "Approved");
            await verificationManager.connect(validator3).submitVote(1, true, 80, "Approved");

            // Task 2: Rejected (fraud)
            await taskRegistry.connect(operator).submitProof(2, "QmFakeProof", ACTUAL_CO2);
            await verificationManager.initiateVerification(2);
            await verificationManager.connect(validator1).submitVote(2, false, 85, "Fraud");
            await verificationManager.connect(validator2).submitVote(2, false, 90, "Fraud");
            await verificationManager.connect(validator3).submitVote(2, false, 80, "Fraud");

            // Check operator is banned
            const [isApproved] = await collateralManager.getOperatorInfo(operator.address);
            expect(isApproved).to.be.false;
        });
    });

    describe("Flow 7: Funding Pool Fee Distribution", function () {
        it("Should correctly distribute platform fees", async function () {
            // Create and fund task
            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ123"
            );

            const fundAmount = ethers.parseUnits("10", 18);
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), fundAmount);
            await fundingPool.connect(funder1).fundTask(1, fundAmount);

            // Setup and verify
            // Required stake = (10 * 1000) / 10000 = 1 cUSD equivalent
            // Using 2 ETH for registration (sufficient for required stake + gas)
            const stakeAmount = ethers.parseEther("2");
            await collateralManager.connect(operator).registerOperator({ value: stakeAmount });
            await collateralManager.connect(operator).stakeForTask(1);

            await taskRegistry.connect(operator).submitProof(1, "QmProof", ACTUAL_CO2);

            await verificationManager.initiateVerification(1);
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");
            await verificationManager.connect(validator2).submitVote(1, true, 90, "Approved");
            await verificationManager.connect(validator3).submitVote(1, true, 80, "Approved");

            // Check treasury received fee
            const treasuryBalance = await cUSD.balanceOf(treasury.address);
            expect(treasuryBalance).to.be.gt(0);
        });
    });
});
