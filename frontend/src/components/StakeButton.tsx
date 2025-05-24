import React from 'react';
import { useOnrampAndStake } from '../hooks';

const StakeButton: React.FC = () => {
  const {
    // States
    isAuthenticated,
    walletAddress,
    amount,
    isLoading,
    error,
    txHash,
    networkId,
    isStaking,
    amountToStake,
    stakedBalance,
    
    // State setters
    setAmount,
    setNetworkId,
    
    // Functions
    handleStake,
    handleStakeAfterOnramp,
    resetAfterStaking,
    login,
    createWallet
  } = useOnrampAndStake();
  
  if (!isAuthenticated) {
    return <button onClick={login}>Login</button>;
  }
  
  if (!walletAddress) {
    return <button onClick={createWallet}>Create Wallet</button>;
  }
  
  return (
    <div>
      {stakedBalance && (
        <div>
          <p>Staked: {stakedBalance.balanceFormatted} {stakedBalance.token}</p>
        </div>
      )}
      
      {txHash ? (
        <button onClick={resetAfterStaking}>Stake More</button>
      ) : amountToStake ? (
        <button 
          onClick={handleStakeAfterOnramp} 
          disabled={isStaking}
        >
          {isStaking ? 'Staking...' : `Stake ${amountToStake} ETH`}
        </button>
      ) : (
        <div>
          <input
            type="number"
            placeholder="ETH amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
          />
          
          <select
            value={networkId}
            onChange={(e) => setNetworkId(e.target.value)}
            disabled={isLoading}
          >
            <option value="8453">Base</option>
            <option value="1">Ethereum</option>
          </select>
          
          <button 
            onClick={handleStake} 
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Stake'}
          </button>
        </div>
      )}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default StakeButton; 