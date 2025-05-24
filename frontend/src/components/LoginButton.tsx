import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAuth } from '../contexts/AuthContext';

const LoginButton: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const privy = usePrivy();

  if (isLoading) {
    return <button disabled>Loading...</button>;
  }

  if (isAuthenticated) {
    return (
      <button onClick={() => privy.logout()}>
        Logout
      </button>
    );
  }

  return (
    <button onClick={() => privy.login()}>
      Login with Privy
    </button>
  );
};

export default LoginButton; 