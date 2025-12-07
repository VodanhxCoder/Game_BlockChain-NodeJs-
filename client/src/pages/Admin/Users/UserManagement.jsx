import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL + "/api";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      showMessage(error.message || "Không thể tải danh sách người dùng", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInventory = async (username) => {
    try {
      setInventoryLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE}/admin/users/${username}/inventory`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }

      const data = await response.json();
      setInventory(data.inventory || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      showMessage("Không thể tải kho đồ", "error");
    } finally {
      setInventoryLoading(false);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.playername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewInventory = async (user) => {
    setSelectedUser(user);
    setShowInventoryModal(true);
    await fetchUserInventory(user.username);
  };

  const handleBanUser = (user) => {
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const confirmBan = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const isBanned = selectedUser.status === "banned";
      
      const response = await fetch(`${API_BASE}/admin/users/${selectedUser.username}/ban`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ban: !isBanned })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user status");
      }

      // Update local state
      setUsers(users.map(u => 
        u.username === selectedUser.username 
          ? { ...u, status: isBanned ? "active" : "banned" } 
          : u
      ));

      showMessage(
        isBanned ? "Đã gỡ cấm người dùng" : "Đã cấm người dùng",
        "success"
      );
    } catch (error) {
      console.error("Error updating user status:", error);
      showMessage(error.message || "Không thể cập nhật trạng thái người dùng", "error");
    } finally {
      setShowBanModal(false);
      setSelectedUser(null);
    }
  };

  const getRarityBadgeClass = (rarity) => {
    const rarityMap = {
      'Common': 'common',
      'Rare': 'rare',
      'Legendary': 'legendary'
    };
    return rarityMap[rarity] || 'common';
  };

  return (
    <div>
      {message && (
        <div className={`admin-message admin-message--${message.type}`}>
          {message.text}
        </div>
      )}

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
          <button className="admin-btn admin-btn--secondary" onClick={fetchUsers}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "3rem" }}>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Username</th>
                <th>Trạng thái</th>
                <th>Điểm cao</th>
                <th>Vật phẩm</th>
                <th>Nhà cung cấp</th>
                <th>Ngày tham gia</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2rem" }}>
                    Không tìm thấy người dùng
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.username}>
                    <td data-label="Người dùng">
                      <div className="admin-user-info">
                        <div className="admin-user-avatar">
                          {user.userImage ? (
                            <img src={user.userImage} alt={user.playername} />
                          ) : (
                            user.playername?.charAt(0) || user.username.charAt(0)
                          )}
                        </div>
                        <div className="admin-user-details">
                          <span className="admin-user-name">{user.playername || user.username}</span>
                          <span className="admin-user-email">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Username">@{user.username}</td>
                    <td data-label="Trạng thái">
                      <span className={`admin-badge admin-badge--${user.status}`}>
                        {user.status === "active" ? "Hoạt động" : user.status === "banned" ? "Bị cấm" : "Không hoạt động"}
                      </span>
                    </td>
                    <td data-label="Điểm cao">{user.highScore?.toLocaleString() || 0}</td>
                    <td data-label="Vật phẩm">{user.itemCount || 0}</td>
                    <td data-label="Nhà cung cấp">
                      <span className="admin-badge admin-badge--info">
                        {user.provider === "local" ? "Local" : user.provider === "google" ? "Google" : "GitHub"}
                      </span>
                    </td>
                    <td data-label="Ngày tham gia">
                      {user.joinDate ? new Date(user.joinDate).toLocaleDateString("vi-VN") : "N/A"}
                    </td>
                    <td data-label="Hành động">
                      <div className="admin-actions">
                        <button
                          className="admin-btn admin-btn--secondary admin-btn--small"
                          onClick={() => handleViewInventory(user)}
                        >
                          Kho đồ
                        </button>
                        {user.role !== "admin" && (
                          <button
                            className={`admin-btn admin-btn--small ${
                              user.status === "banned" ? "admin-btn--success" : "admin-btn--danger"
                            }`}
                            onClick={() => handleBanUser(user)}
                          >
                            {user.status === "banned" ? "Unban" : "Ban"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventoryModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowInventoryModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">
                Kho đồ - {selectedUser.playername || selectedUser.username}
              </h3>
              <button className="admin-modal__close" onClick={() => setShowInventoryModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="admin-modal__body">
              {inventoryLoading ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <p>Đang tải kho đồ...</p>
                </div>
              ) : inventory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                  <p>Người dùng chưa có vật phẩm nào</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Vật phẩm</th>
                      <th>Độ hiếm</th>
                      <th>Số lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.itemId}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                style={{ 
                                  width: "40px", 
                                  height: "40px", 
                                  objectFit: "contain",
                                  borderRadius: "4px"
                                }}
                              />
                            ) : (
                              <div style={{
                                width: "40px",
                                height: "40px",
                                backgroundColor: "var(--bg-tertiary)",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.5rem"
                              }}>
                                📦
                              </div>
                            )}
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-badge admin-badge--${getRarityBadgeClass(item.rarity)}`}>
                            {item.rarity}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: "600" }}>{item.quantity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
                  ? `Bạn có chắc chắn muốn gỡ cấm cho người dùng "${selectedUser.playername || selectedUser.username}"?`
                  : `Bạn có chắc chắn muốn cấm người dùng "${selectedUser.playername || selectedUser.username}"?`}
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
