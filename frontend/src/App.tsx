import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import './styles/global.css';

function App() {
  return (
    <PrivyProvider
      appId={process.env.REACT_APP_PRIVY_APP_ID || ''}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'light',
          accentColor: '#3B82F6',
          logo: 'https://your-logo-url.com/logo.png',
        },
      }}
    >
      <AuthProvider>
        <div className="container">
          <HomePage />
        </div>
      </AuthProvider>
    </PrivyProvider>
  );
}

export default App;
