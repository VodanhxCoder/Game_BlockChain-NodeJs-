import React from "react";
import { Routes, Route } from "react-router-dom";
import AuthSlider from "../pages/User/Auth/AuthSlider";
import Homepage from "../pages/User/Homepage/Homepage";
import Shop from "../pages/User/Shop/Shop";
import Inventory from "../pages/User/Inventory/Inventory";
import Leaderboards from "../pages/User/Leaderboards/Leaderboard";
import Settings from "../pages/User/Settings/Settings";
import AppLayout from "../layouts/AppLayout";

/**
 * Use AuthSlider for root / signin / signup routes.
 * Keep protected area under AppLayout (shows Menu) as before.
 */
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AuthSlider />} />
      <Route path="/signin" element={<AuthSlider />} />
      <Route path="/signup" element={<AuthSlider />} />

      <Route element={<AppLayout />}>
        <Route path="/H" element={<Homepage />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<AuthSlider />} />
    </Routes>
  );
}