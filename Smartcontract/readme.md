
## Overview of the HealFi Smart contract

The HealFi system is a suite of interconnected smart contracts designed to incentivize savings, provide microcredit for healthcare emergencies, manage healthcare partnerships, and govern the ecosystem through a decentralized autonomous organization (DAO). Here's a high-level breakdown of the components:

1. **HealFi (Main Contract)**: Acts as the central coordinator, managing stablecoin support and contract interconnections.
2. **HealFiSavings**: Manages user savings accounts with interest distribution.
3. **HealFiMicrocredit**: Provides microloans for healthcare needs, linked to savings history and credit scores.
4. **HealFiPartners**: Manages healthcare provider partnerships and service records.
5. **HealFiToken**: Implements the ERC-20 token (HST) for rewards and reputation tracking.
6. **HealFiGovernance**: Facilitates decentralized governance through proposals and voting.

The system uses OpenZeppelin's libraries (`Ownable`, `Pausable`, `AccessControl`, `ReentrancyGuard`) for security and Chainlink price feeds for currency conversion.

---

## Detailed Documentation

### 1. HealFi (Main Contract)
**Purpose**: The central hub that initializes and coordinates the HealFi ecosystem.

- **Key Features**:
  - Initializes with support for three stablecoins: `celoUSD` (USDT), `celoEUR` (cEUR), and `celoREAL` (cREAL).
  - Sets up connections between sub-contracts (Savings, Microcredit, Partners, Token, Governance).
  - Manages system-wide roles (ADMIN_ROLE) and pausing functionality.
  - Allows ownership transfer to a governance contract for decentralization.

- **Key Functions**:
  - `setupContracts`: Links all sub-contracts and sets their interdependencies.
  - `updateStablecoins`: Updates supported stablecoin addresses across all contracts.
  - `transferSystemControl`: Transfers ownership of all contracts to a new governance address.
  - `emergencyShutdown`: Pauses the system in emergencies.
  - `pause` / `unpause`: Controls system operation.

- **Events**:
  - `ContractSetup`: Emitted when contracts are linked.
  - `StablecoinAdded`: Emitted when stablecoin addresses are updated.
  - `EmergencyShutdown`: Emitted during system pause.

---

### 2. HealFiSavings
**Purpose**: Manages user savings accounts with interest accrual to encourage long-term savings.

- **Key Features**:
  - Supports deposits and withdrawals in USDT, cEUR, and cREAL.
  - Tracks savings streaks to qualify users for microcredit.
  - Distributes interest (2% annually by default) to active savers.
  - Integrates with Microcredit for loan funding and repayments.

- **Key Functions**:
  - `createAccount`: Initializes a savings account for a user.
  - `deposit`: Adds funds to a user’s savings, updating streaks and totals.
  - `withdraw`: Allows users to withdraw savings.
  - `distributeInterest`: Distributes compound interest to all account holders every 30 days.
  - `withdrawForLoan`: Transfers funds to Microcredit for approved loans (only callable by Microcredit).
  - `depositLoanRepayment`: Accepts loan repayments from Microcredit.

- **Key Variables**:
  - `interestRate`: 2% annually (200 basis points).
  - `totalSavingsUSD`: Total savings value in USD.
  - `SavingsAccount`: Struct tracking balances, streaks, and activity per user.

- **Events**:
  - `Deposit`, `Withdrawal`, `InterestDistributed`, `AccountCreated`.

---

### 3. HealFiMicrocredit
**Purpose**: Provides microloans for healthcare, with eligibility based on savings history and credit scores.

- **Key Features**:
  - Loans can be requested in USDT, cEUR, or cREAL, with a 1% fee (configurable).
  - Emergency loans bypass savings streak requirements.
  - Integrates with Savings for funding and Partners for direct healthcare payments.
  - Maintains credit scores (starting at 500) based on repayment behavior.
  - Rewards timely repayments with HST tokens.

- **Key Functions**:
  - `requestLoan`: Initiates a loan request with amount, duration, and emergency status.
  - `approveLoan`: Approves and funds a loan (by LOAN_MANAGER_ROLE).
  - `repayLoan`: Processes loan repayments, updating status and credit scores.
  - `checkLoanStatuses`: Updates loan statuses (e.g., PastDue, Defaulted) and adjusts credit scores.
  - `getMaxLoanAmount`: Calculates a user’s maximum loan based on savings and credit score.

- **Key Variables**:
  - `minimumSavingsStreak`: Required savings streak for non-emergency loans (default: 3).
  - `loanFeeRate`: Fee in basis points (default: 100 = 1%).
  - `Loan`: Struct tracking loan details (amount, status, due date, etc.).

