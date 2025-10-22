

### Smart Contracts - Foundation
- [ ] **Setup Hardhat project**
  - [ ] Initialize with `npx hardhat init`
  - [ ] Install OpenZeppelin: `npm install @openzeppelin/contracts`
  - [ ] Configure Celo Alfajores testnet in `hardhat.config.js`
  - [ ] Setup `.env` with private key and RPC URL

- [ ] **TaskRegistry.sol - Simplified**
  ```solidity
  // Inherit: Ownable, Pausable, ReentrancyGuard
  ```
  - [ ] `createTask()` - basic version (description, cost, CO2)
  - [ ] `getTask()` - view function
  - [ ] `updateTaskStatus()` - internal helper
  - [ ] TaskStatus enum: Proposed, Funded, InProgress, Completed, Verified
  - [ ] Basic events: TaskCreated, StatusChanged
  - [ ] Deploy script
  - [ ] Test: create task, read task

- [ ] **FundingPool.sol - Simplified**
  ```solidity
  // Inherit: ReentrancyGuard, Pausable
  // Use: OpenZeppelin's IERC20 for cUSD
  ```
  - [ ] `fundTask()` - accept cUSD, store funder amounts
  - [ ] `getPoolBalance()` - view function
  - [ ] Track funders in mapping: `mapping(uint256 => mapping(address => uint256))`
  - [ ] Emit FundingReceived event
  - [ ] Deploy script
  - [ ] Test: fund task, check balance
  - [ ] **Skip share tokens for now** - just track amounts in mapping

- [ ] **Simple verification (manual for MVP)**
  - [ ] Add `markAsVerified()` to TaskRegistry (onlyOwner)
  - [ ] Add `releasePayment()` to FundingPool
  - [ ] Test: verify task → release funds

### Frontend - Minimal UI
- [ ] **Setup React + Vite**
  - [ ] `npm create vite@latest frontend -- --template react-ts`
  - [ ] Install: `wagmi`, `viem`, `@rainbow-me/rainbowkit`
  - [ ] Configure Celo Alfajores network
  - [ ] Setup wallet connect (Rainbow Kit)

- [ ] **Page 1: Create Task**
  - [ ] Form: description, estimated cost (cUSD), CO2 offset
  - [ ] Connect wallet button
  - [ ] Submit transaction to TaskRegistry
  - [ ] Show success toast with task ID
  - [ ] Basic Tailwind styling

- [ ] **Page 2: Browse Tasks**
  - [ ] Fetch all tasks from TaskRegistry (off-chain indexing later)
  - [ ] Display cards: task ID, description, cost, funding progress
  - [ ] Click to view details
  - [ ] Filter by status (Proposed, Funded, etc.)

- [ ] **Page 3: Fund Task**
  - [ ] Task detail page
  - [ ] Input amount in cUSD
  - [ ] Approve cUSD spend (ERC20 approval)
  - [ ] Call FundingPool.fundTask()
  - [ ] Show transaction status

- [ ] **Admin Panel (for demo)**
  - [ ] Button to mark task as verified (calls TaskRegistry)
  - [ ] Button to release payment
  - [ ] Only visible to contract owner

### Testing & Demo
- [ ] **Get testnet cUSD**
  - [ ] Faucet: https://faucet.celo.org
  - [ ] Deploy mock cUSD token if needed

- [ ] **End-to-end test**
  - [ ] Create task → Fund task → Verify → Release payment
  - [ ] Record demo video

---

## Phase 2: Collateral & Operators (Week 3)

### Smart Contracts
- [ ] **CollateralManager.sol**
  ```solidity
  // Inherit: Ownable, ReentrancyGuard
  ```
  - [ ] `registerOperator()` - accept ETH/CELO stake
  - [ ] `stakeForTask()` - lock collateral
  - [ ] `releaseStake()` - after verification
  - [ ] Simple version: fixed 10% stake requirement
  - [ ] Events: OperatorRegistered, StakedForTask
  - [ ] Deploy + tests

- [ ] **Update TaskRegistry**
  - [ ] `assignOperator()` function
  - [ ] `submitProof()` function (stores IPFS hash string)
  - [ ] Link to CollateralManager

