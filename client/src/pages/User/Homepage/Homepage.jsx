// Renders the interactive Space Raiders canvas shooter and its surrounding HUD panels.
import React, { useState } from "react";
import "../../../assets/css/Homepage.css";
import { useLanguage } from "../../../context/LanguageContext";
import GameCanvas from "../../../components/GameCanvas";

export default function Homepage() {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [showOverlay, setShowOverlay] = useState(true);
  const [lootDrops, setLootDrops] = useState([]);
  const { t, lang } = useLanguage();

  const handleLootDrop = (loot) => {
    console.log("Loot dropped:", loot);
    setLootDrops(prev => [loot, ...prev].slice(0, 5)); // Keep last 5 drops
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

  const formatter = new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US");
  const overlayControls = t("game.controls");
  const missions = t("game.missions") || [];
  const boosts = t("game.boosts") || [];

  const statCards = [
    { id: "score", label: t("game.score"), value: formatter.format(score) },
    { id: "level", label: t("game.level"), value: level },
    { id: "lives", label: t("game.lives"), value: lives },
    { id: "combo", label: t("game.combo"), value: `x${Math.max(1, Math.floor(score / 450) + 1)}` },
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

          <div className="game-hud__card game-hud__missions">
            <div className="game-hud__card-header">
              <strong>{t("game.missionsTitle")}</strong>
              <span className="chip chip--accent">{missions.length}</span>
            </div>
            <ul>
              {missions.map((mission) => (
                <li key={mission.label}>
                  <span>{mission.label}</span>
                  <small>{mission.reward}</small>
                </li>
              ))}
            </ul>
          </div>

          <div className="game-hud__card game-hud__boosts">
            <div className="game-hud__card-header">
              <strong>{t("game.boostsTitle")}</strong>
            </div>
            <ul>
              {boosts.map((boost) => (
                <li key={boost.label}>
                  <span>{boost.label}</span>
                  <span className="chip">{boost.status}</span>
                </li>
              ))}
            </ul>
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