- **Events**:
  - `LoanRequested`, `LoanApproved`, `LoanRepayment`, `LoanFullyRepaid`, `LoanDefaulted`.

---

### 4. HealFiPartners
**Purpose**: Manages healthcare provider partnerships, service records, and payment processing.

- **Key Features**:
  - Registers and verifies healthcare providers (Clinics, Pharmacies, Hospitals, Labs).
  - Records healthcare services and applies partner-specific discounts.
  - Processes payments with a platform fee (default: 1%).
  - Tracks patient service history.

- **Key Functions**:
  - `registerPartner`: Adds a new healthcare provider with details and discount percentage.
  - `verifyPartner`: Verifies a partner (by PARTNER_MANAGER_ROLE).
  - `recordService`: Logs a healthcare service provided to a patient.
  - `processPayment`: Handles payment from patient to partner, deducting a fee.
  - `applyDiscount`: Calculates discounted amounts based on partner rates.

- **Key Variables**:
  - `platformFeeRate`: Fee in basis points (default: 100 = 1%).
  - `HealthcarePartner`: Struct storing partner details (name, type, discount, etc.).
  - `ServiceRecord`: Struct tracking patient services.

- **Events**:
  - `PartnerRegistered`, `PartnerVerified`, `ServiceProvided`, `DiscountApplied`.

---

### 5. HealFiToken
**Purpose**: Implements the HST ERC-20 token for rewards and reputation within the ecosystem.

- **Key Features**:
  - Initial supply: 100 million HST; max supply: 1 billion HST.
  - Mints reward tokens for savings, loan repayments, and healthcare engagement.
  - Tracks user reputation scores based on token rewards.
  - Allows token redemption for services.

- **Key Functions**:
  - `mintRewardTokens`: Mints tokens as rewards (by authorized contracts).
  - `redeemForService`: Burns tokens for healthcare services.
  - `getReputationScore`: Returns a user’s reputation score.
  - `governanceMint`: Mints tokens for governance purposes (by owner).

- **Key Variables**:
  - `rewardDistributors`: Mapping of contracts authorized to mint rewards.
  - `userReputationScore`: Tracks reputation based on rewarded tokens.

- **Events**:
  - `RewardTokensMinted`, `TokensRedeemed`.

---

### 6. HealFiGovernance
**Purpose**: Manages decentralized governance through proposals and voting using HST tokens.

- **Key Features**:
  - Supports multiple proposal types (General, PartnerVerification, MicrocreditTerm, etc.).
  - Voting weight combines token balance and reputation score.
  - Requires minimum quorum and proposal threshold for execution.
  - Manages a treasury for funding ecosystem initiatives.

- **Key Functions**:
  - `createProposal`: Submits a new proposal with calldata and target contract.
  - `castVote`: Allows token holders to vote on proposals.
  - `executeProposal`: Executes passed proposals after a delay.
  - `fundTreasury`: Adds funds to the treasury.
  - `withdrawFromTreasury`: Withdraws treasury funds (by GOVERNOR_ROLE).

- **Key Variables**:
  - `votingPeriod`: 7 days by default.
  - `minimumQuorum`: 100 HST tokens.
  - `proposalThreshold`: 10 HST tokens required to propose.

- **Events**:
  - `ProposalCreated`, `VoteCast`, `ProposalExecuted`, `TreasuryFunded`.

---

## System Workflow

1. **User Saves**: Users deposit stablecoins into HealFiSavings, earning interest and building a savings streak.
2. **Loan Request**: Users with sufficient savings streaks request loans via HealFiMicrocredit, funded by pooled savings.
3. **Healthcare Services**: Verified partners in HealFiPartners provide services, optionally paid via loans or direct stablecoin payments.
4. **Rewards**: Users earn HST tokens for savings, timely loan repayments, and healthcare engagement via HealFiToken.
5. **Governance**: HST holders propose and vote on system changes (e.g., terms, fees) via HealFiGovernance.

---

## Security Features

- **Pausable**: All contracts can be paused in emergencies.
- **AccessControl**: Role-based permissions (e.g., ADMIN_ROLE, GOVERNOR_ROLE).
- **ReentrancyGuard**: Prevents reentrancy attacks in Savings and Microcredit.
- **Ownership**: Transferable to governance for decentralization.

---

## Dependencies

- **OpenZeppelin**: ERC20, Ownable, Pausable, AccessControl, ReentrancyGuard.
- **Chainlink**: Price feeds for EUR/USD and REAL/USD conversions.

---

This documentation provides a comprehensive overview of the HealFi system’s functionality, suitable for developers, auditors, or stakeholders. Let me know if you need further clarification or specific sections expanded!