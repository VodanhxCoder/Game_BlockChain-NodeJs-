import React, { useState } from "react";

// Mock data
const MOCK_USERS = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    username: "nguyenvana",
    status: "active",
    level: 12,
    score: 45600,
    items: 28,
    joinDate: "2025-09-15",
  },
  {
    id: 2,
    name: "Trần Thị B",
    email: "tranthib@example.com",
    username: "tranthib",
    status: "active",
    level: 8,
    score: 23400,
    items: 15,
    joinDate: "2025-10-20",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "levanc@example.com",
    username: "levanc",
    status: "banned",
    level: 15,
    score: 67800,
    items: 42,
    joinDate: "2025-08-10",
  },
  {
    id: 4,
    name: "Phạm Thị D",
    email: "phamthid@example.com",
    username: "phamthid",
    status: "active",
    level: 5,
    score: 12300,
    items: 8,
    joinDate: "2025-11-05",
  },
  {
    id: 5,
    name: "Hoàng Văn E",
    email: "hoangvane@example.com",
    username: "hoangvane",
    status: "active",
    level: 20,
    score: 98500,
    items: 56,
    joinDate: "2025-07-01",
  },
];

export default function UserManagement() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewInventory = (user) => {
    setSelectedUser(user);
    setShowInventoryModal(true);
  };

  const handleBanUser = (user) => {
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const confirmBan = () => {
    setUsers(
      users.map((u) =>
        u.id === selectedUser.id ? { ...u, status: u.status === "banned" ? "active" : "banned" } : u
      )
    );
    setShowBanModal(false);
    setSelectedUser(null);
  };

  // Mock inventory items
  const mockInventory = [
    { id: 1, name: "Legendary Sword", rarity: "legendary", quantity: 1, image: "⚔️" },
    { id: 2, name: "Epic Shield", rarity: "epic", quantity: 2, image: "🛡️" },
    { id: 3, name: "Rare Potion", rarity: "rare", quantity: 5, image: "🧪" },
    { id: 4, name: "Common Gem", rarity: "common", quantity: 15, image: "💎" },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-header__title">Quản lý tài khoản</h1>
        <div className="admin-page-header__actions">
          <div className="admin-search">
            <svg className="admin-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              className="admin-search__input"
              placeholder="Tìm kiếm người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="admin-btn admin-btn--primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Thêm người dùng
          </button>
        </div>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Username</th>
              <th>Trạng thái</th>
              <th>Level</th>
              <th>Điểm</th>
              <th>Vật phẩm</th>
              <th>Ngày tham gia</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td data-label="Người dùng">
                  <div className="admin-user-info">
                    <div className="admin-user-avatar">{user.name.charAt(0)}</div>
                    <div className="admin-user-details">
                      <span className="admin-user-name">{user.name}</span>
                      <span className="admin-user-email">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td data-label="Username">@{user.username}</td>
                <td data-label="Trạng thái">
                  <span className={`admin-badge admin-badge--${user.status}`}>
                    {user.status === "active" ? "Hoạt động" : "Bị cấm"}
                  </span>
                </td>
                <td data-label="Level">{user.level}</td>
                <td data-label="Điểm">{user.score.toLocaleString()}</td>
                <td data-label="Vật phẩm">{user.items}</td>
                <td data-label="Ngày tham gia">{new Date(user.joinDate).toLocaleDateString("vi-VN")}</td>
                <td data-label="Hành động">
                  <div className="admin-actions">
                    <button
                      className="admin-btn admin-btn--secondary admin-btn--small"
                      onClick={() => handleViewInventory(user)}
                    >
                      Kho đồ
                    </button>
                    <button
                      className={`admin-btn admin-btn--small ${
                        user.status === "banned" ? "admin-btn--success" : "admin-btn--danger"
                      }`}
                      onClick={() => handleBanUser(user)}
                    >
                      {user.status === "banned" ? "Unban" : "Ban"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inventory Modal */}
      {showInventoryModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowInventoryModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">Kho đồ - {selectedUser.name}</h3>
              <button className="admin-modal__close" onClick={() => setShowInventoryModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Vật phẩm</th>
                    <th>Độ hiếm</th>
                    <th>Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {mockInventory.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontSize: "2rem" }}>{item.image}</span>
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge admin-badge--${item.rarity}`}>
                          {item.rarity.toUpperCase()}
                        </span>
                      </td>
                      <td>{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setShowInventoryModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowBanModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">
                {selectedUser.status === "banned" ? "Gỡ cấm" : "Cấm"} người dùng
              </h3>
              <button className="admin-modal__close" onClick={() => setShowBanModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <p style={{ color: "var(--text-primary)", marginBottom: "1rem" }}>
                {selectedUser.status === "banned"
                  ? `Bạn có chắc chắn muốn gỡ cấm cho người dùng "${selectedUser.name}"?`
                  : `Bạn có chắc chắn muốn cấm người dùng "${selectedUser.name}"?`}
              </p>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setShowBanModal(false)}>
                Hủy
              </button>
              <button
                className={`admin-btn ${selectedUser.status === "banned" ? "admin-btn--success" : "admin-btn--danger"}`}
                onClick={confirmBan}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
