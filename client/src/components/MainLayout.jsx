import React from "react";
import { Outlet } from "react-router-dom";
import Menu from "./Menu";
import "../assets/css/Homepage.css";

export default function MainLayout() {
  return (
    <div className="layout">
      <Menu />
      <div className="content-area">
        <Outlet />
      </div>
    </div>
  );
}