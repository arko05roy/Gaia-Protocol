# Gaia Protocol - Comprehensive Test Suite

This directory contains comprehensive tests for the Gaia Protocol smart contracts. The test suite covers all contracts, user flows, edge cases, and integration scenarios.

## Test Files Overview

### Unit Tests

#### 1. **TaskRegistry.test.js**
Tests for the core task management contract.

**Coverage:**
- Task creation with validation
- Task status lifecycle (Proposed → Funded → InProgress → UnderReview → Verified/Rejected)
- Task assignment to operators
- Proof submission and validation
- Deadline checking and task abandonment
- Access control and permissions
- Edge cases (large values, long descriptions, non-existent tasks)

**Key Test Scenarios:**
- Creating tasks with valid/invalid parameters
- Tracking tasks by status and proposer
- Operator assignment and task status transitions
- Proof submission with actual CO2 tracking
- Deadline enforcement with grace period

---

#### 2. **FundingPool.test.js**
Tests for funding management and payment distribution.

**Coverage:**
- Task funding with multiple funders
- Funder share tracking and calculations
- Withdrawal with penalty system
- Payment release to operators
- Refund processing for failed tasks
- Platform fee deduction
- Access control and pause functionality

**Key Test Scenarios:**
- Multiple funders contributing to same task
- Partial and complete funding
- Withdrawal penalties before task completion
- Payment release after verification
- Refund claims after task rejection
- Platform fee calculation and distribution

---

#### 3. **CollateralManager.test.js**
Tests for operator collateral staking and slashing.

**Coverage:**
- Operator registration with minimum stake
- Stake addition and withdrawal
- Task-specific staking requirements
- Stake locking and release
- Stake slashing for fraud/failure
- Operator banning on full slash
- Reputation tracking

**Key Test Scenarios:**
- Operator registration and validation
- Stake calculation based on task cost
- Stake release after successful verification
- Partial and full stake slashing
- Operator deregistration on full withdrawal
- Multiple operators managing different tasks

---

#### 4. **VerificationManager.test.js**
Tests for the verification and consensus process.

**Coverage:**
- Validator management (add/remove)
- Verification initiation and deadline
- Validator voting with confidence scores
- Consensus calculation (66% threshold)
- Automatic finalization on consensus
- Deadline-based finalization
- Stake release/slashing based on outcome
- Refund enabling for rejected tasks

**Key Test Scenarios:**
- Validator assignment and voting
- Consensus reaching with different vote distributions
- Confidence score tracking
- Automatic task verification/rejection
- Operator stake release on approval
- Operator stake slashing on rejection
- Multiple validators with different opinions

---

#### 5. **CarbonCreditMinter.test.js**
Tests for carbon credit token minting and retirement.

**Coverage:**
- Credit minting for verified tasks
- Proportional credit distribution to funders
- Metadata storage (CO2, location, vintage)
- Credit retirement/burning
- Circulating supply calculation
- Retired credits tracking
- URI generation for token metadata

**Key Test Scenarios:**
- Minting credits with correct distribution
- Handling unequal funder contributions
- Credit retirement with reason tracking
- Circulating supply after retirement
- Multiple token types (tasks)
- Large CO2 amounts handling

---

#### 6. **CarbonMarketplace.test.js**
Tests for carbon credit trading.

**Coverage:**
- Sell order creation and management
- Order cancellation with credit return
- Credit purchase with fee deduction
- Partial and complete order fills
- Trading fee collection
- Market statistics (volume, trades)
- Order book queries (by token, seller, active)
- Price discovery (cheapest order)

**Key Test Scenarios:**
- Creating sell orders with price setting
- Multiple sellers for same token
- Buyer purchases with fee deduction
- Order state transitions (active → filled)
- Trading volume and trade count tracking
- Market statistics aggregation
- High price handling

---

#### 7. **PredictionMarket.test.js**
Tests for binary prediction markets.

