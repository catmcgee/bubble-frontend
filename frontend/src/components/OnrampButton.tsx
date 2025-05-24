import React from 'react';
import { useOnrampAndStake } from '../hooks';

const OnrampButton: React.FC = () => {
  const {
    isAuthenticated,
    walletAddress,
    onrampAmount,
    checkingBalance,
    error,
    setOnrampAmount,
    handleOnramp,
    login,
    createWallet
  } = useOnrampAndStake();

  if (!isAuthenticated) {
    return (
      <div>
        <p>Please login to use the onramp feature</p>
        <button onClick={login}>Login with Privy</button>
      </div>
    );
  }

  return (
    <div>
      <h3>Onramp with ZKP2P</h3>
      
      <div>
        <input
          type="number"
          placeholder="Amount in EUR"
          value={onrampAmount}
          onChange={(e) => setOnrampAmount(e.target.value)}
          disabled={checkingBalance}
          style={{ marginRight: '8px' }}
        />
        
        <button 
          onClick={handleOnramp} 
          disabled={checkingBalance}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            fontWeight: 'bold',
            padding: '8px 12px',
            borderRadius: '4px',
            border: 'none'
          }}
        >
          {checkingBalance ? 'Processing...' : 'Onramp ETH'}
        </button>
      </div>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
        <p>You'll be redirected to ZKP2P to complete the onramp process.</p>
      </div>
    </div>
  );
};

export default OnrampButton; 