- [ ] **Update FundingPool**
  - [ ] Only release if task verified AND operator assigned
  - [ ] Payment goes to operator address

### Frontend
- [ ] **Operator Registration Page**
  - [ ] Form: stake amount
  - [ ] Submit to CollateralManager
  - [ ] Show operator dashboard: total stake, active tasks

- [ ] **Operator Actions**
  - [ ] Button to "Accept Task" (calls stakeForTask)
  - [ ] Upload proof form: text description + IPFS hash placeholder
  - [ ] Submit proof to TaskRegistry

- [ ] **Update Task Cards**
  - [ ] Show operator assigned
  - [ ] Show proof submitted status

### Testing
- [ ] Test operator flow: register → stake → submit proof
- [ ] Test collateral lock/release

---

## Phase 3: Real Verification System (Week 4)

### Smart Contracts
- [ ] **VerificationManager.sol**
  ```solidity
  // Inherit: Ownable
  ```
  - [ ] `initiateVerification()` - called after proof submitted
  - [ ] `submitValidatorVote()` - validators vote YES/NO
  - [ ] Simple consensus: 2 out of 3 validators
  - [ ] `finalizeVerification()` - triggers stake release or slash
  - [ ] Hardcoded validator addresses for MVP
  - [ ] Events: VerificationStarted, ValidatorVoted, Verified
  - [ ] Deploy + tests

- [ ] **Update CollateralManager**
  - [ ] `slashStake()` function
  - [ ] Send slashed funds to treasury

- [ ] **Simple Treasury.sol**
  - [ ] Receive slashed funds
  - [ ] Owner can withdraw

### Frontend
- [ ] **Validator Dashboard**
  - [ ] Show pending verifications
  - [ ] Task details + proof
  - [ ] Vote YES/NO buttons
  - [ ] Show current vote count

- [ ] **Update Task Detail Page**
  - [ ] Show verification status
  - [ ] Show validator votes (address + vote)
  - [ ] Show if verified/rejected

### Testing
- [ ] Test voting: 2 YES → verified → stake released
- [ ] Test voting: 2 NO → rejected → stake slashed

---

## Phase 4: Carbon Credits (Week 5)

### Smart Contracts
- [ ] **CreditToken.sol (ERC1155)**
  ```solidity
  // Inherit: ERC1155, Ownable
  ```
  - [ ] Use OpenZeppelin's ERC1155
  - [ ] Metadata URI for each token ID
  - [ ] `mint()` function (only CarbonCreditMinter)
  - [ ] `burn()` for retirement
  - [ ] Deploy + tests

- [ ] **CarbonCreditMinter.sol**
  - [ ] `mintCredits()` - called by VerificationManager
  - [ ] Calculate distribution to funders
  - [ ] Batch mint using ERC1155 `mintBatch()`
  - [ ] Store credit metadata: task ID, CO2 amount, location
  - [ ] Events: CreditsMinted
  - [ ] Deploy + tests

- [ ] **Update VerificationManager**
  - [ ] Call CarbonCreditMinter.mintCredits() on verification success

- [ ] **Update FundingPool**
  - [ ] Add function to get funder list and amounts
  - [ ] Used by CarbonCreditMinter for distribution

### Frontend
- [ ] **My Credits Page**
  - [ ] Display user's credit balances (query ERC1155)
  - [ ] Show metadata: task, CO2 amount, date
  - [ ] Button to retire/burn credits
  - [ ] Show total credits owned

- [ ] **Update Task Detail**
  - [ ] Show if credits minted
  - [ ] Show credit token ID

### Testing
- [ ] Full flow: fund → verify → receive credits proportionally
- [ ] Test burn functionality

---

## Phase 5: Marketplace (Week 6)

### Smart Contracts
- [ ] **CarbonMarketplace.sol**
  ```solidity
  // Inherit: ReentrancyGuard, Ownable
  ```
  - [ ] Simplified order book: sell orders only for MVP
  - [ ] `createSellOrder()` - escrow credits
  - [ ] `buyCredits()` - instant purchase
  - [ ] Fixed price per credit (no matching algorithm)
  - [ ] Trading fee: 1% to treasury
  - [ ] Events: OrderCreated, TradeSold
  - [ ] Deploy + tests

