// Leaderboards page - fetches real data from server (users.high_score > 0)
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await axios.get('/api/user/leaderboard?limit=50');
        if (!mounted) return;
        setEntries(r.data.leaderboard || []);
      } catch (err) {
        console.error('Failed to load leaderboard:', err.response?.data || err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <div className="page-shell">
      <section className="page-hero fade-in-up">
        <span className="page-hero__badge">
          <span role="img" aria-hidden="true">🚀</span> Leaderboards
        </span>
        <h1 className="gradient-title">Các phi công đứng đầu chuỗi.</h1>
        <p className="page-hero__text">
          Theo dõi realtime điểm Space Raiders. Bảng xếp hạng được cập nhật sau mỗi trận đấu.
        </p>
      </section>

      <section className="list-card fade-in-up">
        <table>
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Người chơi</th>
              <th>Điểm</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}>Đang tải...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={4}>Chưa có điểm cao nào.</td></tr>
            ) : entries.map((u, idx) => (
              <tr key={u.username}>
                <td><span className="chip chip--accent">#{idx + 1}</span></td>
                <td>{u.playername || u.username}</td>
                <td>{(u.highScore || 0).toLocaleString()}</td>
                <td>
                  <button type="button" className="ui-btn ui-btn--text">Xem hồ sơ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
