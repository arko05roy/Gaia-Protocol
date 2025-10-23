# Gaia Protocol - TODO List

## 🔗 Hook Integration Required

### Dashboard Pages - Partial Integration
- [x] **Marketplace Page** (`/dashboard/marketplace/page.tsx`)
  - [x] Replace mock orders with `useGetOrders()` for individual order details
  - [x] Integrate `useGetOrdersByToken()` for filtering
  - [x] Add `useCalculateBuyCost()` for price calculations
  - [x] Implement ERC20 approval flow for cUSD before buying
  - [x] Add real-time order updates

- [x] **Sell Credits Page** (`/dashboard/sell-credits/page.tsx`)
  - [x] Integrate `useGetBalanceOfBatch()` to fetch actual credit balances
  - [x] Add `useGetOrdersBySeller()` to show user's active orders
  - [x] Implement `useCancelOrder()` functionality
  - [x] Add ERC1155 approval for marketplace contract

- [x] **Stakes Page** (`/dashboard/stakes/page.tsx`)
  - [x] Integrate `useRegisterOperator()` for new operators
  - [x] Add `useWithdrawStake()` functionality
  - [x] Implement `useStakeForTask()` for task assignment
  - [x] Add `useGetTaskStake()` to show locked stakes per task
  - [x] Display `useGetMinimumOperatorStake()` requirements

- [x] **Admin Page** (`/admin/page.tsx`)
  - [x] Replace mock data with real blockchain metrics
  - [x] Integrate `useGetDatasetStats()` for analytics
  - [x] Add `useGetStatsByProjectType()` for project breakdowns
  - [x] Implement governance proposal creation UI
  - [x] Add validator management (authorize/revoke)

### Missing Dashboard Pages
- [ ] **Prediction Market Page** (`/dashboard/predictions/page.tsx`)
  - [ ] Create UI for browsing active markets
  - [ ] Integrate `useGetMarket()` for market details
  - [ ] Add `useBuyShares()` for YES/NO positions
  - [ ] Implement `useGetPosition()` to show user positions
  - [ ] Add `useClaimWinnings()` for resolved markets
  - [ ] Display `useGetMarketOdds()` real-time
  - [ ] Show `useCalculateShares()` before purchase

- [ ] **Data Registry Page** (`/dashboard/data/page.tsx`)
  - [ ] Create researcher dashboard
  - [ ] Integrate `useGetAllPublicEntries()` for browsing
  - [ ] Add `useQueryByProjectType()` filtering
  - [ ] Implement `useQueryByLocation()` search
  - [ ] Add `useQueryByCO2Range()` filtering
  - [ ] Display `useGetDatasetStats()` overview
  - [ ] Add data export functionality

- [ ] **Governance Page** (`/dashboard/governance/page.tsx`)
  - [ ] Create proposal browsing interface
  - [ ] Integrate `useGetProposal()` for details
  - [ ] Add `useCreateProposal()` form
  - [ ] Implement `useVote()` functionality
  - [ ] Add `useExecuteProposal()` for passed proposals
  - [ ] Display `useGetProposalState()` status
  - [ ] Show `useGetVotingResults()` live
  - [ ] Add `useCheckQuorum()` indicator

- [ ] **Model Registry Page** (`/dashboard/models/page.tsx`)
  - [ ] Create AI model marketplace
  - [ ] Integrate `useGetTopModels()` leaderboard
  - [ ] Add `useRegisterModel()` form
  - [ ] Implement `useRecordPrediction()` for predictions
  - [ ] Display `useGetModelPerformance()` metrics
  - [ ] Add `useGetConsensusPrediction()` for tasks
  - [ ] Show `useCalculateExpectedReward()` estimates

### Bridge Page
- [ ] **Bridge Page** (`/bridge/page.tsx`)
  - [ ] Integrate `useRetireCredits()` for carbon offsetting
  - [ ] Add `useGetUserRetired()` to show retirement history
  - [ ] Implement cross-chain bridge functionality (if applicable)
  - [ ] Add `useGetCirculatingSupply()` display
  - [ ] Show `useGetCreditMetadata()` for each token

