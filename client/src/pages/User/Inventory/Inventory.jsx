// Shows the player's inventory items fetched from database
import React, { useState, useEffect, useMemo } from "react";
import "../../../assets/css/Homepage.css";
import { useAuth } from '../../../context/AuthContext';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { useLanguage } from "../../../context/LanguageContext";
import WalletConnect from '../../../components/WalletConnect';
import { useTheme } from '../../../context/ThemeContext';
import { useWeb3 } from '../../../context/Web3Context';
import ProtectedImage from '../../../components/ProtectedImage';
import axios from "axios";
import { ethers } from 'ethers';
import { mapLegacyApiUrl } from '../../../services/backendHosts';

const rarityColors = {
  Legendary: "#FFD700",
  Rare: "#3B82F6",
  Common: "#6B7280"
};

const rarityLabels = {
  Legendary: "Legendary",
  Rare: "Rare",
  Common: "Common"
};

export default function Inventory() {
  const getFullImageUrl = (imgPath) => {
    if (!imgPath) return null;
    if (imgPath.startsWith('http')) return imgPath;

    if (imgPath.startsWith('/')) return mapLegacyApiUrl(imgPath);
    return mapLegacyApiUrl(`/${imgPath}`);
  };
  const { user } = useAuth();
  const { t } = useLanguage();
  const { account, isConnected } = useWeb3();
  const { isDark } = useTheme();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    byRarity: {},
    totalValue: 0
  });
  const [sortOption, setSortOption] = useState('time-desc');
  const [actionLoading, setActionLoading] = useState({});
  const [listingModal, setListingModal] = useState({ open: false, itemHash: null, wantedItemId: null });
  const [availableWantedItems, setAvailableWantedItems] = useState([]);

  // Compute sorted inventory based on user selection
  const sortedInventory = useMemo(() => {
    if (!Array.isArray(inventory)) return [];
    const arr = [...inventory];
    
    const getTier = (item) => item?.itemTier || item?.rarity;

    const tierRank = (tier) => {
      if (!tier) return 0;
      const t = String(tier);
      if (t === 'Legendary') return 3;
      if (t === 'Rare') return 2;
      if (t === 'Common') return 1;
      return 0;
    };

    switch (sortOption) {
      case 'time-asc':
        arr.sort((a, b) => new Date(a.obtainedAt) - new Date(b.obtainedAt));
        break;
      case 'time-desc':
        arr.sort((a, b) => new Date(b.obtainedAt) - new Date(a.obtainedAt));
        break;
      case 'tier-asc':
        arr.sort((a, b) => tierRank(getTier(a.item)) - tierRank(getTier(b.item)));
        break;
      case 'tier-desc':
        arr.sort((a, b) => tierRank(getTier(b.item)) - tierRank(getTier(a.item)));
        break;
      default:
        break;
    }
    return arr;
  }, [inventory, sortOption]);

  useEffect(() => {
    if (user?.username) {
      fetchInventory();
    } else {
      setLoading(false);
      setError("Please log in to view your inventory");
    }
  }, [user]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/inventory/${user.username}`);
      const inventoryData = response.data.inventory || [];
      setInventory(inventoryData);

      // Calculate stats
      const byRarity = {};
      let totalValue = 0;
      inventoryData.forEach(item => {
        if (item.item) {
          const rarity = item.item.itemTier || item.item.rarity;
          byRarity[rarity] = (byRarity[rarity] || 0) + 1;
        }
      });

      setStats({
        totalItems: response.data.totalItems || 0,
        byRarity,
        totalValue
      });
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setError(err.response?.data?.error || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleListOnShop = async (itemHash) => {
    // Open the listing modal and load available wanted-items
    if (!user?.username) {
      alert('Please sign in');
      return;
    }
    setListingModal({ open: true, itemHash, wantedItemId: null });
    try {
      const r = await axios.get('/api/market/items');
      setAvailableWantedItems(r.data.items || []);
    } catch (e) {
      console.error('Failed to load wanted-items', e);
      setAvailableWantedItems([]);
    }
  };

  const confirmListOnShop = async () => {
    const { itemHash, wantedItemId } = listingModal;
    if (!user?.username) {
      alert('Please sign in');
      return;
    }
    if (!wantedItemId) {
      alert('Please choose the item you want in exchange');
      return;
    }
    setActionLoading(prev => ({ ...prev, [itemHash]: true }));
    try {
      // Step 1: Create the listing first (without signature) to get listingId
      const createResp = await axios.post('/api/market/list', {
        username: user.username,
        itemHash,
        wantedItemId
      });
      
      const listingId = createResp.data.listingId;
      console.log('[OK] Listing created with ID:', listingId);
      
      // Step 2: If wallet connected, create and save the contract-compatible signature
      if (isConnected && account && listingId) {
        try {
          const sellerSignatureTimestamp = Date.now();
          
          // Get contract address from backend
          const configResp = await axios.get('/api/config');
          const contractAddress = configResp.data.contractAddress;
          
          if (!contractAddress) {
            console.warn('[WARN]  Contract address not available, listing created without signature');
            return;
          }
          
          console.log('📝 Creating signature for listing...');
          console.log('   Contract:', contractAddress);
          console.log('   Listing ID:', listingId);
          console.log('   Timestamp:', sellerSignatureTimestamp);
          
          // Create contract-compatible message: keccak256(sellerItemHash, listingId, timestamp, contractAddress)
          const sellerHashBytes = '0x' + itemHash;
          const messageHash = ethers.solidityPackedKeccak256(
            ['bytes32', 'uint256', 'uint256', 'address'],
            [sellerHashBytes, listingId, sellerSignatureTimestamp, contractAddress]
          );
          
          console.log('   Message hash:', messageHash);
          
          // Sign the hash using eth_sign (or personal_sign with hex string)
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const sellerSignature = await signer.signMessage(ethers.getBytes(messageHash));
          
          console.log('[OK] Signature obtained:', sellerSignature.substring(0, 20) + '...');
          
          // Update the listing with the signature
          await axios.patch('/api/market/update-signature', {
            listingId,
            sellerSignature,
            sellerSignatureTimestamp
          });
          
          console.log('[OK] Listing updated with seller signature');
        } catch (signErr) {
          console.warn('Seller signature failed or rejected:', signErr);
          alert('Signature rejected. Your item is listed but buyer-initiated trades won\'t work until you provide a signature.');
        }
      }
      
      // notify marketplace components so they can refresh without a full reload
      try { window.dispatchEvent(new Event('market:updated')); } catch (e) { /* ignore */ }
      setListingModal({ open: false, itemHash: null, wantedItemId: null });
      await fetchInventory();
    } catch (err) {
      console.error('Failed to list item:', err);
      alert(err.response?.data?.error || 'Failed to list item');
    } finally {
      setActionLoading(prev => ({ ...prev, [itemHash]: false }));
    }
  };

  const cancelListingModal = () => setListingModal({ open: false, itemHash: null, wantedItemId: null });

  const handleUnlistFromShop = async (itemHash) => {
    if (!user?.username) {
      alert('Please sign in');
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [itemHash]: true }));
    try {
      // Find listing by itemHash (we need listingId, so fetch listings first or use itemHash)
      // For simplicity, we'll call cancel with a pseudo-lookup or extend API
      // Current API expects listingId. Let's fetch the listing by itemHash first:
      const listingsRes = await axios.get('/api/market/listings?limit=100');
      const listing = listingsRes.data.listings.find(l => l.itemHash === itemHash && l.seller?.username === user.username);
      
      if (!listing) {
        alert('Listing not found');
        setActionLoading(prev => ({ ...prev, [itemHash]: false }));
        return;
      }

      await axios.post('/api/market/cancel', {
        listingId: listing.listingId,
        username: user.username
      });
      // refresh marketplace views silently
      try { window.dispatchEvent(new Event('market:updated')); } catch (e) { /* ignore */ }
      await fetchInventory();
    } catch (err) {
      console.error('Failed to unlist item:', err);
      alert(err.response?.data?.error || 'Failed to unlist item');
    } finally {
      setActionLoading(prev => ({ ...prev, [itemHash]: false }));
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <section className="page-hero fade-in-up">
          <h1 className="gradient-title">{t("inventory.loading")}</h1>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <section className="page-hero fade-in-up">
          <h1 className="gradient-title">{t("inventory.title")}</h1>
          <div className="page-card" style={{ marginTop: 20, padding: 20, textAlign: 'center' }}>
            <p style={{ color: '#ff6b6b' }}>{error}</p>
            {!user && (
              <button 
                type="button" 
                className="ui-btn ui-btn--primary" 
                onClick={() => window.location.href = '/signin'}
                style={{ marginTop: 16 }}
              >
                Go to Login
              </button>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="page-hero fade-in-up">
        <span className="page-hero__badge">
          <span role="img" aria-hidden="true">🎒</span>
          {t("inventory.title")}
        </span>
        <h1 className="gradient-title">{t("inventory.subtitle")}</h1>
        <p className="page-hero__text">
          {t("inventory.description")}
        </p>
      </section>

      {/* MetaMask Wallet Connection */}
      <WalletConnect />

      {isConnected && (
        <div style={{ 
          background: 'rgba(139, 92, 246, 0.1)', 
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#a78bfa' }}>
            🎨 Your items can be minted as NFTs on blockchain when listed for trade!
          </p>
        </div>
      )}

      {/* Stats Overview */}
      <section className="page-grid">
        <article className="page-card">
          <h3>{t("inventory.totalItems")}</h3>
          <div className="metric-value">{stats.totalItems}</div>
          <div className="metric-label">Collected from drops</div>
        </article>

        <article className="page-card">
          <h3>{t("inventory.totalValue")}</h3>
          <div className="metric-value">{stats.totalItems} Items</div>
          <div className="metric-label">In your collection</div>
        </article>

        <article className="page-card">
          <h3>{t("inventory.rarestItem")}</h3>
          <div className="metric-value">
            {stats.byRarity.Legendary ? `${stats.byRarity.Legendary} Legendary` :
             stats.byRarity.Rare ? `${stats.byRarity.Rare} Rare` : 
             stats.byRarity.Common ? `${stats.byRarity.Common} Common` : 'None yet'}
          </div>
          <div className="metric-label">Keep collecting!</div>
        </article>
      </section>

      {/* Inventory Grid */}
      <section className="page-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3 style={{ margin: 0 }}>{t("inventory.yourItems")} ({inventory.length})</h3>
            <select className="sort-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              <option value="time-desc">Newest first</option>
              <option value="time-asc">Oldest first</option>
              <option value="tier-desc">Tier: High -> Low</option>
              <option value="tier-asc">Tier: Low -> High</option>
            </select>
          </div>
          <button 
            type="button" 
            className="ui-btn ui-btn--ghost"
            onClick={fetchInventory}
          >
            {t("inventory.refresh")}
          </button>
        </div>

        {inventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ fontSize: 18, marginBottom: 12 }}>{t("inventory.noItems")}</p>
            <p className="metric-label">{t("inventory.playToCollect")}</p>
            <button 
              type="button" 
              className="ui-btn ui-btn--primary"
              onClick={() => window.location.href = '/H'}
              style={{ marginTop: 16 }}
            >
              {t("inventory.startPlaying")}
            </button>
          </div>
        ) : (
          <div className="inventory-scroll" style={{
            maxHeight: '60vh',
            boxSizing: 'border-box',
            paddingRight: 8
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: 12 
            }}>
            {sortedInventory.map((inventoryItem) => {
              const item = inventoryItem.item;
              if (!item) return null;
              const tier = item.itemTier || item.rarity;
              
              return (
                <div 
                  key={inventoryItem.inventoryItemId} 
                  className="page-card"
                  style={{ 
                    padding: 16,
                    borderLeft: `3px solid ${rarityColors[tier] || '#6B7280'}`
                  }}
                >
                  {/* Item image / GIF (if available) */}
                  {(() => {
                    // Support multiple possible image fields coming from different APIs
                    const imgPath =
                      item.imageUrl ||
                      item.image ||
                      item.itemImage ||
                      item.image_path ||
                      item.imagePath ||
                      inventoryItem.imageUrl ||
                      inventoryItem.image || '';

                    const imageSrc = getFullImageUrl(imgPath);
                    if (imageSrc) {
                      return (
                        <div style={{ textAlign: 'center', marginBottom: 8 }}>
                          <a href={imageSrc} target="_blank" rel="noreferrer">
                            <ProtectedImage
                              src={imageSrc}
                              alt={item.itemName || item.name || 'item'}
                              style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }}
                            />
                          </a>
                        </div>
                      );
                    }

                    // small placeholder when no image
                    return (
                      <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <div style={{ width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#f3f4f6', color: '#9ca3af', margin: '0 auto' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24 }}>🖼️</div>
                            <div style={{ fontSize: 10, marginTop: 4 }}>No image</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <span 
                      className="chip chip--accent"
                      style={{ backgroundColor: (rarityColors[tier] || '#6B7280') + '20', color: rarityColors[tier] || '#6B7280', fontSize: '0.7rem', padding: '2px 8px' }}
                    >
                      {rarityLabels[tier] || tier}
                    </span>
                  </div>
                  
                  <h4 style={{ marginBottom: 4, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.itemName}>{item.itemName}</h4>
                  <p className="metric-label" style={{ fontSize: 12, marginBottom: 8 }}>
                    {tier} tier item
                  </p>
                  
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
                    <div>📅 {formatDate(inventoryItem.obtainedAt)}</div>
                    {inventoryItem.itemHash && (
                      <div style={{ fontSize: 10, marginTop: 2, fontFamily: 'monospace', opacity: 0.6 }}>
                        🔐 {inventoryItem.itemHash.substring(0, 8)}...
                      </div>
                    )}
                  </div>
                  
                  {inventoryItem.inMarket ? (
                    <button 
                      type="button" 
                      className="ui-btn ui-btn--ghost"
                      style={{ width: '100%', marginTop: 8, fontSize: 12 }}
                      onClick={() => handleUnlistFromShop(inventoryItem.itemHash)}
                      disabled={actionLoading[inventoryItem.itemHash]}
                    >
                      {actionLoading[inventoryItem.itemHash] ? '⏳ Processing...' : `🏪 ${t("inventory.unlistFromShop")}`}
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="ui-btn ui-btn--primary"
                      style={{ width: '100%', marginTop: 8, fontSize: 12 }}
                      onClick={() => handleListOnShop(inventoryItem.itemHash)}
                      disabled={actionLoading[inventoryItem.itemHash]}
                    >
                      {actionLoading[inventoryItem.itemHash] ? '⏳ Listing...' : `🛒 ${t("inventory.listOnShop")}`}
                    </button>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}
      </section>

      {listingModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ width: 560, maxWidth: '96%', background: isDark ? '#0b1220' : '#fff', borderRadius: 8, padding: 20, color: isDark ? '#e5e7eb' : '#111827' }}>
            <h3 style={{ marginTop: 0 }}>List item on Shop</h3>
            <p style={{ marginTop: 6, color: isDark ? '#9ca3af' : '#444' }}>Choose the item you want in exchange (wanted item).</p>

            <div style={{ display: 'flex', gap: 16, marginTop: 12, alignItems: 'flex-start' }}>
              {/* Left: image preview of the selected inventory item */}
              <div style={{ width: 160, flex: '0 0 160px' }}>
                {(() => {
                  const sel = inventory.find(ii => ii.itemHash === listingModal.itemHash) || {};
                  const itm = sel.item || {};
                  const imgPath = itm.imageUrl || itm.image || itm.itemImage || sel.imageUrl || '';
                  const src = getFullImageUrl(imgPath);
                  if (src) {
                    return (
                      <a href={src} target="_blank" rel="noreferrer">
                        <img src={src} alt={itm.itemName || itm.name || 'item'} style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                      </a>
                    );
                  }
                  return (
                    <div style={{ width: 160, height: 160, borderRadius: 8, background: isDark ? '#071022' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#9ca3af' : '#9ca3af' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 32 }}>🖼️</div>
                        <div style={{ fontSize: 12, marginTop: 8 }}>No image</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right: select wanted item */}
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, color: isDark ? '#e5e7eb' : '#111827' }}>Wanted item</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {availableWantedItems.length === 0 ? (
                    <div style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>No wanted items available</div>
                  ) : (
                    availableWantedItems.map(it => {
                      const img = it.imageUrl || it.image || it.itemImage || '';
                      const src = getFullImageUrl(img);
                      const selected = listingModal.wantedItemId === it.itemId;
                      return (
                        <label key={it.itemId} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, borderRadius: 8, cursor: 'pointer', border: selected ? `2px solid ${isDark ? '#2563eb' : '#0b74de'}` : `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, background: selected ? (isDark ? '#06172b' : '#eef6ff') : (isDark ? '#071022' : '#fff') }}>
                          <input type="radio" name="wanted-item" value={it.itemId} checked={selected} onChange={() => setListingModal(s => ({ ...s, wantedItemId: it.itemId }))} style={{ display: 'none' }} />
                          <div style={{ width: '100%', height: 84, borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#071022' : '#f3f4f6' }}>
                            {src ? (
                              <img src={src} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ color: isDark ? '#9ca3af' : '#9ca3af' }}>{it.name?.slice(0,2) || '—'}</div>
                            )}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#e5e7eb' : '#111827', textAlign: 'center' }}>{it.name}</div>
                          <div style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center' }}>{it.rarity}</div>
                        </label>
                      );
                    })
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button className="ui-btn ui-btn--ghost" onClick={cancelListingModal}>Cancel</button>
                  <button className="ui-btn ui-btn--primary" onClick={confirmListOnShop}>Confirm List</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rarity Breakdown */}
      {Object.keys(stats.byRarity).length > 0 && (
        <section className="page-card">
          <h3 style={{ marginBottom: 16 }}>{t("inventory.collectionByRarity")}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            {Object.entries(stats.byRarity).map(([rarity, count]) => (
              <div 
                key={rarity}
                style={{ 
                  textAlign: 'center', 
                  padding: 12, 
                  borderRadius: 8,
                  backgroundColor: rarityColors[rarity] + '10',
                  border: `1px solid ${rarityColors[rarity]}30`
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 700, color: rarityColors[rarity] }}>{count}</div>
                <div style={{ fontSize: 12, color: rarityColors[rarity] }}>{rarityLabels[rarity]}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
