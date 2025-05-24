# Bubble App

A web application that allows users to:
- Log in with Privy and create a wallet
- Onramp with zkp2p to get ETH
- Automatically stake ETH using Lido

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts for state management
│   ├── pages/             # Page components
│   ├── styles/            # CSS and styling files
│   ├── utils/             # Utility functions
│   │   ├── auth/          # Authentication utilities
│   │   ├── onramp/        # Onramp utilities
│   │   └── staking/       # Staking utilities
│   ├── App.tsx            # Main App component
│   └── index.tsx          # Entry point
├── .env.example           # Example environment variables
├── package.json           # Dependencies and scripts
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory
   ```
   cd frontend
   ```
3. Install dependencies
   ```
   npm install
   ```
4. Create a `.env` file by copying `.env.example` and fill in your API keys
   ```
   cp .env.example .env
   ```
5. Start the development server
   ```
   npm start
   ```

## Environment Variables

- `PRIVY_APP_ID`: Your Privy application ID
- `REACT_APP_NETWORK_RPC_URL`: Ethereum RPC URL for connecting to the blockchain
- `REACT_APP_CHAIN_ID`: Ethereum chain ID (1 for mainnet)
- `REACT_APP_LIDO_CONTRACT_ADDRESS`: Lido stETH contract address

## Features

### Authentication with Privy
- Create and manage user wallets
- Secure authentication

### Onramp with zkp2p
- Convert fiat currency to ETH
- Track onramp transactions

### Staking with Lido
- Stake ETH to earn stETH
- Automatic staking after onramping
- View staking transactions and rewards

## Technologies Used

- React.js with TypeScript
- Privy for authentication
- zkp2p for onramping
- Lido for ETH staking
- ethers.js for blockchain interactions
