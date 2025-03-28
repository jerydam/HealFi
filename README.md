# HeFi - Decentralized Health Savings and Microcredit Platform

HeFi is a decentralized platform built on the CELO blockchain, designed to provide affordable health savings and microcredit solutions for underserved communities, particularly in Africa. Leveraging CELO's stablecoins (cUSD) and a community-driven governance model, HeFi enables users to save for healthcare, access low/no-interest microloans, and connect with healthcare providers—all without traditional banking systems.

## Problem Context
Access to healthcare financing in Africa is limited due to high out-of-pocket costs, inadequate insurance, and inaccessible microcredit systems with high interest rates. HeFi offers a transparent, secure, and inclusive solution.

## Features
- **Health Savings Pools**: Save small amounts in cUSD, pooled into smart contracts for interest via staking.
- **Community Microcredit**: Request low/no-interest loans with a guarantor staking system and reputation-based eligibility.
- **Healthcare Partnerships**: Direct access to services at partnered clinics and pharmacies.
- **Health Support Tokens**: Earn tokens for savings and repayments, redeemable for health services or stablecoins.
- **Non-Custodial**: Users control their funds via secure wallets.
- **DAO Governance**: Community voting on policies and loan terms.

## Tech Stack
- **Blockchain**: CELO
- **Stablecoin**: cUSD (CELO USD)
- **Smart Contracts**: Solidity
- **Development Tool**: Foundry (Forge, Cast, Anvil)
- **Libraries**: OpenZeppelin (ERC20 for cUSD integration)
- **Wallet Support**: CELO-compatible wallets (e.g., Valora, MetaMask)

## Prerequisites
- **Foundry**: Install Foundry by following the [official installation guide](https://getfoundry.sh/).
- **CELO Wallet**: For testing and interacting with the contract.
- **cUSD Tokens**: For testing on CELO Alfajores testnet.
- **Rust**: Foundry requires Rust; install it via `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`.

## Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Blockchain-Lautech-Club/HeFi.git
   cd HeFi
   ```

2. **Install Dependencies**:
   Foundry uses Git submodules for dependencies. Install OpenZeppelin contracts:
   ```bash
   forge install OpenZeppelin/openzeppelin-contracts
   ```
   Update `foundry.toml` to include remappings if needed:
   ```toml
   [profile.default]
   remappings = ["@openzeppelin/=lib/openzeppelin-contracts/"]
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory:
   ```
   PRIVATE_KEY=your_celo_private_key
   CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
   CUSD_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1  # cUSD on Alfajores
   ```
   - Replace `your_celo_private_key` with your wallet’s private key (keep it secure!).
   - Source the `.env` file in your shell: `source .env`.

4. **Build the Smart Contract**:
   ```bash
   forge build
   ```

## Deployment
1. **Deploy to CELO Alfajores Testnet**:
   Deploy the `HeFi` contract using Forge:
   ```bash
   forge create src/HeFi.sol:HeFi --rpc-url $CELO_RPC_URL --private-key $PRIVATE_KEY --constructor-args $CUSD_ADDRESS
   ```
   - Replace `$CUSD_ADDRESS` with the cUSD contract address.
   - The command outputs the deployed contract address.

2. **Verify Contract (Optional)**:
   Verify the contract on Celo Explorer using:
   ```bash
   forge verify-contract --chain-id 44787 --rpc-url $CELO_RPC_URL <deployed_address> src/HeFi.sol:HeFi
   ```

## Usage
### Smart Contract Functions
- **`requestLoan(uint256 amount, address guarantor)`**: Request a loan with a guarantor staking 50% of the amount.
- **`repayLoan(uint256 amount)`**: Repay a loan partially or fully.
- **`slashGuarantor(address debtor)`**: Slash the guarantor’s stake if the debtor defaults (DAO-triggered).
- **`addSavings(uint256 amount)`**: Add funds to your savings pool.

### Example Interaction (via Cast)
1. **Check Contract Deployment**:
   Confirm the contract is deployed and get its address.

2. **Interact with the Contract**:
   - Add savings (1 cUSD):
     ```bash
     cast send <deployed_address> "addSavings(uint256)" 1000000000000000000 --rpc-url $CELO_RPC_URL --private-key $PRIVATE_KEY
     ```
   - Request a loan (10 cUSD with guarantor):
     ```bash
     cast send <deployed_address> "requestLoan(uint256,address)" 10000000000000000000 <guarantor_address> --rpc-url $CELO_RPC_URL --private-key $PRIVATE_KEY
     ```

   Note: Amounts are in wei (1 cUSD = 10^18 wei).

## Security Features
- **Guarantor Staking**: Locks guarantor funds until repayment, ensuring accountability.
- **Reputation System**: Limits borrowing for untrustworthy users.
- **Transparent**: All transactions are recorded on the CELO blockchain.
- **Audits**: Recommended before mainnet deployment (not yet audited).

## Testing
Run the test suite using Forge:
```bash
forge test
```
- Place test files in `test/` (e.g., `test/HeFi.t.sol`).
- Example test setup:
  ```solidity
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.0;

  import "forge-std/Test.sol";
  import "../src/HeFi.sol";

  contract HeFiTest is Test {
      HeFi heFi;
      address cUSD = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

      function setUp() public {
          HeFi = new HeFi(cUSD);
      }

      function testAddSavings() public {
          HeFi.addSavings(1e18);
          assertEq(HeFi.savings(address(this)), 1e18);
      }
  }
  ```

## Local Development with Anvil
Run a local CELO fork for testing:
```bash
anvil --fork-url $CELO_RPC_URL
```
Interact with the contract locally using Cast or a frontend.

## Scaling and Future Work
- **Healthcare Provider Integration**: Add direct payment functionality for partnered clinics.
- **Token Rewards**: Implement health support tokens as an ERC20 contract.
- **Mobile App**: Develop a user-friendly frontend with wallet integration.
- **Mainnet Deployment**: Transition from Alfajores testnet to CELO mainnet.

## Project Structure
```
HeFi/
├── src/                # Smart contracts (e.g., HeFi.sol)
├── test/               # Test files (e.g., HeFi.t.sol)
├── lib/                # Dependencies (e.g., OpenZeppelin)
├── foundry.toml        # Foundry configuration
└── README.md           # This file
```

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m "Add feature"`).
4. Push to the branch (`git push origin feature-name`).
5. Open a pull request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.