import React from "react";
import { Link } from "react-router-dom";

export default function Settings() {
  return (
    <div className="page settings" style={{ padding: 24 }}>
      <h1>Settings</h1>
      <p>Placeholder for user settings: profile, preferences, audio, controls, etc.</p>

      <section style={{ marginTop: 16 }}>
        <h3>Profile</h3>
        <p>Name, avatar, bio (placeholder)</p>
      </section>

      <section style={{ marginTop: 12 }}>
        <h3>Controls</h3>
        <p>Keybindings, sensitivity, etc. (placeholder)</p>
      </section>

      <p style={{ marginTop: 18 }}>
        <Link to="/H">← Back to Home</Link>
      </p>
    </div>
  );
}