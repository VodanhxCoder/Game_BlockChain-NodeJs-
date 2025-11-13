// Renders the interactive Space Raiders canvas shooter and its surrounding HUD panels.
import React, { useState, useEffect } from "react";
import "../../../assets/css/Homepage.css";
import { useLanguage } from "../../../context/LanguageContext";
import GameCanvas from "../../../components/GameCanvas";

export default function Homepage() {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [kills, setKills] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [lootDrops, setLootDrops] = useState([]);
  const [totalDropsThisRun, setTotalDropsThisRun] = useState(0);
  const { t, lang } = useLanguage();

  const handleLootDrop = (loot) => {
    console.log("Loot dropped:", loot);
    // increment total tally for this session/run
    setTotalDropsThisRun((n) => n + 1);
    // Keep last 3 drops (newest first)
    setLootDrops(prev => [loot, ...prev].slice(0, 3));
  };

  const handleScoreChange = (newScore) => {
    setScore(newScore);
  };

  const handleLivesChange = (newLives) => {
    setLives(newLives);
  };

  const handleLevelChange = (newLevel) => {
    setLevel(newLevel);
  };

  const handleKillsChange = (newKills) => {
    setKills(newKills);
  };

  const formatter = new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US");
  const overlayControls = t("game.controls");
  const missions = t("game.missions") || [];
  const boosts = t("game.boosts") || [];

  // Allow toggling the HUD overlay with the 'T' key. Ignore keypresses when
  // the user is typing into an input/textarea or editable element.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== "KeyT") return;
      const target = e.target;
      const tag = target && target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      e.preventDefault();
      setShowOverlay((s) => !s);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const statCards = [
    { id: "score", label: t("game.score"), value: formatter.format(score) },
    { id: "level", label: t("game.level"), value: level },
    { id: "lives", label: t("game.lives"), value: lives },
    { id: "combo", label: t("game.combo"), value: formatter.format(kills) },
  ];

  return (
    <main className="space-game">
      <div className="game-dashboard">
        <section className="game-hud" aria-label={t("game.statsTitle")}>
          <div className="game-hud__header">
            <div>
              <p className="game-hud__eyebrow">{t("game.statsTitle")}</p>
              <h2>Space Raiders</h2>
            </div>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setShowOverlay((s) => !s)}>
              {showOverlay ? t("game.overlayHide") : t("game.overlayShow")}
            </button>
          </div>

          <div className="game-hud__metrics">
            {statCards.map((card) => (
              <div key={card.id} className="game-hud__card">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
            ))}
          </div>

          <div className="game-hud__card">
            <div className="game-hud__card-header">
                <strong>Recent Drops</strong>
                <span className="chip chip--accent">{totalDropsThisRun}</span>
              </div>
            {lootDrops.length === 0 ? (
              <p className="metric-label" style={{ padding: 12, textAlign: 'center' }}>
                No drops yet. Destroy enemies to get loot!
              </p>
            ) : (
              <ul style={{ maxHeight: 240 }}>
                {lootDrops.map((drop, idx) => (
                  <li key={drop.id || idx} style={{ marginBottom: 8, padding: 8, borderRadius: 4, backgroundColor: 'rgba(120,192,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{drop.itemName || drop.name}</span>
                      <span className="chip" style={{ fontSize: 11 }}>{drop.itemTier || drop.rarity}</span>
                    </div>
                    <small style={{ fontSize: 11, color: '#888', display: 'block' }}>
                      {drop.timeLabel || new Date(drop.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </small>
                    <small style={{ fontSize: 11, color: '#666', display: 'block', marginTop: 4 }}>
                      Hash: {drop.itemHash ? `${drop.itemHash.substring(0, 16)}...` : (drop.id || '')}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="game-frame">
          <div className="game-frame__header">
            <div>
              <span className="chip chip--accent">Live build</span>
              <h2>Space Raiders</h2>
              <p>{t("nav.home.hint")}</p>
            </div>
          </div>

          <div className="game-frame__canvas" role="main" aria-label="Game area">
            <GameCanvas 
              onLootDrop={handleLootDrop}
              onScoreChange={handleScoreChange}
              onLivesChange={handleLivesChange}
              onLevelChange={handleLevelChange}
              onKillsChange={handleKillsChange}
            />
            {showOverlay && (
              <div className="game-overlay-panel" role="dialog" aria-label={t("game.overlayTitle")}>
                <div className="overlay-header">
                  <strong>{t("game.overlayTitle")}</strong>
                  <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setShowOverlay(false)}>
                    {t("game.overlayHide")}
                  </button>
                </div>
                <ul>
                  <li>{overlayControls.move}</li>
                  <li>{overlayControls.shoot}</li>
                  <li>{overlayControls.pause}</li>
                  <li>{overlayControls.defense}</li>
                </ul>
                <small>{t("game.overlayShowHint")}</small>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
