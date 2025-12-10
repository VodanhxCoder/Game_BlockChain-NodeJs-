import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../../../hooks/usePageTitle';
import axios from 'axios';
import MediaPicker from "../../../components/MediaPicker"; // Import MediaPicker component

// Use import.meta.env for Vite or fallback to empty string
const API_BASE_URL = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL || '' : '';

export default function ItemManagement() {
  usePageTitle('Item Management');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterRarity, setFilterRarity] = useState("all");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    rarity: "Common",
    dropRate: 0,
    imageUrl: "",
    active: true,
  });

  // Fetch items from backend
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/items');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      if (error.response?.status === 401) {
        alert('Session expired or unauthorized. Please log in as admin.');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        alert('Access denied. Admin privileges required.');
      } else {
        alert('Failed to load items. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = filterRarity === "all" || item.rarity === filterRarity;
    return matchesSearch && matchesRarity;
  });

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      rarity: item.rarity,
      dropRate: item.dropRate,
      imageUrl: item.imageUrl || "",
      active: item.active !== undefined ? item.active : true,
    });
    setShowEditModal(true);
  };

  const confirmSave = async () => {
    if (!formData.name || formData.name.trim().length < 3) {
      alert('Item name must be at least 3 characters');
      return;
    }

    if (formData.dropRate < 0 || formData.dropRate > 100) {
      alert('Drop rate must be between 0 and 100');
      return;
    }

    try {
      setSaving(true);
      await axios.put(`/api/admin/items/${selectedItem.itemId}`, {
        name: formData.name.trim(),
        imageUrl: formData.imageUrl || null,
        rarity: formData.rarity,
        dropRate: parseFloat(formData.dropRate),
        active: formData.active
      });

      // Refresh items list
      await fetchItems();
      setShowEditModal(false);
      setSelectedItem(null);
      alert('Item updated successfully!');
    } catch (error) {
      console.error('Error updating item:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please log in again.');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        alert('Access denied. Admin privileges required.');
      } else {
        alert(error.response?.data?.error || 'Failed to update item');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!formData.name || formData.name.trim().length < 3) {
      alert('Item name must be at least 3 characters');
      return;
    }

    if (formData.dropRate < 0 || formData.dropRate > 100) {
      alert('Drop rate must be between 0 and 100');
      return;
    }

    try {
      setSaving(true);
      const newItem = {
        name: formData.name.trim(),
        imageUrl: formData.imageUrl || null,
        rarity: formData.rarity,
        dropRate: parseFloat(formData.dropRate),
        active: formData.active,
      };

      await axios.post('/api/admin/items', newItem);

      // Refresh items list
      await fetchItems();
      setShowEditModal(false);
      setFormData({
        name: "",
        rarity: "Common",
        dropRate: 0,
        imageUrl: "",
        active: true,
      });
      alert('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please log in again.');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        alert('Access denied. Admin privileges required.');
      } else {
        alert(error.response?.data?.error || 'Failed to add item');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (imageUrl) => {
    setFormData({ ...formData, imageUrl });
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-header__title">Quản lý vật phẩm</h1>
        <div className="admin-page-header__actions">
          <button 
            className="admin-btn admin-btn--primary" 
            onClick={() => {
              setSelectedItem(null);
              setFormData({
                name: "",
                rarity: "Common",
                dropRate: 0,
                imageUrl: "",
                active: true,
              });
              setShowEditModal(true);
            }}
          >
            Thêm vật phẩm mới
          </button>
          <button 
            className="admin-btn admin-btn--secondary" 
            onClick={async () => {
              try {
                const response = await axios.post('/api/admin/populate-drop-pool');
                alert(response.data.message || 'Drop pool populated successfully!');
              } catch (error) {
                console.error('Error populating drop pool:', error);
                alert(error.response?.data?.error || 'Failed to populate drop pool.');
              }
            }}
          >
            Populate Drop Pool
          </button>
          <select
            className="admin-form-select"
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value)}
            style={{ width: "150px" }}
          >
            <option value="all">Tất cả</option>
            <option value="Common">Common</option>
            <option value="Rare">Rare</option>
            <option value="Legendary">Legendary</option>
          </select>
          <div className="admin-search">
            <svg className="admin-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              className="admin-search__input"
              placeholder="Tìm kiếm vật phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vật phẩm</th>
                <th>Độ hiếm</th>
                <th>Drop Rate (%)</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Không tìm thấy vật phẩm nào
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const safeDropRate = item.dropRate !== null && item.dropRate !== undefined ? item.dropRate.toFixed(2) : 'N/A';
                  const safeActive = item.active !== null && item.active !== undefined ? item.active : true;

                  return (
                    <tr key={item.itemId}>
                      <td data-label="Vật phẩm">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          {item.imageUrl && (
                            <img
                              src={`${API_BASE_URL.replace(/\/+$/, '')}/${item.imageUrl.replace(/^\/+/, '')}`}
                              alt={item.name}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                          )}
                          <span style={{ fontWeight: 600 }}>{item.name}</span>
                        </div>
                      </td>
                      <td data-label="Độ hiếm">
                        <span className={`admin-badge admin-badge--${item.rarity.toLowerCase()}`}>
                          {item.rarity.toUpperCase()}
                        </span>
                      </td>
                      <td data-label="Drop Rate">{safeDropRate}%</td>
                      <td data-label="Trạng thái">
                        <span className={`admin-badge admin-badge--${safeActive ? 'success' : 'warning'}`}>
                          {safeActive ? 'Hoạt động' : 'Tắt'}
                        </span>
                      </td>
                      <td data-label="Hành động">
                        <div className="admin-actions">
                          <button
                            className="admin-btn admin-btn--secondary admin-btn--small"
                            onClick={() => handleEdit(item)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Sửa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showEditModal && (
        <div className="admin-modal-overlay" onClick={() => !saving && setShowEditModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">{selectedItem ? 'Chỉnh sửa vật phẩm' : 'Thêm vật phẩm mới'}</h3>
              <button className="admin-modal__close" onClick={() => !saving && setShowEditModal(false)} disabled={saving}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-group">
                <label className="admin-form-label">Tên vật phẩm *</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên vật phẩm (tối thiểu 3 ký tự)"
                  disabled={saving}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Hình ảnh</label>
                <MediaPicker
                  value={formData.imageUrl}
                  onSelect={handleImageSelect}
                  placeholder="Chọn hình ảnh"
                  disabled={saving}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Độ hiếm *</label>
                  <select
                    className="admin-form-select"
                    value={formData.rarity}
                    onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                    disabled={saving}
                  >
                    <option value="Common">Common</option>
                    <option value="Rare">Rare</option>
                    <option value="Legendary">Legendary</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Drop Rate (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="admin-form-input"
                    value={formData.dropRate}
                    onChange={(e) => setFormData({ ...formData, dropRate: parseFloat(e.target.value) || 0 })}
                    placeholder="0.0 - 100.0"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    disabled={saving}
                    style={{ width: 'auto' }}
                  />
                  Kích hoạt vật phẩm (có thể rơi trong game)
                </label>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Bỏ chọn để tạm thời vô hiệu hóa vật phẩm này khỏi drop pool
                </p>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button 
                className="admin-btn admin-btn--secondary" 
                onClick={() => setShowEditModal(false)}
                disabled={saving}
              >
                Hủy
              </button>
              <button 
                className="admin-btn admin-btn--primary" 
                onClick={selectedItem ? confirmSave : handleAddItem}
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : (selectedItem ? 'Lưu thay đổi' : 'Thêm vật phẩm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
