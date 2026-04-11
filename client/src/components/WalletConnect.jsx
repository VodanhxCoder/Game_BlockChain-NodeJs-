import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';

export default function WalletConnect({ compact = false }) {
  const { user } = useAuth();
  const {
    account,
    balance,
    chainId,
    isConnected,
    connecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork
  } = useWeb3();

  // Format address for display (0x1234...5678)
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Format balance to 4 decimals
  const formatBalance = (bal) => {
    if (!bal) return '0';
    return parseFloat(bal).toFixed(4);
  };

  // Get network name
  const getNetworkName = (id) => {
    const networks = {
      1: 'Ethereum',
      56: 'BSC',
      97: 'BSC Testnet',
      137: 'Polygon',
      80001: 'Mumbai',
      31337: 'Hardhat Local'
    };
    return networks[id] || `Chain ${id}`;
  };

  // Handle MetaMask not installed
  if (!isConnected && error && error.includes('not installed')) {
    return (
      <div className="wallet-connect-error">
        <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          [WARN] MetaMask not detected
        </p>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="ui-btn ui-btn--secondary"
          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          Install MetaMask
        </a>
      </div>
    );
  }

  // Compact mode (for navbar)
  if (compact) {
    return (
      <div className="wallet-connect-compact">
        {!isConnected ? (
          <button
            type="button"
            className="ui-btn ui-btn--primary"
            onClick={connectWallet}
            disabled={connecting}
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              className="wallet-badge"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ color: '#22c55e' }}>●</span>
              <span style={{ fontFamily: 'monospace' }}>{formatAddress(account)}</span>
              <span style={{ color: '#9ca3af' }}>|</span>
              <span>{formatBalance(balance)} ETH</span>
            </div>
            <button
              type="button"
              className="ui-btn ui-btn--secondary"
              onClick={disconnectWallet}
              style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full mode (for pages)
  return (
    <div className="wallet-connect-full" style={{ marginBottom: '2rem' }}>
      {!isConnected ? (
        <div
          className="wallet-connect-card"
          style={{
            background: 'rgba(139, 92, 246, 0.05)',
            border: '2px dashed rgba(139, 92, 246, 0.3)',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>MM</div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>
            Connect Your MetaMask Wallet
          </h3>
          <p style={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Link your wallet to trade items on the blockchain
          </p>
          {user && !user.walletAddress && (
            <p style={{ color: '#8b5cf6', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Your wallet will be automatically linked to your account ({user.username})
            </p>
          )}
          {!user && (
            <p style={{ color: '#f59e0b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              [WARN] Please login first to link your wallet
            </p>
          )}
          <button
            type="button"
            className="ui-btn ui-btn--primary"
            onClick={connectWallet}
            disabled={connecting || !user}
            style={{ minWidth: '200px' }}
          >
            {connecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
          {error && (
            <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.875rem' }}>
              {error}
            </p>
          )}
        </div>
      ) : (
        <div
          className="wallet-connected-card"
          style={{
            background: 'rgba(34, 197, 94, 0.05)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '1rem',
            padding: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#22c55e', fontSize: '1.25rem' }}>●</span>
                <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>Wallet Connected</span>
                {user && user.walletAddress && (
                  <span style={{ 
                    background: 'rgba(139, 92, 246, 0.2)', 
                    color: '#8b5cf6', 
                    fontSize: '0.75rem', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '0.25rem',
                    fontWeight: 600
                  }}>
                    Linked to {user.username}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#9ca3af' }}>
                {account}
              </div>
            </div>
            <button
              type="button"
              className="ui-btn ui-btn--secondary"
              onClick={disconnectWallet}
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              Disconnect
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}
            >
              <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Balance
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {formatBalance(balance)} ETH
              </div>
            </div>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}
            >
              <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Network
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                {getNetworkName(chainId)}
              </div>
            </div>
          </div>

          {chainId && chainId !== 31337 && chainId !== 97 && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#eab308', marginBottom: '0.5rem' }}>
                [WARN] Wrong Network
              </p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.75rem' }}>
                Please switch to Hardhat Local (31337) or BSC Testnet (97)
              </p>
              <button
                type="button"
                className="ui-btn ui-btn--secondary"
                onClick={() => switchNetwork(31337)}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Switch to Hardhat Local
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
