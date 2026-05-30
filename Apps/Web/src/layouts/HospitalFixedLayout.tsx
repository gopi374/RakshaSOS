import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  useEffect,
  useState,
} from "react";

import {
  auth,
  db,
} from "../firebase/firebaseConfig";

import "../styles/HospitalFixedLayout.css";

import {
  MdDashboard,
  MdLocalHospital,
  MdLogout,
  MdNotifications,
  MdSettings,
  MdPeople,
  MdListAlt,
  MdHealthAndSafety,
  MdMenu,
} from "react-icons/md";

export default function HospitalFixedLayout() {

  const navigate =
    useNavigate();

  const [
    hospitalData,
    setHospitalData,
  ] = useState<any>(null);

  const [
    currentUser,
    setCurrentUser,
  ] = useState<any>(null);

  /* AUTH */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {

          if (user) {

            setCurrentUser(
              user
            );

          }

        }
      );

    return () =>
      unsubscribe();

  }, []);

  /* FETCH HOSPITAL */

  useEffect(() => {

    if (!currentUser)
      return;

    const fetchHospital =
      async () => {

        try {

          const hospitalRef =
            doc(
              db,
              "hospitals",
              currentUser.uid
            );

          const hospitalSnap =
            await getDoc(
              hospitalRef
            );

          if (
            hospitalSnap.exists()
          ) {

            const data =
              hospitalSnap.data();

            console.log(
              "LAYOUT HOSPITAL:",
              data
            );

            setHospitalData(
              data
            );

          }

        } catch (error) {

          console.error(
            error
          );

        }

      };

    fetchHospital();

  }, [currentUser]);

  /* LOGOUT */

  const handleLogout =
    async () => {

      try {

        await signOut(
          auth
        );

        navigate(
          "/hospital-login"
        );

      } catch (error) {

        console.error(
          "Logout Error:",
          error
        );

      }

    };

  /* DYNAMIC VALUES */

  const hospitalName =
    hospitalData
      ?.hospitalName ||
    "Hospital";

  const city =
    hospitalData?.city ||
    "Unknown City";

  const state =
    hospitalData?.state ||
    "Unknown State";

  const profileLetter =
    hospitalName.charAt(0);

  return (
    <div className="hospital-layout">

      {/* SIDEBAR */}

      <aside className="hospital-sidebar">

        <div className="sidebar-top">

          <div>

            <p className="sidebar-subtitle">
              Command Hub
            </p>

            <h2 className="sidebar-title">
              {city}, {state}
            </h2>

          </div>

        </div>

        <div className="sidebar-links">

          <NavLink
            to="/hospital-dashboard"
            end
            className={({
              isActive,
            }) =>
              isActive
                ? "sidebar-link active-link"
                : "sidebar-link"
            }
          >

            <MdDashboard
              size={22}
            />

            <span>
              Command Center
            </span>

          </NavLink>

          <NavLink
            to="/hospital-dashboard/incident-logs"
            className={({
              isActive,
            }) =>
              isActive
                ? "sidebar-link active-link"
                : "sidebar-link"
            }
          >

            <MdListAlt
              size={22}
            />

            <span>
              Incident Logs
            </span>

          </NavLink>

          <NavLink
            to="/hospital-dashboard/ambulance-logistics"
            className={({
              isActive,
            }) =>
              isActive
                ? "sidebar-link active-link"
                : "sidebar-link"
            }
          >

            <MdLocalHospital
              size={22}
            />

            <span>
              Ambulance Logistics
            </span>

          </NavLink>


         <NavLink
  to="/hospital-dashboard/profile"
  className={({ isActive }) =>
    isActive
      ? "sidebar-link active-link"
      : "sidebar-link"
  }
>
  <MdPeople size={22} />
  <span>
    Hospital Profile
  </span>
</NavLink>

        </div>

        <div className="sidebar-bottom">

          <button className="sidebar-link">

            <MdHealthAndSafety
              size={22}
            />

            <span>
              System Health
            </span>

          </button>

          <button
            className="sidebar-link logout-btn"
            onClick={
              handleLogout
            }
          >

            <MdLogout
              size={22}
            />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* MAIN */}

      <div className="hospital-main">

        {/* TOPBAR */}

        <header className="hospital-topbar">

          <div className="topbar-left">

            <div className="mobile-menu">

              <MdMenu
                size={24}
              />

            </div>

            <div>

              <h1 className="hospital-name">
                {
                  hospitalName
                }
              </h1>

              <p className="hospital-status">

                <span className="status-dot"></span>

                System Stable

              </p>

            </div>

          </div>

          <div className="topbar-right">

            <button className="topbar-icon-btn">

              <MdNotifications
                size={22}
              />

            </button>

            <button className="topbar-icon-btn">

              <MdSettings
                size={22}
              />

            </button>

            <button className="emergency-btn">

              Emergency Alert

            </button>

            <div className="profile-circle">

              {
                profileLetter
              }

            </div>

          </div>

        </header>

        {/* PAGE */}

        <main className="hospital-content">

          <Outlet />

        </main>

      </div>

    </div>
  );
}