### Operator Pages
- [ ] **Operator Dashboard** (`/operator/page.tsx`)
  - [ ] Create operator-specific dashboard
  - [ ] Integrate `useGetOperatorTasks()` for assigned tasks
  - [ ] Add `useSubmitProof()` interface with IPFS upload
  - [ ] Display `useGetOperatorTotalStake()` overview
  - [ ] Show available tasks with `useGetTasksByStatus(Funded)`

## 🎨 Frontend Pages to Create

### Public Pages
- [ ] **Landing Page Enhancements** (`/page.tsx`)
  - [ ] Add live protocol statistics
  - [ ] Integrate `useGetTotalTasks()` counter
  - [ ] Display `useGetMarketStats()` volume
  - [ ] Show total CO2 offset from `useGetTotalRetired()`

- [ ] **Task Detail Page** (`/task/[id]/page.tsx`)
  - [ ] Create detailed task view
  - [ ] Show funding progress with `useGetFundingProgress()`
  - [ ] Display funders list with `useGetFundersWithShares()`
  - [ ] Add prediction market widget
  - [ ] Show verification status
  - [ ] Display proof documents (IPFS links)

- [ ] **Profile Page** (`/profile/[address]/page.tsx`)
  - [ ] Create user profile view
  - [ ] Show tasks created with `useGetProposerTasks()`
  - [ ] Display tasks operated with `useGetOperatorTasks()`
  - [ ] Show carbon credits owned
  - [ ] Display reputation/validator score

### Advanced Features Pages
- [ ] **Analytics Dashboard** (`/analytics/page.tsx`)
  - [ ] Create protocol-wide analytics
  - [ ] Integrate `useGetDatasetStats()`
  - [ ] Add charts for funding trends
  - [ ] Show verification success rates
  - [ ] Display market volume over time

- [ ] **Leaderboard Page** (`/leaderboard/page.tsx`)
  - [ ] Top operators by completed tasks
  - [ ] Top validators by reputation
  - [ ] Top funders by volume
  - [ ] Top AI models by accuracy

## ⚙️ Functionalities Not Yet Implemented

### Task Management
- [ ] Task editing/cancellation (proposer)
- [ ] Task deadline extension requests
- [ ] Milestone-based funding release
- [ ] Task templates for common project types
- [ ] Batch task creation

### Funding Features
- [ ] Recurring funding subscriptions
- [ ] Funding matching programs
- [ ] Crowdfunding campaigns with stretch goals
- [ ] Funder reputation system
- [ ] Funding withdrawal before task starts

### Verification Enhancements
- [ ] Multi-stage verification (progress checkpoints)
- [ ] Validator specialization/categories
- [ ] Validator staking requirements
- [ ] Automated verification triggers
- [ ] Dispute resolution UI
- [ ] Appeal process for rejected tasks

### Marketplace Features
- [ ] Bulk order creation
- [ ] Order book visualization
- [ ] Price charts and history
- [ ] Automated market making
- [ ] Credit bundling/unbundling
- [ ] OTC (over-the-counter) trading
- [ ] Credit derivatives/futures

### Collateral & Staking
- [ ] Dynamic collateral requirements based on risk
- [ ] Stake delegation
- [ ] Stake insurance pools
- [ ] Slashing appeals process
- [ ] Operator reputation scoring

### Prediction Markets
- [ ] Market creation by community
- [ ] Liquidity provision incentives
- [ ] Market resolution disputes
- [ ] Conditional markets (if X then Y)
- [ ] Market analytics dashboard

### Data Registry
- [ ] Data access control (private datasets)
- [ ] Data marketplace (sell access to datasets)
- [ ] API for researchers
- [ ] Data quality scoring
- [ ] Citation tracking
- [ ] Dataset versioning

### Governance
- [ ] Proposal templates
- [ ] Delegation of voting power
- [ ] Quadratic voting
- [ ] Time-locked proposals
- [ ] Emergency proposals (fast-track)
- [ ] Governance token distribution
- [ ] Treasury management UI