**Coverage:**
- Market creation with deadline
- YES/NO share purchasing
- Pool balance tracking
- Market resolution (YES/NO outcome)
- Winning calculation and distribution
- Odds calculation (probability)
- Position tracking per user
- Market creation fee collection

**Key Test Scenarios:**
- Market creation and fee charging
- Buying YES and NO shares
- Pool balance updates
- Market resolution by authorized parties
- Winnings calculation based on pool ratios
- Odds calculation from pool ratios
- Preventing claims for losing side

---

### Integration Tests

#### 8. **Integration.test.js**
Comprehensive end-to-end tests covering complete user flows.

**Coverage:**

**Flow 1: Complete Task Lifecycle - Success Path**
- Task creation by proposer
- Prediction market creation
- Multiple funders contributing
- Operator staking and assignment
- Proof submission
- Validator verification (all approve)
- Credit minting and distribution
- Operator payment release

**Flow 2: Task Rejection Path**
- Task creation and funding
- Operator assignment and proof submission
- Validator rejection (fraud detection)
- Operator stake slashing
- Funder refund processing

**Flow 3: Carbon Credit Trading**
- Task completion and credit minting
- Funder creates sell order
- Trader purchases credits
- Trader retires credits for ESG compliance

**Flow 4: Prediction Market Participation**
- Market creation
- Multiple traders buying YES/NO shares
- Odds calculation and updates
- Market resolution based on task outcome
- Winning traders claim rewards

**Flow 5: Multiple Concurrent Tasks**
- Multiple tasks created simultaneously
- Different operators assigned to each
- Parallel verification processes
- All tasks verified successfully

**Flow 6: Operator Reputation**
- Operator succeeds on first task
- Operator commits fraud on second task
- Operator gets banned after fraud detection
- Stake slashing applied

**Flow 7: Fee Distribution**
- Platform fees collected from funding
- Treasury receives fee share
- Operator receives payment after fees

---

## Running Tests

### Prerequisites
```bash
npm install
```

### Run All Tests
```bash
npx hardhat test
```

### Run Specific Test File
```bash
npx hardhat test test/TaskRegistry.test.js
npx hardhat test test/FundingPool.test.js
npx hardhat test test/CollateralManager.test.js
npx hardhat test test/VerificationManager.test.js
npx hardhat test test/CarbonCreditMinter.test.js
npx hardhat test test/CarbonMarketplace.test.js
npx hardhat test test/PredictionMarket.test.js
npx hardhat test test/Integration.test.js
```

### Run with Coverage
```bash
npx hardhat coverage
```

### Run with Gas Reporter
```bash
REPORT_GAS=true npx hardhat test
```

---

## Test Statistics

### Total Test Count
- **TaskRegistry**: 50+ tests
- **FundingPool**: 45+ tests
- **CollateralManager**: 40+ tests
- **VerificationManager**: 55+ tests
- **CarbonCreditMinter**: 35+ tests
- **CarbonMarketplace**: 50+ tests
- **PredictionMarket**: 45+ tests
- **Integration**: 7 comprehensive flows

**Total: 320+ test cases**

---

## Test Coverage Areas

### Functionality Coverage
- ✅ Core business logic
- ✅ State transitions
- ✅ Access control
- ✅ Fee calculations
- ✅ Stake management
- ✅ Voting and consensus
- ✅ Token minting and burning
- ✅ Order management
- ✅ Market mechanics

### Error Handling
- ✅ Invalid inputs
- ✅ Unauthorized access
- ✅ Insufficient balances
- ✅ Invalid state transitions
- ✅ Duplicate operations
- ✅ Deadline violations
- ✅ Paused contract operations

### Edge Cases
- ✅ Zero amounts
- ✅ Very large values
- ✅ Minimum thresholds
- ✅ Maximum limits
- ✅ Boundary conditions
- ✅ Concurrent operations
- ✅ Multiple participants

