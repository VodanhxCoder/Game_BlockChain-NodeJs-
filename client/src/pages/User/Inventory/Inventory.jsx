import React from "react";
import { Link } from "react-router-dom";

export default function Inventory() {
  return (
    <div className="page inventory" style={{ padding: 24 }}>
      <h1>Inventory</h1>
      <p>Placeholder for user inventory: items, equipment, etc.</p>

      <section style={{ marginTop: 16 }}>
        <h3>Items</h3>
        <p>List of items (placeholder)</p>
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