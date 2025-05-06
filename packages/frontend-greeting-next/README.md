# Private Asset Transfers on Sui Blockchain

## Overview

This application provides a user interface for private asset transfers on the Sui blockchain using zero-knowledge proofs. It enables users to create shielded pools, deposit assets, make private transfers, withdraw assets, and generate viewing keys for controlled visibility.

## Key Features

- **Shielded Pools**: Create isolated pools for private transactions
- **Private Deposits**: Deposit assets into your shielded pool
- **Confidential Transfers**: Transfer assets without revealing transaction details on the blockchain
- **Secure Withdrawals**: Withdraw assets to any address
- **Viewing Keys**: Generate keys to provide selective visibility

## User Roles

### End Users

Individuals who want to maintain privacy for their financial transactions can use this application to:

- Create personal shielded pools
- Deposit assets into their pools
- Make confidential transfers to other addresses
- Withdraw assets when needed
- Generate viewing keys for selective disclosure

### Enterprises

Businesses that need financial privacy for competitive reasons can use this application to:

- Create company-wide shielded pools
- Manage confidential payments to suppliers
- Pay salaries privately
- Make internal transfers between departments
- Provide viewing keys to auditors for compliance

### Auditors & Compliance Officers

Financial auditors and compliance teams can:

- Use viewing keys to access transaction history for specific pools
- Verify transaction compliance without seeing all transaction details
- Generate reports for regulatory purposes

### Regulators

Government agencies with proper authorization can:

- Request viewing keys for investigations
- Audit specific transactions with granted access
- Maintain oversight while respecting privacy

## Technical Architecture

### Frontend Components

- **PrivateTransfersForm**: Main interface for user interactions
- **ShieldedPool Hook**: API interface to interact with blockchain data
- **Transaction Handlers**: Process user actions into blockchain transactions
- **Wallet Connection**: Integration with Sui wallets

### Backend / Smart Contracts

The application interacts with Move smart contracts on the Sui blockchain that handle:

- Shielded pool creation and management
- Zero-knowledge proof generation and verification
- On-chain privacy logic
- Viewing key management

## How It Works

1. **Pool Creation**: Users create a shielded pool that acts as a private wallet
2. **Deposits**: Users deposit Sui tokens into their pool
3. **Transfers**: When making transfers, the application:
   - Generates zero-knowledge proofs
   - Executes transactions privately on-chain
   - Updates balances without revealing amounts or participants
4. **Withdrawals**: Users can withdraw assets to any address
5. **Viewing Keys**: Users can generate keys that provide selective visibility

## Privacy Features

- **Zero-Knowledge Proofs**: Verify transaction validity without revealing details
- **Confidential Amounts**: Transaction values are hidden on-chain
- **Private Recipients**: Transfer destinations are not visible on the blockchain
- **Selective Disclosure**: Viewing keys enable controlled transparency

## Getting Started

### Prerequisites

- Sui Wallet (browser extension)
- SUI tokens for gas fees
- Modern web browser

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-org/sui-private-transfers.git
cd sui-private-transfers
```

2. Install dependencies
```bash
cd cryptozkp/packages/frontend-greeting-next
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser to http://localhost:3000

### Usage

1. **Connect Wallet**: Click the "Connect Wallet" button to connect your Sui wallet
2. **Create Pool**: Create a new shielded pool using the "Create Shielded Pool" button
3. **Deposit**: Add assets to your pool by specifying an amount
4. **Transfer**: Make private transfers by providing recipient address and amount
5. **Withdraw**: Move assets from your shielded pool to any address
6. **Viewing Keys**: Generate keys to provide selective visibility

## Development and Deployment

### Development Mode

The application includes a mock mode for development without needing deployed contracts:

```javascript
// Mock pool ID for testing
const MOCK_POOL_ID = '0x123456789abcdef000000000000000000000000000000000000000000001'
```

### Production Deployment

1. Deploy Move contracts to Sui Mainnet
2. Update configuration file with contract address
3. Build and deploy the frontend application
4. Connect to a production Sui RPC endpoint

## Security Considerations

- **Key Management**: Protect viewing keys as they provide transaction visibility
- **Privacy Limitations**: Be aware of correlation attacks in certain usage patterns
- **Smart Contract Audits**: Ensure underlying contracts have been professionally audited
- **Wallet Security**: Protect your wallet as it controls access to your shielded pools

## Future Enhancements

- **Multi-Asset Support**: Enable privacy for different token types
- **Advanced ZK Features**: Implement more sophisticated zero-knowledge functionalities
- **Enhanced Viewing Controls**: More granular permissions for viewing keys
- **Cross-Chain Privacy**: Extend private transfers across multiple blockchains

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [LICENSE NAME] - see the LICENSE file for details.

## Acknowledgments

- Sui Foundation for blockchain infrastructure
- Zero-knowledge cryptography community
- Open-source libraries and tools used in this project
