const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TaskRegistry", function () {
    let taskRegistry;
    let owner, proposer, operator, validator, funder, other;
    let fundingPoolAddress, collateralManagerAddress, verificationManagerAddress;

    const TASK_DESCRIPTION = "Plant 10,000 Mangroves in Pichavaram";
    const ESTIMATED_COST = ethers.parseUnits("50000", 18);
    const EXPECTED_CO2 = ethers.parseUnits("500", 18);
    const LOCATION = "Tamil Nadu, India";
    const PROOF_REQUIREMENTS = "GPS photos, drone imagery, local authority attestation";
    const IPFS_HASH = "QmXYZ...ABC";

    beforeEach(async function () {
        [owner, proposer, operator, validator, funder, other] = await ethers.getSigners();

        // Deploy TaskRegistry
        const TaskRegistry = await ethers.getContractFactory("TaskRegistry");
        taskRegistry = await TaskRegistry.deploy();
        await taskRegistry.waitForDeployment();

        // Set dummy addresses for dependent contracts
        fundingPoolAddress = funder.address;
        collateralManagerAddress = operator.address;
        verificationManagerAddress = validator.address;

        await taskRegistry.setFundingPool(fundingPoolAddress);
        await taskRegistry.setCollateralManager(collateralManagerAddress);
        await taskRegistry.setVerificationManager(verificationManagerAddress);
        
        // Store signers for later use
        this.funderSigner = funder;
        this.operatorSigner = operator;
        this.validatorSigner = validator;
    });

    describe("Deployment", function () {
        it("Should initialize with correct owner", async function () {
            expect(await taskRegistry.owner()).to.equal(owner.address);
        });

        it("Should start with task counter at 1", async function () {
            expect(await taskRegistry.getTotalTasks()).to.equal(0);
        });

        it("Should have zero initial tasks", async function () {
            const tasks = await taskRegistry.getTasksByStatus(0); // Proposed
            expect(tasks.length).to.equal(0);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to set FundingPool address", async function () {
            const newAddress = other.address;
            await taskRegistry.setFundingPool(newAddress);
            expect(await taskRegistry.fundingPoolAddress()).to.equal(newAddress);
        });

        it("Should reject invalid FundingPool address", async function () {
            await expect(
                taskRegistry.setFundingPool(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid address");
        });

        it("Should allow owner to set CollateralManager address", async function () {
            const newAddress = other.address;
            await taskRegistry.setCollateralManager(newAddress);
            expect(await taskRegistry.collateralManagerAddress()).to.equal(newAddress);
        });

        it("Should allow owner to set VerificationManager address", async function () {
            const newAddress = other.address;
            await taskRegistry.setVerificationManager(newAddress);
            expect(await taskRegistry.verificationManagerAddress()).to.equal(newAddress);
        });

        it("Should allow owner to pause/unpause", async function () {
            await taskRegistry.pause();
            expect(await taskRegistry.paused()).to.be.true;

            await taskRegistry.unpause();
            expect(await taskRegistry.paused()).to.be.false;
        });

        it("Should reject non-owner pause attempts", async function () {
            await expect(
                taskRegistry.connect(proposer).pause()
            ).to.be.revertedWithCustomError(taskRegistry, "OwnableUnauthorizedAccount");
        });
    });

    describe("Task Creation", function () {
        it("Should create a task with valid parameters", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;

            const tx = await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            await expect(tx).to.emit(taskRegistry, "TaskCreated");
            expect(await taskRegistry.getTotalTasks()).to.equal(1);
        });

        it("Should assign correct task ID", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;

            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            const task = await taskRegistry.getTask(1);
            expect(task.id).to.equal(1);
            expect(task.proposer).to.equal(proposer.address);
        });

        it("Should store all task details correctly", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;

            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            const task = await taskRegistry.getTask(1);
            expect(task.description).to.equal(TASK_DESCRIPTION);
            expect(task.estimatedCost).to.equal(ESTIMATED_COST);
            expect(task.expectedCO2).to.equal(EXPECTED_CO2);
            expect(task.location).to.equal(LOCATION);
            expect(task.proofRequirements).to.equal(PROOF_REQUIREMENTS);
            expect(task.ipfsHash).to.equal(IPFS_HASH);
            expect(task.status).to.equal(0); // Proposed
        });

        it("Should set task status to Proposed", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;

            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            const task = await taskRegistry.getTask(1);
            expect(task.status).to.equal(0); // TaskStatus.Proposed
        });

        it("Should reject empty description", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;

            await expect(
                taskRegistry.connect(proposer).createTask(
                    "",
                    ESTIMATED_COST,
                    EXPECTED_CO2,
                    LOCATION,
                    deadline,
                    PROOF_REQUIREMENTS,
                    IPFS_HASH
                )
            ).to.be.revertedWith("Description required");
        });

        it("Should reject zero cost", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;

            await expect(
                taskRegistry.connect(proposer).createTask(
                    TASK_DESCRIPTION,
                    0,
                    EXPECTED_CO2,
                    LOCATION,
                    deadline,
                    PROOF_REQUIREMENTS,
                    IPFS_HASH
                )
            ).to.be.revertedWith("Cost must be positive");
        });

        it("Should reject zero CO2", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;

            await expect(
                taskRegistry.connect(proposer).createTask(
                    TASK_DESCRIPTION,
                    ESTIMATED_COST,
                    0,
                    LOCATION,
                    deadline,
                    PROOF_REQUIREMENTS,
                    IPFS_HASH
                )
            ).to.be.revertedWith("CO2 must be positive");
        });

        it("Should reject past deadline", async function () {
            const pastDeadline = (await time.latest()) - 1;

            await expect(
                taskRegistry.connect(proposer).createTask(
                    TASK_DESCRIPTION,
                    ESTIMATED_COST,
                    EXPECTED_CO2,
                    LOCATION,
                    pastDeadline,
                    PROOF_REQUIREMENTS,
                    IPFS_HASH
                )
            ).to.be.revertedWith("Deadline must be in future");
        });

        it("Should track proposer tasks", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;

            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            const proposerTasks = await taskRegistry.getProposerTasks(proposer.address);
            expect(proposerTasks.length).to.equal(1);
            expect(proposerTasks[0]).to.equal(1);
        });

        it("Should track tasks by status", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;

            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            const proposedTasks = await taskRegistry.getTasksByStatus(0); // Proposed
            expect(proposedTasks.length).to.equal(1);
            expect(proposedTasks[0]).to.equal(1);
        });

        it("Should reject creation when paused", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;

            await taskRegistry.pause();

            await expect(
                taskRegistry.connect(proposer).createTask(
                    TASK_DESCRIPTION,
                    ESTIMATED_COST,
                    EXPECTED_CO2,
                    LOCATION,
                    deadline,
                    PROOF_REQUIREMENTS,
                    IPFS_HASH
                )
            ).to.be.revertedWithCustomError(taskRegistry, "EnforcedPause");
        });

        it("Should create multiple tasks with incremental IDs", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;

            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            await taskRegistry.connect(proposer).createTask(
                "Second Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            expect(await taskRegistry.getTotalTasks()).to.equal(2);
            const task1 = await taskRegistry.getTask(1);
            const task2 = await taskRegistry.getTask(2);
            expect(task1.id).to.equal(1);
            expect(task2.id).to.equal(2);
        });
    });

    describe("Task Status Updates", function () {
        let taskId;
        let deadline;

        beforeEach(async function () {
            deadline = (await time.latest()) + 90 * 24 * 60 * 60;
            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );
            taskId = await taskRegistry.getTotalTasks();
        });

        it("Should mark task as Funded", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);

            const task = await taskRegistry.getTask(taskId);
            expect(task.status).to.equal(1); // Funded
        });

        it("Should reject markAsFunded from non-FundingPool", async function () {
            await expect(
                taskRegistry.connect(other).markAsFunded(taskId)
            ).to.be.revertedWith("Only FundingPool");
        });

        it("Should reject markAsFunded if not Proposed", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);

            await expect(
                taskRegistry.connect(funder).markAsFunded(taskId)
            ).to.be.revertedWith("Must be Proposed");
        });

        it("Should assign operator and update status to InProgress", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);
            
            // Set CollateralManager to operator for this test
            await taskRegistry.setCollateralManager(operator.address);
            await taskRegistry.connect(operator).assignOperator(taskId, operator.address);

            const task = await taskRegistry.getTask(taskId);
            expect(task.assignedOperator).to.equal(operator.address);
            expect(task.status).to.equal(2); // InProgress
        });

        it("Should reject assignOperator from non-CollateralManager", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);

            await expect(
                taskRegistry.connect(other).assignOperator(taskId, operator.address)
            ).to.be.revertedWith("Only CollateralManager");
        });

        it("Should reject assignOperator if not Funded", async function () {
            // Set CollateralManager to operator for this test
            await taskRegistry.setCollateralManager(operator.address);
            
            await expect(
                taskRegistry.connect(operator).assignOperator(taskId, operator.address)
            ).to.be.revertedWith("Must be Funded");
        });

        it("Should reject assignOperator if already assigned", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);
            
            // Set CollateralManager to operator for this test
            await taskRegistry.setCollateralManager(operator.address);
            await taskRegistry.connect(operator).assignOperator(taskId, operator.address);

            // Task is now InProgress, so trying to assign again should fail with "Must be Funded"
            await expect(
                taskRegistry.connect(operator).assignOperator(taskId, other.address)
            ).to.be.revertedWith("Must be Funded");
        });

        it("Should track operator tasks", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);
            
            // Set CollateralManager to operator for this test
            await taskRegistry.setCollateralManager(operator.address);
            await taskRegistry.connect(operator).assignOperator(taskId, operator.address);

            const operatorTasks = await taskRegistry.getOperatorTasks(operator.address);
            expect(operatorTasks.length).to.equal(1);
            expect(operatorTasks[0]).to.equal(taskId);
        });

        it("Should update status to UnderReview when proof submitted", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);
            await taskRegistry.connect(operator).assignOperator(taskId, operator.address);

            await taskRegistry.connect(operator).submitProof(taskId, "QmProof123", ethers.parseUnits("520", 18));

            const task = await taskRegistry.getTask(taskId);
            expect(task.status).to.equal(3); // UnderReview
        });

        it("Should store proof details", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);
            await taskRegistry.connect(operator).assignOperator(taskId, operator.address);

            const actualCO2 = ethers.parseUnits("520", 18);
            const proofHash = "QmProof123";

            await taskRegistry.connect(operator).submitProof(taskId, proofHash, actualCO2);

            const task = await taskRegistry.getTask(taskId);
            expect(task.proofHash).to.equal(proofHash);
            expect(task.actualCO2).to.equal(actualCO2);
        });

        it("Should reject submitProof from non-assigned operator", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);
            await taskRegistry.connect(operator).assignOperator(taskId, operator.address);

            await expect(
                taskRegistry.connect(other).submitProof(taskId, "QmProof123", ethers.parseUnits("520", 18))
            ).to.be.revertedWith("Only assigned operator");
        });

        it("Should reject submitProof with empty hash", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);
            await taskRegistry.connect(operator).assignOperator(taskId, operator.address);

            await expect(
                taskRegistry.connect(operator).submitProof(taskId, "", ethers.parseUnits("520", 18))
            ).to.be.revertedWith("Proof hash required");
        });

        it("Should reject submitProof with zero CO2", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);
            await taskRegistry.connect(operator).assignOperator(taskId, operator.address);

            await expect(
                taskRegistry.connect(operator).submitProof(taskId, "QmProof123", 0)
            ).to.be.revertedWith("CO2 must be positive");
        });

        it("Should mark task as Verified", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);
            await taskRegistry.connect(operator).assignOperator(taskId, operator.address);
            await taskRegistry.connect(operator).submitProof(taskId, "QmProof123", ethers.parseUnits("520", 18));

            await taskRegistry.connect(validator).markAsVerified(taskId);

            const task = await taskRegistry.getTask(taskId);
            expect(task.status).to.equal(4); // Verified
        });

        it("Should mark task as Rejected", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);
            await taskRegistry.connect(operator).assignOperator(taskId, operator.address);
            await taskRegistry.connect(operator).submitProof(taskId, "QmProof123", ethers.parseUnits("520", 18));

            await taskRegistry.connect(validator).markAsRejected(taskId);

            const task = await taskRegistry.getTask(taskId);
            expect(task.status).to.equal(5); // Rejected
        });

        it("Should reject markAsVerified from non-VerificationManager", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);
            await taskRegistry.connect(operator).assignOperator(taskId, operator.address);
            await taskRegistry.connect(operator).submitProof(taskId, "QmProof123", ethers.parseUnits("520", 18));

            await expect(
                taskRegistry.connect(other).markAsVerified(taskId)
            ).to.be.revertedWith("Only VerificationManager");
        });
    });

    describe("Task Deadline Check", function () {
        let taskId;

        beforeEach(async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;
            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );
            taskId = await taskRegistry.getTotalTasks();

            await taskRegistry.connect(funder).markAsFunded(taskId);
            await taskRegistry.connect(operator).assignOperator(taskId, operator.address);
        });

        it("Should reject checkDeadline if grace period not over", async function () {
            await expect(
                taskRegistry.checkDeadline(taskId)
            ).to.be.revertedWith("Grace period not over");
        });

        it("Should mark task as abandoned after deadline + grace period", async function () {
            const task = await taskRegistry.getTask(taskId);
            const gracePeriod = BigInt(7 * 24 * 60 * 60);

            // Fast forward past deadline + grace period
            await time.increaseTo(task.deadline + gracePeriod + 1n);

            await taskRegistry.checkDeadline(taskId);

            const updatedTask = await taskRegistry.getTask(taskId);
            expect(updatedTask.status).to.equal(5); // Rejected
        });
    });

    describe("Read Functions", function () {
        let taskId;
        let deadline;

        beforeEach(async function () {
            deadline = (await time.latest()) + 90 * 24 * 60 * 60;
            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );
            taskId = await taskRegistry.getTotalTasks();
        });

        it("Should retrieve task by ID", async function () {
            const task = await taskRegistry.getTask(taskId);
            expect(task.id).to.equal(taskId);
            expect(task.proposer).to.equal(proposer.address);
        });

        it("Should retrieve multiple tasks", async function () {
            await taskRegistry.connect(proposer).createTask(
                "Second Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            const tasks = await taskRegistry.getTasks([1, 2]);
            expect(tasks.length).to.equal(2);
            expect(tasks[0].id).to.equal(1);
            expect(tasks[1].id).to.equal(2);
        });

        it("Should retrieve tasks by status", async function () {
            await taskRegistry.connect(proposer).createTask(
                "Second Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            await taskRegistry.connect(funder).markAsFunded(1);

            const proposedTasks = await taskRegistry.getTasksByStatus(0);
            const fundedTasks = await taskRegistry.getTasksByStatus(1);

            expect(proposedTasks.length).to.equal(1);
            expect(fundedTasks.length).to.equal(1);
        });

        it("Should retrieve proposer tasks", async function () {
            const tasks = await taskRegistry.getProposerTasks(proposer.address);
            expect(tasks.length).to.equal(1);
            expect(tasks[0]).to.equal(taskId);
        });

        it("Should retrieve operator tasks", async function () {
            await taskRegistry.connect(funder).markAsFunded(taskId);
            await taskRegistry.connect(operator).assignOperator(taskId, operator.address);

            const tasks = await taskRegistry.getOperatorTasks(operator.address);
            expect(tasks.length).to.equal(1);
            expect(tasks[0]).to.equal(taskId);
        });

        it("Should get total tasks count", async function () {
            expect(await taskRegistry.getTotalTasks()).to.equal(1);

            await taskRegistry.connect(proposer).createTask(
                "Second Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            expect(await taskRegistry.getTotalTasks()).to.equal(2);
        });

        it("Should get basic task info", async function () {
            const [proposers, costs, statuses] = await taskRegistry.getTasksBasicInfo([1]);
            expect(proposers[0]).to.equal(proposer.address);
            expect(costs[0]).to.equal(ESTIMATED_COST);
            expect(statuses[0]).to.equal(0); // Proposed
        });

        it("Should check if task exists", async function () {
            expect(await taskRegistry.taskExists_(1)).to.be.true;
            expect(await taskRegistry.taskExists_(999)).to.be.false;
        });
    });

    describe("Edge Cases", function () {
        it("Should handle very large cost values", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;
            const largeCost = ethers.parseUnits("1000000000", 18);

            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                largeCost,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            const task = await taskRegistry.getTask(1);
            expect(task.estimatedCost).to.equal(largeCost);
        });

        it("Should handle very large CO2 values", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;
            const largeCO2 = ethers.parseUnits("1000000", 18);

            await taskRegistry.connect(proposer).createTask(
                TASK_DESCRIPTION,
                ESTIMATED_COST,
                largeCO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            const task = await taskRegistry.getTask(1);
            expect(task.expectedCO2).to.equal(largeCO2);
        });

        it("Should handle long descriptions", async function () {
            const deadline = (await time.latest()) + 90 * 24 * 60 * 60;
            const longDescription = "A".repeat(1000);

            await taskRegistry.connect(proposer).createTask(
                longDescription,
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                PROOF_REQUIREMENTS,
                IPFS_HASH
            );

            const task = await taskRegistry.getTask(1);
            expect(task.description).to.equal(longDescription);
        });

        it("Should handle non-existent task queries", async function () {
            await expect(
                taskRegistry.getTask(999)
            ).to.be.revertedWith("Task does not exist");
        });
    });
});
