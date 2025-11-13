import React, { useState } from "react";

// Mock data
const MOCK_ITEMS = [
  {
    id: 1,
    name: "Legendary Sword",
    itemName: "Legendary Sword",
    rarity: "legendary",
    dropRate: 0.5,
    level: 10,
    image: "⚔️",
    description: "A powerful legendary sword with immense damage",
  },
  {
    id: 2,
    name: "Epic Shield",
    itemName: "Epic Shield",
    rarity: "epic",
    dropRate: 2.5,
    level: 8,
    image: "🛡️",
    description: "An epic shield that provides strong defense",
  },
  {
    id: 3,
    name: "Rare Potion",
    itemName: "Rare Potion",
    rarity: "rare",
    dropRate: 8.0,
    level: 5,
    image: "🧪",
    description: "A rare potion that restores health",
  },
  {
    id: 4,
    name: "Common Gem",
    itemName: "Common Gem",
    rarity: "common",
    dropRate: 25.0,
    level: 1,
    image: "💎",
    description: "A common gem found throughout the game",
  },
  {
    id: 5,
    name: "Epic Helmet",
    itemName: "Epic Helmet",
    rarity: "epic",
    dropRate: 3.0,
    level: 7,
    image: "⛑️",
    description: "An epic helmet with great protection",
  },
  {
    id: 6,
    name: "Rare Boots",
    itemName: "Rare Boots",
    rarity: "rare",
    dropRate: 10.0,
    level: 4,
    image: "👢",
    description: "Rare boots that increase movement speed",
  },
];

export default function ItemManagement() {
  const [items, setItems] = useState(MOCK_ITEMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filterRarity, setFilterRarity] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    rarity: "common",
    dropRate: 0,
    level: 1,
    image: "",
    description: "",
  });

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
      level: item.level,
      image: item.image,
      description: item.description,
    });
    setShowEditModal(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setFormData({
      name: "",
      rarity: "common",
      dropRate: 0,
      level: 1,
      image: "",
      description: "",
    });
    setShowEditModal(true);
  };

  const confirmSave = () => {
    if (selectedItem) {
      // Edit existing item
      setItems(
        items.map((item) =>
          item.id === selectedItem.id
            ? { ...item, ...formData, itemName: formData.name }
            : item
        )
      );
    } else {
      // Add new item
      setItems([
        ...items,
        {
          id: Date.now(),
          ...formData,
          itemName: formData.name,
        },
      ]);
    }
    setShowEditModal(false);
    setSelectedItem(null);
  };

  const confirmDelete = () => {
    setItems(items.filter((item) => item.id !== selectedItem.id));
    setShowDeleteModal(false);
    setSelectedItem(null);
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-header__title">Quản lý vật phẩm</h1>
        <div className="admin-page-header__actions">
          <select
            className="admin-form-select"
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value)}
            style={{ width: "150px" }}
          >
            <option value="all">Tất cả</option>
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
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
          <button className="admin-btn admin-btn--primary" onClick={handleAddNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Thêm vật phẩm
          </button>
        </div>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Vật phẩm</th>
              <th>Độ hiếm</th>
              <th>Drop Rate (%)</th>
              <th>Level yêu cầu</th>
              <th>Mô tả</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td data-label="Vật phẩm">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "2rem" }}>{item.image}</span>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                  </div>
                </td>
                <td data-label="Độ hiếm">
                  <span className={`admin-badge admin-badge--${item.rarity}`}>
                    {item.rarity.toUpperCase()}
                  </span>
                </td>
                <td data-label="Drop Rate">{item.dropRate.toFixed(2)}%</td>
                <td data-label="Level yêu cầu">Level {item.level}</td>
                <td data-label="Mô tả" style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.description}
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
                    <button
                      className="admin-btn admin-btn--danger admin-btn--small"
                      onClick={() => handleDelete(item)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {showEditModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">
                {selectedItem ? "Chỉnh sửa vật phẩm" : "Thêm vật phẩm mới"}
              </h3>
              <button className="admin-modal__close" onClick={() => setShowEditModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-group">
                <label className="admin-form-label">Tên vật phẩm</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên vật phẩm"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Hình ảnh (Emoji)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="Nhập emoji (⚔️, 🛡️, 🧪...)"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Độ hiếm</label>
                  <select
                    className="admin-form-select"
                    value={formData.rarity}
                    onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                  >
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Drop Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="admin-form-input"
                    value={formData.dropRate}
                    onChange={(e) => setFormData({ ...formData, dropRate: parseFloat(e.target.value) })}
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Level yêu cầu</label>
                <input
                  type="number"
                  className="admin-form-input"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                  placeholder="1"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Mô tả</label>
                <textarea
                  className="admin-form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả vật phẩm"
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setShowEditModal(false)}>
                Hủy
              </button>
              <button className="admin-btn admin-btn--primary" onClick={confirmSave}>
                {selectedItem ? "Lưu thay đổi" : "Thêm vật phẩm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedItem && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">Xóa vật phẩm</h3>
              <button className="admin-modal__close" onClick={() => setShowDeleteModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <p style={{ color: "var(--text-primary)", marginBottom: "1rem" }}>
                Bạn có chắc chắn muốn xóa vật phẩm "{selectedItem.name}"?
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </button>
              <button className="admin-btn admin-btn--danger" onClick={confirmDelete}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