### Model Registry
- [ ] Model training data marketplace
- [ ] Model performance tracking
- [ ] Model version control
- [ ] Automated model retraining
- [ ] Model ensemble predictions
- [ ] Reward distribution for accurate models

### Oracle Integration
- [ ] Satellite imagery verification
- [ ] IoT sensor data integration
- [ ] Weather data validation
- [ ] Chainlink oracle setup
- [ ] Multiple oracle aggregation
- [ ] Oracle dispute resolution

### Token Economics
- [ ] Credit burning mechanism UI
- [ ] Token vesting schedules
- [ ] Liquidity mining programs
- [ ] Fee distribution to stakeholders
- [ ] Dynamic fee adjustment

### Social Features
- [ ] Task comments/discussions
- [ ] User messaging system
- [ ] Project updates feed
- [ ] Social proof (endorsements)
- [ ] Community forums
- [ ] Task sharing on social media

### Notifications
- [ ] Email notifications
- [ ] Push notifications
- [ ] Telegram/Discord bot integration
- [ ] Custom notification preferences
- [ ] Real-time alerts for critical events

### Mobile
- [ ] Mobile-responsive design improvements
- [ ] Progressive Web App (PWA)
- [ ] Mobile-specific features
- [ ] QR code scanning for proof submission

### Security & Compliance
- [ ] KYC/AML integration for large transactions
- [ ] Multi-sig wallet support
- [ ] Rate limiting for API calls
- [ ] Audit trail for all actions
- [ ] GDPR compliance features

### Performance & Optimization
- [ ] Caching layer for blockchain data
- [ ] Pagination for large lists
- [ ] Lazy loading for images/data
- [ ] GraphQL API for efficient queries
- [ ] Batch transaction support

### Testing & Documentation
- [ ] Unit tests for all hooks
- [ ] Integration tests for user flows
- [ ] E2E tests with Playwright
- [ ] API documentation
- [ ] User guides and tutorials
- [ ] Video walkthroughs

## 🚀 Advanced Features

### AI/ML Integration
- [ ] Automated task feasibility scoring
- [ ] Fraud detection models
- [ ] Carbon offset prediction models
- [ ] Price prediction for credits
- [ ] Optimal validator selection
- [ ] Risk assessment for operators

### Cross-Chain
- [ ] Bridge to Ethereum mainnet
- [ ] Bridge to Polygon
- [ ] Bridge to other L2s
- [ ] Cross-chain credit trading
- [ ] Multi-chain governance

### DeFi Integration
- [ ] Credit-backed lending
- [ ] Liquidity pools for credits
- [ ] Yield farming with credits
- [ ] Credit derivatives
- [ ] Insurance protocols

### NFT Features
- [ ] Task completion NFTs
- [ ] Validator badges
- [ ] Operator certificates
- [ ] Funder recognition NFTs
- [ ] Achievement system

### Gamification
- [ ] Experience points (XP) system
- [ ] Levels and ranks
- [ ] Challenges and quests
- [ ] Seasonal events
- [ ] Referral rewards

### Enterprise Features
- [ ] Corporate dashboards
- [ ] Bulk credit purchasing
- [ ] White-label solutions
- [ ] API for enterprise integration
- [ ] Custom reporting

### Sustainability Tracking
- [ ] Personal carbon footprint calculator
- [ ] Offset recommendations
- [ ] Impact visualization
- [ ] SDG alignment tracking
- [ ] ESG reporting tools

### Community Tools
- [ ] DAO treasury management
- [ ] Community grants program
- [ ] Bounty system
- [ ] Hackathon platform
- [ ] Educational resources

## 📊 Priority Matrix

### High Priority (P0)
- Complete hook integration for all dashboard pages
- Implement Prediction Market page
- Add Governance page
- Complete Operator dashboard
- Implement dispute resolution UI

### Medium Priority (P1)
- Data Registry page
- Model Registry page
- Task detail page
- Profile pages
- Analytics dashboard

### Low Priority (P2)
- Advanced marketplace features
- Social features
- Gamification
- Mobile app
- Cross-chain bridges

### Future Considerations (P3)
- AI/ML advanced features
- DeFi integrations
- Enterprise features
- NFT marketplace
- White-label solutions
