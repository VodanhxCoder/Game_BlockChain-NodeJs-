// Lists competitive divisions and top player rankings pulled from mock leaderboard data.
import React from "react";

const topPlayers = [
  { rank: 1, name: "Lilium", score: 18240, streak: 9 },
  { rank: 2, name: "Atlas", score: 17310, streak: 4 },
  { rank: 3, name: "Nyx", score: 16002, streak: 6 },
  { rank: 4, name: "Riven", score: 14980, streak: 2 },
  { rank: 5, name: "Mika", score: 14130, streak: 3 },
];

const divisions = [
  { title: "Mythic", players: 124, color: "#fef3c7" },
  { title: "Nova", players: 884, color: "#e0f2fe" },
  { title: "Vanguard", players: 2120, color: "#ede9fe" },
];

export default function Leaderboard() {
  return (
    <div className="page-shell">
      <section className="page-hero fade-in-up">
        <span className="page-hero__badge">
          <span role="img" aria-hidden="true">
            🚀
          </span>
          Leaderboards
        </span>
        <h1 className="gradient-title">Các phi công đứng đầu chuỗi.</h1>
        <p className="page-hero__text">
          Theo dõi realtime điểm Space Raiders, streak và phân chia hạng đa server. Bảng xếp hạng được cập nhật sau mỗi trận
          đấu on-chain.
        </p>
        <div className="page-hero__actions">
          <button type="button" className="ui-btn ui-btn--primary">
            Thách đấu top 10
          </button>
          <button type="button" className="ui-btn ui-btn--ghost">
            Xem phần thưởng mùa
          </button>
        </div>
      </section>

      <section className="page-grid">
        {divisions.map((division) => (
          <article key={division.title} className="page-card" style={{ background: `linear-gradient(135deg, ${division.color}, transparent)` }}>
            <h3>{division.title}</h3>
            <div className="metric-value">{division.players}</div>
            <div className="metric-label">Phi công đang cạnh tranh</div>
            <div className="ui-progress">
              <div className="ui-progress__bar" style={{ width: `${Math.min(100, (division.players / 2500) * 100)}%` }} />
            </div>
          </article>
        ))}
      </section>

      <section className="list-card fade-in-up">
        <table>
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Người chơi</th>
              <th>Điểm</th>
              <th>Chuỗi thắng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {topPlayers.map((player) => (
              <tr key={player.rank}>
                <td>
                  <span className="chip chip--accent">#{player.rank}</span>
                </td>
                <td>{player.name}</td>
                <td>{player.score.toLocaleString()}</td>
                <td>
                  <span className="chip">{player.streak} trận</span>
                </td>
                <td>
                  <button type="button" className="ui-btn ui-btn--text">
                    Xem hồ sơ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
