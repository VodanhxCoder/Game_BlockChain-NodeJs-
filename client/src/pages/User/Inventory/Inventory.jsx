// Shows the player's gear stats, loadout, and achievement progress at a glance.
import React from "react";

const stats = [
  { id: "power", label: "Sức mạnh tàu", value: "1.280", progress: 72, note: "+120 tuần này" },
  { id: "rarity", label: "Skin hiếm", value: "8", progress: 40, note: "3 Legendary" },
  { id: "materials", label: "Vật liệu nâng cấp", value: "42", progress: 54, note: "Chuẩn bị nâng level" },
];

const loadout = [
  { slot: "Primary", name: "Nova Railgun", tier: "Mythic", stats: "+34% dmg" },
  { slot: "Secondary", name: "Pulse Swarm", tier: "Epic", stats: "5 drones auto-lock" },
  { slot: "Utility", name: "Gravity Well", tier: "Rare", stats: "Giảm tốc 2s" },
];

const achievements = [
  { title: "Collector IV", desc: "Sở hữu 25 vật phẩm on-chain", progress: 76 },
  { title: "No-Death Run", desc: "Thắng 10 trận không mất mạng", progress: 52 },
  { title: "Speed Runner", desc: "Phá kỷ lục 3 map campaign", progress: 31 },
];

export default function Inventory() {
  return (
    <div className="page-shell">
      <section className="page-hero fade-in-up">
        <span className="page-hero__badge">
          <span role="img" aria-hidden="true">
            🎒
          </span>
          Inventory
        </span>
        <h1 className="gradient-title">Loadout đa chuỗi của bạn.</h1>
        <p className="page-hero__text">
          Kéo thả NFT từ ví hoặc craft vật phẩm trực tiếp. Hệ thống đồng bộ mọi thứ vào trận chiến trong vài giây với hiệu
          ứng chuyển đổi mượt mà.
        </p>
      </section>

      <section className="page-grid">
        {stats.map((stat) => (
          <article key={stat.id} className="page-card">
            <h3>{stat.label}</h3>
            <div className="metric-value">{stat.value}</div>
            <div className="metric-label">{stat.note}</div>
            <div className="ui-progress">
              <div className="ui-progress__bar" style={{ width: `${stat.progress}%` }} />
            </div>
          </article>
        ))}
      </section>

      <section className="page-grid">
        <article className="page-card">
          <h3>Tải trang</h3>
          <div className="stagger">
            {loadout.map((slot) => (
              <div key={slot.slot} className="settings-item">
                <div>
                  <strong>{slot.slot}</strong>
                  <p>{slot.name}</p>
                </div>
                <div>
                  <span className="chip chip--accent">{slot.tier}</span>
                  <p className="metric-label">{slot.stats}</p>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="ui-btn ui-btn--primary" style={{ marginTop: 18 }}>
            Chỉnh sửa loadout
          </button>
        </article>

        <article className="page-card">
          <h3>Huy hiệu & mục tiêu</h3>
          <div className="stagger">
            {achievements.map((ach) => (
              <div key={ach.title}>
                <strong>{ach.title}</strong>
                <p className="metric-label">{ach.desc}</p>
                <div className="ui-progress">
                  <div className="ui-progress__bar" style={{ width: `${ach.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
