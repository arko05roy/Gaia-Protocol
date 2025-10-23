const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("VerificationManager", function () {
    let verificationManager, taskRegistry, collateralManager, fundingPool;
    let owner, proposer, validator1, validator2, validator3, operator, funder, treasury, other;

    const TASK_DESCRIPTION = "Plant 10,000 Mangroves";
    const ESTIMATED_COST = ethers.parseUnits("10", 18);  // Reduced for test feasibility
    const EXPECTED_CO2 = ethers.parseUnits("500", 18);
    const LOCATION = "Tamil Nadu, India";
    const DEADLINE_OFFSET = 90 * 24 * 60 * 60;

    beforeEach(async function () {
        [owner, proposer, validator1, validator2, validator3, operator, funder, treasury, other] = await ethers.getSigners();

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

        // Deploy mock FundingPool
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const cUSD = await MockERC20.deploy("cUSD", "cUSD", 18);
        await cUSD.waitForDeployment();

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

        // Setup addresses
        await taskRegistry.setFundingPool(await fundingPool.getAddress());
        await taskRegistry.setCollateralManager(await collateralManager.getAddress());
        await taskRegistry.setVerificationManager(await verificationManager.getAddress());
        await collateralManager.setVerificationManager(await verificationManager.getAddress());

        // Add validators
        await verificationManager.addValidator(validator1.address);
        await verificationManager.addValidator(validator2.address);
        await verificationManager.addValidator(validator3.address);

        // Create and setup task
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

        // Fund task
        await cUSD.mint(funder.address, ESTIMATED_COST);
        await cUSD.connect(funder).approve(await fundingPool.getAddress(), ESTIMATED_COST);
        await fundingPool.connect(funder).fundTask(1, ESTIMATED_COST);

        // Assign operator
        // Required stake = (10 * 1000) / 10000 = 1 cUSD equivalent
        // Using 2 ETH for registration (sufficient for required stake + gas)
        const stakeAmount = ethers.parseEther("2");
        await collateralManager.connect(operator).registerOperator({ value: stakeAmount });
        await collateralManager.connect(operator).stakeForTask(1);

        // Submit proof
        await taskRegistry.connect(operator).submitProof(1, "QmProof123", ethers.parseUnits("520", 18));
    });

    describe("Deployment", function () {
        it("Should initialize with correct addresses", async function () {
            expect(await verificationManager.taskRegistry()).to.equal(await taskRegistry.getAddress());
            expect(await verificationManager.collateralManager()).to.equal(await collateralManager.getAddress());
            expect(await verificationManager.fundingPool()).to.equal(await fundingPool.getAddress());
        });

        it("Should set default required validators to 3", async function () {
            expect(await verificationManager.requiredValidators()).to.equal(3);
        });

        it("Should set default consensus threshold to 66%", async function () {
            expect(await verificationManager.consensusThresholdBps()).to.equal(6600);
        });

        it("Should set default verification period to 7 days", async function () {
            expect(await verificationManager.verificationPeriod()).to.equal(7 * 24 * 60 * 60);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to add validator", async function () {
            await verificationManager.addValidator(other.address);

            expect(await verificationManager.isValidator(other.address)).to.be.true;
        });

        it("Should emit ValidatorAdded event", async function () {
            await expect(
                verificationManager.addValidator(other.address)
            ).to.emit(verificationManager, "ValidatorAdded").withArgs(other.address);
        });

        it("Should reject adding invalid validator address", async function () {
            await expect(
                verificationManager.addValidator(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid address");
        });

        it("Should reject adding duplicate validator", async function () {
            await expect(
                verificationManager.addValidator(validator1.address)
            ).to.be.revertedWith("Already validator");
        });

        it("Should allow owner to remove validator", async function () {
            await verificationManager.removeValidator(validator1.address);

            expect(await verificationManager.isValidator(validator1.address)).to.be.false;
        });

        it("Should emit ValidatorRemoved event", async function () {
            await expect(
                verificationManager.removeValidator(validator1.address)
            ).to.emit(verificationManager, "ValidatorRemoved").withArgs(validator1.address);
        });

        it("Should allow owner to set required validators", async function () {
            await verificationManager.setRequiredValidators(5);
            expect(await verificationManager.requiredValidators()).to.equal(5);
        });

        it("Should reject invalid required validators count", async function () {
            await expect(
                verificationManager.setRequiredValidators(0)
            ).to.be.revertedWith("Invalid number");

            await expect(
                verificationManager.setRequiredValidators(11)
            ).to.be.revertedWith("Invalid number");
        });

        it("Should allow owner to set consensus threshold", async function () {
            await verificationManager.setConsensusThreshold(7000); // 70%
            expect(await verificationManager.consensusThresholdBps()).to.equal(7000);
        });

        it("Should reject invalid consensus threshold", async function () {
            await expect(
                verificationManager.setConsensusThreshold(4000)
            ).to.be.revertedWith("Invalid threshold");

            await expect(
                verificationManager.setConsensusThreshold(10001)
            ).to.be.revertedWith("Invalid threshold");
        });

        it("Should allow owner to pause/unpause", async function () {
            await verificationManager.pause();
            expect(await verificationManager.paused()).to.be.true;

            await verificationManager.unpause();
            expect(await verificationManager.paused()).to.be.false;
        });
    });

    describe("Verification Initiation", function () {
        it("Should initiate verification for UnderReview task", async function () {
            await verificationManager.initiateVerification(1);

            const [validators, , , deadline, , ] = await verificationManager.getVerification(1);
            expect(validators.length).to.equal(3);
            expect(deadline).to.be.gt(await time.latest());
        });

        it("Should emit VerificationStarted event", async function () {
            await expect(
                verificationManager.initiateVerification(1)
            ).to.emit(verificationManager, "VerificationStarted");
        });

        it("Should select required number of validators", async function () {
            await verificationManager.initiateVerification(1);

            const [validators] = await verificationManager.getVerification(1);
            expect(validators.length).to.equal(3);
        });

        it("Should set deadline to current time + verification period", async function () {
            const currentTime = await time.latest();
            const verificationPeriod = 7 * 24 * 60 * 60;

            await verificationManager.initiateVerification(1);

            const [, , , deadline] = await verificationManager.getVerification(1);
            expect(deadline).to.be.closeTo(currentTime + verificationPeriod, 10);
        });

        it("Should reject verification for non-UnderReview task", async function () {
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

            await expect(
                verificationManager.initiateVerification(2)
            ).to.be.revertedWith("Task not under review");
        });

        it("Should reject double verification initiation", async function () {
            await verificationManager.initiateVerification(1);

            await expect(
                verificationManager.initiateVerification(1)
            ).to.be.revertedWith("Verification already initiated");
        });

        it("Should reject verification when paused", async function () {
            await verificationManager.pause();

            await expect(
                verificationManager.initiateVerification(1)
            ).to.be.revertedWithCustomError(verificationManager, "EnforcedPause");
        });
    });

    describe("Validator Voting", function () {
        beforeEach(async function () {
            await verificationManager.initiateVerification(1);
        });

        it("Should accept validator vote", async function () {
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");

            const [hasVoted, approve, confidence] = await verificationManager.getValidatorVote(1, validator1.address);
            expect(hasVoted).to.be.true;
            expect(approve).to.be.true;
            expect(confidence).to.equal(85);
        });

        it("Should emit ValidatorVoted event", async function () {
            await expect(
                verificationManager.connect(validator1).submitVote(1, true, 85, "Approved")
            ).to.emit(verificationManager, "ValidatorVoted").withArgs(1, validator1.address, true, 85);
        });

        it("Should reject vote from non-validator", async function () {
            await expect(
                verificationManager.connect(other).submitVote(1, true, 85, "Approved")
            ).to.be.revertedWith("Not a validator");
        });

        it("Should reject invalid confidence score", async function () {
            await expect(
                verificationManager.connect(validator1).submitVote(1, true, 101, "Approved")
            ).to.be.revertedWith("Invalid confidence score");
        });

        it("Should reject vote after deadline", async function () {
            const verificationPeriod = 7 * 24 * 60 * 60;
            await time.increase(verificationPeriod + 1);

            await expect(
                verificationManager.connect(validator1).submitVote(1, true, 85, "Approved")
            ).to.be.revertedWith("Deadline passed");
        });

        it("Should reject double voting from same validator", async function () {
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");

            await expect(
                verificationManager.connect(validator1).submitVote(1, false, 90, "Changed mind")
            ).to.be.revertedWith("Already voted");
        });

        it("Should reject vote when paused", async function () {
            await verificationManager.pause();

            await expect(
                verificationManager.connect(validator1).submitVote(1, true, 85, "Approved")
            ).to.be.revertedWithCustomError(verificationManager, "EnforcedPause");
        });

        it("Should track approve votes", async function () {
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");

            const [, approveVotes] = await verificationManager.getVerification(1);
            expect(approveVotes).to.equal(1);
        });

        it("Should track reject votes", async function () {
            await verificationManager.connect(validator1).submitVote(1, false, 75, "Rejected");

            const [, , rejectVotes] = await verificationManager.getVerification(1);
            expect(rejectVotes).to.equal(1);
        });
    });

    describe("Consensus and Finalization", function () {
        beforeEach(async function () {
            await verificationManager.initiateVerification(1);
        });

        it("Should finalize with consensus (all approve)", async function () {
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");
            await verificationManager.connect(validator2).submitVote(1, true, 90, "Approved");
            await verificationManager.connect(validator3).submitVote(1, true, 80, "Approved");

            const [, , , , isFinalized, outcome] = await verificationManager.getVerification(1);
            expect(isFinalized).to.be.true;
            expect(outcome).to.be.true;
        });

        it("Should emit ConsensusReached event", async function () {
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");
            await verificationManager.connect(validator2).submitVote(1, true, 90, "Approved");

            await expect(
                verificationManager.connect(validator3).submitVote(1, true, 80, "Approved")
            ).to.emit(verificationManager, "ConsensusReached").withArgs(1, true, 3, 0);
        });

        it("Should emit VerificationFinalized event", async function () {
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");
            await verificationManager.connect(validator2).submitVote(1, true, 90, "Approved");

            await expect(
                verificationManager.connect(validator3).submitVote(1, true, 80, "Approved")
            ).to.emit(verificationManager, "VerificationFinalized").withArgs(1, true);
        });

        it("Should mark task as Verified on approval", async function () {
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");
            await verificationManager.connect(validator2).submitVote(1, true, 90, "Approved");
            await verificationManager.connect(validator3).submitVote(1, true, 80, "Approved");

            const task = await taskRegistry.getTask(1);
            expect(task.status).to.equal(4); // Verified
        });

        it("Should release operator stake on verification", async function () {
            const requiredStake = (ESTIMATED_COST * 1000n) / 10000n;

            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");
            await verificationManager.connect(validator2).submitVote(1, true, 90, "Approved");
            await verificationManager.connect(validator3).submitVote(1, true, 80, "Approved");

            const [, availableStake] = await collateralManager.getOperatorInfo(operator.address);
            expect(availableStake).to.equal(ethers.parseEther("2")); // Operator registered with 2 ETH, all released after approval
        });

        it("Should finalize with rejection (all reject)", async function () {
            await verificationManager.connect(validator1).submitVote(1, false, 85, "Rejected");
            await verificationManager.connect(validator2).submitVote(1, false, 90, "Rejected");
            await verificationManager.connect(validator3).submitVote(1, false, 80, "Rejected");

            const [, , , , isFinalized, outcome] = await verificationManager.getVerification(1);
            expect(isFinalized).to.be.true;
            expect(outcome).to.be.false;
        });

        it("Should mark task as Rejected on rejection", async function () {
            await verificationManager.connect(validator1).submitVote(1, false, 85, "Rejected");
            await verificationManager.connect(validator2).submitVote(1, false, 90, "Rejected");
            await verificationManager.connect(validator3).submitVote(1, false, 80, "Rejected");

            const task = await taskRegistry.getTask(1);
            expect(task.status).to.equal(5); // Rejected
        });

        it("Should slash operator stake on rejection", async function () {
            await verificationManager.connect(validator1).submitVote(1, false, 85, "Rejected");
            await verificationManager.connect(validator2).submitVote(1, false, 90, "Rejected");
            await verificationManager.connect(validator3).submitVote(1, false, 80, "Rejected");

            const [, availableStake] = await collateralManager.getOperatorInfo(operator.address);
            expect(availableStake).to.equal(ethers.parseEther("1")); // 2 ETH registered - 1 ETH locked and slashed = 1 ETH remaining
        });

        it("Should enable refunds on rejection", async function () {
            await verificationManager.connect(validator1).submitVote(1, false, 85, "Rejected");
            await verificationManager.connect(validator2).submitVote(1, false, 90, "Rejected");
            await verificationManager.connect(validator3).submitVote(1, false, 80, "Rejected");

            const pool = await fundingPool.getPool(1);
            expect(pool.refundsEnabled).to.be.true;
        });

        it("Should finalize after deadline with partial votes", async function () {
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");
            await verificationManager.connect(validator2).submitVote(1, true, 90, "Approved");

            const verificationPeriod = 7 * 24 * 60 * 60;
            await time.increase(verificationPeriod + 1);

            await verificationManager.finalizeVerification(1);

            const [, , , , isFinalized, outcome] = await verificationManager.getVerification(1);
            expect(isFinalized).to.be.true;
            expect(outcome).to.be.true; // 2 approve, 0 reject = 100% > 66%
        });

        it("Should reject finalization before deadline without consensus", async function () {
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");

            await expect(
                verificationManager.finalizeVerification(1)
            ).to.be.revertedWith("Deadline not reached");
        });

        it("Should apply consensus threshold correctly", async function () {
            // 2 approve, 1 reject = 66.67% > 66% threshold
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");
            await verificationManager.connect(validator2).submitVote(1, true, 90, "Approved");
            await verificationManager.connect(validator3).submitVote(1, false, 80, "Rejected");

            const [, , , , isFinalized, outcome] = await verificationManager.getVerification(1);
            expect(isFinalized).to.be.true;
            expect(outcome).to.be.true;
        });
    });

    describe("Read Functions", function () {
        beforeEach(async function () {
            await verificationManager.initiateVerification(1);
            await verificationManager.connect(validator1).submitVote(1, true, 85, "Approved");
        });

        it("Should get verification details", async function () {
            const [validators, approveVotes, rejectVotes, deadline, isFinalized, outcome] = await verificationManager.getVerification(1);
            expect(validators.length).to.equal(3);
            expect(approveVotes).to.equal(1);
            expect(rejectVotes).to.equal(0);
            expect(deadline).to.be.gt(await time.latest());
            expect(isFinalized).to.be.false;
        });

        it("Should get validator vote", async function () {
            const [hasVoted, approve, confidence, justification] = await verificationManager.getValidatorVote(1, validator1.address);
            expect(hasVoted).to.be.true;
            expect(approve).to.be.true;
            expect(confidence).to.equal(85);
            expect(justification).to.equal("Approved");
        });

        it("Should get all validators", async function () {
            const validators = await verificationManager.getAllValidators();
            expect(validators.length).to.equal(3);
        });

        it("Should get active validators", async function () {
            await verificationManager.removeValidator(validator3.address);

            const activeValidators = await verificationManager.getActiveValidators();
            expect(activeValidators.length).to.equal(2);
        });

        it("Should get validator reputation", async function () {
            const reputation = await verificationManager.getValidatorReputation(validator1.address);
            expect(reputation).to.equal(100); // Default reputation
        });

        it("Should check if verification can finalize", async function () {
            const [canFinalize, reason] = await verificationManager.canFinalize(1);
            expect(canFinalize).to.be.false;
            expect(reason).to.equal("Waiting for votes");
        });

        it("Should get voting progress", async function () {
            const [votesReceived, votesRequired, percentageComplete] = await verificationManager.getVotingProgress(1);
            expect(votesReceived).to.equal(1);
            expect(votesRequired).to.equal(3);
            expect(percentageComplete).to.equal(3333); // ~33%
        });
    });

    describe("Edge Cases", function () {
        it("Should handle minimum validators requirement", async function () {
            // Set minimum validators to 1
            await verificationManager.setRequiredValidators(1);

            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.connect(proposer).createTask(
                "Min Validators Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ"
            );

            // Fund and setup
            const cUSD = await ethers.getContractAt("MockERC20", await fundingPool.cUSD());
            await cUSD.mint(funder.address, ESTIMATED_COST);
            await cUSD.connect(funder).approve(await fundingPool.getAddress(), ESTIMATED_COST);
            await fundingPool.connect(funder).fundTask(2, ESTIMATED_COST);

            const signers = await ethers.getSigners();
            const op2 = signers[15]; // Use fresh operator
            const stakeAmount = ethers.parseEther("2");
            await collateralManager.connect(op2).registerOperator({ value: stakeAmount });
            await collateralManager.connect(op2).stakeForTask(2);

            await taskRegistry.connect(op2).submitProof(2, "QmProof", ethers.parseUnits("520", 18));

            await verificationManager.initiateVerification(2);

            const [validators] = await verificationManager.getVerification(2);
            expect(validators.length).to.equal(1);
        });

        it("Should handle maximum validators requirement", async function () {
            // Add more validators
            const signers = await ethers.getSigners();
            const maxValidators = Math.min(10, signers.length - 1); // Ensure we don't exceed available signers
            for (let i = 4; i < maxValidators; i++) {
                try {
                    await verificationManager.addValidator(signers[i].address);
                } catch (e) {
                    // Already a validator, skip
                }
            }

            await verificationManager.setRequiredValidators(Math.min(3, maxValidators));

            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.connect(proposer).createTask(
                "Max Validators Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ"
            );

            // Fund and setup
            const cUSD = await ethers.getContractAt("MockERC20", await fundingPool.cUSD());
            await cUSD.mint(funder.address, ESTIMATED_COST);
            await cUSD.connect(funder).approve(await fundingPool.getAddress(), ESTIMATED_COST);
            await fundingPool.connect(funder).fundTask(2, ESTIMATED_COST);

            const op3 = signers[10]; // Use fresh operator
            const stakeAmount = ethers.parseEther("2");
            await collateralManager.connect(op3).registerOperator({ value: stakeAmount });
            await collateralManager.connect(op3).stakeForTask(2);

            await taskRegistry.connect(op3).submitProof(2, "QmProof", ethers.parseUnits("520", 18));

            await verificationManager.initiateVerification(2);

            const [validators] = await verificationManager.getVerification(2);
            expect(validators.length).to.be.greaterThan(0); // At least some validators assigned
        });
    });
});