### Integration Scenarios
- ✅ Complete task lifecycle (success)
- ✅ Complete task lifecycle (rejection)
- ✅ Multi-step user journeys
- ✅ Cross-contract interactions
- ✅ Fee distribution
- ✅ Operator reputation
- ✅ Market participation

---

## Key Testing Patterns

### 1. Setup Pattern
Each test file establishes contracts and initial state in `beforeEach()`:
```javascript
beforeEach(async function () {
    // Deploy contracts
    // Setup interconnections
    // Mint initial tokens
    // Create initial state
});
```

### 2. Event Testing
Tests verify correct events are emitted:
```javascript
await expect(tx).to.emit(contract, "EventName").withArgs(arg1, arg2);
```

### 3. State Verification
Tests verify state changes:
```javascript
const value = await contract.getState();
expect(value).to.equal(expectedValue);
```

### 4. Error Testing
Tests verify correct error messages:
```javascript
await expect(tx).to.be.revertedWith("Error message");
```

### 5. Flow Testing
Integration tests follow complete user journeys with multiple steps.

---

## Test Data

### Constants Used
- **ESTIMATED_COST**: 50,000 cUSD
- **EXPECTED_CO2**: 500 tons
- **ACTUAL_CO2**: 520 tons
- **DEADLINE_OFFSET**: 90 days
- **MINIMUM_STAKE**: 1 ether
- **MINIMUM_STAKE_PERCENTAGE**: 10%
- **CONSENSUS_THRESHOLD**: 66%
- **PLATFORM_FEE**: 2% (200 bps)
- **WITHDRAWAL_PENALTY**: 2% (200 bps)
- **TRADING_FEE**: 0.5% (50 bps)

---

## Mocking Strategy

### MockERC20
- Used for cUSD token simulation
- Supports mint/burn operations
- Configurable decimals

### Contract Interfaces
- Minimal interfaces for cross-contract calls
- Allows testing without full implementations

---

## Best Practices Demonstrated

1. **Comprehensive Coverage**: Tests cover happy paths, error cases, and edge cases
2. **Clear Documentation**: Each test has descriptive names and comments
3. **Isolation**: Tests are independent and can run in any order
4. **Reusability**: Common setup patterns reduce code duplication
5. **Assertions**: Multiple assertions verify complete state changes
6. **Event Verification**: Critical events are verified
7. **Access Control**: Permission checks are tested
8. **State Transitions**: Valid and invalid transitions are tested
9. **Fee Calculations**: All fee logic is verified
10. **Integration**: End-to-end flows test real usage patterns

---

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Contract not deployed"
- **Solution**: Ensure all contracts are deployed in beforeEach()

**Issue**: Insufficient balance errors
- **Solution**: Mint sufficient tokens before operations

**Issue**: Approval errors
- **Solution**: Call approve() before transfer operations

**Issue**: Deadline passed errors
- **Solution**: Use time.increase() to advance blockchain time

**Issue**: Access control errors
- **Solution**: Verify correct signer is used for each operation

---

## Future Enhancements

- [ ] Add gas optimization tests
- [ ] Add security audit tests
- [ ] Add performance benchmarks
- [ ] Add fuzzing tests
- [ ] Add property-based tests
- [ ] Add stress tests for multiple concurrent operations
- [ ] Add oracle integration tests
- [ ] Add upgrade path tests

---

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Add comprehensive documentation
3. Test both success and failure paths
4. Include edge cases
5. Verify events and state changes
6. Use meaningful assertions
7. Keep tests isolated and independent

---

## References

- [Hardhat Testing Documentation](https://hardhat.org/hardhat-runner/docs/guides/test)
- [Chai Assertion Library](https://www.chaijs.com/)
- [OpenZeppelin Test Helpers](https://docs.openzeppelin.com/test-helpers/)
- [Gaia Protocol Documentation](../../Working.md)
