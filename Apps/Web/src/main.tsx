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

import HospitalDashboard from "./pages/HospitalDashboard";

import ResourceMap from "./pages/ResourceMap";

import AmbulanceLogistics from "./pages/AmbulanceLogistics";

import IncidentLogs from "./pages/IncidentLogs";

import HospitalProfile from "./pages/HospitalProfile";

import HospitalLayout from "./layouts/HospitalLayout";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(

  <React.StrictMode>

    <BrowserRouter>

      <Routes>

        {/* LANDING */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* POLICE */}

        <Route
          path="/police-login"
          element={<PoliceLogin />}
        />

        <Route
          path="/police-signup"
          element={<PoliceSignup />}
        />

        <Route
          path="/police-dashboard"
          element={<PoliceDashboard />}
        />

        {/* HOSPITAL */}

        <Route
          path="/hospital-login"
          element={<HospitalLogin />}
        />

        <Route
          path="/hospital-signup"
          element={<HospitalSignup />}
        />

        {/* HOSPITAL DASHBOARD */}

        <Route
          path="/hospital-dashboard"
          element={<HospitalLayout />}
        >

          {/* COMMAND CENTER */}

          <Route
            index
            element={<HospitalDashboard />}
          />

          {/* INCIDENT LOGS */}

          <Route
            path="incident-logs"
            element={<IncidentLogs />}
          />

          {/* RESOURCE MAP */}

          <Route
            path="resource-map"
            element={<ResourceMap />}
          />

          {/* AMBULANCE LOGISTICS */}

          <Route
            path="ambulance-logistics"
            element={<AmbulanceLogistics />}
          />

            <Route
            path="hospital-profile"
            element={<HospitalProfile />}
          />

        </Route>

      </Routes>

    </BrowserRouter>

  </React.StrictMode>

);