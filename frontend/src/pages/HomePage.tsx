import React from 'react';
import LoginButton from '../components/LoginButton';
import OnrampAndStakeButton from '../components/OnrampAndStakeButton';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated, walletAddress } = useAuth();

  return (
    <div className="homepage">
      <header>
        <h1>Bubble App</h1>
        <p>Login, Onramp, and Stake with ease</p>
        <div className="auth-section">
          <LoginButton />
          {isAuthenticated && walletAddress && (
            <p>Connected wallet: {walletAddress}</p>
          )}
        </div>
      </header>

      <main>
        <section className="features">
          <div className="feature-card">
            <h2>Login with Privy</h2>
            <p>Create a wallet and login securely</p>
            <LoginButton />
          </div>

          {isAuthenticated && (
            <div className="feature-card highlight-card">
              <h2>Onramp & Stake in One Step</h2>
              <OnrampAndStakeButton />
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default HomePage; 