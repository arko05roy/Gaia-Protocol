const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CarbonMarketplace", function () {
    let marketplace, minter, taskRegistry, fundingPool, creditToken, cUSD;
    let owner, proposer, funder1, funder2, buyer, seller, treasury, other;

    const TASK_DESCRIPTION = "Plant 10,000 Mangroves";
    const ESTIMATED_COST = ethers.parseUnits("50000", 18);
    const EXPECTED_CO2 = ethers.parseUnits("500", 18);
    const ACTUAL_CO2 = ethers.parseUnits("520", 18);
    const LOCATION = "Tamil Nadu, India";
    const DEADLINE_OFFSET = 90 * 24 * 60 * 60;
    const BASE_URI = "ipfs://QmBase/";

    beforeEach(async function () {
        [owner, proposer, funder1, funder2, buyer, seller, treasury, other] = await ethers.getSigners();

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

        // Deploy CarbonMarketplace
        const CarbonMarketplace = await ethers.getContractFactory("CarbonMarketplace");
        marketplace = await CarbonMarketplace.deploy(
            await minter.getAddress(),
            await cUSD.getAddress(),
            treasury.address
        );
        await marketplace.waitForDeployment();

        // Setup
        await taskRegistry.setFundingPool(await fundingPool.getAddress());
        await taskRegistry.setVerificationManager(owner.address);
        await minter.setVerificationManager(owner.address);

        // Create and fund task
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

        await cUSD.mint(funder1.address, ethers.parseUnits("25000", 18));
        await cUSD.mint(funder2.address, ethers.parseUnits("25000", 18));

        await cUSD.connect(funder1).approve(await fundingPool.getAddress(), ethers.parseUnits("25000", 18));
        await cUSD.connect(funder2).approve(await fundingPool.getAddress(), ethers.parseUnits("25000", 18));

        await fundingPool.connect(funder1).fundTask(1, ethers.parseUnits("25000", 18));
        await fundingPool.connect(funder2).fundTask(1, ethers.parseUnits("25000", 18));

        // Mint credits - need to submit proof first
        await taskRegistry.setCollateralManager(owner.address);
        await taskRegistry.assignOperator(1, owner.address);
        await taskRegistry.connect(owner).submitProof(1, "QmProofHash", ACTUAL_CO2);
        await taskRegistry.markAsVerified(1);
        await minter.mintCredits(1);

        creditToken = minter;
    });

    describe("Deployment", function () {
        it("Should initialize with correct addresses", async function () {
            expect(await marketplace.creditToken()).to.equal(await minter.getAddress());
            expect(await marketplace.cUSD()).to.equal(await cUSD.getAddress());
            expect(await marketplace.treasuryAddress()).to.equal(treasury.address);
        });

        it("Should set default trading fee to 50 bps (0.5%)", async function () {
            expect(await marketplace.tradingFeeBps()).to.equal(50);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to update trading fee", async function () {
            await marketplace.setTradingFee(100);
            expect(await marketplace.tradingFeeBps()).to.equal(100);
        });

        it("Should reject trading fee above maximum", async function () {
            await expect(
                marketplace.setTradingFee(600)
            ).to.be.revertedWith("Fee too high");
        });

        it("Should allow owner to update treasury", async function () {
            await marketplace.setTreasury(other.address);
            expect(await marketplace.treasuryAddress()).to.equal(other.address);
        });

        it("Should reject invalid treasury address", async function () {
            await expect(
                marketplace.setTreasury(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid address");
        });

        it("Should allow owner to pause/unpause", async function () {
            await marketplace.pause();
            expect(await marketplace.paused()).to.be.true;

            await marketplace.unpause();
            expect(await marketplace.paused()).to.be.false;
        });
    });

    describe("Creating Sell Orders", function () {
        beforeEach(async function () {
            // Approve credits for marketplace
            await minter.connect(funder1).setApprovalForAll(await marketplace.getAddress(), true);
            await minter.connect(funder2).setApprovalForAll(await marketplace.getAddress(), true);
        });

        it("Should create a sell order", async function () {
            const amount = ethers.parseUnits("100", 18);
            const pricePerCredit = ethers.parseUnits("1", 18);

            const tx = await marketplace.connect(funder1).createSellOrder(1, amount, pricePerCredit);

            await expect(tx).to.emit(marketplace, "OrderCreated");
        });

        it("Should emit OrderCreated event", async function () {
            const amount = ethers.parseUnits("100", 18);
            const pricePerCredit = ethers.parseUnits("1", 18);

            await expect(
                marketplace.connect(funder1).createSellOrder(1, amount, pricePerCredit)
            ).to.emit(marketplace, "OrderCreated").withArgs(1, funder1.address, 1, amount, pricePerCredit);
        });

        it("Should transfer credits to marketplace escrow", async function () {
            const amount = ethers.parseUnits("100", 18);
            const pricePerCredit = ethers.parseUnits("1", 18);

            const initialBalance = await minter.balanceOf(funder1.address, 1);

            await marketplace.connect(funder1).createSellOrder(1, amount, pricePerCredit);

            const finalBalance = await minter.balanceOf(funder1.address, 1);
            expect(finalBalance).to.equal(initialBalance - amount);

            const marketplaceBalance = await minter.balanceOf(await marketplace.getAddress(), 1);
            expect(marketplaceBalance).to.equal(amount);
        });

        it("Should reject zero amount", async function () {
            const pricePerCredit = ethers.parseUnits("1", 18);

            await expect(
                marketplace.connect(funder1).createSellOrder(1, 0, pricePerCredit)
            ).to.be.revertedWith("Amount must be positive");
        });

        it("Should reject zero price", async function () {
            const amount = ethers.parseUnits("100", 18);

            await expect(
                marketplace.connect(funder1).createSellOrder(1, amount, 0)
            ).to.be.revertedWith("Price must be positive");
        });

        it("Should reject insufficient balance", async function () {
            const excessAmount = ACTUAL_CO2 + ethers.parseUnits("100", 18);
            const pricePerCredit = ethers.parseUnits("1", 18);

            await expect(
                marketplace.connect(funder1).createSellOrder(1, excessAmount, pricePerCredit)
            ).to.be.revertedWith("Insufficient balance");
        });

        it("Should reject order creation when paused", async function () {
            await marketplace.pause();

            const amount = ethers.parseUnits("100", 18);
            const pricePerCredit = ethers.parseUnits("1", 18);

            await expect(
                marketplace.connect(funder1).createSellOrder(1, amount, pricePerCredit)
            ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
        });

        it("Should assign incremental order IDs", async function () {
            const amount = ethers.parseUnits("100", 18);
            const pricePerCredit = ethers.parseUnits("1", 18);

            // funder1 has 260 credits (ACTUAL_CO2 / 2), funder2 has 260 credits
            // Each can create an order for 100 credits
            await marketplace.connect(funder1).createSellOrder(1, amount, pricePerCredit);
            // funder2 also has credits from the same task, so can create another order
            await marketplace.connect(funder2).createSellOrder(1, amount, pricePerCredit);

            const order1 = await marketplace.getOrder(1);
            const order2 = await marketplace.getOrder(2);

            expect(order1.seller).to.equal(funder1.address);
            expect(order2.seller).to.equal(funder2.address);
        });
    });

    describe("Canceling Orders", function () {
        beforeEach(async function () {
            await minter.connect(funder1).setApprovalForAll(await marketplace.getAddress(), true);
            await minter.connect(funder2).setApprovalForAll(await marketplace.getAddress(), true);

            const amount = ethers.parseUnits("100", 18);
            const pricePerCredit = ethers.parseUnits("1", 18);

            await marketplace.connect(funder1).createSellOrder(1, amount, pricePerCredit);
        });

        it("Should cancel an active order", async function () {
            await marketplace.connect(funder1).cancelOrder(1);

            const order = await marketplace.getOrder(1);
            expect(order.isActive).to.be.false;
        });

        it("Should emit OrderCancelled event", async function () {
            await expect(
                marketplace.connect(funder1).cancelOrder(1)
            ).to.emit(marketplace, "OrderCancelled").withArgs(1, funder1.address);
        });

        it("Should return credits to seller", async function () {
            const initialBalance = await minter.balanceOf(funder1.address, 1);

            await marketplace.connect(funder1).cancelOrder(1);

            const finalBalance = await minter.balanceOf(funder1.address, 1);
            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should reject cancellation by non-owner", async function () {
            await expect(
                marketplace.connect(other).cancelOrder(1)
            ).to.be.revertedWith("Not order owner");
        });

        it("Should reject cancellation of inactive order", async function () {
            await marketplace.connect(funder1).cancelOrder(1);

            await expect(
                marketplace.connect(funder1).cancelOrder(1)
            ).to.be.revertedWith("Order not active");
        });
    });

    describe("Buying Credits", function () {
        beforeEach(async function () {
            await minter.connect(funder1).setApprovalForAll(await marketplace.getAddress(), true);

            const amount = ethers.parseUnits("100", 18);
            const pricePerCredit = ethers.parseUnits("1", 18);

            await marketplace.connect(funder1).createSellOrder(1, amount, pricePerCredit);

            // Mint cUSD for buyer
            await cUSD.mint(buyer.address, ethers.parseUnits("1000", 18));
            await cUSD.connect(buyer).approve(await marketplace.getAddress(), ethers.parseUnits("1000", 18));
        });

        it("Should buy credits from order", async function () {
            const buyAmount = ethers.parseUnits("50", 18);

            await marketplace.connect(buyer).buyCredits(1, buyAmount);

            const buyerBalance = await minter.balanceOf(buyer.address, 1);
            expect(buyerBalance).to.equal(buyAmount);
        });

        it("Should emit OrderFilled event for complete fill", async function () {
            const buyAmount = ethers.parseUnits("100", 18);

            await expect(
                marketplace.connect(buyer).buyCredits(1, buyAmount)
            ).to.emit(marketplace, "OrderFilled");
        });

        it("Should emit OrderPartiallyFilled event for partial fill", async function () {
            const buyAmount = ethers.parseUnits("50", 18);

            await expect(
                marketplace.connect(buyer).buyCredits(1, buyAmount)
            ).to.emit(marketplace, "OrderPartiallyFilled");
        });

        it("Should deduct trading fee from buyer", async function () {
            const buyAmount = ethers.parseUnits("100", 18);
            const expectedFee = (buyAmount * 50n) / 10000n; // 0.5% fee

            const initialTreasuryBalance = await cUSD.balanceOf(treasury.address);

            await marketplace.connect(buyer).buyCredits(1, buyAmount);

            const finalTreasuryBalance = await cUSD.balanceOf(treasury.address);
            expect(finalTreasuryBalance).to.equal(initialTreasuryBalance + expectedFee);
        });

        it("Should pay seller after fee deduction", async function () {
            const buyAmount = ethers.parseUnits("100", 18);
            const fee = (buyAmount * 50n) / 10000n;
            const sellerProceeds = buyAmount - fee;

            const initialSellerBalance = await cUSD.balanceOf(funder1.address);

            await marketplace.connect(buyer).buyCredits(1, buyAmount);

            const finalSellerBalance = await cUSD.balanceOf(funder1.address);
            expect(finalSellerBalance).to.equal(initialSellerBalance + sellerProceeds);
        });

        it("Should reject zero amount", async function () {
            await expect(
                marketplace.connect(buyer).buyCredits(1, 0)
            ).to.be.revertedWith("Amount must be positive");
        });

        it("Should reject amount exceeding order", async function () {
            const excessAmount = ethers.parseUnits("200", 18);

            await expect(
                marketplace.connect(buyer).buyCredits(1, excessAmount)
            ).to.be.revertedWith("Amount exceeds order");
        });

        it("Should reject purchase from inactive order", async function () {
            await marketplace.connect(funder1).cancelOrder(1);

            const buyAmount = ethers.parseUnits("50", 18);

            await expect(
                marketplace.connect(buyer).buyCredits(1, buyAmount)
            ).to.be.revertedWith("Order not active");
        });

        it("Should reject purchase when paused", async function () {
            await marketplace.pause();

            const buyAmount = ethers.parseUnits("50", 18);

            await expect(
                marketplace.connect(buyer).buyCredits(1, buyAmount)
            ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
        });

        it("Should update order amount after partial fill", async function () {
            const buyAmount = ethers.parseUnits("50", 18);

            await marketplace.connect(buyer).buyCredits(1, buyAmount);

            const order = await marketplace.getOrder(1);
            expect(order.amount).to.equal(ethers.parseUnits("50", 18));
            expect(order.isActive).to.be.true;
        });

        it("Should deactivate order after complete fill", async function () {
            const buyAmount = ethers.parseUnits("100", 18);

            await marketplace.connect(buyer).buyCredits(1, buyAmount);

            const order = await marketplace.getOrder(1);
            expect(order.isActive).to.be.false;
        });

        it("Should track trading volume", async function () {
            const buyAmount = ethers.parseUnits("100", 18);

            await marketplace.connect(buyer).buyCredits(1, buyAmount);

            const [totalVolume] = await marketplace.getMarketStats(1);
            expect(totalVolume).to.equal(buyAmount);
        });

        it("Should track number of trades", async function () {
            const buyAmount = ethers.parseUnits("50", 18);

            await marketplace.connect(buyer).buyCredits(1, buyAmount);

            // Create another buyer
            const buyer2 = (await ethers.getSigners())[9];
            await cUSD.mint(buyer2.address, ethers.parseUnits("1000", 18));
            await cUSD.connect(buyer2).approve(await marketplace.getAddress(), ethers.parseUnits("1000", 18));

            await marketplace.connect(buyer2).buyCredits(1, buyAmount);

            const [, totalTrades] = await marketplace.getMarketStats(1);
            expect(totalTrades).to.equal(2);
        });
    });

    describe("Read Functions", function () {
        beforeEach(async function () {
            await minter.connect(funder1).setApprovalForAll(await marketplace.getAddress(), true);
            await minter.connect(funder2).setApprovalForAll(await marketplace.getAddress(), true);

            const amount = ethers.parseUnits("100", 18);
            const pricePerCredit = ethers.parseUnits("1", 18);

            await marketplace.connect(funder1).createSellOrder(1, amount, pricePerCredit);
            await marketplace.connect(funder2).createSellOrder(1, amount, ethers.parseUnits("2", 18));
        });

        it("Should get order details", async function () {
            const order = await marketplace.getOrder(1);
            expect(order.orderId).to.equal(1);
            expect(order.seller).to.equal(funder1.address);
            expect(order.tokenId).to.equal(1);
            expect(order.isActive).to.be.true;
        });

        it("Should get multiple orders", async function () {
            const orders = await marketplace.getOrders([1, 2]);
            expect(orders.length).to.equal(2);
            expect(orders[0].orderId).to.equal(1);
            expect(orders[1].orderId).to.equal(2);
        });

        it("Should get orders by token", async function () {
            const orderIds = await marketplace.getOrdersByToken(1);
            expect(orderIds.length).to.equal(2);
        });

        it("Should get active orders by token", async function () {
            const orderIds = await marketplace.getActiveOrdersByToken(1);
            expect(orderIds.length).to.equal(2);
        });

        it("Should get orders by seller", async function () {
            const orderIds = await marketplace.getOrdersBySeller(funder1.address);
            expect(orderIds.length).to.equal(1);
            expect(orderIds[0]).to.equal(1);
        });

        it("Should get active orders by seller", async function () {
            const orderIds = await marketplace.getActiveOrdersBySeller(funder1.address);
            expect(orderIds.length).to.equal(1);
        });

        it("Should get all active orders", async function () {
            const orderIds = await marketplace.getAllActiveOrders();
            expect(orderIds.length).to.equal(2);
        });

        it("Should get cheapest order", async function () {
            const [cheapestOrderId, price] = await marketplace.getCheapestOrder(1);
            expect(cheapestOrderId).to.equal(1);
            expect(price).to.equal(ethers.parseUnits("1", 18));
        });

        it("Should get market statistics", async function () {
            const [totalVolume, totalTrades, activeOrderCount] = await marketplace.getMarketStats(1);
            expect(totalVolume).to.equal(0); // No trades yet
            expect(totalTrades).to.equal(0);
            expect(activeOrderCount).to.equal(2);
        });

        it("Should calculate buy cost", async function () {
            const buyAmount = ethers.parseUnits("50", 18);
            const [totalCost, fee, sellerReceives] = await marketplace.calculateBuyCost(1, buyAmount);

            expect(totalCost).to.equal(buyAmount);
            expect(fee).to.equal((buyAmount * 50n) / 10000n);
            expect(sellerReceives).to.equal(buyAmount - fee);
        });

        it("Should get total orders count", async function () {
            expect(await marketplace.getTotalOrders()).to.equal(2);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle very high prices", async function () {
            await minter.connect(funder1).setApprovalForAll(await marketplace.getAddress(), true);

            const amount = ethers.parseUnits("1", 18);
            const highPrice = ethers.parseUnits("1000000", 18);

            await marketplace.connect(funder1).createSellOrder(1, amount, highPrice);

            const order = await marketplace.getOrder(1);
            expect(order.pricePerCredit).to.equal(highPrice);
        });

        it("Should handle multiple orders for same token", async function () {
            await minter.connect(funder1).setApprovalForAll(await marketplace.getAddress(), true);
            await minter.connect(funder2).setApprovalForAll(await marketplace.getAddress(), true);

            const amount = ethers.parseUnits("50", 18);
            const pricePerCredit = ethers.parseUnits("1", 18);

            for (let i = 0; i < 5; i++) {
                const funder = i === 0 ? funder1 : funder2;
                await marketplace.connect(funder).createSellOrder(1, amount, pricePerCredit);
            }

            const orderIds = await marketplace.getOrdersByToken(1);
            expect(orderIds.length).to.equal(5);
        });
    });
});
