import React, { useEffect, useState } from 'react';
import { useOnrampAndStake } from '../hooks';

// Define the spin animation as a constant
const spinnerStyle = {
  display: 'inline-block',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  border: '3px solid #f3f3f3',
  borderTop: '3px solid #3b82f6',
  animation: 'spin 1s linear infinite'
};

// Common button style
const buttonStyle = {
  backgroundColor: '#3b82f6',
  color: 'white',
  fontWeight: 'bold' as const,
  padding: '8px 12px',
  borderRadius: '4px',
  border: 'none'
};

const OnrampAndStakeButton: React.FC = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [autoCheckingBalance, setAutoCheckingBalance] = useState(false);
  const [checkBalanceComplete, setCheckBalanceComplete] = useState(false);
  
  const {
    // States
    isAuthenticated,
    walletAddress,
    onrampAmount,
    checkingBalance,
    error,
    txHash,
    isStaking,
    amountToStake,
    stakedBalance,
    currentBalance,
    initialBalance,
    
    // State setters
    setOnrampAmount,
    
    // Functions
    handleOnramp,
    handleStakeAfterOnramp,
    resetAfterStaking,
    login,
    createWallet,
    checkBalanceAfterOnramp
  } = useOnrampAndStake();
  
  // Check if we're returning from ZKP2P
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromZkp2p = urlParams.get('fromZkp2p');
    
    if (fromZkp2p === 'true' && isAuthenticated && walletAddress) {
      console.log("OnrampAndStakeButton: Detected return from ZKP2P");
      setAutoCheckingBalance(true);
      
      // Force a check after a short delay (in case the useEffect in the hook hasn't fired)
      setTimeout(() => {
        console.log("OnrampAndStakeButton: Running manual balance check");
        checkBalanceAfterOnramp().then(() => {
          console.log("OnrampAndStakeButton: Balance check complete");
          setCheckBalanceComplete(true);
        });
      }, 2000);
      
      // Safety timeout
      const timer = setTimeout(() => {
        console.log("OnrampAndStakeButton: Safety timeout reached");
        setAutoCheckingBalance(false);
        setCheckBalanceComplete(true);
      }, 15000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, walletAddress]);
  
  // Once we have amountToStake, we're ready to show the stake button
  useEffect(() => {
    if (amountToStake) {
      console.log("OnrampAndStakeButton: Amount to stake is set:", amountToStake);
      setAutoCheckingBalance(false);
      setCheckBalanceComplete(true);
    }
  }, [amountToStake]);
  
  const handleOnrampClick = () => {
    setIsRedirecting(true);
    handleOnramp();
  };
  
  // Function to show the balance diff for the user
  const getBalanceDiff = () => {
    if (!currentBalance || !initialBalance) return null;
    
    try {
      const diff = currentBalance.sub(initialBalance);
      return parseFloat(diff.toString()) / 1e18;
    } catch (e) {
      console.error("Error calculating balance diff:", e);
      return null;
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div>
        <p>Please login to use the onramp and stake feature</p>
        <button onClick={login}>Login with Privy</button>
      </div>
    );
  }
  
  if (!walletAddress) {
    return <button onClick={createWallet}>Create Wallet</button>;
  }
  
  // After checking balance, if we don't have amountToStake but the check is complete,
  // and we have a balance difference, show a manual option
  const balanceDiff = getBalanceDiff();
  const showManualOption = checkBalanceComplete && !amountToStake && balanceDiff && balanceDiff > 0;
  
  return (
    <div>
      {/* Add CSS for the spinner animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
      
      {stakedBalance && (
        <div>
          <p>Staked: {stakedBalance.balanceFormatted} {stakedBalance.token}</p>
        </div>
      )}
      
      {txHash ? (
        <button 
          onClick={resetAfterStaking}
          style={buttonStyle}
        >
          Onramp & Stake More
        </button>
      ) : amountToStake ? (
        <div>
          <p>ETH received! Ready to stake.</p>
          <button 
            onClick={handleStakeAfterOnramp} 
            disabled={isStaking}
            style={buttonStyle}
          >
            {isStaking ? 'Staking...' : `Stake ${amountToStake} ETH`}
          </button>
        </div>
      ) : showManualOption ? (
        <div>
          <p>We detected new funds but couldn't calculate the stake amount automatically.</p>
          <p>Balance increased by approximately {balanceDiff.toFixed(6)} ETH</p>
          <button 
            onClick={() => {
              // Manually try the balance check again
              checkBalanceAfterOnramp();
              setAutoCheckingBalance(true);
              setCheckBalanceComplete(false);
            }}
            style={buttonStyle}
          >
            Try Staking Again
          </button>
        </div>
      ) : autoCheckingBalance || checkingBalance ? (
        <div>
          <p>Checking your balance after onramp...</p>
          <div style={{...spinnerStyle, marginLeft: '8px'}}></div>
        </div>
      ) : isRedirecting ? (
        <div>
          <p>Redirecting to ZKP2P...</p>
        </div>
      ) : (
        <div>
          <h3>Onramp and Stake ETH</h3>
          
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
              onClick={handleOnrampClick} 
              disabled={checkingBalance}
              style={buttonStyle}
            >
              {checkingBalance ? 'Processing...' : 'Onramp & Stake ETH'}
            </button>
          </div>
          
          <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
            <p>You'll be redirected to ZKP2P to complete the onramp process. After returning, we'll automatically stake your funds.</p>
          </div>
        </div>
      )}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default OnrampAndStakeButton; 