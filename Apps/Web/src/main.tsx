import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import PoliceLogin from "./pages/PoliceLogin";
import HospitalLogin from "./pages/HospitalLogin";
import PoliceDashboard from "./pages/PoliceDashboard";
import PoliceSignup from "./pages/PoliceSignup";
import HospitalSignup from "./pages/HospitalSignup";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/police-login" element={<PoliceLogin />} />
        <Route path="/hospital-login" element={<HospitalLogin />} />
        <Route path="/police-dashboard" element={<PoliceDashboard />} />
        <Route path="/police-signup" element={<PoliceSignup />} />
        <Route path="/hospital-signup" element={<HospitalSignup />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);