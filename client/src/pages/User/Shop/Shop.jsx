import React from "react";
import { Link } from "react-router-dom";

export default function Shop() {
  return (
    <div className="page shop" style={{ padding: 24 }}>
      <h1>Shop</h1>
      <p>This is a placeholder shop page. Replace with your store UI/components.</p>
      <ul>
        <li>Item listing (placeholder)</li>
        <li>Purchase flow (placeholder)</li>
        <li>Currency / balances (placeholder)</li>
      </ul>
      <p>
        <Link to="/H">← Back to Home</Link>
      </p>
    </div>
  );
}