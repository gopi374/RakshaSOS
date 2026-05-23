import "./styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import "./styles.css";

import LandingPage from "./pages/LandingPage";
import PoliceLogin from "./pages/PoliceLogin";
import HospitalLogin from "./pages/HospitalLogin";
import PoliceDashboard from "./pages/PoliceDashboard";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/police-login" element={<PoliceLogin />} />
        <Route path="/hospital-login" element={<HospitalLogin />} />
        <Route
  path="/police-dashboard"
  element={<PoliceDashboard />}
/>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);