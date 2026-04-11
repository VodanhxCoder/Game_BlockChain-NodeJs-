import React, { useState } from "react";
import GridEditor from "../../../components/GridEditor";

export default function GameLayoutEditor() {
  usePageTitle('Game Layout Editor');
  const [gameSettings, setGameSettings] = useState({
    playerSpeed: 5,
    enemySpeed: 3,
    bulletSpeed: 8,
    enemyShootInterval: 1000,
    playerStartLives: 3,
    pointsPerKill: 100,
    levelUpKills: 10,
    invaderRows: 4,
    invaderCols: 8,
    invaderSpacing: 10,
    blockadeCount: 3,
    canvasWidth: 800,
    canvasHeight: 600,
    backgroundColor: "#0a1628",
    playerColor: "#00ff88",
    enemyColor: "#ff4444",
    bulletColor: "#ffffff",
  });

  const [activeTab, setActiveTab] = useState("gameplay");

  const handleChange = (key, value) => {
    setGameSettings({ ...gameSettings, [key]: value });
  };

  const handleReset = () => {
    if (confirm("Bạn có chắc chắn muốn đặt lại tất cả cài đặt về mặc định?")) {
      setGameSettings({
        playerSpeed: 5,
        enemySpeed: 3,
        bulletSpeed: 8,
        enemyShootInterval: 1000,
        playerStartLives: 3,
        pointsPerKill: 100,
        levelUpKills: 10,
        invaderRows: 4,
        invaderCols: 8,
        invaderSpacing: 10,
        blockadeCount: 3,
        canvasWidth: 800,
        canvasHeight: 600,
        backgroundColor: "#0a1628",
        playerColor: "#00ff88",
        enemyColor: "#ff4444",
        bulletColor: "#ffffff",
      });
    }
  };

  const handleSave = () => {
    alert("Settings saved!");
    console.log("Saved settings:", gameSettings);
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-header__title">Chỉnh layout game</h1>
        <div className="admin-page-header__actions">
          <button className="admin-btn admin-btn--secondary" onClick={handleReset}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Đặt lại mặc định
          </button>
          <button className="admin-btn admin-btn--primary" onClick={handleSave}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => setActiveTab("gameplay")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "gameplay" ? "2px solid var(--accent)" : "2px solid transparent",
              color: activeTab === "gameplay" ? "var(--accent)" : "var(--text-muted)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            Gameplay
          </button>
          <button
            onClick={() => setActiveTab("layout")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "layout" ? "2px solid var(--accent)" : "2px solid transparent",
              color: activeTab === "layout" ? "var(--accent)" : "var(--text-muted)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            Layout & Grid
          </button>
          <button
            onClick={() => setActiveTab("visual")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "visual" ? "2px solid var(--accent)" : "2px solid transparent",
              color: activeTab === "visual" ? "var(--accent)" : "var(--text-muted)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            Visual & Colors
          </button>
        </div>
      </div>

      {/* Gameplay Tab */}
      {activeTab === "gameplay" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
          <div className="admin-card">
            <div className="admin-card__header">
              <h3 className="admin-card__title">⚡ Tốc độ & Di chuyển</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Tốc độ người chơi</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={gameSettings.playerSpeed}
                  onChange={(e) => handleChange("playerSpeed", parseInt(e.target.value))}
                  style={{ width: "100%" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  <span>Giá trị: {gameSettings.playerSpeed}</span>
                  <span>Mặc định: 5</span>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Tốc độ kẻ địch</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={gameSettings.enemySpeed}
                  onChange={(e) => handleChange("enemySpeed", parseInt(e.target.value))}
                  style={{ width: "100%" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  <span>Giá trị: {gameSettings.enemySpeed}</span>
                  <span>Mặc định: 3</span>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Tốc độ đạn</label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={gameSettings.bulletSpeed}
                  onChange={(e) => handleChange("bulletSpeed", parseInt(e.target.value))}
                  style={{ width: "100%" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  <span>Giá trị: {gameSettings.bulletSpeed}</span>
                  <span>Mặc định: 8</span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card__header">
              <h3 className="admin-card__title"> Cơ chế game</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Số mạng ban đầu</label>
                <input
                  type="number"
                  className="admin-form-input"
                  min="1"
                  max="10"
                  value={gameSettings.playerStartLives}
                  onChange={(e) => handleChange("playerStartLives", parseInt(e.target.value))}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Điểm mỗi lần giết địch</label>
                <input
                  type="number"
                  className="admin-form-input"
                  min="10"
                  max="1000"
                  step="10"
                  value={gameSettings.pointsPerKill}
                  onChange={(e) => handleChange("pointsPerKill", parseInt(e.target.value))}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Số lần giết để lên cấp</label>
                <input
                  type="number"
                  className="admin-form-input"
                  min="1"
                  max="50"
                  value={gameSettings.levelUpKills}
                  onChange={(e) => handleChange("levelUpKills", parseInt(e.target.value))}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Thời gian bắn của địch (ms)</label>
                <input
                  type="number"
                  className="admin-form-input"
                  min="100"
                  max="5000"
                  step="100"
                  value={gameSettings.enemyShootInterval}
                  onChange={(e) => handleChange("enemyShootInterval", parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Layout Tab */}
      {activeTab === "layout" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
            <div className="admin-card">
              <div className="admin-card__header">
                <h3 className="admin-card__title">📐 Kích thước Canvas</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Chiều rộng (px)</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    min="400"
                    max="1920"
                    value={gameSettings.canvasWidth}
                    onChange={(e) => handleChange("canvasWidth", parseInt(e.target.value))}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Chiều cao (px)</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    min="300"
                    max="1080"
                    value={gameSettings.canvasHeight}
                    onChange={(e) => handleChange("canvasHeight", parseInt(e.target.value))}
                  />
                </div>

                <div style={{ padding: "1rem", background: "var(--bg-soft)", borderRadius: "8px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  Tỷ lệ hiện tại: {gameSettings.canvasWidth} x {gameSettings.canvasHeight}
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card__header">
                <h3 className="admin-card__title">👾 Cấu hình Grid</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Số hàng</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    min="1"
                    max="10"
                    value={gameSettings.invaderRows}
                    onChange={(e) => handleChange("invaderRows", parseInt(e.target.value))}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Số cột</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    min="1"
                    max="15"
                    value={gameSettings.invaderCols}
                    onChange={(e) => handleChange("invaderCols", parseInt(e.target.value))}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Khoảng cách (px)</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    min="0"
                    max="50"
                    value={gameSettings.invaderSpacing}
                    onChange={(e) => handleChange("invaderSpacing", parseInt(e.target.value))}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Số rào chắn</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    min="0"
                    max="5"
                    value={gameSettings.blockadeCount}
                    onChange={(e) => handleChange("blockadeCount", parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grid Editor */}
          <div className="admin-card">
            <div className="admin-card__header">
              <h3 className="admin-card__title">🎨 Thiết kế Pattern kẻ địch</h3>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                Click hoặc kéo để vẽ pattern
              </span>
            </div>
            <GridEditor
              rows={gameSettings.invaderRows}
              cols={gameSettings.invaderCols}
              onChange={(pattern) => {
                console.log("Enemy pattern:", pattern);
                // Save pattern to settings if needed
              }}
            />
          </div>
        </div>
      )}

      {/* Visual Tab */}
      {activeTab === "visual" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
          <div className="admin-card">
            <div className="admin-card__header">
              <h3 className="admin-card__title">🎨 Màu sắc</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Màu nền</label>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <input
                    type="color"
                    value={gameSettings.backgroundColor}
                    onChange={(e) => handleChange("backgroundColor", e.target.value)}
                    style={{ width: "60px", height: "40px", border: "none", borderRadius: "8px", cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    className="admin-form-input"
                    value={gameSettings.backgroundColor}
                    onChange={(e) => handleChange("backgroundColor", e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Màu người chơi</label>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <input
                    type="color"
                    value={gameSettings.playerColor}
                    onChange={(e) => handleChange("playerColor", e.target.value)}
                    style={{ width: "60px", height: "40px", border: "none", borderRadius: "8px", cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    className="admin-form-input"
                    value={gameSettings.playerColor}
                    onChange={(e) => handleChange("playerColor", e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Màu kẻ địch</label>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <input
                    type="color"
                    value={gameSettings.enemyColor}
                    onChange={(e) => handleChange("enemyColor", e.target.value)}
                    style={{ width: "60px", height: "40px", border: "none", borderRadius: "8px", cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    className="admin-form-input"
                    value={gameSettings.enemyColor}
                    onChange={(e) => handleChange("enemyColor", e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Màu đạn</label>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <input
                    type="color"
                    value={gameSettings.bulletColor}
                    onChange={(e) => handleChange("bulletColor", e.target.value)}
                    style={{ width: "60px", height: "40px", border: "none", borderRadius: "8px", cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    className="admin-form-input"
                    value={gameSettings.bulletColor}
                    onChange={(e) => handleChange("bulletColor", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card__header">
              <h3 className="admin-card__title">👁️ Preview</h3>
            </div>
            <div
              style={{
                width: "100%",
                aspectRatio: `${gameSettings.canvasWidth} / ${gameSettings.canvasHeight}`,
                background: gameSettings.backgroundColor,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Enemy preview */}
              <div
                style={{
                  position: "absolute",
                  top: "20%",
                  width: "30px",
                  height: "30px",
                  background: gameSettings.enemyColor,
                  borderRadius: "4px",
                }}
              />
              {/* Player preview */}
              <div
                style={{
                  position: "absolute",
                  bottom: "20%",
                  width: "40px",
                  height: "30px",
                  background: gameSettings.playerColor,
                  borderRadius: "4px",
                }}
              />
              {/* Bullet preview */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  width: "4px",
                  height: "15px",
                  background: gameSettings.bulletColor,
                  borderRadius: "2px",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
