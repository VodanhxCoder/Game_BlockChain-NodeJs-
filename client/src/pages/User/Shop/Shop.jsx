// Displays featured NFT drops, power-up bundles, and recent on-chain marketplace activity.
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import WalletConnect from '../../../components/WalletConnect';
import { useWeb3 } from '../../../context/Web3Context';

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
      console.log('🔄 Starting blockchain trade...');
      
      // Step 1: Ask user to sign a message to approve the trade
      console.log('🦊 Requesting user signature for trade approval...');
      
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const sellerName = typeof tradeModal.listing.seller === 'string' 
        ? tradeModal.listing.seller 
        : (tradeModal.listing.seller?.username || tradeModal.listing.seller?.playername || 'Unknown');
      
      const message = `Approve trade:\nListing ID: ${tradeModal.listing.listingId}\nSeller: ${sellerName}\nBuyer: ${user.username}\nTimestamp: ${Date.now()}`;
      
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account],
      });
      
      console.log('✅ User approved trade with signature');
      
      // Step 2: Send approval to backend - backend will execute the trade
      console.log('📡 Submitting trade to blockchain...');
      const tradeResp = await axios.post('/api/market/execute-trade', {
        listingId: tradeModal.listing.listingId,
        buyer: user.username,
        buyerInventoryItemId: tradeModal.selectedItemId,
        buyerWallet: account,
        signature,
        message
      });
      
      const { txHash, success } = tradeResp.data;
      console.log('✅ Trade executed:', txHash);
      
      alert(`Trade successful!\nTransaction: ${txHash.substring(0, 10)}...\n\nCheck your inventory!`);
      
      // notify other parts of the app and refresh
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
                      <div style={{ width: 72, height: 72, background: '#0b1220', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {l.inventoryItem?.item?.itemImage ? (
                          <img src={l.inventoryItem.item.itemImage} alt="item" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                        ) : (
                          <div style={{ color: '#fff', fontSize: 12 }}>{l.inventoryItem?.item?.itemName?.slice(0,2) || '—'}</div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <strong>{l.inventoryItem?.item?.itemName || l.itemHash.slice(0,12) + '…'}</strong>
                          <span style={{ fontSize: 12, color: '#666' }}>
                            {l.inventoryItem?.item?.itemTier || l.tier || '—'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{l.seller?.playername || l.seller?.username || '—'}</div>
                        {!l.seller?.walletAddress && (
                          <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            ⚠️ Seller wallet not connected
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: '#444', marginTop: 8 }}>
                          Wanted: {l.wantedItem?.name || 'Any'} {l.wantedItem ? `(Tier: ${l.wantedItem.rarity})` : ''}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11, color: '#666', display: 'flex', gap: 8, alignItems: 'center' }}>
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
          <div style={{ width: 520, background: '#fff', borderRadius: 8, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>{viewModal.itemName || 'Item details'}</h3>
            <p style={{ fontSize: 12, color: '#444' }}>Full item hash (copy to clipboard):</p>
            <div style={{ fontFamily: 'monospace', background: '#f6f6f8', padding: 12, borderRadius: 6, wordBreak: 'break-all' }}>{viewModal.itemHash}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="ui-btn ui-btn--ghost" onClick={closeViewModal}>Close</button>
              <button className="ui-btn ui-btn--primary" onClick={handleCopyHash}>{copySuccess ? 'Copied!' : 'Copy'}</button>
            </div>
          </div>
        </div>
      )}
      {tradeModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80 }}>
          <div style={{ width: 720, maxHeight: '80vh', overflowY: 'auto', background: '#fff', borderRadius: 8, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Choose an item to trade</h3>
            <p style={{ fontSize: 13, color: '#444' }}>{tradeModal.listing?.inventoryItem?.item?.itemName} — select one of your items to offer in exchange.</p>
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
                        {ii.item?.itemImage ? (
                          <img src={ii.item.itemImage} alt="item" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
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
