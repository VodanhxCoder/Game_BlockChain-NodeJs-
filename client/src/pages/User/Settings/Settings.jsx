// Provides profile, notification, and session security controls for the player.
import React, { useState } from "react";
import { useAuth } from '../../../context/AuthContext';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { useWeb3 } from "../../../context/Web3Context";
import { useLanguage } from "../../../context/LanguageContext";
import { hashTextSHA256 } from "../../../utils/Passwordhasher";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081') + "/api";

export default function Settings() {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const { account, connectWallet, disconnectWallet } = useWeb3();

  const [showNameModal, setShowNameModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ playername: newName })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setUser({ ...user, playername: newName });
      showMsg(t("settings.successName"));
      setShowNameModal(false);
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passData.current || !passData.new || !passData.confirm) {
      return showMsg(t("settings.errorFillAll"), "error");
    }
    if (passData.new !== passData.confirm) {
      return showMsg(t("settings.errorPassMismatch"), "error");
    }
    
    setLoading(true);
    try {
      const currentHash = await hashTextSHA256(passData.current);
      const newHash = await hashTextSHA256(passData.new);
      
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/user/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword: currentHash, newPassword: newHash })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      showMsg(t("settings.successPass"));
      setShowPassModal(false);
      setPassData({ current: "", new: "", confirm: "" });
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletAction = async () => {
    if (account) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  return (
    <div className="page-shell">
      {message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '1rem',
          borderRadius: '8px',
          background: message.type === 'error' ? '#ef4444' : '#22c55e',
          color: 'white',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease'
        }}>
          {message.text}
        </div>
      )}

      <section className="page-hero fade-in-up">
        <span className="page-hero__badge">
          <span role="img" aria-hidden="true">
            ⚙️
          </span>
          {t("settings.controlCenter")}
        </span>
        <h1 className="gradient-title">{t("settings.title")}</h1>
        <p className="page-hero__text">
          {t("settings.description")}
        </p>
      </section>

      <section className="page-grid">
        <article className="settings-group">
          <h3>{t("settings.profile")}</h3>
          <div className="settings-item">
            <div>
              <strong>{t("settings.nickname")}</strong>
              <p>{user?.playername || user?.username || t("settings.notSet")}</p>
            </div>
            <button 
              type="button" 
              className="ui-btn ui-btn--ghost"
              onClick={() => {
                setNewName(user?.playername || "");
                setShowNameModal(true);
              }}
            >
              {t("settings.edit")}
            </button>
          </div>
          
          <div className="settings-item">
            <div>
              <strong>{t("settings.password")}</strong>
              <p>********</p>
            </div>
            <button 
              type="button" 
              className="ui-btn ui-btn--ghost"
              onClick={() => setShowPassModal(true)}
            >
              {t("settings.changePassword")}
            </button>
          </div>

          <div className="settings-item">
            <div>
              <strong>{t("settings.linkedWallet")}</strong>
              <p>{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : t("settings.notConnected")}</p>
            </div>
            <button 
              type="button" 
              className={`ui-btn ${account ? 'ui-btn--ghost' : 'ui-btn--primary'}`}
              onClick={handleWalletAction}
            >
              {account ? t("settings.disconnect") : t("settings.connect")}
            </button>
          </div>
        </article>

        <article className="settings-group">
          <h3>{t("settings.details")}</h3>
          
          <div className="settings-item">
            <div>
              <strong>{t("settings.username")}</strong>
              <p>{user?.username}</p>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>{t("settings.email")}</strong>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>{t("settings.role")}</strong>
              <p style={{ textTransform: 'capitalize' }}>{user?.role || 'Player'}</p>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>{t("settings.highScore")}</strong>
              <p>{(user?.highScore || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>{t("settings.joinedDate")}</strong>
              <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
            </div>
          </div>
        </article>
      </section>



      {/* Edit Name Modal */}
      {showNameModal && (
        <div className="ui-modal-overlay" onClick={() => setShowNameModal(false)}>
          <div className="ui-modal" onClick={e => e.stopPropagation()}>
            <h3>{t("settings.editNameTitle")}</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="text"
                className="ui-input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={t("settings.enterNewName")}
                autoFocus
              />
            </div>
            <div className="ui-modal-actions">
              <button className="ui-btn ui-btn--ghost" onClick={() => setShowNameModal(false)}>{t("settings.cancel")}</button>
              <button className="ui-btn ui-btn--primary" onClick={handleUpdateName} disabled={loading}>
                {loading ? t("settings.saving") : t("settings.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPassModal && (
        <div className="ui-modal-overlay" onClick={() => setShowPassModal(false)}>
          <div className="ui-modal" onClick={e => e.stopPropagation()}>
            <h3>{t("settings.changePassTitle")}</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{t("settings.currentPass")}</label>
              <input
                type="password"
                className="ui-input"
                value={passData.current}
                onChange={e => setPassData({...passData, current: e.target.value})}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{t("settings.newPass")}</label>
              <input
                type="password"
                className="ui-input"
                value={passData.new}
                onChange={e => setPassData({...passData, new: e.target.value})}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{t("settings.confirmPass")}</label>
              <input
                type="password"
                className="ui-input"
                value={passData.confirm}
                onChange={e => setPassData({...passData, confirm: e.target.value})}
              />
            </div>

            <div className="ui-modal-actions">
              <button className="ui-btn ui-btn--ghost" onClick={() => setShowPassModal(false)}>{t("settings.cancel")}</button>
              <button className="ui-btn ui-btn--primary" onClick={handleChangePassword} disabled={loading}>
                {loading ? t("settings.processing") : t("settings.changePassword")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
