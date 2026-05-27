import {
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  signOut,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase/firebaseConfig";

import "../styles/HospitalLayout.css";

import {
  ShieldAlert,
  ClipboardList,
  Ambulance,
  MapPinned,
  Users,
  LogOut,
  Bell,
  Settings,
  HelpCircle,
} from "lucide-react";

function HospitalLayout() {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [hospitalName,
    setHospitalName] =
    useState("");

  const [hospitalLocation,
    setHospitalLocation] =
    useState("");

  /* FETCH HOSPITAL */

  useEffect(() => {

    const fetchHospital =
      async () => {

        if (
          !auth.currentUser
        )
          return;

        try {

          const hospitalRef =
            doc(
              db,
              "hospitals",
              auth.currentUser.uid
            );

          const snapshot =
            await getDoc(
              hospitalRef
            );

          if (
            snapshot.exists()
          ) {

            const data =
              snapshot.data();

            setHospitalName(
              data.hospitalName ||
              "Hospital"
            );

            setHospitalLocation(
              data.location ||
              "Emergency Dispatch"
            );

          }

        } catch (
          error
        ) {

          console.log(error);

        }

      };

    fetchHospital();

  }, []);

  /* LOGOUT */

  const logout =
    async () => {

      const confirmLogout =
        window.confirm(
          "Are you sure you want to logout?"
        );

      if (
        !confirmLogout
      )
        return;

      try {

        await signOut(
          auth
        );

        navigate(
          "/hospital-login"
        );

      } catch (
        error
      ) {

        console.log(error);

      }

    };

  return (

    <div className="hospital-layout">

      {/* SIDEBAR */}

      <aside className="hospital-sidebar">

        <div>

          {/* LOGO */}

          <div className="hospital-logo">

            <h1>

              {
                hospitalName ||
                "Loading..."
              }

            </h1>

            <p>
              COMMAND HUB
            </p>

            <h2>

              {
                hospitalLocation ||
                "Emergency Dispatch"
              }

            </h2>

          </div>

          {/* MENU */}

          <div className="hospital-menu">

            {/* COMMAND CENTER */}

            <div
              className={`hospital-item ${
                location.pathname ===
                "/hospital-dashboard"
                  ? "hospital-active"
                  : ""
              }`}
              onClick={() =>
                navigate(
                  "/hospital-dashboard"
                )
              }
            >

              <ShieldAlert
                size={20}
              />

              <span>
                Command Center
              </span>

            </div>

            {/* INCIDENT LOGS */}

            <div
              className={`hospital-item ${
                location.pathname ===
                "/hospital-dashboard/incident-logs"
                  ? "hospital-active"
                  : ""
              }`}
              onClick={() =>
                navigate(
                  "/hospital-dashboard/incident-logs"
                )
              }
            >

              <ClipboardList
                size={20}
              />

              <span>
                Incident Logs
              </span>

            </div>

            {/* AMBULANCE */}

            <div
              className={`hospital-item ${
                location.pathname ===
                "/hospital-dashboard/ambulance-logistics"
                  ? "hospital-active"
                  : ""
              }`}
              onClick={() =>
                navigate(
                  "/hospital-dashboard/ambulance-logistics"
                )
              }
            >

              <Ambulance
                size={20}
              />

              <span>
                Ambulance Logistics
              </span>

            </div>

            {/* RESOURCE MAP */}

            <div
              className={`hospital-item ${
                location.pathname ===
                "/hospital-dashboard/resource-map"
                  ? "hospital-active"
                  : ""
              }`}
              onClick={() =>
                navigate(
                  "/hospital-dashboard/resource-map"
                )
              }
            >

              <MapPinned
                size={20}
              />

              <span>
                Resource Map
              </span>

            </div>
            </div>

            {/* PERSONNEL */}

              <div
              className={`hospital-item ${
                location.pathname ===
                "/hospital-dashboard/hospital-profile"
                  ? "hospital-active"
                  : ""
              }`}
              onClick={() =>
                navigate(
                  "/hospital-dashboard/hospital-profile"
                )
              }
            >

              <MapPinned
                size={20}
              />

              <span>
                Hospital Profile
              </span>

            </div>

          </div>
        {/* BOTTOM */}

        <div className="hospital-bottom">

          <div className="hospital-health">

            <ShieldAlert
              size={18}
            />

            <span>
              System Health
            </span>

          </div>

          <div
            className="hospital-logout"
            onClick={logout}
          >

            <LogOut
              size={18}
            />

            <span>
              Logout
            </span>

          </div>

        </div>

      </aside>

      {/* RIGHT */}

      <div className="hospital-right">

        {/* TOPBAR */}

        <div className="hospital-topbar">

          <div className="hospital-status">

            <div className="green-dot"></div>

            SYSTEM STABLE

          </div>

          <div className="hospital-icons">

            <Bell />

            <Settings />

            <HelpCircle />

            <img
              src="https://i.imgur.com/HeIi0wU.png"
              alt="profile"
            />

          </div>

        </div>

        {/* PAGE */}

        <Outlet />

      </div>

    </div>

  );

}

export default HospitalLayout;