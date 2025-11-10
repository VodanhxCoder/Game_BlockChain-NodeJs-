// Displays featured NFT drops, power-up bundles, and recent on-chain marketplace activity.
import React from "react";

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
    </div>
  );
}
