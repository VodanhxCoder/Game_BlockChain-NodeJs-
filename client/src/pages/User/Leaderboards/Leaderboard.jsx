// Leaderboards page - fetches real data from server (users.high_score > 0)
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import { usePageTitle } from "../../../hooks/usePageTitle";

export default function Leaderboard() {
  usePageTitle('Leaderboards');
  const { user } = useAuth();
  const { t } = useLanguage();
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

  // Find current user rank
  const userRankIndex = entries.findIndex(e => e.username === user?.username);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : null;
  const userEntry = userRankIndex !== -1 ? entries[userRankIndex] : null;

  return (
    <div className="page-shell">
      <section className="page-hero fade-in-up">
        <span className="page-hero__badge">
          <span role="img" aria-hidden="true">🚀</span> {t("leaderboard.title")}
        </span>
        <h1 className="gradient-title">{t("leaderboard.subtitle")}</h1>
        <p className="page-hero__text">
          {t("leaderboard.description")}
        </p>
      </section>

      {/* User Rank Section */}
      {!loading && user && (
        <section className="page-card fade-in-up" style={{ border: '1px solid var(--accent)', background: 'rgba(124, 93, 255, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent)' }}>{t("leaderboard.yourRank")}</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {userRank 
                  ? t("leaderboard.congrats", { rank: `#${userRank}` })
                  : t("leaderboard.notRanked")}
              </p>
            </div>
            {userRank ? (
              <div style={{ textAlign: 'right', display: 'flex', gap: 24, alignItems: 'center' }}>
                <div>
                  <div className="metric-label">{t("leaderboard.highestScore")}</div>
                  <div className="metric-value" style={{ fontSize: '1.5rem' }}>{(userEntry?.highScore || 0).toLocaleString()}</div>
                </div>
                <div className="chip chip--accent" style={{ fontSize: '1.2rem', padding: '8px 16px' }}>#{userRank}</div>
              </div>
            ) : (
              <button 
                type="button" 
                className="ui-btn ui-btn--primary"
                onClick={() => window.location.href = '/H'}
              >
                {t("leaderboard.playNow")}
              </button>
            )}
          </div>
        </section>
      )}

      <section className="list-card fade-in-up">
        <table>
          <thead>
            <tr>
              <th>{t("leaderboard.rank")}</th>
              <th>{t("leaderboard.player")}</th>
              <th>{t("leaderboard.score")}</th>
              <th>{t("leaderboard.action")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}>{t("leaderboard.loading")}</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={4}>{t("leaderboard.noData")}</td></tr>
            ) : entries.map((u, idx) => (
              <tr key={u.username}>
                <td><span className="chip chip--accent">#{idx + 1}</span></td>
                <td>{u.playername || u.username}</td>
                <td>{(u.highScore || 0).toLocaleString()}</td>
                <td>
                  <button type="button" className="ui-btn ui-btn--text">{t("leaderboard.viewProfile")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
