import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAuth } from './AuthContext';

const Web3Context = createContext(null);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export function Web3Provider({ children }) {
  const { user, setUser } = useAuth();
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Link wallet to user account via challenge-sign-verify (with explicit signer)
  const linkWalletToUserWithSigner = async (walletAddress, username, signerInstance) => {
    try {
      console.log('🔗 Starting wallet link for user:', username, 'wallet:', walletAddress);
      
      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please login first.');
      }
      
      // 1. Get challenge from backend
      console.log('📡 Requesting challenge from backend...');
      const challengeResp = await fetch(`${API_BASE_URL}/api/user/wallet/challenge`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ username })
      });
      if (!challengeResp.ok) {
        const errorText = await challengeResp.text();
        console.error('❌ Challenge request failed:', errorText);
        throw new Error('Failed to get challenge');
      }
      const { message } = await challengeResp.json();
      console.log('✅ Challenge received:', message);

      // 2. Sign the message using the provided signer
      console.log('✍️ Requesting signature from user...');
      const signature = await signerInstance.signMessage(message);
      console.log('✅ Message signed:', signature.substring(0, 20) + '...');

      // 3. Verify and save on backend
      console.log('📡 Sending signature to backend for verification...');
      const verifyResp = await fetch(`${API_BASE_URL}/api/user/wallet/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ username, address: walletAddress, signature })
      });
      if (!verifyResp.ok) {
        const errorData = await verifyResp.json();
        console.error('❌ Verification failed:', errorData);
        throw new Error(errorData.error || 'Failed to verify signature');
      }
      const result = await verifyResp.json();
      
      console.log('✅ Wallet linked to user:', username, '→', walletAddress);
      
      // Update user context with wallet address
      if (user) {
        setUser({ ...user, walletAddress });
      }
      
      return result;
    } catch (err) {
      console.error('Failed to link wallet:', err);
      throw err;
    }
  };

  // Link wallet to user account via challenge-sign-verify (uses state signer)
  const linkWalletToUser = async (walletAddress, username) => {
    if (!signer) {
      throw new Error('Signer not available. Please connect wallet first.');
    }
    return linkWalletToUserWithSigner(walletAddress, username, signer);
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to use blockchain features.');
      return false;
    }

    setConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const selectedAccount = accounts[0];

      // If user is logged in and has a saved wallet, check if it matches
      if (user && user.walletAddress) {
        if (user.walletAddress.toLowerCase() !== selectedAccount.toLowerCase()) {
          setError(
            `This account (${user.username}) is linked to wallet ${user.walletAddress.substring(0, 10)}...\n` +
            `Please switch MetaMask to the correct account and try again.`
          );
          setConnecting(false);
          return false;
        }
      }

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(selectedAccount);
      setChainId(Number(network.chainId));

      // Get balance with error handling
      try {
        const bal = await web3Provider.getBalance(selectedAccount);
        setBalance(ethers.formatEther(bal));
      } catch (balanceErr) {
        console.warn("⚠️ Failed to fetch balance (RPC might be busy):", balanceErr);
        // Don't fail the whole connection if balance fetch fails
      }

      console.log('✅ Wallet connected:', selectedAccount);
      console.log('🌐 Network:', network.name, '(chainId:', Number(network.chainId), ')');

      // If user is logged in but no wallet linked, link it now
      if (user && !user.walletAddress) {
        try {
          console.log('🔗 Auto-linking wallet to user account...');
          
          const shouldLink = confirm(
            `Link Wallet to Account\n\n` +
            `Account: ${user.username}\n` +
            `Wallet: ${selectedAccount}\n\n` +
            `This will permanently link this wallet to your account.\n` +
            `You can switch wallets in MetaMask before confirming.\n\n` +
            `Click OK to proceed with linking, or Cancel to use a different wallet.`
          );
          
          if (!shouldLink) {
            console.log('❌ User cancelled wallet linking');
            disconnectWallet();
            setConnecting(false);
            return false;
          }
          
          alert('Please sign the message in MetaMask to verify wallet ownership.');
          
          // Use the web3Signer directly instead of state variable
          await linkWalletToUserWithSigner(selectedAccount, user.username, web3Signer);
          
          alert(`✅ Wallet linked successfully!\n\nYour wallet ${selectedAccount.substring(0, 10)}... is now linked to ${user.username}`);
        } catch (err) {
          console.error('❌ Auto-link failed:', err);
          console.error('Error details:', {
            message: err.message,
            stack: err.stack,
            name: err.name
          });
          disconnectWallet();
          alert(`Failed to link wallet: ${err.message}\n\nYou can try again later from your account settings.`);
          return false;
        }
      } else if (user && user.walletAddress) {
        console.log('✅ Wallet already linked to user:', user.username);
      }

      return true;
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      return false;
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setBalance('0');
    setError(null);
  };

  // Switch network
  const switchNetwork = async (targetChainId) => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.toBeHex(targetChainId) }],
      });
      return true;
    } catch (err) {
      // If network doesn't exist, add it
      if (err.code === 4902) {
        console.error('Network not found. Please add it manually.');
      }
      console.error('Failed to switch network:', err);
      return false;
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
        return;
      }
      
      const newAccount = accounts[0];
      
      // If user is logged in and has a saved wallet, only accept the saved wallet
      if (user && user.walletAddress) {
        if (newAccount.toLowerCase() !== user.walletAddress.toLowerCase()) {
          console.warn(`⚠️ Account mismatch: User ${user.username} is linked to ${user.walletAddress.substring(0, 10)}... but MetaMask switched to ${newAccount.substring(0, 10)}...`);
          setError(`This account is linked to wallet ${user.walletAddress.substring(0, 10)}... Please switch back in MetaMask.`);
          disconnectWallet();
          return;
        }
      }
      
      if (newAccount !== account) {
        setAccount(newAccount);
        setError(null);
        // Refresh balance
        if (provider) {
          provider.getBalance(newAccount).then(bal => {
            setBalance(ethers.formatEther(bal));
          });
        }
      }
    };

    const handleChainChanged = (chainIdHex) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      // Reload page to reset state properly
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, provider, user]);

  // Auto-connect only if user is logged in and has a linked wallet
  useEffect(() => {
    // Only attempt auto-connect if:
    // 1. User is logged in
    // 2. User has a saved wallet address
    // 3. MetaMask is installed
    if (!user || !user.walletAddress || !isMetaMaskInstalled()) {
      return;
    }

    const attemptAutoConnect = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        // Only auto-connect if the currently selected MetaMask account matches the user's saved wallet
        if (accounts.length > 0 && accounts[0].toLowerCase() === user.walletAddress.toLowerCase()) {
          console.log('🔄 Auto-connecting to saved wallet...');
          await connectWallet();
        } else if (accounts.length > 0) {
          console.log('⚠️ MetaMask account does not match saved wallet. Skipping auto-connect.');
        }
      } catch (err) {
        console.error('Auto-connect failed:', err);
      }
    };

    attemptAutoConnect();
  }, [user?.walletAddress]); // Re-run when user login state or wallet changes

  const value = {
    provider,
    signer,
    account,
    chainId,
    balance,
    connecting,
    error,
    isConnected: !!account,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connectWallet,
    disconnectWallet,
    switchNetwork,
    linkWalletToUser
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
}
