import React from "react";
import { Routes, Route } from "react-router-dom";
import Homepage from "../pages/User/Homepage/Homepage";
import Shop from "../pages/User/Shop/Shop";
import Inventory from "../pages/User/Inventory/Inventory";
import Leaderboards from "../pages/User/Leaderboards/Leaderboard";
import Settings from "../pages/User/Settings/Settings";
import SignIn from "../pages/User/Signin/Signin";
import SignUp from "../pages/User/SignUp/Signup";
import AppLayout from "../layouts/AppLayout";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/Admin/Dashboard/Dashboard";
import UserManagement from "../pages/Admin/Users/UserManagement";
import ItemManagement from "../pages/Admin/Items/ItemManagement";
import GameLayoutEditor from "../pages/Admin/GameLayout/GameLayoutEditor";

/**
 * Public routes show the split sign-in/sign-up experience.
 * Protected area stays wrapped by AppLayout (renders Menu, etc.).
 * Admin routes wrapped by AdminLayout (renders AdminMenu, etc.).
 */
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<SignIn />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      <Route element={<AppLayout />}>
        <Route path="/H" element={<Homepage />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="items" element={<ItemManagement />} />
        <Route path="layout" element={<GameLayoutEditor />} />
      </Route>

      <Route path="*" element={<SignIn />} />
    </Routes>
  );
}
