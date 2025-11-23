// Displays featured NFT drops, power-up bundles, and recent on-chain marketplace activity.
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { ethers } from 'ethers';
import { useAuth } from '../../../context/AuthContext';
import WalletConnect from '../../../components/WalletConnect';
import { useWeb3 } from '../../../context/Web3Context';
import { useTheme } from '../../../context/ThemeContext';

// Vite-friendly API base URL and helper to build full image URLs
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env) ? (import.meta.env.VITE_API_BASE_URL || '') : '';
const getFullImageUrl = (imgPath) => {
  if (!imgPath) return null;
  if (imgPath.startsWith('http')) return imgPath;
  if (imgPath.startsWith('/')) return `${API_BASE_URL}${imgPath}`;
  return `${API_BASE_URL}/${imgPath}`.replace(/\/\/+/, '/');
};

const featuredDrops = [
  { id: 1, name: "Nebula Phantom", rarity: "Legendary", price: "1200 ZEN", stock: "25 / 50", accent: "#fee2ff" },
  { id: 2, name: "Aurora Core Pack", rarity: "Epic", price: "680 ZEN", stock: "80 / 200", accent: "#e0f2fe" },
  { id: 3, name: "Chrono Blade", rarity: "Mythic", price: "2.3 BNB", stock: "4 / 12", accent: "#fef3c7" },
];

const bundles = [
  { id: "booster", title: "XP Booster 3x", desc: "Tăng kinh nghiệm sau mỗi trận trong 24h", price: "320 ZEN" },
  { id: "shield", title: "Quantum Shield", desc: "Khiên hấp thụ 2 đòn chí mạng", price: "0.12 BNB" },
  { id: "pass", title: "Battle Pass S4", desc: "Mở khóa 60 cấp phần thưởng và skin độc quyền", price: "900 ZEN" },
];

const activities = [
  { player: "Raven", item: "Chrono Blade", time: "1 phút trước", tx: "#7F9D...1A9" },
  { player: "Kaito", item: "Nebula Phantom", time: "12 phút trước", tx: "#1BC0...6E2" },
  { player: "Mona", item: "Aurora Pack", time: "30 phút trước", tx: "#5E21...A92" },
];

