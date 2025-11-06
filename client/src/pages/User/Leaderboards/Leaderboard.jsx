import React from "react";
import { Link } from "react-router-dom";

export default function Leaderboard() {
  const sample = [
    { rank: 1, name: "PlayerOne", score: 12450 },
    { rank: 2, name: "PlayerTwo", score: 11320 },
    { rank: 3, name: "PlayerThree", score: 9800 },
  ];

  return (
    <div className="page leaderboard" style={{ padding: 24 }}>
      <h1>Leaderboards</h1>
      <p>Top players (placeholder)</p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>Rank</th>
            <th style={{ textAlign: "left", padding: 8 }}>Player</th>
            <th style={{ textAlign: "left", padding: 8 }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {sample.map((r) => (
            <tr key={r.rank}>
              <td style={{ padding: 8 }}>{r.rank}</td>
              <td style={{ padding: 8 }}>{r.name}</td>
              <td style={{ padding: 8 }}>{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 18 }}>
        <Link to="/H">← Back to Home</Link>
      </p>
    </div>
  );
}