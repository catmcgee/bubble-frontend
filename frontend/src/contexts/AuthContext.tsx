import React, { createContext, useContext } from 'react';
import usePrivyAuth from '../hooks/usePrivyAuth';

interface EmbeddedWallet {
  type: string;
  walletClientType: string;
  address: string;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  walletAddress: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  createWallet: () => Promise<any>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isAuthenticated,
    isLoading,
    walletAddress,
    login,
    logout,
    createWallet,
  } = usePrivyAuth();
  
  const value = {
    isAuthenticated,
    isLoading,
    walletAddress,
    login,
    logout,
    createWallet,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 