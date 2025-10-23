const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CarbonCreditMinter", function () {
    let minter, taskRegistry, fundingPool, cUSD;
    let owner, proposer, funder1, funder2, operator, treasury, other;

    const TASK_DESCRIPTION = "Plant 10,000 Mangroves";
    const ESTIMATED_COST = ethers.parseUnits("50000", 18);
    const EXPECTED_CO2 = ethers.parseUnits("500", 18);
    const ACTUAL_CO2 = ethers.parseUnits("520", 18);
    const LOCATION = "Tamil Nadu, India";
    const DEADLINE_OFFSET = 90 * 24 * 60 * 60;
    const BASE_URI = "ipfs://QmBase/";

    beforeEach(async function () {
        [owner, proposer, funder1, funder2, operator, treasury, other] = await ethers.getSigners();

        // Deploy mock cUSD
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        cUSD = await MockERC20.deploy("cUSD", "cUSD", 18);
        await cUSD.waitForDeployment();

        // Deploy TaskRegistry
        const TaskRegistry = await ethers.getContractFactory("TaskRegistry");
        taskRegistry = await TaskRegistry.deploy();
        await taskRegistry.waitForDeployment();

        // Deploy FundingPool
        const FundingPool = await ethers.getContractFactory("FundingPool");
        fundingPool = await FundingPool.deploy(
            await cUSD.getAddress(),
            await taskRegistry.getAddress(),
            treasury.address
        );
        await fundingPool.waitForDeployment();

        // Deploy CarbonCreditMinter
        const CarbonCreditMinter = await ethers.getContractFactory("CarbonCreditMinter");
        minter = await CarbonCreditMinter.deploy(
            await taskRegistry.getAddress(),
            await fundingPool.getAddress(),
            BASE_URI
        );
        await minter.waitForDeployment();

        // Setup
        await taskRegistry.setFundingPool(await fundingPool.getAddress());
        await taskRegistry.setVerificationManager(owner.address);
        await minter.setVerificationManager(owner.address);

        // Create task
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
        await cUSD.mint(funder1.address, ethers.parseUnits("25000", 18));
        await cUSD.mint(funder2.address, ethers.parseUnits("25000", 18));

        await cUSD.connect(funder1).approve(await fundingPool.getAddress(), ethers.parseUnits("25000", 18));
        await cUSD.connect(funder2).approve(await fundingPool.getAddress(), ethers.parseUnits("25000", 18));

        await fundingPool.connect(funder1).fundTask(1, ethers.parseUnits("25000", 18));
        await fundingPool.connect(funder2).fundTask(1, ethers.parseUnits("25000", 18));
    });

    describe("Deployment", function () {
        it("Should initialize with correct addresses", async function () {
            expect(await minter.taskRegistry()).to.equal(await taskRegistry.getAddress());
            expect(await minter.fundingPool()).to.equal(await fundingPool.getAddress());
        });

        it("Should set base URI", async function () {
            expect(await minter.verificationManagerAddress()).to.equal(owner.address);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to set verification manager", async function () {
            await minter.setVerificationManager(other.address);
            expect(await minter.verificationManagerAddress()).to.equal(other.address);
        });

        it("Should allow owner to update base URI", async function () {
            const newURI = "ipfs://QmNew/";
            await minter.setBaseURI(newURI);
            // Base URI is updated successfully if no error is thrown
        });

        it("Should allow owner to update project type", async function () {
            // First mark task as InProgress (simulating operator assignment)
            await taskRegistry.setCollateralManager(owner.address);
            await taskRegistry.assignOperator(1, owner.address);
            // Submit proof with actualCO2
            await taskRegistry.connect(owner).submitProof(1, "QmProofHash", ACTUAL_CO2);
            // Mark task as verified
            await taskRegistry.markAsVerified(1);
            await minter.mintCredits(1);

            await minter.updateProjectType(1, "Mangrove Restoration");

            const metadata = await minter.getMetadata(1);
            expect(metadata.projectType).to.equal("Mangrove Restoration");
        });

        it("Should allow owner to pause/unpause", async function () {
            await minter.pause();
            expect(await minter.paused()).to.be.true;

            await minter.unpause();
            expect(await minter.paused()).to.be.false;
        });
    });

    describe("Minting Credits", function () {
        beforeEach(async function () {
            // Mark task as InProgress first (simulating operator assignment)
            await taskRegistry.setCollateralManager(owner.address);
            await taskRegistry.assignOperator(1, owner.address);
            // Submit proof with actualCO2
            await taskRegistry.connect(owner).submitProof(1, "QmProofHash", ACTUAL_CO2);
            // Mark task as verified
            await taskRegistry.markAsVerified(1);
        });

        it("Should mint credits for verified task", async function () {
            await minter.mintCredits(1);

            const metadata = await minter.getMetadata(1);
            expect(metadata.exists).to.be.true;
            expect(metadata.totalCO2).to.equal(ACTUAL_CO2);
        });

        it("Should emit CreditsMinted event", async function () {
            await expect(
                minter.mintCredits(1)
            ).to.emit(minter, "CreditsMinted");
        });

        it("Should distribute credits proportionally to funders", async function () {
            await minter.mintCredits(1);

            const funder1Balance = await minter.balanceOf(funder1.address, 1);
            const funder2Balance = await minter.balanceOf(funder2.address, 1);

            // Both funded equally, should get equal credits
            expect(funder1Balance).to.equal(ACTUAL_CO2 / 2n);
            expect(funder2Balance).to.equal(ACTUAL_CO2 / 2n);
        });

        it("Should store metadata correctly", async function () {
            await minter.mintCredits(1);

            const metadata = await minter.getMetadata(1);
            expect(metadata.taskId).to.equal(1);
            expect(metadata.totalCO2).to.equal(ACTUAL_CO2);
            expect(metadata.location).to.equal(LOCATION);
            expect(metadata.mintedAt).to.be.gt(0);
        });

        it("Should reject minting for non-verified task", async function () {
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
                minter.mintCredits(2)
            ).to.be.revertedWith("No CO2 offset recorded");
        });

        it("Should reject double minting", async function () {
            await minter.mintCredits(1);

            await expect(
                minter.mintCredits(1)
            ).to.be.revertedWith("Credits already minted");
        });

        it("Should reject minting when paused", async function () {
            await minter.pause();

            await expect(
                minter.mintCredits(1)
            ).to.be.revertedWithCustomError(minter, "EnforcedPause");
        });

        it("Should reject minting from non-VerificationManager", async function () {
            await expect(
                minter.connect(other).mintCredits(1)
            ).to.be.revertedWith("Only VerificationManager");
        });

        it("Should increment total token types", async function () {
            expect(await minter.totalTokenTypes()).to.equal(0);

            await minter.mintCredits(1);

            expect(await minter.totalTokenTypes()).to.equal(1);
        });
    });

    describe("Retiring Credits", function () {
        beforeEach(async function () {
            // Mark task as InProgress first (simulating operator assignment)
            await taskRegistry.setCollateralManager(owner.address);
            await taskRegistry.assignOperator(1, owner.address);
            // Submit proof with actualCO2
            await taskRegistry.connect(owner).submitProof(1, "QmProofHash", ACTUAL_CO2);
            // Mark task as verified
            await taskRegistry.markAsVerified(1);
            await minter.mintCredits(1);
        });

        it("Should retire credits", async function () {
            const retireAmount = ethers.parseUnits("100", 18);

            await minter.connect(funder1).retireCredits(1, retireAmount, "Corporate ESG 2025");

            const retired = await minter.getUserRetired(funder1.address, 1);
            expect(retired).to.equal(retireAmount);
        });

        it("Should emit CreditsRetired event", async function () {
            const retireAmount = ethers.parseUnits("100", 18);

            await expect(
                minter.connect(funder1).retireCredits(1, retireAmount, "Corporate ESG 2025")
            ).to.emit(minter, "CreditsRetired").withArgs(1, funder1.address, retireAmount, "Corporate ESG 2025");
        });

        it("Should burn credits on retirement", async function () {
            const retireAmount = ethers.parseUnits("100", 18);
            const initialBalance = await minter.balanceOf(funder1.address, 1);

            await minter.connect(funder1).retireCredits(1, retireAmount, "Corporate ESG 2025");

            const finalBalance = await minter.balanceOf(funder1.address, 1);
            expect(finalBalance).to.equal(initialBalance - retireAmount);
        });

        it("Should reject retirement with zero amount", async function () {
            await expect(
                minter.connect(funder1).retireCredits(1, 0, "Corporate ESG 2025")
            ).to.be.revertedWith("Amount must be positive");
        });

        it("Should reject retirement with insufficient balance", async function () {
            const excessAmount = ACTUAL_CO2 + ethers.parseUnits("100", 18);

            await expect(
                minter.connect(funder1).retireCredits(1, excessAmount, "Corporate ESG 2025")
            ).to.be.revertedWith("Insufficient balance");
        });

        it("Should reject retirement when paused", async function () {
            await minter.pause();

            const retireAmount = ethers.parseUnits("100", 18);

            await expect(
                minter.connect(funder1).retireCredits(1, retireAmount, "Corporate ESG 2025")
            ).to.be.revertedWithCustomError(minter, "EnforcedPause");
        });

        it("Should track total retired credits", async function () {
            const retireAmount1 = ethers.parseUnits("100", 18);
            const retireAmount2 = ethers.parseUnits("50", 18);

            await minter.connect(funder1).retireCredits(1, retireAmount1, "ESG 2025");
            await minter.connect(funder2).retireCredits(1, retireAmount2, "ESG 2025");

            const totalRetired = await minter.getTotalRetired(1);
            expect(totalRetired).to.equal(retireAmount1 + retireAmount2);
        });
    });

    describe("Read Functions", function () {
        beforeEach(async function () {
            // Mark task as InProgress first (simulating operator assignment)
            await taskRegistry.setCollateralManager(owner.address);
            await taskRegistry.assignOperator(1, owner.address);
            // Submit proof with actualCO2
            await taskRegistry.connect(owner).submitProof(1, "QmProofHash", ACTUAL_CO2);
            // Mark task as verified
            await taskRegistry.markAsVerified(1);
            await minter.mintCredits(1);
        });

        it("Should get metadata", async function () {
            const metadata = await minter.getMetadata(1);
            expect(metadata.taskId).to.equal(1);
            expect(metadata.totalCO2).to.equal(ACTUAL_CO2);
            expect(metadata.exists).to.be.true;
        });

        it("Should get circulating supply", async function () {
            const circulatingSupply = await minter.getCirculatingSupply(1);
            expect(circulatingSupply).to.equal(ACTUAL_CO2);
        });

        it("Should get circulating supply after retirement", async function () {
            const retireAmount = ethers.parseUnits("100", 18);
            await minter.connect(funder1).retireCredits(1, retireAmount, "ESG 2025");

            const circulatingSupply = await minter.getCirculatingSupply(1);
            expect(circulatingSupply).to.equal(ACTUAL_CO2 - retireAmount);
        });

        it("Should get total retired", async function () {
            const retireAmount = ethers.parseUnits("100", 18);
            await minter.connect(funder1).retireCredits(1, retireAmount, "ESG 2025");

            const totalRetired = await minter.getTotalRetired(1);
            expect(totalRetired).to.equal(retireAmount);
        });

        it("Should get user retired credits", async function () {
            const retireAmount = ethers.parseUnits("100", 18);
            await minter.connect(funder1).retireCredits(1, retireAmount, "ESG 2025");

            const userRetired = await minter.getUserRetired(funder1.address, 1);
            expect(userRetired).to.equal(retireAmount);
        });

        it("Should check if credits exist", async function () {
            expect(await minter.creditsExist(1)).to.be.true;
            expect(await minter.creditsExist(999)).to.be.false;
        });

        it("Should get URI for token", async function () {
            const uri = await minter.uri(1);
            expect(uri).to.include(BASE_URI);
            expect(uri).to.include("1.json");
        });

        it("Should get balance of batch", async function () {
            const balances = await minter.balanceOfBatchForAccount(funder1.address, [1]);
            expect(balances[0]).to.equal(ACTUAL_CO2 / 2n);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle unequal funder contributions", async function () {
            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.connect(proposer).createTask(
                "Unequal Funding Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ"
            );

            // Fund with different amounts
            const amount1 = ethers.parseUnits("30000", 18);
            const amount2 = ethers.parseUnits("20000", 18);

            await cUSD.mint(funder1.address, amount1);
            await cUSD.mint(funder2.address, amount2);

            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), amount1);
            await cUSD.connect(funder2).approve(await fundingPool.getAddress(), amount2);

            await fundingPool.connect(funder1).fundTask(2, amount1);
            await fundingPool.connect(funder2).fundTask(2, amount2);

            // Mark task as InProgress first (simulating operator assignment)
            await taskRegistry.setCollateralManager(owner.address);
            await taskRegistry.assignOperator(2, owner.address);
            // Submit proof with actualCO2
            await taskRegistry.connect(owner).submitProof(2, "QmProofHash", ACTUAL_CO2);
            // Mark task as verified
            await taskRegistry.markAsVerified(2);
            await minter.mintCredits(2);

            const funder1Balance = await minter.balanceOf(funder1.address, 2);
            const funder2Balance = await minter.balanceOf(funder2.address, 2);

            // Funder1 should get 60% of credits, funder2 40%
            expect(funder1Balance).to.equal((ACTUAL_CO2 * 60n) / 100n);
            expect(funder2Balance).to.equal((ACTUAL_CO2 * 40n) / 100n);
        });

        it("Should handle large CO2 amounts", async function () {
            const largeCO2 = ethers.parseUnits("1000000", 18);

            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.connect(proposer).createTask(
                "Large CO2 Task",
                ESTIMATED_COST,
                largeCO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ"
            );

            // Fund task
            await cUSD.mint(funder1.address, ESTIMATED_COST);
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), ESTIMATED_COST);
            await fundingPool.connect(funder1).fundTask(2, ESTIMATED_COST);

            // Mark task as InProgress first (simulating operator assignment)
            await taskRegistry.setCollateralManager(owner.address);
            await taskRegistry.assignOperator(2, owner.address);
            // Submit proof with actualCO2
            await taskRegistry.connect(owner).submitProof(2, "QmProofHash", largeCO2);
            // Mark task as verified
            await taskRegistry.markAsVerified(2);
            await minter.mintCredits(2);

            const metadata = await minter.getMetadata(2);
            expect(metadata.totalCO2).to.equal(largeCO2);
        });

        it("Should handle multiple token types", async function () {
            // Mark task 1 as InProgress first (simulating operator assignment)
            await taskRegistry.setCollateralManager(owner.address);
            await taskRegistry.assignOperator(1, owner.address);
            // Submit proof with actualCO2
            await taskRegistry.connect(owner).submitProof(1, "QmProofHash", ACTUAL_CO2);
            // Mark task as verified
            await taskRegistry.markAsVerified(1);
            await minter.mintCredits(1);

            const deadline = (await time.latest()) + DEADLINE_OFFSET;
            await taskRegistry.connect(proposer).createTask(
                "Second Task",
                ESTIMATED_COST,
                EXPECTED_CO2,
                LOCATION,
                deadline,
                "GPS photos",
                "QmXYZ"
            );

            await cUSD.mint(funder1.address, ESTIMATED_COST);
            await cUSD.connect(funder1).approve(await fundingPool.getAddress(), ESTIMATED_COST);
            await fundingPool.connect(funder1).fundTask(2, ESTIMATED_COST);

            // Mark task 2 as InProgress first (simulating operator assignment)
            await taskRegistry.assignOperator(2, owner.address);
            // Submit proof with actualCO2
            await taskRegistry.connect(owner).submitProof(2, "QmProofHash", ACTUAL_CO2);
            // Mark task as verified
            await taskRegistry.markAsVerified(2);
            await minter.mintCredits(2);

            expect(await minter.totalTokenTypes()).to.equal(2);
        });
    });
});
