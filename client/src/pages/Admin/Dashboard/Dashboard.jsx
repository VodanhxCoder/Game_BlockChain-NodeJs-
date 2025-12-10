import React, { useState, useEffect } from "react";
import axios from "axios";
import { usePageTitle } from "../../../hooks/usePageTitle";

export default function Dashboard() {
  usePageTitle('Admin Dashboard');
  const [stats, setStats] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get("/api/admin/dashboard/stats");
        setStats(response.data.stats);
        setRecentUsers(response.data.recentUsers);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="admin-card" style={{ padding: "3rem", textAlign: "center" }}>
        <p>Đang tải dữ liệu Dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-header__title">Dashboard</h1>
        <div className="admin-page-header__actions">
          <button className="admin-btn admin-btn--secondary admin-btn--small">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-stat-card">
            <div className={`admin-stat-card__icon admin-stat-card__icon--${stat.color}`}>
              {stat.icon === "users" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              {stat.icon === "active" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {stat.icon === "items" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" />
                  <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              {stat.icon === "rate" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="admin-stat-card__label">{stat.label}</span>
            <span className="admin-stat-card__value">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h2 className="admin-card__title">Người dùng mới nhất</h2>
          <button className="admin-btn admin-btn--secondary admin-btn--small">
            Xem tất cả
          </button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Trạng thái</th>
              <th>Ngày tham gia</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((user) => (
              <tr key={user.id}>
                <td data-label="Người dùng">
                  <div className="admin-user-info">
                    <div className="admin-user-avatar">
                      {user.name.charAt(0)}
                    </div>
                    <span className="admin-user-name">{user.name}</span>
                  </div>
                </td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Trạng thái">
                  <span className={`admin-badge admin-badge--${user.status}`}>
                    {user.status === "active" ? "Hoạt động" : "Bị cấm"}
                  </span>
                </td>
                <td data-label="Ngày tham gia">{new Date(user.joinDate).toLocaleDateString("vi-VN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