- [ ] **Update CreditToken**
  - [ ] Approve marketplace to transfer credits

### Frontend
- [ ] **Marketplace Page**
  - [ ] List all sell orders
  - [ ] Card display: token ID, amount, price, seller
  - [ ] Buy button → approve cUSD → buy
  - [ ] Filter by credit type/CO2 amount

- [ ] **Create Sell Order Page**
  - [ ] Select credit token from user's balance
  - [ ] Input amount and price
  - [ ] Approve credit transfer
  - [ ] Submit order

- [ ] **My Orders Page**
  - [ ] Show user's active sell orders
  - [ ] Cancel order button

### Testing
- [ ] Create sell order → buy → receive credits
- [ ] Test fees go to treasury

---

## Phase 6: Prediction Markets (Week 7)

### Smart Contracts
- [ ] **PredictionMarket.sol**
  ```solidity
  // Inherit: ReentrancyGuard, Ownable
  ```
  - [ ] Simple binary market: YES/NO pools
  - [ ] Constant sum formula: YES price + NO price = 1 cUSD
  - [ ] `createMarket()` - for each new task
  - [ ] `buyShares()` - deposit cUSD, get position tokens
  - [ ] `resolveMarket()` - called by VerificationManager
  - [ ] `claimWinnings()` - winners redeem
  - [ ] Use OpenZeppelin ERC20 for position tokens
  - [ ] Events: MarketCreated, SharesPurchased, MarketResolved
  - [ ] Deploy + tests

- [ ] **Update VerificationManager**
  - [ ] Call PredictionMarket.resolveMarket() after finalization

### Frontend
- [ ] **Prediction Market Page**
  - [ ] Show active markets (one per active task)
  - [ ] Display current YES/NO prices
  - [ ] Buy YES/NO shares form
  - [ ] Show user's positions

- [ ] **Update Task Detail**
  - [ ] Embed prediction market widget
  - [ ] Show live odds
  - [ ] Quick buy buttons

- [ ] **My Predictions Page**
  - [ ] Show all user positions
  - [ ] Claim winnings for resolved markets

### Testing
- [ ] Buy YES shares → task verified → claim winnings
- [ ] Buy NO shares → task rejected → claim winnings

---

## Phase 7: Data Registry & Governance (Week 8)

### Smart Contracts
- [ ] **DataRegistry.sol**
  ```solidity
  // Inherit: Ownable
  ```
  - [ ] `publishTaskData()` - called after verification
  - [ ] Store anonymized metrics: region, cost, CO2, success
  - [ ] IPFS hash for detailed data
  - [ ] `queryDataset()` - filter by region/date
  - [ ] Simple version: no access control yet
  - [ ] Events: DataPublished
  - [ ] Deploy + tests

- [ ] **GovernanceDAO.sol**
  ```solidity
  // Inherit: Ownable
  ```
  - [ ] Simplified governance: voting with credit tokens
  - [ ] `createProposal()` - text proposal
  - [ ] `vote()` - YES/NO with token weight
  - [ ] `executeProposal()` - manual execution by owner
  - [ ] 3-day voting period
  - [ ] Events: ProposalCreated, VoteCast, ProposalExecuted
  - [ ] Deploy + tests

### Frontend
- [ ] **Data Explorer Page**
  - [ ] Display published datasets (table view)
  - [ ] Filters: date range, region, CO2 range
  - [ ] Download CSV button (export visible data)
  - [ ] Charts: total CO2 over time, cost vs CO2 scatter

- [ ] **Governance Page**
  - [ ] List active proposals
  - [ ] Proposal detail: description, votes, time left
  - [ ] Vote YES/NO
  - [ ] Create proposal form (basic text)

- [ ] **My Voting Power Widget**
  - [ ] Show user's credit balance = voting power
  - [ ] Display in navbar

### Testing
- [ ] Verify task → data published
- [ ] Create proposal → vote → execute

---

## Phase 8: Polish & Deploy (Week 9-10)

