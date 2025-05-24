import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallets } from '@privy-io/react-auth';
import usePrivyAuth from './usePrivyAuth';

const BASE_RPC_URL = "https://mainnet.base.org";

const INITIAL_BALANCE_KEY = 'bubble_initial_balance';
const WALLET_ADDRESS_KEY = 'bubble_wallet_address';

// Lido contract addresses
const LIDO_BASE_WSTETH_ADDRESS = '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452';
const LIDO_ETH_STETH_ADDRESS = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84';

/**
 * A custom hook that provides onramping and staking functionality
 */
export const useOnrampAndStake = () => {
  // staking states
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<string>('8453'); // Default to Base
  const [stakedBalance, setStakedBalance] = useState<{
    balanceFormatted: string;
    token: string;
  } | null>(null);
  
  // onramp states
  const [currency, setCurrency] = useState<string>('EUR');
  const [showOnrampForm, setShowOnrampForm] = useState<boolean>(true);
  const [initialBalance, setInitialBalance] = useState<ethers.BigNumber | null>(null);
  const [currentBalance, setCurrentBalance] = useState<ethers.BigNumber | null>(null);
  const [onrampAmount, setOnrampAmount] = useState<string>('');
  const [checkingBalance, setCheckingBalance] = useState<boolean>(false);
  const [isStaking, setIsStaking] = useState<boolean>(false);
  const [showStakeConfirm, setShowStakeConfirm] = useState<boolean>(false);
  const [amountToStake, setAmountToStake] = useState<string>('');
  
  const { isAuthenticated, walletAddress, login, createWallet } = usePrivyAuth();
  const { wallets } = useWallets();
  
  /**
   * Get the embedded wallet from Privy
   */
  const getEmbeddedWallet = () => {
    if (!wallets || !walletAddress) return null;
    return wallets.find(wallet => 
      wallet.walletClientType === 'privy' && wallet.address.toLowerCase() === walletAddress.toLowerCase()
    );
  };

  /**
   * Function to stake ETH using Lido
   */
  const stakeEth = async (
    provider: ethers.providers.Web3Provider,
    amountInEth: string,
    referralAddress?: string
  ) => {
    try {
      // Get network to determine if we're on Base or Ethereum
      const network = await provider.getNetwork();
      console.log(`Connected to network: ${network.name} (${network.chainId})`);
      
      // Convert ETH amount to Wei
      const amountInWei = ethers.utils.parseEther(amountInEth);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      // Determine if we're on Base or Ethereum
      if (network.chainId === 8453) {
        console.log(`Staking ${amountInEth} ETH on Base using wstETH contract at ${LIDO_BASE_WSTETH_ADDRESS}`);
        
        // On Base, we use the wstETH contract directly
        // This is a direct ETH transfer to the wstETH contract
        const tx = await signer.sendTransaction({
          to: LIDO_BASE_WSTETH_ADDRESS,
          value: amountInWei,
          gasLimit: ethers.utils.hexlify(100000),
        });
        
        console.log("Transaction sent:", tx.hash);
        await tx.wait(1);
        
        return {
          transactionHash: tx.hash,
          stakedAmount: amountInEth,
        };
      } else {
        // On Ethereum, we use the stETH contract
        console.log(`Staking ${amountInEth} ETH on Ethereum using stETH contract at ${LIDO_ETH_STETH_ADDRESS}`);
        
        // For Ethereum, we can use the submit method or direct transfer
        const tx = await signer.sendTransaction({
          to: LIDO_ETH_STETH_ADDRESS,
          value: amountInWei,
          gasLimit: ethers.utils.hexlify(250000),
          data: referralAddress ? 
            ethers.utils.defaultAbiCoder.encode(['address'], [referralAddress]) : 
            '0x',
        });
        
        console.log("Transaction sent:", tx.hash);
        await tx.wait(1);
        
        return {
          transactionHash: tx.hash,
          stakedAmount: amountInEth,
        };
      }
    } catch (error) {
      console.error('Error staking ETH with Lido:', error);
      throw error;
    }
  };

  /**
   * Function to get stETH/wstETH balance
   */
  const getStakedBalance = async (
    provider: ethers.providers.Web3Provider,
    address: string
  ) => {
    try {
      const network = await provider.getNetwork();
      
      // Simple ERC20 ABI for balanceOf
      const erc20Abi = ["function balanceOf(address owner) view returns (uint256)"];
      
      if (network.chainId === 8453) {
        // On Base, check wstETH balance
        const wstethContract = new ethers.Contract(LIDO_BASE_WSTETH_ADDRESS, erc20Abi, provider);
        
        const balance = await wstethContract.balanceOf(address);
        return {
          balanceWei: balance,
          balanceFormatted: ethers.utils.formatEther(balance),
          token: 'wstETH'
        };
      } else {
        // On Ethereum, check stETH balance
        const stethContract = new ethers.Contract(LIDO_ETH_STETH_ADDRESS, erc20Abi, provider);
        
        const balance = await stethContract.balanceOf(address);
        return {
          balanceWei: balance,
          balanceFormatted: ethers.utils.formatEther(balance),
          token: 'stETH'
        };
      }
    } catch (error) {
      console.error('Error getting staked balance:', error);
      throw error;
    }
  };

  /**
   * Build the ZKP2P redirect URL
   */
  const buildZkp2pRedirectUrl = (params: {
    amount: string;
    walletAddress: string;
    chainId?: string;
    currency?: string;
    paymentPlatform?: string;
    callbackParams?: Record<string, string>;
  }) => {
    const {
      amount,
      walletAddress,
      chainId = '8453', // Default to Base
      currency = 'EUR',
      paymentPlatform,
      callbackParams,
    } = params;

    // Base URL
    const baseUrl = 'https://zkp2p.xyz/swap';
    
    // App information
    const referrer = 'Bubble App';
    const referrerLogo = ''; // Add your logo URL if available
    const callbackUrl = new URL(window.location.href);
    
    // Clear existing query parameters from the URL
    callbackUrl.search = '';
    
    // Add any callback parameters
    if (callbackParams) {
      Object.entries(callbackParams).forEach(([key, value]) => {
        callbackUrl.searchParams.append(key, value);
      });
    }
    
    // Build token parameter - Default to ETH on specified chain
    const toToken = `${chainId}:0x0000000000000000000000000000000000000000`;
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      referrer,
      callbackUrl: callbackUrl.toString(),
      inputCurrency: currency,
      inputAmount: amount,
      toToken,
      recipientAddress: walletAddress,
    });
    
    // Add optional parameters if provided
    if (referrerLogo) {
      queryParams.append('referrerLogo', referrerLogo);
    }
    
    if (paymentPlatform) {
      queryParams.append('paymentPlatform', paymentPlatform);
    }
    
    return `${baseUrl}?${queryParams.toString()}`;
  };

  /**
   * Redirect to ZKP2P for onramping
   */
  const redirectToZkp2p = (params: {
    amount: string;
    walletAddress: string;
    chainId?: string;
    currency?: string;
    paymentPlatform?: string;
    callbackParams?: Record<string, string>;
  }) => {
    const url = buildZkp2pRedirectUrl(params);
    window.location.href = url;
  };
  
  /**
   * Fetch staked balance
   */
  const fetchStakedBalance = async () => {
    if (!isAuthenticated || !walletAddress) return;
    
    try {
      const embeddedWallet = getEmbeddedWallet();
      if (!embeddedWallet) return;
      
      const provider = await embeddedWallet.getEthereumProvider();
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      
      const balance = await getStakedBalance(ethersProvider, walletAddress);
      setStakedBalance(balance);
    } catch (error) {
      console.error('Error fetching staked balance:', error);
    }
  };
  
  useEffect(() => {
    const savedWalletAddress = localStorage.getItem(WALLET_ADDRESS_KEY);
    
    const savedInitialBalance = localStorage.getItem(INITIAL_BALANCE_KEY);
    if (savedInitialBalance && savedInitialBalance !== 'null') {
      setInitialBalance(ethers.BigNumber.from(savedInitialBalance));
      console.log("Loaded initial balance from localStorage:", ethers.utils.formatEther(savedInitialBalance), "ETH");
    }
    
    // check if returning from ZKP2P
    const urlParams = new URLSearchParams(window.location.search);
    const fromZkp2p = urlParams.get('fromZkp2p');
    
    if (fromZkp2p === 'true' && isAuthenticated && walletAddress) {
      console.log("Detected return from ZKP2P, checking balance...");
      checkBalanceAfterOnramp();
    }
  }, [isAuthenticated, walletAddress]);
  
  // get staked balance
  useEffect(() => {
    fetchStakedBalance();
  }, [isAuthenticated, walletAddress, wallets, txHash]);
  
  /**
   * Check balance after returning from ZKP2P
   */
  const checkBalanceAfterOnramp = async () => {
    if (!isAuthenticated || !walletAddress) return;
    
    try {
      setCheckingBalance(true);
      
      const savedInitialBalance = localStorage.getItem(INITIAL_BALANCE_KEY);
      const initialBalanceValue = savedInitialBalance && savedInitialBalance !== 'null' 
        ? ethers.BigNumber.from(savedInitialBalance)
        : ethers.constants.Zero;
      
      const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
      const balance = await provider.getBalance(walletAddress);
      setCurrentBalance(balance);
      
      console.log("Initial balance:", ethers.utils.formatEther(initialBalanceValue), "ETH");
      console.log("Current balance:", ethers.utils.formatEther(balance), "ETH");
      
      if (balance.gt(initialBalanceValue)) {
        const difference = balance.sub(initialBalanceValue);
        console.log("Balance difference:", ethers.utils.formatEther(difference), "ETH");
        
        const gasBuffer = ethers.utils.parseEther('0.00001');
        
        let safeStakeAmount;
        if (difference.gt(gasBuffer)) {
          safeStakeAmount = difference.sub(gasBuffer);
          console.log("Safe stake amount (after gas buffer):", ethers.utils.formatEther(safeStakeAmount), "ETH");
        } else {
          safeStakeAmount = difference.mul(80).div(100); // 80% of the difference
          console.log("Difference too small, staking 80%:", ethers.utils.formatEther(safeStakeAmount), "ETH");
        }
        
        if (safeStakeAmount.gt(ethers.constants.Zero)) {
          const formattedAmount = ethers.utils.formatEther(safeStakeAmount);
          console.log("Setting amount to stake:", formattedAmount, "ETH");
          setAmountToStake(formattedAmount);
          setShowStakeConfirm(true);
          setShowOnrampForm(false);
        } else {
          console.error("No stakeable amount calculated");
        }
      } else {
        console.log("No balance increase detected");
      }
      
      setCheckingBalance(false);
      
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Error checking balance:', error);
      setCheckingBalance(false);
    }
  };
  
  /**
   * Handle direct staking without onramp (prob wont use)
   */
  const handleStake = async () => {
    if (!isAuthenticated || !walletAddress) {
      setError('Please login first');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const embeddedWallet = getEmbeddedWallet();
      
      if (!embeddedWallet) {
        throw new Error('Embedded wallet not found');
      }
      
      const networkName = networkId === '1' ? 'Ethereum' : networkId === '8453' ? 'Base' : 'Unknown Network';
      console.log(`Staking ${amount} ETH on ${networkName}`);
      
      const provider = await embeddedWallet.getEthereumProvider();
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      
      const network = await ethersProvider.getNetwork();
      console.log(`Connected to network: ${network.name} (${network.chainId})`);
      
      // stake ETH
      const result = await stakeEth(ethersProvider, amount);
      
      setTxHash(result.transactionHash);
      setAmount('');
      
      setTimeout(fetchStakedBalance, 5000);
      
    } catch (error) {
      console.error('Staking error:', error);
      setError('Failed to stake: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle staking after onramp
   */
  const handleStakeAfterOnramp = async () => {
    if (!isAuthenticated || !walletAddress || !amountToStake) {
      setError('Unable to stake at this time');
      return;
    }
    
    try {
      setIsStaking(true);
      setError(null);
      
      // get the embedded wallet from Privy
      const embeddedWallet = getEmbeddedWallet();
      
      if (!embeddedWallet) {
        throw new Error('Embedded wallet not found');
      }
      
      const provider = await embeddedWallet.getEthereumProvider();
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      
      // stake ETH using Lido
      const result = await stakeEth(ethersProvider, amountToStake);
      
      setTxHash(result.transactionHash);
      setShowStakeConfirm(false);
      
      setTimeout(fetchStakedBalance, 5000); 
      
    } catch (error) {
      console.error('Staking error:', error);
      setError('Failed to stake: ' + (error as Error).message);
    } finally {
      setIsStaking(false);
    }
  };
  
  /**
   * Redirect to ZKP2P for onramping
   */
  const handleOnramp = () => {
    if (!isAuthenticated) {
      setError('Please login first');
      return;
    }
    
    if (!walletAddress) {
      setError('No wallet available');
      return;
    }
    
    if (!onrampAmount || parseFloat(onrampAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      setError(null);
      setTxHash(null);
      
      const storeInitialBalance = async () => {
        const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
        const balance = await provider.getBalance(walletAddress);
        
        setInitialBalance(balance);
        
        localStorage.setItem(INITIAL_BALANCE_KEY, balance.toString());
        localStorage.setItem(WALLET_ADDRESS_KEY, walletAddress);
        
        console.log("Initial balance stored:", ethers.utils.formatEther(balance), "ETH");
      };
      
      storeInitialBalance().then(() => {
        // redirect to ZKP2P for onramping
        redirectToZkp2p({
          amount: onrampAmount,
          walletAddress,
          chainId: networkId,
          currency,
          callbackParams: { fromZkp2p: 'true' }
        });
      });
      
    } catch (error) {
      console.error('Onramp error:', error);
      setError('Failed to redirect to onramp: ' + (error as Error).message);
    }
  };
  
  /**
   * Reset state after successful staking
   */
  const resetAfterStaking = () => {
    setTxHash(null);
    setShowOnrampForm(true);
  };

  return {
    isAuthenticated,
    walletAddress,
    amount,
    isLoading,
    error,
    txHash,
    networkId,
    currency,
    showOnrampForm,
    initialBalance,
    currentBalance,
    onrampAmount,
    checkingBalance,
    isStaking,
    showStakeConfirm,
    amountToStake,
    stakedBalance,
    
    setAmount,
    setNetworkId,
    setCurrency,
    setShowOnrampForm,
    setOnrampAmount,
    
    handleStake,
    handleStakeAfterOnramp,
    handleOnramp,
    resetAfterStaking,
    checkBalanceAfterOnramp,
    login,
    createWallet,
  };
};

export default useOnrampAndStake; 