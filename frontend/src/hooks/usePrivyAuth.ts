import { useState, useEffect, useCallback } from 'react';
import { usePrivy, useCreateWallet } from '@privy-io/react-auth';

interface EmbeddedWallet {
  type: string;
  walletClientType: string;
  address: string;
}

/**
 * Custom hook for Privy authentication
 * Handles login, logout, wallet creation and auth state management
 */
export const usePrivyAuth = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  const privy = usePrivy();
  const { createWallet: privyCreateWallet } = useCreateWallet();
  
  const isAuthenticated = privy.authenticated;
  
  // udate wallet address when authentication state changes
  useEffect(() => {
    const updateWalletAddress = async () => {
      try {
        if (isAuthenticated && privy.user) {
          const embeddedWallets = privy.user.linkedAccounts?.filter(
            (account) => account.type === 'wallet' && account.walletClientType === 'privy'
          ) as EmbeddedWallet[] | undefined;
          
          if (embeddedWallets && embeddedWallets.length > 0) {
            setWalletAddress(embeddedWallets[0].address);
          } else {
            setWalletAddress(null);
          }
        } else {
          setWalletAddress(null);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error updating wallet address:', error);
        setIsLoading(false);
      }
    };
    
    updateWalletAddress();
  }, [isAuthenticated, privy.user]);
  
  // login 
  const login = useCallback(async () => {
    try {
      await privy.login();
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }, [privy]);
  
  // logout 
  const logout = useCallback(async () => {
    try {
      await privy.logout();
      setWalletAddress(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }, [privy]);
  
  // create wallet 
  const createWallet = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to create a wallet');
      }
      
      const wallet = await privyCreateWallet();
      
      if (wallet && wallet.address) {
        setWalletAddress(wallet.address);
      }
      
      return wallet;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }, [isAuthenticated, privyCreateWallet]);
  
  return {
    isAuthenticated,
    isLoading,
    walletAddress,
    login,
    logout,
    createWallet,
    user: privy.user,
    ready: privy.ready,
  };
};

export default usePrivyAuth; 