### Smart Contracts
- [ ] **Security Audit Prep**
  - [ ] Add Pausable to all critical contracts
  - [ ] Add ReentrancyGuard where needed
  - [ ] Review all onlyOwner functions
  - [ ] Add emergency withdrawal functions
  - [ ] Test pause/unpause scenarios

- [ ] **Gas Optimization**
  - [ ] Use `calldata` instead of `memory` where possible
  - [ ] Pack structs efficiently
  - [ ] Batch operations where applicable
  - [ ] Remove unnecessary storage reads

- [ ] **Deploy to Celo Mainnet**
  - [ ] Deploy all contracts in order
  - [ ] Set cross-contract addresses
  - [ ] Transfer ownership to multisig (future)
  - [ ] Verify contracts on Celoscan

### Frontend
- [ ] **UI/UX Polish**
  - [ ] Consistent design system (shadcn/ui)
  - [ ] Loading states for all transactions
  - [ ] Error handling and user feedback
  - [ ] Responsive design (mobile-friendly)
  - [ ] Dark mode toggle

- [ ] **Dashboard Page**
  - [ ] Protocol stats: total tasks, total CO2, total credits
  - [ ] Recent activity feed
  - [ ] Quick actions: create task, fund, trade

- [ ] **User Profile Page**
  - [ ] Show all user activity: tasks created, funded, operated
  - [ ] Credits owned, orders, predictions
  - [ ] Reputation score (simple: verified tasks completed)

- [ ] **Documentation**
  - [ ] How-to guides for each role (proposer, funder, operator, validator)
  - [ ] FAQ page
  - [ ] Video tutorials

- [ ] **Analytics**
  - [ ] Integrate Dune Analytics or Covalent
  - [ ] Public dashboard with protocol metrics

### DevOps
- [ ] **Frontend Deployment**
  - [ ] Deploy to Vercel/Netlify
  - [ ] Setup custom domain
  - [ ] Environment variables for contract addresses

- [ ] **Monitoring**
  - [ ] Setup Tenderly for transaction monitoring
  - [ ] Error tracking (Sentry)
  - [ ] Uptime monitoring

- [ ] **Backup & Recovery**
  - [ ] Document all contract addresses
  - [ ] Backup deployment scripts
  - [ ] Recovery procedures

---

## Bonus Features (Post-MVP)

### Advanced Features
- [ ] **Oracle Integration**
  - [ ] Chainlink for satellite data
  - [ ] Custom oracle for IoT sensors
  - [ ] Oracle reputation system

- [ ] **AI Model Registry**
  - [ ] Model staking mechanism
  - [ ] Performance tracking
  - [ ] Automated validation

- [ ] **Advanced Marketplace**
  - [ ] Order matching algorithm
  - [ ] Limit orders
  - [ ] AMM pool for liquidity

- [ ] **Mobile App**
  - [ ] React Native wrapper
  - [ ] WalletConnect integration
  - [ ] Push notifications

### Optimization
- [ ] **Subgraph (The Graph)**
  - [ ] Index all events
  - [ ] Fast queries for frontend
  - [ ] Historical data analysis

- [ ] **IPFS Integration**
  - [ ] Pinata/NFT.storage for proof uploads
  - [ ] Decentralized file storage
  - [ ] Image preview in UI

- [ ] **Share Tokens (ERC1155)**
  - [ ] Implement full share token system
  - [ ] Make shares tradeable
  - [ ] Governance rights for share holders

---
### Code Organization
```
project/
├── contracts/          # Hardhat project
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.js
├── frontend/           # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/      # Wagmi hooks
│   │   └── utils/      # Contract ABIs, addresses
│   └── package.json
└── README.md
```

### Must-Have Tools
- **Hardhat Console:** `npx hardhat console --network alfajores`
- **Remix IDE:** Quick contract testing
- **Celoscan:** Verify transactions
- **Rainbow Kit:** Fast wallet integration
- **Tailwind + shadcn/ui:** Pre-built components


## Emergency Contacts & Resources

- **Celo Docs:** https://docs.celo.org
- **OpenZeppelin Docs:** https://docs.openzeppelin.com
- **Wagmi Docs:** https://wagmi.sh
- **Celo Discord:** Join for testnet help
- **Alfajores Faucet:** https://faucet.celo.org
