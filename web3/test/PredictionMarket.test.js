const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PredictionMarket", function () {
    let predictionMarket, cUSD;
    let owner, trader1, trader2, trader3, verificationManager, other;

    const MARKET_CREATION_FEE = ethers.parseUnits("100", 18);

    beforeEach(async function () {
        [owner, trader1, trader2, trader3, verificationManager, other] = await ethers.getSigners();

        // Deploy mock cUSD
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        cUSD = await MockERC20.deploy("cUSD", "cUSD", 18);
        await cUSD.waitForDeployment();

        // Deploy PredictionMarket
        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        predictionMarket = await PredictionMarket.deploy(await cUSD.getAddress());
        await predictionMarket.waitForDeployment();

        // Setup
        await predictionMarket.setVerificationManager(verificationManager.address);

        // Mint cUSD to traders
        await cUSD.mint(trader1.address, ethers.parseUnits("10000", 18));
        await cUSD.mint(trader2.address, ethers.parseUnits("10000", 18));
        await cUSD.mint(trader3.address, ethers.parseUnits("10000", 18));
        await cUSD.mint(owner.address, ethers.parseUnits("10000", 18));
    });

    describe("Deployment", function () {
        it("Should initialize with correct cUSD address", async function () {
            expect(await predictionMarket.cUSD()).to.equal(await cUSD.getAddress());
        });

        it("Should set default market creation fee to 100 cUSD", async function () {
            expect(await predictionMarket.marketCreationFee()).to.equal(MARKET_CREATION_FEE);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to set verification manager", async function () {
            await predictionMarket.setVerificationManager(other.address);
            expect(await predictionMarket.verificationManagerAddress()).to.equal(other.address);
        });

        it("Should reject invalid verification manager address", async function () {
            await expect(
                predictionMarket.setVerificationManager(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid address");
        });

        it("Should allow owner to update market creation fee", async function () {
            const newFee = ethers.parseUnits("200", 18);
            await predictionMarket.setMarketCreationFee(newFee);
            expect(await predictionMarket.marketCreationFee()).to.equal(newFee);
        });

        it("Should allow owner to pause/unpause", async function () {
            await predictionMarket.pause();
            expect(await predictionMarket.paused()).to.be.true;

            await predictionMarket.unpause();
            expect(await predictionMarket.paused()).to.be.false;
        });
    });

    describe("Market Creation", function () {
        it("Should create a market", async function () {
            const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE);
            await predictionMarket.connect(owner).createMarket(1, deadline);

            expect(await predictionMarket.marketExists(1)).to.be.true;
        });

        it("Should emit MarketCreated event", async function () {
            const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE);

            await expect(
                predictionMarket.connect(owner).createMarket(1, deadline)
            ).to.emit(predictionMarket, "MarketCreated").withArgs(1, deadline);
        });

        it("Should charge market creation fee", async function () {
            const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
            const initialBalance = await cUSD.balanceOf(owner.address);

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE);
            await predictionMarket.connect(owner).createMarket(1, deadline);

            const finalBalance = await cUSD.balanceOf(owner.address);
            expect(finalBalance).to.equal(initialBalance - MARKET_CREATION_FEE);
        });

        it("Should initialize pools to zero", async function () {
            const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE);
            await predictionMarket.connect(owner).createMarket(1, deadline);

            const market = await predictionMarket.getMarket(1);
            expect(market.yesPool).to.equal(0);
            expect(market.noPool).to.equal(0);
        });

        it("Should reject market creation with invalid deadline", async function () {
            const pastDeadline = (await time.latest()) - 1;

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE);

            await expect(
                predictionMarket.connect(owner).createMarket(1, pastDeadline)
            ).to.be.revertedWith("Invalid deadline");
        });

        it("Should reject duplicate market creation", async function () {
            const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE * 2n);
            await predictionMarket.connect(owner).createMarket(1, deadline);

            await expect(
                predictionMarket.connect(owner).createMarket(1, deadline)
            ).to.be.revertedWith("Market already exists");
        });

        it("Should reject market creation when paused", async function () {
            await predictionMarket.pause();

            const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE);

            await expect(
                predictionMarket.connect(owner).createMarket(1, deadline)
            ).to.be.revertedWithCustomError(predictionMarket, "EnforcedPause");
        });
    });

    describe("Buying Shares", function () {
        beforeEach(async function () {
            const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE);
            await predictionMarket.connect(owner).createMarket(1, deadline);

            // Approve cUSD for traders
            await cUSD.connect(trader1).approve(await predictionMarket.getAddress(), ethers.parseUnits("10000", 18));
            await cUSD.connect(trader2).approve(await predictionMarket.getAddress(), ethers.parseUnits("10000", 18));
            await cUSD.connect(trader3).approve(await predictionMarket.getAddress(), ethers.parseUnits("10000", 18));
        });

        it("Should buy YES shares", async function () {
            const amount = ethers.parseUnits("100", 18);

            await predictionMarket.connect(trader1).buyShares(1, true, amount);

            const [yesShares, noShares] = await predictionMarket.getPosition(1, trader1.address);
            expect(yesShares).to.equal(amount);
            expect(noShares).to.equal(0);
        });

        it("Should buy NO shares", async function () {
            const amount = ethers.parseUnits("100", 18);

            await predictionMarket.connect(trader1).buyShares(1, false, amount);

            const [yesShares, noShares] = await predictionMarket.getPosition(1, trader1.address);
            expect(yesShares).to.equal(0);
            expect(noShares).to.equal(amount);
        });

        it("Should emit SharesPurchased event", async function () {
            const amount = ethers.parseUnits("100", 18);

            await expect(
                predictionMarket.connect(trader1).buyShares(1, true, amount)
            ).to.emit(predictionMarket, "SharesPurchased").withArgs(1, trader1.address, true, amount, amount);
        });

        it("Should update pool balances", async function () {
            const amount1 = ethers.parseUnits("100", 18);
            const amount2 = ethers.parseUnits("150", 18);

            await predictionMarket.connect(trader1).buyShares(1, true, amount1);
            await predictionMarket.connect(trader2).buyShares(1, false, amount2);

            const market = await predictionMarket.getMarket(1);
            expect(market.yesPool).to.equal(amount1);
            expect(market.noPool).to.equal(amount2);
        });

        it("Should reject zero amount", async function () {
            await expect(
                predictionMarket.connect(trader1).buyShares(1, true, 0)
            ).to.be.revertedWith("Amount must be positive");
        });

        it("Should reject purchase from non-existent market", async function () {
            const amount = ethers.parseUnits("100", 18);

            await expect(
                predictionMarket.connect(trader1).buyShares(999, true, amount)
            ).to.be.revertedWith("Market does not exist");
        });

        it("Should reject purchase from resolved market", async function () {
            const amount = ethers.parseUnits("100", 18);

            await predictionMarket.connect(verificationManager).resolveMarket(1, true);

            await expect(
                predictionMarket.connect(trader1).buyShares(1, true, amount)
            ).to.be.revertedWith("Market already resolved");
        });

        it("Should reject purchase when paused", async function () {
            await predictionMarket.pause();

            const amount = ethers.parseUnits("100", 18);

            await expect(
                predictionMarket.connect(trader1).buyShares(1, true, amount)
            ).to.be.revertedWithCustomError(predictionMarket, "EnforcedPause");
        });

        it("Should track total volume", async function () {
            const amount1 = ethers.parseUnits("100", 18);
            const amount2 = ethers.parseUnits("150", 18);

            await predictionMarket.connect(trader1).buyShares(1, true, amount1);
            await predictionMarket.connect(trader2).buyShares(1, false, amount2);

            const market = await predictionMarket.getMarket(1);
            expect(market.totalVolume).to.equal(amount1 + amount2);
        });
    });

    describe("Market Resolution", function () {
        beforeEach(async function () {
            const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE);
            await predictionMarket.connect(owner).createMarket(1, deadline);

            // Buy shares
            await cUSD.connect(trader1).approve(await predictionMarket.getAddress(), ethers.parseUnits("10000", 18));
            await cUSD.connect(trader2).approve(await predictionMarket.getAddress(), ethers.parseUnits("10000", 18));

            await predictionMarket.connect(trader1).buyShares(1, true, ethers.parseUnits("100", 18));
            await predictionMarket.connect(trader2).buyShares(1, false, ethers.parseUnits("100", 18));
        });

        it("Should resolve market to YES", async function () {
            await predictionMarket.connect(verificationManager).resolveMarket(1, true);

            const market = await predictionMarket.getMarket(1);
            expect(market.isResolved).to.be.true;
            expect(market.outcome).to.be.true;
        });

        it("Should resolve market to NO", async function () {
            await predictionMarket.connect(verificationManager).resolveMarket(1, false);

            const market = await predictionMarket.getMarket(1);
            expect(market.isResolved).to.be.true;
            expect(market.outcome).to.be.false;
        });

        it("Should emit MarketResolved event", async function () {
            await expect(
                predictionMarket.connect(verificationManager).resolveMarket(1, true)
            ).to.emit(predictionMarket, "MarketResolved").withArgs(1, true);
        });

        it("Should reject resolution from non-authorized", async function () {
            await expect(
                predictionMarket.connect(other).resolveMarket(1, true)
            ).to.be.revertedWith("Not authorized");
        });

        it("Should reject double resolution", async function () {
            await predictionMarket.connect(verificationManager).resolveMarket(1, true);

            await expect(
                predictionMarket.connect(verificationManager).resolveMarket(1, false)
            ).to.be.revertedWith("Already resolved");
        });
    });

    describe("Claiming Winnings", function () {
        beforeEach(async function () {
            const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE);
            await predictionMarket.connect(owner).createMarket(1, deadline);

            // Buy shares
            await cUSD.connect(trader1).approve(await predictionMarket.getAddress(), ethers.parseUnits("10000", 18));
            await cUSD.connect(trader2).approve(await predictionMarket.getAddress(), ethers.parseUnits("10000", 18));

            const yesAmount = ethers.parseUnits("100", 18);
            const noAmount = ethers.parseUnits("200", 18);

            await predictionMarket.connect(trader1).buyShares(1, true, yesAmount);
            await predictionMarket.connect(trader2).buyShares(1, false, noAmount);
        });

        it("Should claim winnings for YES winners", async function () {
            await predictionMarket.connect(verificationManager).resolveMarket(1, true);

            const initialBalance = await cUSD.balanceOf(trader1.address);

            await predictionMarket.connect(trader1).claimWinnings(1);

            const finalBalance = await cUSD.balanceOf(trader1.address);
            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should claim winnings for NO winners", async function () {
            await predictionMarket.connect(verificationManager).resolveMarket(1, false);

            const initialBalance = await cUSD.balanceOf(trader2.address);

            await predictionMarket.connect(trader2).claimWinnings(1);

            const finalBalance = await cUSD.balanceOf(trader2.address);
            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should emit WinningsClaimed event", async function () {
            await predictionMarket.connect(verificationManager).resolveMarket(1, true);

            await expect(
                predictionMarket.connect(trader1).claimWinnings(1)
            ).to.emit(predictionMarket, "WinningsClaimed");
        });

        it("Should reject claim before resolution", async function () {
            await expect(
                predictionMarket.connect(trader1).claimWinnings(1)
            ).to.be.revertedWith("Market not resolved");
        });

        it("Should reject claim for losing side", async function () {
            await predictionMarket.connect(verificationManager).resolveMarket(1, true);

            await expect(
                predictionMarket.connect(trader2).claimWinnings(1)
            ).to.be.revertedWith("No winnings to claim");
        });

        it("Should reject double claim", async function () {
            await predictionMarket.connect(verificationManager).resolveMarket(1, true);

            await predictionMarket.connect(trader1).claimWinnings(1);

            await expect(
                predictionMarket.connect(trader1).claimWinnings(1)
            ).to.be.revertedWith("No winnings to claim");
        });

        it("Should calculate correct winnings", async function () {
            const yesAmount = ethers.parseUnits("100", 18);
            const noAmount = ethers.parseUnits("200", 18);
            const totalPool = yesAmount + noAmount;

            await predictionMarket.connect(verificationManager).resolveMarket(1, true);

            const expectedWinnings = (yesAmount * totalPool) / yesAmount;

            const [yesWinnings] = await predictionMarket.calculateWinnings(1, trader1.address);
            expect(yesWinnings).to.equal(expectedWinnings);
        });
    });

    describe("Read Functions", function () {
        beforeEach(async function () {
            const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE);
            await predictionMarket.connect(owner).createMarket(1, deadline);

            await cUSD.connect(trader1).approve(await predictionMarket.getAddress(), ethers.parseUnits("10000", 18));
            await cUSD.connect(trader2).approve(await predictionMarket.getAddress(), ethers.parseUnits("10000", 18));

            await predictionMarket.connect(trader1).buyShares(1, true, ethers.parseUnits("100", 18));
            await predictionMarket.connect(trader2).buyShares(1, false, ethers.parseUnits("150", 18));
        });

        it("Should get market information", async function () {
            const market = await predictionMarket.getMarket(1);
            expect(market.taskId).to.equal(1);
            expect(market.yesPool).to.equal(ethers.parseUnits("100", 18));
            expect(market.noPool).to.equal(ethers.parseUnits("150", 18));
            expect(market.isResolved).to.be.false;
        });

        it("Should get user position", async function () {
            const [yesShares, noShares] = await predictionMarket.getPosition(1, trader1.address);
            expect(yesShares).to.equal(ethers.parseUnits("100", 18));
            expect(noShares).to.equal(0);
        });

        it("Should get market odds", async function () {
            const [yesPercent, noPercent] = await predictionMarket.getOdds(1);
            expect(yesPercent).to.equal(4000); // 40%
            expect(noPercent).to.equal(6000); // 60%
        });

        it("Should get odds for empty market", async function () {
            const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE);
            await predictionMarket.connect(owner).createMarket(2, deadline);

            const [yesPercent, noPercent] = await predictionMarket.getOdds(2);
            expect(yesPercent).to.equal(5000); // 50%
            expect(noPercent).to.equal(5000); // 50%
        });

        it("Should calculate potential winnings", async function () {
            const [yesWinnings, noWinnings] = await predictionMarket.calculateWinnings(1, trader1.address);
            expect(yesWinnings).to.be.gt(0);
            expect(noWinnings).to.equal(0);
        });

        it("Should check if market exists", async function () {
            expect(await predictionMarket.marketExists(1)).to.be.true;
            expect(await predictionMarket.marketExists(999)).to.be.false;
        });
    });

    describe("Edge Cases", function () {
        it("Should handle equal YES and NO pools", async function () {
            const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE);
            await predictionMarket.connect(owner).createMarket(1, deadline);

            await cUSD.connect(trader1).approve(await predictionMarket.getAddress(), ethers.parseUnits("10000", 18));
            await cUSD.connect(trader2).approve(await predictionMarket.getAddress(), ethers.parseUnits("10000", 18));

            const amount = ethers.parseUnits("100", 18);

            await predictionMarket.connect(trader1).buyShares(1, true, amount);
            await predictionMarket.connect(trader2).buyShares(1, false, amount);

            const [yesPercent, noPercent] = await predictionMarket.getOdds(1);
            expect(yesPercent).to.equal(5000);
            expect(noPercent).to.equal(5000);
        });

        it("Should handle very large amounts", async function () {
            const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

            await cUSD.connect(owner).approve(await predictionMarket.getAddress(), MARKET_CREATION_FEE);
            await predictionMarket.connect(owner).createMarket(1, deadline);

            const largeAmount = ethers.parseUnits("1000000", 18);
            await cUSD.mint(trader1.address, largeAmount);
            await cUSD.connect(trader1).approve(await predictionMarket.getAddress(), largeAmount);

            await predictionMarket.connect(trader1).buyShares(1, true, largeAmount);

            const market = await predictionMarket.getMarket(1);
            expect(market.yesPool).to.equal(largeAmount);
        });
    });
});