export default function Shop() {
  const { user } = useAuth();
  const { account, isConnected } = useWeb3();
  const { isDark } = useTheme();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModal, setViewModal] = useState({ open: false, itemHash: '', itemName: '' });
  const [copySuccess, setCopySuccess] = useState(false);
  const [tradeModal, setTradeModal] = useState({ open: false, listing: null, buyerItems: [], selectedItemId: null, loading: false });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/market/listings?limit=40');
      setListings(r.data.listings || []);
    } catch (e) {
      console.error('Failed to load listings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);
  useEffect(() => {
    const onMarketUpdated = () => fetchListings();
    window.addEventListener('market:updated', onMarketUpdated);
    return () => window.removeEventListener('market:updated', onMarketUpdated);
  }, []);

  const closeViewModal = () => setViewModal({ open: false, itemHash: '', itemName: '' });
  const handleCopyHash = async () => {
    try {
      if (!viewModal.itemHash) return;
      await navigator.clipboard.writeText(viewModal.itemHash);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
    } catch (e) {
      console.error('copy failed', e);
      try { window.prompt('Copy item hash', viewModal.itemHash); } catch (_) { /* ignore */ }
    }
  };
  const closeTradeModal = () => setTradeModal({ open: false, listing: null, buyerItems: [], selectedItemId: null, loading: false });

  const confirmTrade = async () => {
    if (!tradeModal.listing || !tradeModal.selectedItemId) return;
    
    // Require wallet connection for blockchain trading
    if (!account || !isConnected) {
      alert('Please connect your MetaMask wallet first');
      return;
    }
    
    try {
      console.log('🔄 Starting trade flow — preparing calldata from backend...');

      // Call backend to prepare calldata and get seller signature (if seller provided one)
      const prep = await axios.post('/api/market/prepare-trade', {
        listingId: tradeModal.listing.listingId,
        buyer: user.username,
        buyerInventoryItemId: tradeModal.selectedItemId,
        buyerWallet: account
      });

      const prepData = prep.data || {};
      const { contractAddress, sellerSignature, sellerItemHash, buyerItemHash, listingId, sellerWallet, buyerWallet, sellerSignatureTimestamp } = prepData;

      console.log('📦 Prepared trade data:', { contractAddress, sellerSignature: sellerSignature ? 'present' : 'missing', sellerSignatureTimestamp, listingId });

      // If seller provided an off-chain signature that allows buyer-initiated on-chain execution,
      // call the contract method `executeTradeByParticipants` from the buyer's wallet so buyer pays gas.
      if (sellerSignature && contractAddress && window.ethereum && sellerWallet && sellerSignatureTimestamp) {
        try {
          console.log('⛓️  Seller signature present — invoking on-chain trade via MetaMask');

          const sellerAddr = sellerWallet;
          const buyerAddr = account;

          const sellerHashBytes = sellerItemHash ? ('0x' + sellerItemHash) : ('0x' + (tradeModal.listing.itemHash || '0'.repeat(64)));
          const buyerHashBytes = buyerItemHash ? ('0x' + buyerItemHash) : ('0x' + '0'.repeat(64));

          console.log('📝 Transaction parameters:');
          console.log('   Seller item:', sellerHashBytes);
          console.log('   Buyer item:', buyerHashBytes);
          console.log('   Seller addr:', sellerAddr);
          console.log('   Buyer addr:', buyerAddr);
          console.log('   Listing ID:', listingId || tradeModal.listing.listingId);
          console.log('   Timestamp:', sellerSignatureTimestamp);
          console.log('   Contract:', contractAddress);

          // Create the contract-compatible signature
          // Contract expects: keccak256(sellerItemHash, listingId, timestamp, contractAddress)
          // We need to recreate this message and have the seller sign it via MetaMask
          const messageHash = ethers.solidityPackedKeccak256(
            ['bytes32', 'uint256', 'uint256', 'address'],
            [sellerHashBytes, listingId || tradeModal.listing.listingId, sellerSignatureTimestamp, contractAddress]
          );
          
          console.log('   Expected message hash:', messageHash);
          console.log('   Seller signature:', sellerSignature.substring(0, 20) + '...');
          
          // Verify signature matches
          try {
            const recoveredAddr = ethers.verifyMessage(ethers.getBytes(messageHash), sellerSignature);
            console.log('   Recovered address:', recoveredAddr);
            console.log('   Matches seller?', recoveredAddr.toLowerCase() === sellerAddr.toLowerCase());
            
            if (recoveredAddr.toLowerCase() !== sellerAddr.toLowerCase()) {
              throw new Error('Signature verification failed - recovered address does not match seller');
            }
          } catch (verifyErr) {
            console.error('❌ Signature verification failed:', verifyErr);
            throw new Error('Invalid seller signature: ' + verifyErr.message);
          }
          
          // Minimal ABI for the buyer-executed function
          const abi = [
            'function executeTradeByParticipants(bytes32,bytes32,address,address,bytes,uint256,uint256)'
          ];

          const provider = new ethers.BrowserProvider(window.ethereum);
          const signerLocal = await provider.getSigner();
          const contract = new ethers.Contract(contractAddress, abi, signerLocal);

          console.log('📤 Sending transaction to contract...');
          const tx = await contract.executeTradeByParticipants(
            sellerHashBytes,
            buyerHashBytes,
            sellerAddr,
            buyerAddr,
            sellerSignature,
            listingId || tradeModal.listing.listingId,
            sellerSignatureTimestamp,
            { gasLimit: 800000 }
          );

          console.log('🔄 Waiting for MetaMask tx to be mined...', tx.hash);
          const receipt = await tx.wait();

          console.log('✅ On-chain trade mined:', receipt.transactionHash || receipt.hash);
          
          // Calculate gas fee paid by buyer
          const gasUsed = receipt.gasUsed;
          const effectiveGasPrice = receipt.gasPrice || receipt.effectiveGasPrice;
          let gasFeeEth = '0';
          if (gasUsed && effectiveGasPrice) {
            const gasFeeWei = gasUsed * effectiveGasPrice;
            gasFeeEth = ethers.formatEther(gasFeeWei);
          }

          // Notify backend to finalize DB swap and record gas usage
          await axios.post('/api/market/confirm-trade', {
            txHash: receipt.transactionHash || receipt.hash,
            listingId: tradeModal.listing.listingId,
            buyer: user.username,
            buyerInventoryItemId: tradeModal.selectedItemId
          });

          alert(`✅ Trade successful!\n\nTransaction: ${(receipt.transactionHash || receipt.hash).substring(0, 10)}...\nGas paid: ${parseFloat(gasFeeEth).toFixed(6)} ETH\n\nCheck your inventory!`);
          window.dispatchEvent(new Event('market:updated'));
          fetchListings();
          closeTradeModal();
          return;
        } catch (onchainErr) {
          console.error('On-chain execution failed, falling back to server flow:', onchainErr);
          // fall through to server fallback below
        }
      }

      // Fallback: ask buyer to sign a small approval message and POST to server so backend (owner) executes the trade
      console.log('🦊 Requesting user signature for server-executed trade approval...');
      if (!window.ethereum) throw new Error('MetaMask not installed');

      const sellerName = typeof tradeModal.listing.seller === 'string'
        ? tradeModal.listing.seller
        : (tradeModal.listing.seller?.username || tradeModal.listing.seller?.playername || 'Unknown');

      const message = `Approve trade:\nListing ID: ${tradeModal.listing.listingId}\nSeller: ${sellerName}\nBuyer: ${user.username}\nTimestamp: ${Date.now()}`;
      const signature = await window.ethereum.request({ method: 'personal_sign', params: [message, account] });

      console.log('📡 Submitting trade to backend for execution (backend pays gas)');
      const tradeResp = await axios.post('/api/market/execute-trade', {
        listingId: tradeModal.listing.listingId,
        buyer: user.username,
        buyerInventoryItemId: tradeModal.selectedItemId,
        buyerWallet: account,
        signature,
        message
      });

      const { txHash } = tradeResp.data || {};
      console.log('✅ Server-executed trade response:', txHash);

      alert(`Trade successful!\nTransaction: ${txHash ? (txHash.substring ? txHash.substring(0,10)+'...' : txHash) : 'pending'}`);
      window.dispatchEvent(new Event('market:updated'));
      fetchListings();
      closeTradeModal();
      
    } catch (e) {
      console.error('❌ Trade failed:', e);
      
      // User-friendly error messages
      if (e.code === 4001) {
        alert('Transaction rejected by user');
      } else if (e.message?.includes('MetaMask')) {
        alert('MetaMask error: ' + e.message);
      } else {
        alert(e.response?.data?.error || e.message || 'Trade failed');
      }
    }
  };
  return (
    <div className="page-shell">
      <section className="page-hero fade-in-up">
        <span className="page-hero__badge">
          <span role="img" aria-hidden="true">
            🪐
          </span>
          Marketplace
        </span>
        <h1 className="gradient-title">Săn vật phẩm giới hạn trên chuỗi.</h1>
        <p className="page-hero__text">
          Kết hợp NFT và item in-game để nâng cấp tàu chiến. Mỗi vật phẩm đều có chỉ số thực, có thể giao dịch trực tiếp
          trên blockchain và mang vào trận chiến ngay lập tức.
        </p>
        <div className="page-hero__actions">
          <button type="button" className="ui-btn ui-btn--primary">
            Mua ngay
          </button>
          <button type="button" className="ui-btn ui-btn--ghost">
            Tìm hiểu smart contract
          </button>
        </div>
      </section>

      {/* MetaMask Wallet Connection */}
      <WalletConnect />

      {isConnected && (
        <div style={{ 
          background: 'rgba(34, 197, 94, 0.1)', 
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#22c55e' }}>
            ✅ Wallet connected! Your trades will be recorded on blockchain with address: {account?.slice(0, 6)}...{account?.slice(-4)}
          </p>
        </div>
      )}

      <section className="page-grid stagger">
        {featuredDrops.map((drop) => (
          <article
            key={drop.id}
            className="page-card item-card"
            style={{ "--card-accent": drop.accent }}
          >
            <div className="item-card__meta">
              <span className="chip chip--accent">{drop.rarity}</span>
              <span className="chip">Kho: {drop.stock}</span>
            </div>
            <h3>{drop.name}</h3>
            <div className="metric-value">{drop.price}</div>
            <button type="button" className="ui-btn ui-btn--primary">
              Thêm vào giỏ
            </button>
          </article>
        ))}
      </section>

      <section className="page-grid">
        <div className="page-card">
          <h3>Marketplace</h3>
          <p className="page-hero__text">Mua đồ người chơi khác rao bán.</p>
          <div className="list-card">
            {loading ? (
              <div>Loading...</div>
            ) : listings.length === 0 ? (
              <div className="muted">No active listings</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {listings.map(l => (
                  <article key={l.listingId} className="page-card" style={{ padding: 12 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {/* image / placeholder adapts to theme */}
                        <div style={{ width: 72, height: 72, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#0b1220' : '#f3f4f6' }}>
                          {getFullImageUrl(l.inventoryItem?.item?.itemImage) ? (
                              <img src={getFullImageUrl(l.inventoryItem.item.itemImage)} alt="item" loading="lazy" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                            ) : (
                              <div style={{ color: isDark ? '#fff' : '#111827', fontSize: 12 }}>{l.inventoryItem?.item?.itemName?.slice(0,2) || '—'}</div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <strong style={{ color: isDark ? '#fff' : '#111827' }}>{l.inventoryItem?.item?.itemName || l.itemHash.slice(0,12) + '…'}</strong>
                            <span style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>
                              {l.inventoryItem?.item?.itemTier || l.tier || '—'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280', marginTop: 6 }}>{l.seller?.playername || l.seller?.username || '—'}</div>
                          {!l.seller?.walletAddress && (
                            <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              ⚠️ Seller wallet not connected
                            </div>
                          )}
                          <div style={{ fontSize: 12, color: isDark ? '#d1d5db' : '#374151', marginTop: 8 }}>
                            Wanted: {l.wantedItem?.name || 'Any'} {l.wantedItem ? `(Tier: ${l.wantedItem.rarity})` : ''}
                          </div>
                          <div style={{ marginTop: 8, fontSize: 11, color: isDark ? '#9ca3af' : '#6b7280', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontFamily: 'monospace', opacity: 0.85 }}>{(l.itemHash || '').substring(0, 16)}{(l.itemHash || '').length > 16 ? '…' : ''}</span>
                            <button
                              className="ui-btn ui-btn--ghost"
                              style={{ fontSize: 11, padding: '4px 8px' }}
                              onClick={() => setViewModal({ open: true, itemHash: l.itemHash || '', itemName: l.inventoryItem?.item?.itemName || '' })}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            className="ui-btn ui-btn--primary"
                            disabled={!l.seller?.walletAddress}
                            title={!l.seller?.walletAddress ? 'Seller must connect wallet to enable blockchain trading' : 'Trade item'}
                            onClick={async () => {
                              if (!user) return alert('Please sign in to trade');
                              if (!l.seller?.walletAddress) {
                                return alert('Seller has not connected their wallet yet. Please contact seller to link their wallet for blockchain trading.');
                              }
                              // open trade modal for buyer to pick an item from their inventory
                              setTradeModal({ open: true, listing: l, buyerItems: [], selectedItemId: null, loading: true });
                              try {
                                const r = await axios.get(`/api/inventory/${user.username}`);
                                const items = (r.data.inventory || []).filter(ii => !ii.inMarket);
                                // if listing wants a specific item, filter to those itemId
                                const wantedId = l.wantedItem ? l.wantedItem.itemId : null;
                                const filtered = wantedId ? items.filter(ii => ii.item && ii.item.itemId === wantedId) : items;
                                setTradeModal(prev => ({ ...prev, buyerItems: filtered, loading: false }));
                              } catch (e) {
                                console.error('Failed to load your inventory', e);
                                setTradeModal(prev => ({ ...prev, buyerItems: [], loading: false }));
                              }
                            }}
                          >
                            Trade
                          </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="page-grid">
        <div className="page-card">
          <h3>Gói tăng tốc</h3>
          <p className="page-hero__text">Kết hợp booster và buff giúp bạn leo rank nhanh hơn.</p>
          <div className="stagger">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="settings-item">
                <div>
                  <strong>{bundle.title}</strong>
                  <p>{bundle.desc}</p>
                </div>
                <div>
                  <div className="metric-value" style={{ fontSize: "1.2rem" }}>
                    {bundle.price}
                  </div>
                  <button type="button" className="ui-btn ui-btn--ghost" style={{ marginTop: 8 }}>
                    Mua gói
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="page-card">
          <h3>Hoạt động on-chain</h3>
          <p className="page-hero__text">Giao dịch mới nhất từ cộng đồng.</p>
          <div className="list-card" style={{ border: "none", boxShadow: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Người chơi</th>
                  <th>Vật phẩm</th>
                  <th>Thời gian</th>
                  <th>Tx</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((row) => (
                  <tr key={row.tx}>
                    <td>{row.player}</td>
                    <td>{row.item}</td>
                    <td>{row.time}</td>
                    <td>
                      <span className="chip chip--accent">{row.tx}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      {viewModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80 }}>
          <div style={{ width: 520, background: isDark ? '#0b1220' : '#fff', borderRadius: 8, padding: 20, color: isDark ? '#e5e7eb' : '#111827' }}>
            <h3 style={{ marginTop: 0 }}>{viewModal.itemName || 'Item details'}</h3>
            <p style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#444' }}>Full item hash (copy to clipboard):</p>
            <div style={{ fontFamily: 'monospace', background: isDark ? '#071022' : '#f6f6f8', padding: 12, borderRadius: 6, wordBreak: 'break-all' }}>{viewModal.itemHash}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="ui-btn ui-btn--ghost" onClick={closeViewModal}>Close</button>
              <button className="ui-btn ui-btn--primary" onClick={handleCopyHash}>{copySuccess ? 'Copied!' : 'Copy'}</button>
            </div>
          </div>
        </div>
      )}
      {tradeModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80 }}>
          <div style={{ width: 720, maxHeight: '80vh', overflowY: 'auto', background: isDark ? '#0b1220' : '#fff', borderRadius: 8, padding: 20, color: isDark ? '#e5e7eb' : '#111827' }}>
            <h3 style={{ marginTop: 0 }}>Choose an item to trade</h3>
            <p style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#444' }}>{tradeModal.listing?.inventoryItem?.item?.itemName} — select one of your items to offer in exchange.</p>
            <div style={{ marginTop: 12 }}>
              {tradeModal.loading ? (
                <div>Loading your inventory…</div>
              ) : tradeModal.buyerItems.length === 0 ? (
                <div className="muted">No eligible items found in your inventory.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {tradeModal.buyerItems.map(ii => (
                    <label key={ii.inventoryItemId} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8, border: tradeModal.selectedItemId === ii.inventoryItemId ? '1px solid #0b74de' : '1px solid #eee', borderRadius: 6 }}>
                      <input type="radio" name="trade-item" checked={tradeModal.selectedItemId === ii.inventoryItemId} onChange={() => setTradeModal(prev => ({ ...prev, selectedItemId: ii.inventoryItemId }))} />
                      <div style={{ width: 56, height: 56, background: '#0b1220', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getFullImageUrl(ii.item?.itemImage) ? (
                          <img src={getFullImageUrl(ii.item.itemImage)} alt="item" loading="lazy" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                        ) : (
                          <div style={{ color: '#fff' }}>{ii.item?.itemName?.slice(0,2) || '—'}</div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{ii.item?.itemName || ii.itemHash}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>Tier: {ii.item?.itemTier || '—'}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>Obtained: {new Date(ii.obtainedAt).toLocaleString()}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {tradeModal.selectedItemId && isConnected && (
              <div style={{ 
                marginTop: 16, 
                padding: 12, 
                background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 6,
                fontSize: 12,
                color: isDark ? '#93c5fd' : '#1e40af'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span>⛽</span>
                  <strong>Gas Fee Notice</strong>
                </div>
                <div>
                  You will pay the blockchain gas fee for this transaction from your MetaMask wallet. Estimated: ~0.001-0.003 ETH
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="ui-btn ui-btn--ghost" onClick={closeTradeModal}>Cancel</button>
              <button className="ui-btn ui-btn--primary" disabled={!tradeModal.selectedItemId} onClick={confirmTrade}>Confirm trade</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
