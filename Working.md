
## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [User Roles & Personas](#user-roles--personas)
4. [Complete User Flows](#complete-user-flows)
5. [Smart Contract Interactions](#smart-contract-interactions)
6. [Data Flow & State Management](#data-flow--state-management)
7. [Economic Model](#economic-model)
8. [Edge Cases & Error Handling](#edge-cases--error-handling)
9. [Technical Specifications](#technical-specifications)

---

## Executive Summary

### What We're Building
A decentralized platform that connects environmental work (planting trees, mangrove restoration, renewable energy installation) with funding, creates verifiable proof of impact, mints carbon credits, 
and enables trading of those credits - all on the Celo blockchain.

### Core Value Proposition
- **For Funders:** Transparent impact investing with tokenized returns (carbon credits)
- **For Operators:** Access to funding for environmental projects with crypto payments
- **For Validators:** Earn fees by verifying real-world work
- **For Traders:** Liquid market for carbon credits
- **For Researchers:** Open dataset of verified environmental impact

### Key Differentiators
1. **Proof of Impact** - On-chain verification system with collateral at stake
2. **Fractional Ownership** - Anyone can fund small amounts and receive proportional credits
3. **Prediction Markets** - Crowd wisdom validates projects before completion
4. **DeSci Integration** - Every verified task feeds AI models for future predictions

---

## System Architecture Overview

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Web App)                    │
│  React + TypeScript + Wagmi + RainbowKit + Tailwind        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN LAYER (Celo)                   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ TaskRegistry │  │ FundingPool  │  │  Collateral  │     │
│  │   Contract   │  │   Contract   │  │   Manager    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Verification  │  │    Carbon    │  │ Marketplace  │     │
│  │   Manager    │  │Credit Minter │  │   Contract   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Prediction   │  │     Data     │  │  Governance  │     │
│  │   Market     │  │   Registry   │  │     DAO      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                     │
│                                                              │
│  • IPFS (Proof Storage)    • Oracles (IoT/Satellite)       │
│  • cUSD Token              • The Graph (Indexing)           │
│  • ERC1155 Tokens          • Wallet Providers               │
└─────────────────────────────────────────────────────────────┘
```

### Contract Dependency Map

```
TaskRegistry (Core)
    ↓ reads from
FundingPool ←→ cUSD Token (ERC20)
    ↓ triggers when funded
CollateralManager ←→ CELO/ETH
    ↓ operator assigned
TaskRegistry (status: InProgress)
    ↓ operator submits proof
VerificationManager
    ↓ validators vote
PredictionMarket (resolves)
    ↓ consensus reached
CarbonCreditMinter → ERC1155 CreditToken
    ↓ credits distributed
FundingPool (reads funder shares)
    ↓ credits in circulation
CarbonMarketplace ←→ cUSD Token
    ↓ data published
DataRegistry → IPFS
    ↓ governance proposals
GovernanceDAO
```

---

## User Roles & Personas

### 1. **Task Proposer**
**Who:** NGO, local community group, environmental startup  
**Goal:** Get funding for environmental project  
**Needs:** Simple proposal creation, transparent funding tracking  
**Pain Points:** Traditional funding is slow, opaque, and centralized

### 2. **Funder (Impact Investor)**
**Who:** Individual, company seeking ESG compliance, climate fund  
**Goal:** Support verified environmental work, receive carbon credits  
**Needs:** Project transparency, proof of impact, tradeable credits  
**Pain Points:** Greenwashing, no way to verify actual impact

### 3. **Node Operator (Doer)**
**Who:** Tree planting company, renewable energy installer, conservation team  
**Goal:** Execute projects and get paid in crypto  
**Needs:** Access to capital, clear requirements, fair payment  
**Pain Points:** Upfront capital requirements, payment delays

### 4. **Validator**
**Who:** Environmental expert, DAO member, technical verifier  
**Goal:** Earn fees by verifying work quality  
**Needs:** Clear evidence standards, fair compensation  
**Pain Points:** Time-consuming verification, no incentive structure

### 5. **Trader**
**Who:** Carbon credit investor, market maker, arbitrageur  
**Goal:** Buy/sell credits for profit or offsetting  
**Needs:** Liquid market, price discovery, quality information  
**Pain Points:** Illiquid markets, opaque pricing

### 6. **Predictor (Market Participant)**
**Who:** Anyone with market knowledge  
**Goal:** Earn returns by predicting project outcomes  
**Needs:** Early project information, fair resolution  
**Pain Points:** Information asymmetry

### 7. **Researcher (DeSci User)**
**Who:** Climate scientist, ML researcher, academic  
**Goal:** Access verified environmental data for research  
**Needs:** Clean datasets, metadata, open access  
**Pain Points:** Lack of verified real-world data

---

## Complete User Flows

### Flow 1: Task Creation to Funding (Proposer Journey)

#### Step 1: Proposer Creates Task

**Frontend Actions:**
1. User navigates to "Create Task" page
2. Connects wallet via RainbowKit (MetaMask, WalletConnect, etc.)
3. Fills out form:
   - **Task Title:** "Plant 10,000 Mangroves in Pichavaram"
   - **Description:** Detailed project plan (stored partially on-chain, full text in IPFS)
   - **Location:** Tamil Nadu, India (coordinates optional)
   - **Estimated Cost:** 50,000 cUSD
   - **Expected CO₂ Offset:** 500 tons over 10 years
   - **Timeline:** 3 months
   - **Proof Requirements:** GPS-tagged photos, drone imagery, local authority attestation
   - **Upload Documents:** PDF project plan (uploaded to IPFS)
4. Reviews transaction gas cost (Celo: ~$0.01)
5. Signs transaction

**Smart Contract Flow:**
```solidity
User Wallet → TaskRegistry.createTask(...)

TaskRegistry.sol:
1. Validates inputs (cost > 0, CO2 > 0, description not empty)
2. Generates taskId = taskCount++
3. Creates Task struct:
   struct Task {
       uint256 id;
       address proposer;
       string description;
       uint256 estimatedCost;
       uint256 expectedCO2;
       string location;
       uint256 deadline;
       string proofRequirements;
       string ipfsHash; // full documentation
       TaskStatus status; // = Proposed
       uint256 createdAt;
       address assignedOperator;
       uint256 actualCO2;
       string proofHash;
   }
4. Stores: tasks[taskId] = Task(...)
5. Updates: proposerTasks[msg.sender].push(taskId)
6. Emits: TaskCreated(taskId, msg.sender, estimatedCost)
```

**State Changes:**
- `taskCount`: 0 → 1
- `tasks[1]`: undefined → Task{...}
- `taskStatus[1]`: undefined → TaskStatus.Proposed

**Frontend Updates:**
1. Transaction confirmed toast notification
2. Redirect to task detail page: `/task/1`
3. Task appears in "All Tasks" browse page
4. Task appears in proposer's dashboard under "My Tasks"

---

#### Step 2: Prediction Market Auto-Creates

**Triggered By:** TaskCreated event

**Smart Contract Flow:**
```solidity
Event Listener (could be backend or frontend trigger)
→ PredictionMarket.createMarket(taskId, resolutionDeadline)

PredictionMarket.sol:
1. Validates task exists and is in Proposed status
2. Creates Market struct:
   struct Market {
       uint256 taskId;
       uint256 yesPool;
       uint256 noPool;
       uint256 totalVolume;
       uint256 resolutionDeadline;
       bool isResolved;
       bool outcome;
       mapping(address => Position) positions;
   }
3. Initializes: yesPool = 0, noPool = 0
4. Sets resolutionDeadline = task.deadline + 7 days
5. Stores: taskMarkets[taskId] = Market(...)
6. Emits: MarketCreated(taskId, resolutionDeadline)
```

**Frontend Updates:**
1. Task detail page now shows "Prediction Market" widget
2. Current odds display: YES: 50% / NO: 50% (initially)
3. "Buy Shares" buttons enabled

---

#### Step 3: Funders Discover and Fund Task

**Frontend Actions:**
1. User browses "All Tasks" page, filtered by status: "Proposed"
2. Sees task card showing:
   - Title and description preview
   - Funding progress: 0 / 50,000 cUSD (0%)
   - Expected CO₂: 500 tons
   - Timeline: 3 months
   - Prediction market odds: YES 50%
3. Clicks to view full task detail
4. Reviews:
   - Full description
   - IPFS document link (opens in new tab)
   - Proof requirements
   - Proposer address (can check reputation)
   - Comments/discussion (future feature)
5. Decides to fund 5,000 cUSD (10% of total)
6. Clicks "Fund This Task" button
7. Modal appears:
   - Input amount: 5,000 cUSD
   - Shows: "You will receive X share tokens"
   - Shows: "Estimated carbon credits: ~50 tons (pending verification)"
   - Shows gas cost: ~$0.02
8. User must first approve cUSD spend:
   - Clicks "Approve cUSD"
   - Signs ERC20 approval transaction: `cUSD.approve(FundingPool, 5000e18)`
9. After approval, clicks "Confirm Funding"
10. Signs funding transaction

**Smart Contract Flow:**
```solidity
User Wallet → cUSD.approve(FundingPool, 5000 * 10^18)
↓ (separate transaction)
User Wallet → FundingPool.fundTask(taskId=1, amount=5000e18)

FundingPool.sol:
1. Validates:
   - Task exists and status = Proposed
   - Amount > 0
   - User has sufficient cUSD balance
   - Contract has approval for amount
2. Transfers cUSD:
   cUSD.transferFrom(msg.sender, address(this), amount)
3. Updates pool:
   Pool storage pool = taskPools[taskId];
   pool.totalFunded += amount;
   pool.fundersCount++;
   funderShares[taskId][msg.sender] += amount;
4. Calculates share percentage:
   userSharePercent = amount / pool.totalFunded
5. Emits: FundingReceived(taskId, msg.sender, amount)
6. Checks if funding target reached:
   if (pool.totalFunded >= task.estimatedCost) {
       TaskRegistry.updateTaskStatus(taskId, TaskStatus.Funded);
       emit TargetReached(taskId, pool.totalFunded);
   }
```

**State Changes:**
- `taskPools[1].totalFunded`: 0 → 5,000 cUSD
- `taskPools[1].fundersCount`: 0 → 1
- `funderShares[1][funder1]`: 0 → 5,000 cUSD
- `cUSD balance (FundingPool)`: 0 → 5,000 cUSD
- `cUSD balance (Funder)`: 10,000 → 5,000 cUSD

**Frontend Updates:**
1. Funding progress bar updates: 5,000 / 50,000 (10%)
2. Transaction success notification
3. Funder's dashboard shows:
   - "Tasks I've Funded" section
   - Task #1: 5,000 cUSD funded (10% share)
   - Status: Awaiting full funding
4. Task card now shows: "1 funder, 10% funded"

---

#### Step 4: Multiple Funders Complete Funding

**Scenario:** 9 more funders contribute 5,000 cUSD each over the next few days

**After 10th Funder:**

**Smart Contract Flow:**
```solidity
Funder10 → FundingPool.fundTask(1, 5000e18)

FundingPool.sol:
1. Same validation and transfer logic
2. Updates pool:
   pool.totalFunded = 50,000 cUSD (now equals estimatedCost)
   pool.fundersCount = 10
3. **TRIGGER: Funding target reached**
   TaskRegistry(taskRegistryAddress).updateTaskStatus(1, TaskStatus.Funded)
4. Emits: TargetReached(1, 50,000)

TaskRegistry.sol (called by FundingPool):
1. Validates caller is FundingPool contract
2. Updates: taskStatus[1] = TaskStatus.Funded
3. Emits: TaskStatusChanged(1, Proposed, Funded)
```

**State Changes:**
- `taskPools[1].totalFunded`: 45,000 → 50,000 cUSD
- `taskPools[1].fundersCount`: 9 → 10
- `taskStatus[1]`: Proposed → Funded
- 10 funders now have shares: `funderShares[1][address] = 5,000` each

**Frontend Updates:**
1. Task status badge changes: "Proposed" → "Funded ✓"
2. Task moves from "Proposed" filter to "Funded" filter
3. All funders receive notification: "Task #1 is now fully funded!"
4. Task detail page now shows:
   - "Awaiting Operator Assignment"
   - List of all funders (addresses or ENS names)
   - Funding completed timestamp
5. Prediction market odds may shift: YES 65% / NO 35% (as funding signals confidence)

---

### Flow 2: Operator Assignment & Execution

#### Step 5: Operator Discovers and Accepts Task

**Frontend Actions:**
1. Operator navigates to "Available Tasks" (filtered by status: Funded)
2. Reviews task requirements:
   - Scope: Plant 10,000 mangroves
   - Location: Pichavaram, Tamil Nadu
   - Budget: 50,000 cUSD
   - Proof needed: GPS photos, drone imagery
   - Timeline: 3 months
3. Operator assesses:
   - "Can we do this with 50,000 cUSD?" ✓
   - "Do we have capacity?" ✓
   - "Can we provide required proof?" ✓
4. Clicks "Accept Task" button
5. Modal shows:
   - **Collateral Required:** 5,000 cUSD worth of CELO (10% of budget)
   - Current stake available: 10,000 cUSD equivalent
   - Stake will be locked until verification
   - "If task fails verification, stake will be slashed"
6. Confirms and signs transaction

**Smart Contract Flow:**
```solidity
Operator Wallet → CollateralManager.stakeForTask(taskId=1)

CollateralManager.sol:
1. Validates:
   - Operator is registered: approvedOperators[msg.sender] = true
   - Task status = Funded
   - Task not already assigned
   - Operator has sufficient available stake
2. Calculates required stake:
   Task memory task = TaskRegistry(taskRegistry).getTask(taskId);
   uint256 requiredStake = (task.estimatedCost * minimumStakePercentage) / 100;
   // = 50,000 * 10 / 100 = 5,000 cUSD worth
3. Locks stake:
   uint256 available = operatorStake[msg.sender];
   require(available >= requiredStake, "Insufficient stake");
   operatorStake[msg.sender] -= requiredStake;
   
   taskStakes[taskId] = StakeInfo({
       operator: msg.sender,
       amount: requiredStake,
       lockedAt: block.timestamp,
       status: StakeStatus.Locked
   });
4. Assigns operator:
   TaskRegistry(taskRegistry).assignOperator(taskId, msg.sender)
5. Emits: StakedForTask(taskId, msg.sender, requiredStake)

TaskRegistry.sol (called by CollateralManager):
1. Updates task:
   tasks[taskId].assignedOperator = operator;
   tasks[taskId].status = TaskStatus.InProgress;
2. Emits: OperatorAssigned(taskId, operator, stakeAmount)
```

**State Changes:**
- `operatorStake[operator]`: 10,000 → 5,000 CELO equivalent (5k locked)
- `taskStakes[1]`: undefined → StakeInfo{operator, 5000, locked}
- `tasks[1].assignedOperator`: 0x0 → operator address
- `taskStatus[1]`: Funded → InProgress

**Frontend Updates:**
1. Task status changes: "Funded" → "In Progress 🚧"
2. Task detail page shows:
   - "Operator: 0xABC...XYZ (or ENS name)"
   - "Collateral Locked: 5,000 cUSD"
   - "Started: Oct 20, 2025"
   - "Deadline: Jan 20, 2026"
   - Progress tracker: 0% complete
3. Operator dashboard shows:
   - "Active Tasks" section
   - Task #1: In Progress
   - Locked collateral: 5,000 cUSD
   - Days remaining: 90
4. All funders notified: "Your funded task is now in progress!"
5. Prediction market odds may shift: YES 70% / NO 30% (operator acceptance signals viability)

---

#### Step 6: Operator Executes Work (Off-Chain)

**Real-World Actions (Next 3 months):**
1. Operator mobilizes team to Pichavaram
2. Acquires 10,000 mangrove saplings
3. Plants mangroves across designated area
4. Throughout process, collects evidence:
   - **GPS-tagged photos:** Every planting location with timestamp
   - **Drone footage:** Weekly aerial surveys showing progress
   - **IoT sensors:** Soil moisture, salinity readings (if applicable)
   - **Local authority signatures:** Forest department attestation
   - **Team logs:** Daily work reports
5. Month 1: 3,000 mangroves planted
6. Month 2: 6,000 mangroves planted
7. Month 3: 10,000 mangroves planted ✓

**During Execution (Optional):**
- Operator can post updates to task (future feature)
- Funders can view progress (if operator shares)
- Prediction market continues trading based on public info

---

#### Step 7: Operator Submits Proof of Work

**Frontend Actions:**
1. Operator navigates to task detail page
2. Clicks "Submit Proof" button
3. Upload form appears:
   - **Photo Gallery:** Drag-drop GPS-tagged images (100+ photos)
   - **Drone Video:** Upload 4K footage (200MB file)
   - **Documents:** PDF attestations, sensor data CSVs
   - **Summary Text:** Detailed completion report
4. Frontend uploads all files to IPFS via Pinata/NFT.storage
5. Receives IPFS hash: `QmXYZ...ABC`
6. Form also includes:
   - **Actual CO₂ Offset:** 520 tons (operator's estimate, validators will verify)
   - **Completion Date:** Jan 15, 2026
7. Reviews and clicks "Submit to Verification"
8. Signs transaction

**Technical Flow (IPFS Upload):**
```javascript
// Frontend JavaScript
const uploadToIPFS = async (files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${PINATA_JWT}` },
    body: formData
  });
  
  const result = await response.json();
  return result.IpfsHash; // QmXYZ...ABC
};

const proofHash = await uploadToIPFS([photos, videos, docs]);
// User pays IPFS pinning fee (off-chain, ~$1-5 depending on size)
```

**Smart Contract Flow:**
```solidity
Operator Wallet → TaskRegistry.submitProofOfWork(
    taskId=1,
    proofDataHash="QmXYZ...ABC",
    actualCO2Offset=520
)

TaskRegistry.sol:
1. Validates:
   - Task status = InProgress
   - msg.sender = assignedOperator
   - proofDataHash not empty
   - actualCO2Offset > 0
2. Updates task:
   tasks[taskId].proofHash = proofDataHash;
   tasks[taskId].actualCO2 = actualCO2Offset;
   tasks[taskId].status = TaskStatus.UnderReview;
3. Emits: ProofSubmitted(taskId, proofDataHash, block.timestamp)
4. **TRIGGER: Initiate Verification**
   VerificationManager(verificationManager).initiateVerification(taskId)
```

**State Changes:**
- `tasks[1].proofHash`: "" → "QmXYZ...ABC"
- `tasks[1].actualCO2`: 0 → 520 tons
- `taskStatus[1]`: InProgress → UnderReview

**Frontend Updates:**
1. Task status: "In Progress" → "Under Review 🔍"
2. Task detail page shows:
   - "Proof Submitted: Jan 15, 2026"
   - "View Proof" button (opens IPFS gateway link)
   - "Actual CO₂: 520 tons (claimed)"
   - "Verification in progress..."
3. Operator dashboard shows:
   - Task #1: Awaiting verification
   - Collateral still locked
4. All funders notified: "Task completed! Now being verified."
5. Prediction market enters resolution countdown (7 days)

---

### Flow 3: Verification Process

#### Step 8: Verification Manager Assigns Validators

**Triggered By:** TaskRegistry.ProofSubmitted event

**Smart Contract Flow:**
```solidity
VerificationManager.initiateVerification(taskId=1)

VerificationManager.sol:
1. Validates:
   - Task status = UnderReview
   - Not already in verification
2. Randomly selects validators:
   // Pseudorandom selection from approved validator pool
   uint256 randomSeed = uint256(keccak256(abi.encodePacked(
       block.timestamp,
       block.prevrandao,
       taskId
   )));
   
   address[] memory selectedValidators = new address[](requiredValidators);
   for (uint i = 0; i < requiredValidators; i++) {
       uint index = (randomSeed + i) % approvedValidatorsList.length;
       selectedValidators[i] = approvedValidatorsList[index];
   }
   // Say: requiredValidators = 3
3. Checks if should audit:
   bool isAudit = (randomSeed % 100) < auditSampleRate;
   // If auditSampleRate = 10, then 10% of tasks flagged for deep audit
4. Creates Verification struct:
   verifications[taskId] = Verification({
       taskId: taskId,
       validators: selectedValidators,
       approveVotes: 0,
       rejectVotes: 0,
       isAudit: isAudit,
       deadline: block.timestamp + 7 days,
       isFinalized: false,
       outcome: false
   });
5. Notifies validators (off-chain event):
   for (uint i = 0; i < selectedValidators.length; i++) {
       emit ValidatorAssigned(taskId, selectedValidators[i]);
   }
6. Emits: VerificationStarted(taskId, selectedValidators, isAudit)
```

**State Changes:**
- `verifications[1]`: undefined → Verification{...}
- Selected validators: [Validator1, Validator2, Validator3]
- `isAuditTask[1]`: false (in this example, not selected for audit)

**Frontend Updates:**
1. Task detail page shows:
   - "Verification Status: Pending"
   - "Assigned Validators: 3"
   - "Votes Received: 0 / 3"
   - Countdown timer: "6 days 23 hours remaining"
2. Validator dashboards receive notification:
   - "New task assigned for verification"
   - Task #1 appears in "Pending Reviews"

---

#### Step 9: Validators Review and Vote

**Validator 1 Actions:**
1. Logs into validator dashboard
2. Sees Task #1 in "Pending Reviews"
3. Clicks to open verification interface
4. Reviews all evidence:
   - Reads task requirements
   - Downloads IPFS proof bundle
   - Views 100+ GPS-tagged photos
   - Watches drone footage
   - Checks timestamps for consistency
   - Validates GPS coordinates match stated location
   - Reviews local authority attestation
5. Cross-references:
   - Satellite imagery from Google Earth (before/after)
   - Weather data for planting dates (validates timeline)
   - Soil/geography matches mangrove habitat
6. Calculates assessment:
   - Mangroves planted: ✓ Confirmed ~10,000
   - Location correct: ✓ Pichavaram region
   - Quality adequate: ✓ Proper spacing, healthy saplings
   - CO₂ claim reasonable: ✓ 520 tons over 10 years (52 tons/year for 10k mangroves = reasonable)
7. Decision: **APPROVE**
8. Fills out verification form:
   - Vote: APPROVE
   - Confidence: 85% (high confidence)
   - Justification: "All evidence checks out. GPS data consistent, drone footage shows healthy plantation, local authority signature verified. CO₂ estimate aligns with scientific models for mangrove carbon sequestration."
9. Signs and submits transaction

**Smart Contract Flow:**
```solidity
Validator1 → VerificationManager.submitValidatorVote(
    taskId=1,
    approve=true,
    justification="All evidence checks out...",
    confidenceScore=85
)

VerificationManager.sol:
1. Validates:
   - msg.sender is assigned validator for this task
   - Validator hasn't already voted
   - Verification deadline not passed
   - Task still in UnderReview status
2. Records vote:
   Verification storage v = verifications[taskId];
   validatorVotes[taskId][msg.sender] = Vote({
       approve: approve,
       justification: justification,
       confidence: confidenceScore,
       timestamp: block.timestamp
   });
3. Updates tally:
   if (approve) {
       v.approveVotes++;
   } else {
       v.rejectVotes++;
   }
   // Now: approveVotes = 1, rejectVotes = 0
4. Emits: ValidatorVoted(taskId, msg.sender, approve)
5. Checks if voting complete:
   uint256 totalVotes = v.approveVotes + v.rejectVotes;
   if (totalVotes >= requiredValidators) {
       // Not yet, need 3 total
   }
```

**State Changes:**
- `validatorVotes[1][Validator1]`: undefined → Vote{true, "...", 85, timestamp}
- `verifications[1].approveVotes`: 0 → 1

**Frontend Updates:**
1. Task detail page updates:
   - "Votes Received: 1 / 3"
   - Shows validator addresses who voted (or anonymized)
2. Real-time vote count: ✓ 1 | ✗ 0

---

**Validator 2 Actions (Next Day):**
1. Similar review process
2. Also finds evidence compelling
3. Decision: **APPROVE**
4. Submits vote with 90% confidence

**Smart Contract Flow:**
```solidity
Validator2 → VerificationManager.submitValidatorVote(1, true, "...", 90)

// Same validation logic
// Updates: approveVotes = 2, rejectVotes = 0
// Still waiting for 3rd vote
```

---

**Validator 3 Actions (2 Days Later):**
1. Reviews evidence
2. Notices something: Some photos appear to have inconsistent metadata
3. Cross-checks GPS coordinates with Google Maps
4. Finds: 95% of coordinates valid, 5% suspicious (might be duplicates or incorrect)
5. Reviews CO₂ claim: 520 tons seems slightly optimistic, estimates closer to 480 tons
6. Decision: **APPROVE** (but with concerns)
7. Confidence: 70%
8. Justification: "Generally solid evidence, minor inconsistencies in GPS data. Recommend actual CO₂ be adjusted to 480 tons based on mortality rate assumptions. Approving as work was substantially completed."

**Smart Contract Flow:**
```solidity
Validator3 → VerificationManager.submitValidatorVote(1, true, "...", 70)

VerificationManager.sol:
// Same validation logic
// Updates: approveVotes = 3, rejectVotes = 0
// Total votes = 3 = requiredValidators
// **TRIGGER: Check Consensus**

checkConsensus(taskId=1) internal:
1. Calculates result:
   uint256 totalVotes = v.approveVotes + v.rejectVotes; // = 3
   uint256 approvalPercentage = (v.approveVotes * 100) / totalVotes;
   // = 3 * 100 / 3 = 100%
   
   bool passed = approvalPercentage >= consensusThreshold;
   // consensusThreshold = 66%, so 100% >= 66% = TRUE
2. Sets outcome:
   v.outcome = true;
   v.isFinalized = false; // Still need oracle data or finalization
3. Emits: ConsensusReached(taskId, true)
4. **Could auto-finalize here OR wait for oracle data**
   // For this flow, let's say we auto-finalize for non-audit tasks
   finalizeVerification(taskId);
```

---

#### Step 10: Verification Finalization

**Smart Contract**Smart Contract Flow (Continued):**
```solidity
5. Emits: VoteCast(proposalId, msg.sender, true, votingPower)
6. Checks quorum:
   uint256 totalVotingPower = getTotalVotingPower(); // All credits in existence
   uint256 votesReceived = prop.forVotes + prop.againstVotes;
   uint256 quorumPercent = (votesReceived * 100) / totalVotingPower;
   // If quorumPercent >= 20%, proposal can be executed
```

**State Changes:**
- `votes[1][Funder1]`: undefined → Vote{true, 42.5, timestamp}
- `proposals[1].forVotes`: 0 → 42.5

**Frontend Updates:**
1. Proposal page updates:
   - For: 42.5 votes (10%) | Against: 0 votes (0%)
   - Quorum: 10% / 20% required
   - Funder1's vote recorded ✓

---

**Over Next 7 Days: Multiple Voters Participate**

**Voter Distribution Example:**
- **FOR votes:** 8 funders + 50 traders = 250 credit tokens (58.8% of votes)
- **AGAINST votes:** 2 funders + 20 traders = 75 credit tokens (17.6% of votes)
- **Total votes:** 325 credit tokens (76.4% of total 425 in circulation)
- **Quorum reached:** 76.4% > 20% ✓
- **Result:** FOR wins (250 / 325 = 76.9% approval, needs >50%)

**After 7 Days: Voting Period Ends**

**Frontend Updates:**
1. Proposal status changes: Active → Passed
2. Shows final results:
   - **PASSED** 
   - For: 250 votes (76.9%)
   - Against: 75 votes (23.1%)
   - Quorum: 76.4% ✓
   - "Execute Proposal" button enabled
3. Notification to proposer: "Your proposal passed! Execute it."

---

#### Step 17: Proposal Execution

**Frontend Actions:**
1. Anyone can execute a passed proposal
2. Proposer (or any user) clicks "Execute Proposal"
3. Signs transaction

**Smart Contract Flow:**
```solidity
AnyUser → GovernanceDAO.executeProposal(proposalId=1)

GovernanceDAO.sol:
1. Validates:
   - Proposal exists
   - Voting period ended
   - Not already executed or canceled
   - Quorum reached
   - More FOR than AGAINST votes
2. Marks as executed:
   Proposal storage prop = proposals[proposalId];
   prop.executed = true;
3. Returns proposer's bond:
   cUSD.transfer(prop.proposer, prop.bond); // 100 cUSD returned
4. Executes the call:
   (bool success, ) = prop.targetContract.call(prop.callData);
   require(success, "Execution failed");
   
   // This calls:
   // VerificationManager.updateRequiredValidators(5)
5. Emits: ProposalExecuted(proposalId, true)

VerificationManager.sol (receives call):
updateRequiredValidators(uint256 newValue) external onlyGovernance {
    uint256 oldValue = requiredValidators; // 3
    requiredValidators = newValue; // 5
    emit ParameterUpdated("requiredValidators", oldValue, newValue);
}
```

**State Changes:**
- `proposals[1].executed`: false → true
- `requiredValidators (VerificationManager)`: 3 → 5
- `Proposer cUSD balance`: X → X + 100 (bond returned)

**Frontend Updates:**
1. Proposal page shows:
   - Status: ✓ Executed
   - Execution tx hash
   - Parameter change confirmed
2. All users notified: "Governance proposal executed: Required validators now 5"
3. VerificationManager settings page shows:
   - Required Validators: 5 (updated from 3)
   - Effective for all new verifications
4. Future tasks will now need 5 validator approvals instead of 3

---

### Flow 6: Alternative Paths & Edge Cases

#### Edge Case 1: Task Rejected by Validators

**Scenario:** Operator submits fraudulent proof (fake GPS data, stock photos)

**Verification Flow:**
1. Validators review proof
2. Validator1: **REJECT** - "GPS coordinates don't match satellite imagery"
3. Validator2: **REJECT** - "Photos appear to be stock images, metadata inconsistent"
4. Validator3: **REJECT** - "No evidence of actual work, clear fraud attempt"
5. Consensus: 0 FOR, 3 AGAINST (100% rejection)

**Smart Contract Flow:**
```solidity
VerificationManager.finalizeVerification(taskId=X)

1. Consensus check: rejectVotes = 3, approveVotes = 0
2. outcome = false (rejected)
3. Updates TaskRegistry status to Rejected
4. Calls CollateralManager.slashStake(taskId, 100)
   // 100% of stake slashed
5. Calls FundingPool.enableRefunds(taskId)
6. Does NOT mint carbon credits
7. Does NOT release payment
8. Publishes failure data to DataRegistry (for fraud detection training)
9. Resolves PredictionMarket with outcome=false
```

**CollateralManager Slashing:**
```solidity
CollateralManager.slashStake(taskId, slashPercentage=100)

1. Retrieves stake: 5,000 CELO
2. Calculates slash: 5,000 * 100 / 100 = 5,000 CELO (full amount)
3. Transfers to slashDestination:
   // Option A: Send to Treasury
   CELO.transfer(treasuryAddress, slashAmount);
   
   // Option B: Distribute to funders as compensation
   // Split proportionally among funders
4. Updates stake status: Slashed
5. If operator's remaining stake < minimum:
   approvedOperators[operator] = false; // Revoke operator status
6. Emits: StakeSlashed(taskId, operator, 5000, "Fraudulent proof")
```

**FundingPool Refunds:**
```solidity
FundingPool.enableRefunds(taskId)

1. Marks pool as refundable
2. Funders can call claimRefund()
3. Each funder gets proportional refund:
   // Funder1 funded 5,000 of 50,000 total (10%)
   // Refund = 5,000 cUSD (full amount returned)
```

**Funder Claims Refund:**
```solidity
Funder1 → FundingPool.claimRefund(taskId)

FundingPool.sol:
1. Validates:
   - Task status = Rejected
   - Refunds enabled
   - Caller is a funder
   - Not already claimed
2. Calculates refund:
   uint256 funderShare = funderShares[taskId][msg.sender]; // 5,000
3. Transfers refund:
   cUSD.transfer(msg.sender, funderShare);
4. Marks as claimed:
   funderShares[taskId][msg.sender] = 0;
5. Emits: RefundClaimed(taskId, msg.sender, funderShare)
```

**Prediction Market Resolution:**
```solidity
PredictionMarket.resolveMarket(taskId, outcome=false)

1. NO holders win
2. YES holders lose their investment
3. NO holder (Bob) who bought 500 NO shares at 30% odds:
   - Paid: ~150 cUSD
   - Wins: (500 / 15,000) * 50,000 = 1,666.67 cUSD
   - Profit: +1,516.67 cUSD
```

**State Changes:**
- `taskStatus`: InProgress → Rejected
- `operatorStake`: 5,000 slashed → 0
- `approvedOperators[operator]`: true → false (banned)
- Funders refunded: All 50,000 cUSD returned
- Operator receives: 0 payment, loses 5,000 stake
- NO voters profit, YES voters lose

**Frontend Updates:**
1. Task detail page shows:
   - Status: ✗ Rejected
   - Reason: "Failed verification - fraudulent proof"
   - Operator: [address] - BANNED
   - Collateral: Slashed
   - Refunds: Available
2. All funders notified: "Task rejected. Claim your refund."
3. Operator dashboard shows:
   - Task #X: ✗ Failed
   - Status: Banned from platform
   - Loss: -5,000 CELO stake
4. Data Registry flags this for fraud detection model training

---

#### Edge Case 2: Disputed Verification

**Scenario:** 2 validators approve, 1 rejects, operator contests

**Verification Flow:**
1. Validator1: APPROVE (confidence 80%)
2. Validator2: APPROVE (confidence 75%)
3. Validator3: REJECT (confidence 85%) - "Significant discrepancies in GPS data"
4. Result: 2 FOR, 1 AGAINST (66.7% approval)
5. Consensus threshold: 66% - **BARELY PASSES**

**But:** Operator OR a funder can dispute within 48 hours

**Frontend Actions:**
1. Operator sees: "Task verified, but with 1 rejection"
2. Reviews rejection reasoning: "GPS discrepancies"
3. Believes this is unfair - has additional proof
4. Clicks "Dispute Verification"
5. Modal appears:
   - Dispute fee: 500 cUSD deposit
   - Additional evidence required
   - Will go to DAO vote
6. Uploads additional GPS logs (IPFS)
7. Writes dispute reason: "Validator3 misread GPS format. Attached corrected data with industry-standard format."
8. Signs transaction

**Smart Contract Flow:**
```solidity
Operator → VerificationManager.disputeVerification(
    taskId,
    additionalProofHash="QmNEW...DATA",
    reason="GPS format misunderstood..."
)

VerificationManager.sol:
1. Validates:
   - Task is Verified or Rejected
   - Within dispute window (48 hours)
   - Caller is operator or funder
   - Dispute fee paid
2. Locks current outcome:
   verifications[taskId].isDisputed = true;
3. Creates dispute record:
   disputes[taskId] = Dispute({
       initiator: msg.sender,
       additionalProof: additionalProofHash,
       reason: reason,
       fee: 500 cUSD,
       createdAt: block.timestamp
   });
4. Pauses all actions:
   // Payment frozen
   // Credits not minted
   // Stake not released
5. Triggers governance:
   GovernanceDAO(dao).createDisputeProposal(taskId);
6. Emits: DisputeRaised(taskId, msg.sender, reason)
```

**GovernanceDAO Creates Dispute Proposal:**
```solidity
GovernanceDAO.createDisputeProposal(taskId)

1. Creates proposal:
   description = "Dispute Resolution: Task #X"
   proposalType = DisputeResolution
   votingPeriod = 5 days (expedited)
2. Voting options:
   - FOR: Approve task (override rejection)
   - AGAINST: Reject task (uphold rejection)
3. Attaches all evidence:
   - Original proof
   - Validator votes and reasoning
   - Dispute proof
   - Operator argument
```

**Community Votes (5 days):**
- DAO members review all evidence
- Technical experts weigh in
- Vote on whether operator's additional proof is valid
- Result: 65% vote FOR (approve task)

**Proposal Execution:**
```solidity
GovernanceDAO.executeDisputeResolution(proposalId, taskId)

1. Reads vote result: FOR wins
2. Calls VerificationManager.resolveDispute(taskId, approved=true)
3. Returns dispute fee to operator
4. Applies 50% slash to dissenting validator (Validator3)
   // Penalty for incorrect rejection
```

**VerificationManager Resolves Dispute:**
```solidity
VerificationManager.resolveDispute(taskId, approved=true)

1. Overrides verification outcome:
   verifications[taskId].outcome = true;
   verifications[taskId].isDisputed = false;
2. Updates TaskRegistry: Verified
3. Releases stake
4. Mints credits (with 10% reduction for dispute)
5. Releases payment
6. Slashes Validator3's validator stake by 50%
7. Emits: DisputeResolved(taskId, true)
```

**State Changes:**
- Task status: Disputed → Verified
- Operator gets payment: 49,000 cUSD
- Operator gets stake back: 5,000 CELO
- Credits minted: 382.5 tons (10% penalty for dispute)
- Validator3 penalized: -50% validator stake
- Dispute fee returned to operator: +500 cUSD

---

#### Edge Case 3: Partial Funding Withdrawal

**Scenario:** Funder wants to exit before task is fully funded

**Frontend Actions:**
1. Funder2 funded 5,000 cUSD
2. Task only 40% funded after 2 weeks
3. Funder2 changes mind, wants money back
4. Navigates to task detail page
5. Sees status: "Proposed (40% funded)"
6. Clicks "Withdraw Funding"
7. Modal shows:
   - Your funding: 5,000 cUSD
   - Withdrawal penalty: 2% (100 cUSD)
   - You receive: 4,900 cUSD
8. Confirms withdrawal

**Smart Contract Flow:**
```solidity
Funder2 → FundingPool.withdrawFunding(taskId, shareAmount=5000)

FundingPool.sol:
1. Validates:
   - Task status = Proposed (not yet funded/started)
   - Caller has sufficient shares
   - Pool has sufficient cUSD
2. Calculates withdrawal:
   uint256 shareAmount = 5,000;
   uint256 penalty = (shareAmount * withdrawalPenalty) / 100;
   // = 5,000 * 2 / 100 = 100 cUSD
   uint256 refundAmount = shareAmount - penalty;
   // = 4,900 cUSD
3. Updates pool:
   taskPools[taskId].totalFunded -= shareAmount;
   funderShares[taskId][msg.sender] -= shareAmount;
   taskPools[taskId].fundersCount--;
4. Transfers:
   cUSD.transfer(msg.sender, refundAmount); // 4,900 to funder
   cUSD.transfer(treasuryAddress, penalty); // 100 to treasury
5. Emits: FundingWithdrawn(taskId, msg.sender, refundAmount)
```

**State Changes:**
- `taskPools[X].totalFunded`: 20,000 → 15,000 cUSD
- `funderShares[X][Funder2]`: 5,000 → 0
- `Funder2 cUSD balance`: Y → Y + 4,900
- `Treasury balance`: Z → Z + 100

**Frontend Updates:**
1. Task funding progress: 40% → 30%
2. Funder count: 4 → 3
3. Funder2's dashboard: Task removed from "Tasks I've Funded"

**Note:** Withdrawal ONLY allowed while status = Proposed. Once Funded or InProgress, no withdrawals permitted.

---

#### Edge Case 4: Operator Abandons Task

**Scenario:** Operator accepts task, locks collateral, but never completes work

**Timeline:**
1. Task assigned: Jan 1, 2026
2. Deadline: April 1, 2026 (3 months)
3. April 1 passes, no proof submitted
4. April 8: 7 days past deadline

**Smart Contract Auto-Trigger (via Chainlink Automation or manual call):**
```solidity
AnyUser → TaskRegistry.checkDeadline(taskId)

TaskRegistry.sol:
1. Checks:
   if (task.status == InProgress && block.timestamp > task.deadline + gracePeriod) {
       // Grace period = 7 days
       // Task is overdue
       markAsAbandoned(taskId);
   }

markAsAbandoned(taskId) internal:
1. Updates status: InProgress → Rejected
2. Emits: TaskAbandoned(taskId, operator)
3. Triggers verification (will auto-fail):
   VerificationManager(vm).initiateVerification(taskId);
```

**VerificationManager Auto-Rejection:**
```solidity
VerificationManager.initiateVerification(taskId)

1. Detects: Task status = Rejected (from abandonment)
2. Skips validator assignment
3. Immediately finalizes as rejected:
   finalizeVerification(taskId, outcome=false)
```

**Consequences:**
- Operator stake: 100% slashed (5,000 CELO lost)
- Operator status: Banned
- Funders: Can claim refunds
- Prediction market: Resolves to NO
- NO voters profit

**Frontend Updates:**
1. Task marked: "⚠️ Abandoned - Deadline Exceeded"
2. Operator dashboard: "Task failed - Operator banned"
3. Funders notified: "Task abandoned. Refunds available."

---

### Flow 7: Advanced Features

#### Advanced Feature 1: Oracle Integration for Automated Verification

**Scenario:** Task requires satellite imagery confirmation

**Setup:**
1. Task creation includes: "oracleValidationRequired: true"
2. Specifies oracle type: "Satellite Imagery Analysis"
3. Links to geographic bounds

**When Proof Submitted:**
```solidity
VerificationManager.initiateVerification(taskId)

1. Checks: task.oracleRequired == true
2. Requests Chainlink oracle data:
   ChainlinkClient.requestOracleData(
       jobId, // Satellite analysis job
       coordinates, // Task location
       beforeDate, // Pre-project date
       afterDate // Post-project date
   );
3. Oracle callback expected within 24 hours
```

**Oracle Provider (Off-Chain):**
1. Receives request
2. Queries satellite API (Planet Labs, Sentinel, etc.)
3. Downloads before/after images
4. Runs vegetation analysis:
   - NDVI (Normalized Difference Vegetation Index) comparison
   - Detects: 15% increase in vegetation density
   - Spatial area: Matches task boundary
5. Returns result: CONFIRMED

**Oracle Callback:**
```solidity
OracleAggregator.fulfillOracleRequest(
    requestId,
    taskId,
    result=CONFIRMED,
    confidenceScore=92
)

OracleAggregator.sol:
1. Validates callback from authorized oracle
2. Stores result:
   oracleResults[taskId].push(OracleResult({
       source: "Satellite Imagery",
       result: CONFIRMED,
       confidence: 92,
       timestamp: block.timestamp
   }));
3. Notifies VerificationManager:
   VerificationManager(vm).submitOracleData(taskId, result);
```

**VerificationManager Processes Oracle Data:**
```solidity
VerificationManager.submitOracleData(taskId, oracleResult)

1. Combines with validator votes:
   // Validators: 2 FOR, 0 AGAINST
   // Oracle: CONFIRMED (92% confidence)
2. Weighted scoring:
   validatorScore = (2/3) * avgValidatorConfidence; // 66.7% * 80% = 53.4%
   oracleScore = (1/3) * oracleConfidence; // 33.3% * 92% = 30.6%
   totalScore = 84% (high confidence)
3. Passes threshold (>75%) → VERIFIED
4. Finalizes with higher credit accuracy
```

**Benefits:**
- Reduces reliance on human validators
- Faster verification (oracle responds in hours)
- Objective, tamper-proof data source
- Builds dataset for future AI models

---

#### Advanced Feature 2: AI Model Staking for Verification

**Scenario:** ML model trained to predict task success

**Model Registration:**
```solidity
Researcher → ModelRegistry.registerModel(
    ipfsModelHash="QmMODEL...",
    description="Random Forest classifier for mangrove project success",
    architecture="scikit-learn v1.2"
)

1. Model uploaded to IPFS (weights, metadata)
2. Researcher stakes 1,000 cUSD on model
3. Model assigned ID: model#1
```

**Model Prediction (Before Verification):**
```solidity
// Off-chain: Model inference service monitors new tasks
// When task proof submitted, model runs prediction

ModelInferenceService (off-chain):
1. Downloads task proof from IPFS
2. Extracts features:
   - GPS coordinate density
   - Photo timestamp consistency
   - Metadata completeness
   - Operator history
   - Funding speed
3. Runs model inference:
   prediction = model.predict(features)
   // Output: LIKELY_SUCCESS (probability: 0.87)
4. Submits to blockchain:
   ModelRegistry.recordPrediction(model#1, taskId, prediction=true)
```

**After Actual Verification:**
```solidity
VerificationManager.finalizeVerification(taskId)

1. Task outcome: VERIFIED (true positive)
2. Checks model predictions:
   ModelRegistry(registry).updateModelPerformance(model#1, taskId, wasCorrect=true)

ModelRegistry.updateModelPerformance():
1. Increments correct predictions
2. Calculates new accuracy:
   accuracy = correctPredictions / totalPredictions
   // Was: 45/50 = 90%
   // Now: 46/51 = 90.2%
3. Rewards model owner:
   rewardAmount = baseFee * stakeMultiplier
   // = 10 cUSD * (modelStake / 1000) = 10 cUSD
4. If accuracy drops below 70%:
   // Flag model for review
   // Reduce stake automatically
```

**Model Selection for Future Verifications:**
```solidity
VerificationManager.initiateVerification(newTaskId)

1. Queries top 3 models:
   (uint256[] memory modelIds, uint256[] memory accuracies) = 
       ModelRegistry(registry).getTopModels(3);
2. Assigns models as pre-validators:
   // Models give preliminary scores
   // Human validators see model predictions
   // Helps validators focus attention
```

**Benefits:**
- Automated pre-screening
- Faster verification pipeline
- Models improve over time with more data
- Incentivizes AI research in environmental verification

---

#### Advanced Feature 3: Liquidity Pools for Carbon Credits

**Scenario:** Create AMM pool for credit trading

**Pool Creation:**
```solidity
LiquidityProvider → CarbonAMM.createPool(
    creditTokenId=1,
    initialCreditAmount=100,
    initialcUSD=5000
)

CarbonAMM.sol (Uniswap V2-style):
1. Validates:
   - Provider owns sufficient credits
   - Approved for transfer
2. Creates pool:
   pools[creditTokenId] = Pool({
       creditReserve: 100,
       cUSDReserve: 5000,
       totalLPTokens: sqrt(100 * 5000) = 707.1 LP tokens
   });
3. Mints LP tokens to provider:
   LPToken.mint(msg.sender, 707.1);
4. Locks assets:
   CreditToken.transferFrom(msg.sender, address(this), 100);
   cUSD.transferFrom(msg.sender, address(this), 5000);
5. Initial price: 5000/100 = 50 cUSD per credit
```

**Trader Swaps Credits:**
```solidity
Trader → CarbonAMM.swapCreditForUSD(
    creditTokenId=1,
    creditAmountIn=10
)

CarbonAMM.sol:
1. Calculates output (constant product formula):
   k = creditReserve * cUSDReserve = 100 * 5000 = 500,000
   newCreditReserve = 100 + 10 = 110
   newcUSDReserve = k / newCreditReserve = 500,000 / 110 = 4,545.45
   cUSDOut = 5000 - 4,545.45 = 454.55 cUSD
2. Applies 0.3% fee:
   fee = 454.55 * 0.003 = 1.36 cUSD
   actualOut = 453.19 cUSD
3. Executes swap:
   CreditToken.transferFrom(trader, address(this), 10);
   cUSD.transfer(trader, 453.19);
4. New price: 4,546.64 / 110 = 41.33 cUSD per credit (price dropped)
```

**Benefits:**
- Instant liquidity for any credit amount
- Automated price discovery
- LPs earn fees (0.3% per trade)
- No order book management needed

---

### Flow 8: Complete System State Transitions

#### Task Lifecycle State Machine

```
START
  ↓
[PROPOSED]
  │ ← createTask()
  │ ← funders contribute
  │ ← prediction market trades
  ↓ (when totalFunded >= estimatedCost)
[FUNDED]
  │ ← operator discovers task
  │ ← operator stakes collateral
  ↓ (when operator assigned)
[IN_PROGRESS]
  │ ← operator executes work (off-chain)
  │ ← optional progress updates
  ↓ (when operator submits proof OR deadline + grace period passes)
[UNDER_REVIEW]
  │ ← validators assigned
  │ ← validators vote
  │ ← oracle data submitted (optional)
  │ ← AI models predict (optional)
  ↓ (when consensus reached OR deadline)
  ├─→ [VERIFIED] (if approved)
  │     │ ← credits minted
  │     │ ← payment released
  │     │ ← stake released
  │     │ ← data published
  │     │ ← prediction market resolves
  │     └─→ END (success)
  │
  ├─→ [REJECTED] (if not approved)
  │     │ ← stake slashed
  │     │ ← refunds enabled
  │     │ ← operator banned
  │     │ ← prediction market resolves
  │     └─→ END (failure)
  │
  └─→ [DISPUTED] (if contested within 48h)
        │ ← DAO vote initiated
        │ ← additional evidence reviewed
        ↓ (when DAO votes)
        ├─→ [VERIFIED] (if DAO overrides)
        └─→ [REJECTED] (if DAO upholds)
```

---

### Complete Data Flow Diagram

```
USER ACTIONS          SMART CONTRACTS              EXTERNAL SYSTEMS
─────────────────────────────────────────────────────────────────────
                                                   
[Proposer]                                         
   │                                               
   │ createTask()                                  
   ├──────────────→ [TaskRegistry] ───────────────→ [IPFS]
   │                     ↓                         (store docs)
   │                [FundingPool]                  
   │                     ↓                         
   │              [PredictionMarket]               
   │               (auto-create)                   
   │                                               
[Funders]                                          
   │                                               
   │ approve() cUSD                                
   ├──────────────→ [cUSD Token]                  
   │                                               
   │ fundTask()                                    
   ├──────────────→ [FundingPool]                 
   │                     │                         
   │                     ├→ track shares           
   │                     │                         
   │                     └→ if target reached      
   │                          TaskRegistry.updateStatus()
   │                                               
[Operator]                                         
   │                                               
   │ registerOperator()                            
   ├──────────────→ [CollateralManager]           
   │                                               
   │ stakeForTask()                                
   ├──────────────→ [CollateralManager]           
   │                     │                         
   │                     └→ TaskRegistry.assignOperator()
   │                                               
   │ (execute work)                                
   │───────────────────────────────────────────────→ [Real World]
   │                                               (plant trees)
   │                                               
   │ (collect evidence)                            
   │───────────────────────────────────────────────→ [GPS/Camera/Drone]
   │                                               
   │ submitProof()                                 
   ├──────────────→ [TaskRegistry] ───────────────→ [IPFS]
   │                     │                         (upload proof)
   │                     │                         
   │                     └→ VerificationManager.initiate()
   │                                               
[VerificationManager]                              
   │                                               
   │ (assigns validators)                          
   │                                               
[Validators]                                       
   │                                               
   │ (review evidence) ←─────────────────────────── [IPFS]
   │                                               (download proof)
   │                                               
   │ submitVote()                                  
   ├──────────────→ [VerificationManager]         
   │                     │                         
   │                     ├→ check consensus        
   │                     │                         
   │                     └→ if complete:           
   │                          finalizeVerification()
   │                                               
[VerificationManager]                              
   │                                               
   │ finalizeVerification()                        
   ├──────────────→ [TaskRegistry] (update status)
   │                                               
   ├──────────────→ [CollateralManager]           
   │                (release or slash stake)       
   │                                               
   ├──────────────→ [FundingPool]                 
   │                (release payment OR refunds)   
   │                                               
   ├──────────────→ [CarbonCreditMinter]          
   │                     │                         
   │                     └→ [CreditToken] (ERC1155)
   │                          (mint to funders)    
   │                                               
   ├──────────────→ [DataRegistry]                
   │                     │                         
   │                     └──────────────────────────→ [IPFS]
   │                                               (scientific data)
   │                                               
   └──────────────→ [PredictionMarket]            
                    (resolve & enable claims)      
                                                   
[Traders]                                          
   │                                               
   │ createSellOrder()                             
   ├──────────────→ [CarbonMarketplace]           
   │                (escrow credits)               
   │                                               
   │ buyCredits()                                  
   ├──────────────→ [CarbonMarketplace]           
   │                     │                         
   │                     ├→ transfer cUSD          
   │                     └→ transfer credits       
   │                                               
[Company/Offsetter]                                
   │                                               
   │ burnCredits()                                 
   ├──────────────→ [CarbonCreditMinter]          
   │                     │                         
   │                     └→ [CreditToken]          
   │                         (burn from supply)    
   │                                               
   └──────────────────────────────────────────────→ [Certificate PDF]
                                                   (off-chain proof)
```
[DAO Members]                                      
   │                                               
   │ createProposal()                              
   ├──────────────→ [GovernanceDAO]               
   │                (lock bond)                    
   │                                               
   │ vote()                                        
   ├──────────────→ [GovernanceDAO]               
   │                (record votes with token weight)
   │                                               
   │ executeProposal()                             
   ├──────────────→ [GovernanceDAO]               
   │                     │                         
   │                     └→ [Target Contract]      
   │                         (execute callData)    
   │                         Examples:             
   │                         • VerificationManager
   │                         • CollateralManager   
   │                         • FundingPool        
   │                                               
[Researchers]                                      
   │                                               
   │ queryDataset()                                
   ├──────────────→ [DataRegistry]                
   │                     │                         
   │                     └──────────────────────────→ [IPFS]
   │                                               (download data)
   │                                               
   │ registerModel()                               
   ├──────────────→ [ModelRegistry]               
   │                (stake + IPFS hash)            
   │                                               
   │───────────────────────────────────────────────→ [Off-Chain ML Service]
   │                                               (train models)
   │                                               
   │ recordPrediction()                            
   ├──────────────→ [ModelRegistry]               
   │                                               
   │ (after verification)                          
   │ updatePerformance() ←────────── [VerificationManager]
   │                                               
   └──────────────→ [ModelRegistry]               
                    (earn rewards if accurate)     

[Oracles]                                          
   │                                               
   │ (Chainlink request) ←────────── [VerificationManager]
   │                                               
   │───────────────────────────────────────────────→ [External APIs]
   │                                               • Satellite imagery
   │                                               • Weather data
   │                                               • IoT sensors
   │                                               • Government DBs
   │                                               
   │ fulfillRequest()                              
   ├──────────────→ [OracleAggregator]            
   │                     │                         
   │                     └→ [VerificationManager]  
   │                         (oracle data weighted)
```

---

## Economic Model Deep Dive

### Token Economics & Value Flow

```
CAPITAL INFLOWS:
─────────────────
1. Funders deposit cUSD → FundingPool
2. Operators stake CELO/ETH → CollateralManager
3. Traders buy credits → CarbonMarketplace
4. Prediction market participants → PredictionMarket
5. Model stakers → ModelRegistry
6. Liquidity providers → AMM pools
7. Proposal bonds → GovernanceDAO

CAPITAL OUTFLOWS:
─────────────────
1. Operator payments (98% of funded amount) → Operators
2. Platform fees (2%) → Treasury
3. Validator rewards → Validators
4. Model rewards → AI Researchers
5. Data contribution rewards → Operators
6. Prediction market winnings → Winning traders
7. LP fees → Liquidity providers
8. Refunds (if task fails) → Funders

VALUE CREATION:
───────────────
1. Carbon Credits (ERC1155 tokens) → Funders (proportional to funding)
2. Verified environmental impact → Real world
3. Scientific dataset → Public good
4. AI models → Research community
5. Price discovery → Market efficiency
6. Reputation scores → Trust signals

TREASURY USAGE:
───────────────
Treasury accumulates:
• 2% of all task funding (platform fee)
• 0.5% of all credit trades (marketplace fee)
• 0.3% of AMM swaps (if LP pool exists)
• Slashed collateral from bad operators
• Unclaimed refunds (after time limit)
• Market creation fees (100 cUSD per prediction market)

Treasury spends on:
• Oracle payment costs (Chainlink fees)
• Validator base compensation
• Data storage (IPFS pinning)
• Emergency fund for disputes
• Protocol development grants
• Security audits
• DAO-approved initiatives
```

---

### Detailed Economic Example: Task #1 Full Lifecycle

**Initial State:**
```
Task: Plant 10,000 mangroves
Cost: 50,000 cUSD
Expected CO₂: 500 tons
```

**Funding Phase:**
```
10 funders × 5,000 cUSD each = 50,000 cUSD
↓
Funders receive: Share tracking in FundingPool
Funders will receive: ~10% of eventual carbon credits each
```

**Operator Commitment:**
```
Operator stakes: 5,000 CELO (worth ~5,000 cUSD at time of staking)
Risk: Lose entire stake if fraud detected
Reward potential: 49,000 cUSD payment + 100 cUSD data reward
```

**Prediction Market Activity:**
```
Market created with initial 50/50 odds
Over 3 months, traders trade based on:
• Operator reputation
• Project difficulty
• Location risk factors
• Progress updates

Final state before resolution:
• YES pool: 35,000 cUSD (70% probability)
• NO pool: 15,000 cUSD (30% probability)
• Total volume: 50,000 cUSD
```

**Verification Phase:**
```
3 validators assigned
Each validator spends ~4 hours reviewing
Validator compensation: 50 cUSD each = 150 cUSD total (from Treasury)

Oracle called: Satellite imagery check
Oracle cost: 20 cUSD (from Treasury)

Result: APPROVED (3 FOR, 0 AGAINST)
Adjusted CO₂: 425 tons (81.67% confidence average)
```

**Distribution Phase:**

**1. Payment Distribution:**
```
FundingPool balance: 50,000 cUSD
├─ Platform fee (2%): 1,000 cUSD → Treasury
├─ Operator payment: 49,000 cUSD → Operator
└─ Net profit for operator: 49,000 - operational costs

Operator's operational costs (off-chain):
├─ Saplings: 15,000 cUSD
├─ Labor: 20,000 cUSD
├─ Equipment: 5,000 cUSD
├─ Transportation: 3,000 cUSD
└─ Documentation: 1,000 cUSD
Total: 44,000 cUSD
Net profit: 49,000 - 44,000 = 5,000 cUSD
```

**2. Collateral Release:**
```
Operator's staked collateral: 5,000 CELO
Status: Released back to operator
Opportunity cost during lock period: ~3% APY = 150 CELO lost potential yield
```

**3. Carbon Credit Distribution:**
```
Total credits minted: 425 tons CO₂ (ERC1155 token ID #1)

Distribution to 10 funders:
Each funder funded: 5,000 / 50,000 = 10%
Each funder receives: 425 × 10% = 42.5 credit tokens

Credit metadata:
├─ Project: Mangrove Restoration
├─ Location: Tamil Nadu, India
├─ Vintage: 2026
├─ Verification: 81.67% confidence
└─ Unique Token ID: #1
```

**4. Prediction Market Resolution:**
```
Market resolved: YES (task verified)

Winning pool (YES): 35,000 cUSD
Losing pool (NO): 15,000 cUSD
Total pool: 50,000 cUSD

Example winner payout:
Alice held 1,000 YES shares
Total YES shares: 35,000
Alice's payout: (1,000 / 35,000) × 50,000 = 1,428.57 cUSD
Alice's initial cost: ~700 cUSD (bought at 70% odds)
Alice's profit: 728.57 cUSD (104% return)

Example loser:
Bob held 500 NO shares
Total NO shares: 15,000
Bob's payout: 0 cUSD
Bob's loss: ~167 cUSD (bought at 33% odds)
```

**5. Data Reward:**
```
Operator receives data contribution bonus: 100 cUSD (from Treasury)
```

**Total Value Created:**

**For Funders (collectively):**
```
Investment: 50,000 cUSD
Received: 425 carbon credit tokens

Scenario A - Hold credits:
Value depends on future market price
If trading at 50 cUSD/ton later: 425 × 50 = 21,250 cUSD
Loss: 28,750 cUSD (but impact achieved)

Scenario B - Immediate sale at 45 cUSD/ton:
Revenue: 425 × 45 = 19,125 cUSD
Loss: 30,875 cUSD (61.75% loss)

Scenario C - Wait for premium pricing:
Some credits may fetch 80+ cUSD/ton if:
• Carbon markets tighten
• High-quality nature-based credits in demand
• Company needs specific vintage/location
Revenue: 425 × 80 = 34,000 cUSD
Loss: 16,000 cUSD (68% recovery)

Scenario D - Retire for ESG compliance (no sale):
Credits retired for corporate ESG reporting
Accounting value: 50-100 cUSD/ton (internal valuation)
No cash return, but compliance value achieved
```

**For Operator:**
```
Revenue: 49,100 cUSD (payment + data reward)
Costs: 44,000 cUSD (operational)
Profit: 5,100 cUSD
Time investment: 3 months
Hourly equivalent (assuming 500 hours): ~10.20 cUSD/hour
Plus: Reputation gain (can accept higher-value tasks)
Plus: Stake returned (no opportunity loss beyond time-value)
```

**For Validators:**
```
Each validator: 50 cUSD for ~4 hours work
Hourly rate: 12.50 cUSD/hour
Plus: Reputation score increase
Plus: Future task assignment probability
```

**For Prediction Market Winners:**
```
Collective profit for YES holders: 15,000 cUSD (the NO pool)
Distributed proportionally to YES share ownership
Average ROI: ~43% (varies by entry price)
```

**For Treasury:**
```
Platform fee: 1,000 cUSD
Marketplace fees (if credits trade): ~0.5% of volume
Prediction market fee: 0 (absorbed into pools)
Costs:
├─ Validator payments: 150 cUSD
├─ Oracle costs: 20 cUSD
├─ Data reward: 100 cUSD
└─ IPFS storage: ~10 cUSD
Net: ~720 cUSD profit per task
```

**For Ecosystem:**
```
Real-world impact: 10,000 mangroves planted
CO₂ offset: 425 tons verified
Scientific data: 1 task dataset published
Model training: Improved fraud detection
Market liquidity: Price discovery for mangrove credits
Employment: ~10 local jobs for 3 months
```

---

### Revenue Sustainability Model

**Platform Break-Even Analysis:**

**Fixed Costs per Task:**
```
Validator payments: 150 cUSD (3 validators × 50)
Oracle calls: 20-100 cUSD (depending on complexity)
IPFS storage: 10 cUSD per task
Gas subsidies: 5 cUSD (if offering meta-transactions)
Development/maintenance: ~50 cUSD allocated per task
Total: ~235 cUSD per task
```

**Revenue per Task:**
```
Platform fee: 2% of task value
For 50,000 cUSD task: 1,000 cUSD
Break-even task size: 235 / 0.02 = 11,750 cUSD minimum
```

**Conclusion:** Tasks under 11,750 cUSD operate at a loss unless:
- Validator fees reduced for small tasks
- Oracle validation optional for low-value tasks
- Cross-subsidization from larger tasks

**Marketplace Revenue:**
```
Trading fee: 0.5% per trade
If 1,000 tons trade monthly at avg 50 cUSD/ton:
Volume: 50,000 cUSD
Revenue: 250 cUSD/month
Annual: 3,000 cUSD

At scale (100,000 tons/month):
Volume: 5,000,000 cUSD
Revenue: 25,000 cUSD/month
Annual: 300,000 cUSD
```

**Prediction Market Revenue:**
```
Market creation fee: 100 cUSD per market
If 50 tasks/month: 5,000 cUSD/month
Annual: 60,000 cUSD

Note: This is break-even, not profit
Covers market infrastructure costs
```

**Total Annual Revenue (at scale):**
```
Task fees: 500 tasks × 1,000 avg = 500,000 cUSD
Marketplace fees: 300,000 cUSD
Governance fees: 10,000 cUSD
Total: 810,000 cUSD/year

Costs:
├─ Validators: 500 × 150 = 75,000 cUSD
├─ Oracles: 500 × 50 = 25,000 cUSD
├─ Storage: 500 × 10 = 5,000 cUSD
├─ Development: 200,000 cUSD
├─ Security: 50,000 cUSD
└─ Operations: 100,000 cUSD
Total: 455,000 cUSD/year

Net: 355,000 cUSD/year profit
```

---

## Technical Specifications

### Smart Contract Gas Costs (Celo Network)

**Estimated gas per operation:**

```
TaskRegistry.createTask(): ~150,000 gas (~$0.01)
FundingPool.fundTask(): ~120,000 gas (~$0.008)
CollateralManager.stakeForTask(): ~180,000 gas (~$0.012)
TaskRegistry.submitProof(): ~100,000 gas (~$0.007)
VerificationManager.submitVote(): ~90,000 gas (~$0.006)
VerificationManager.finalize(): ~300,000 gas (~$0.02)
CarbonCreditMinter.mintCredits(): ~250,000 gas (~$0.017)
CarbonMarketplace.createSellOrder(): ~120,000 gas (~$0.008)
CarbonMarketplace.buyCredits(): ~150,000 gas (~$0.01)
PredictionMarket.buyShares(): ~130,000 gas (~$0.009)
PredictionMarket.claimWinnings(): ~100,000 gas (~$0.007)
GovernanceDAO.vote(): ~80,000 gas (~$0.005)

Note: Celo gas is significantly cheaper than Ethereum mainnet
Average Celo gas price: ~0.5 Gwei
Average Ethereum gas price: ~30-100 Gwei (60-200x more expensive)
```

**Complete Task Lifecycle Gas Cost:**
```
Create task: $0.01
10 funders deposit: $0.08 (10 × $0.008)
Operator stakes: $0.012
Submit proof: $0.007
3 validators vote: $0.018 (3 × $0.006)
Finalize verification: $0.02
Mint credits to 10 funders: $0.017
Release payment: included in finalize

Total: ~$0.164 in gas fees
Extremely affordable on Celo
```

---

### Data Storage Strategy

**On-Chain Storage (Expensive but Permanent):**
```
Store in smart contracts:
✓ Task metadata (description, cost, CO₂, location string)
✓ Funding amounts per funder
✓ Operator address and stake amount
✓ Validator votes (approve/reject, confidence scores)
✓ Verification outcome
✓ Credit token IDs and amounts
✓ Order book data (active orders)
✓ Governance votes
✓ Model performance metrics

Typical task data: ~5-10 KB on-chain
Cost on Celo: ~$0.10-0.20 per task
```

**IPFS Storage (Cheap but Requires Pinning):**
```
Store on IPFS:
✓ Full task documentation (PDFs, plans)
✓ Proof bundles (photos, videos, GPS logs)
✓ Drone footage (large files)
✓ Scientific datasets (CSV, JSON)
✓ AI model weights
✓ Detailed verification reports

Only IPFS hash stored on-chain (32 bytes)
Actual data hosted on: Pinata, NFT.storage, or Filebase
Cost: $1-5 per task (depending on file sizes)

Pinning strategy:
├─ Primary: Pinata (paid service, reliable)
├─ Backup: NFT.storage (free for now, IPFS + Filecoin)
└─ Fallback: Own IPFS nodes (for platform-critical data)
```

**Off-Chain Indexing (Fast Queries):**
```
Use The Graph for:
✓ Historical task data
✓ User activity feeds
✓ Marketplace order history
✓ Price charts and analytics
✓ Leaderboards (top operators, validators)

Subgraph indexes all events:
• TaskCreated
• FundingReceived
• TaskStatusChanged
• ValidatorVoted
• CreditsMinted
• TradeExecuted
• MarketResolved

Enables fast frontend queries without scanning all blocks
```

---

