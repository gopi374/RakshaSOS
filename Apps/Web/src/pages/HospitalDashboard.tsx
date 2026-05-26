import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";

import {
  signOut
} from "firebase/auth";

import { auth } from "../firebase/firebaseConfig";

import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";

import { useNavigate } from "react-router-dom";

import { db } from "../firebase/firebaseConfig";

import "../styles/HospitalDashboard.css";

import {
  Bell,
  Settings,
  HelpCircle,
  MapPinned,
  ClipboardList,
  Ambulance,
  BarChart3,
  Users,
  LogOut,
  ShieldAlert,
  Plus,
  Minus,
  LocateFixed,
} from "lucide-react";

function HospitalDashboard() {

  const navigate = useNavigate();

  /* TYPES */

  type SOSDataType = {
    id: string;
    latitude: number;
    longitude: number;
    type: string;
    severity: string;
    status: string;
  };

  type AmbulanceType = {
    id: string;
    driverName: string;
    eta: string;
    available: boolean;
  };

  /* STATES */

  const [sosData, setSosData] =
    useState<SOSDataType[]>([]);

  const [ambulances, setAmbulances] =
    useState<AmbulanceType[]>([]);

  const [selectedSOS, setSelectedSOS] =
    useState<SOSDataType | null>(null);

  /* NOTIFICATIONS */

  const unreadSOS =
    sosData.filter(
      (sos) => sos.status === "pending"
    ).length;

  /* LOGOUT */

const handleLogout = async () => {

  const confirmLogout =
    window.confirm(
      "Are you sure you want to logout?"
    );

  if (!confirmLogout) return;

  try {

    await signOut(auth);

   navigate("/hospital-login");

  } catch (error) {

    console.log(error);

  }

};

  /* GOOGLE MAP */

  const { isLoaded } =
    useJsApiLoader({
      googleMapsApiKey:
        import.meta.env
          .VITE_GOOGLE_MAPS_API,
    });

  /* SOS LISTENER */

  useEffect(() => {

    const unsubscribe = onSnapshot(
      collection(db, "sos"),

      (snapshot) => {

        const data: SOSDataType[] =
          snapshot.docs.map((doc) => {

            const firebaseData =
              doc.data();

            return {

              id: doc.id,

              latitude:
                firebaseData.latitude || 0,

              longitude:
                firebaseData.longitude || 0,

              type:
                firebaseData.type || "",

              severity:
                firebaseData.severity || "",

              status:
                firebaseData.status || "",

            };

          });

        setSosData(data);

      }
    );

    return () => unsubscribe();

  }, []);

  /* AMBULANCE LISTENER */

  useEffect(() => {

    const unsubscribe = onSnapshot(
      collection(db, "ambulances"),

      (snapshot) => {

        const data: AmbulanceType[] =
          snapshot.docs.map((doc) => {

            const firebaseData =
              doc.data();

            return {

              id: doc.id,

              driverName:
                firebaseData.driverName ||
                "",

              eta:
                firebaseData.eta || "",

              available:
                firebaseData.available ||
                false,

            };

          });

        setAmbulances(data);

      }
    );

    return () => unsubscribe();

  }, []);

  /* FILTERS */

  const pendingSOS =
    sosData.find(
      (sos) =>
        sos.status === "pending"
    );

  const acceptedSOS =
    sosData.filter(
      (sos) =>
        sos.status === "accepted"
    );

  /* AUTO SELECT */

  useEffect(() => {

    if (
      acceptedSOS.length > 0 &&
      !selectedSOS
    ) {

      setSelectedSOS(
        acceptedSOS[0]
      );

    }

  }, [acceptedSOS]);

  /* ACCEPT */

  const acceptSOS = async (
    id: string
  ) => {

    await updateDoc(
      doc(db, "sos", id),
      {
        status: "accepted",
      }
    );

  };

  /* REJECT */

  const rejectSOS = async (
    id: string
  ) => {

    await updateDoc(
      doc(db, "sos", id),
      {
        status: "rejected",
      }
    );

    await addDoc(
      collection(
        db,
        "incident_logs"
      ),
      {
        sosId: id,
        status: "rejected",
        createdAt: Date.now(),
      }
    );

  };

  return (

    <div className="hospital-dashboard">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div>

          <div className="sidebar-top">

            <h1>
              CITY HOSPITAL
              <span> Vanguard</span>
            </h1>

            <p>COMMAND HUB</p>

            <h2>Sector 7 Dispatch</h2>

          </div>

          <div className="sidebar-menu">

            <div className="menu-item active">
              <ShieldAlert size={20} />
              <span>Command Center</span>
            </div>

            <div
              className="menu-item"
              onClick={() =>
                navigate("/incident-logs")
              }
            >
              <ClipboardList size={20} />
              <span>Incident Logs</span>
            </div>

            <div
              className="menu-item"
              onClick={() =>
                navigate(
                  "/ambulance-logistics"
                )
              }
            >
              <Ambulance size={20} />
              <span>
                Ambulance Logistics
              </span>
            </div>

            <div
              className="menu-item"
              onClick={() =>
                navigate("/resource-map")
              }
            >
              <MapPinned size={20} />
              <span>Resource Map</span>
            </div>

            <div
              className="menu-item"
              onClick={() =>
                navigate("/analytics")
              }
            >
              <BarChart3 size={20} />
              <span>Analytics</span>
            </div>

            <div
              className="menu-item"
              onClick={() =>
                navigate("/personnel")
              }
            >
              <Users size={20} />
              <span>Personnel</span>
            </div>

          </div>

        </div>

        <div className="sidebar-bottom">

          <div className="bottom-item">
            <ShieldAlert size={20} />
            <span>System Health</span>
          </div>

        <div
  className="bottom-item logout-btn"
  onClick={handleLogout}
>
  <LogOut size={20} />
  <span>Logout</span>
</div>
        </div>

      </aside>

      {/* MAIN */}

      <main className="main-content">

        {/* TOPBAR */}

        <div className="topbar">

          <div className="status">

            <span className="green-dot"></span>

            SYSTEM STABLE

          </div>

          <div className="nav-links">

            <span className="active-link">
              Live Map
            </span>

            <span>Unit Dispatch</span>

            <span>Logistics</span>

          </div>

          <div className="top-actions">

           <div className="notification-wrapper">

  <Bell />

  {unreadSOS > 0 && (
    <span className="notification-dot"></span>
  )}

</div>

            <Settings />

            <HelpCircle />

            <button className="alert-btn">
              Emergency Alert
            </button>

            <img
              src="https://i.imgur.com/HeIi0wU.png"
              alt="profile"
            />

          </div>

        </div>

        {/* GRID */}

        <div className="dashboard-grid">

          {/* MAP */}

          <div className="map-section">

            <div className="map-header">

              <h2>
                Tactical Response Map
              </h2>

              <div className="map-actions">

                <button>MAP</button>

                <button>SAT</button>

              </div>

            </div>

            <div className="map-box">

              {isLoaded && (

                <GoogleMap
                  mapContainerStyle={{
                    width: "100%",
                    height: "100%",
                  }}
                  center={{
                    lat:
                      selectedSOS?.latitude ||
                      pendingSOS?.latitude ||
                      28.6139,

                    lng:
                      selectedSOS?.longitude ||
                      pendingSOS?.longitude ||
                      77.2090,
                  }}
                  zoom={14}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: false,
                  }}
                >

                  {acceptedSOS.map((sos) => (

                    <Marker
                      key={sos.id}
                      position={{
                        lat: sos.latitude,
                        lng: sos.longitude,
                      }}
                    />

                  ))}

                  {pendingSOS && (

                    <Marker
                      position={{
                        lat: pendingSOS.latitude,
                        lng: pendingSOS.longitude,
                      }}
                    />

                  )}

                </GoogleMap>

              )}

              {/* FLOATING STATS */}

              {ambulances.length > 0 && (

                <div className="floating-stats">

                  <div className="stat-card">

                    <p>GPS ACCURACY</p>

                    <h3>98.4%</h3>

                  </div>

                  <div className="stat-card">

                    <p>AVERAGE ETA</p>

                    <h3>4.2 min</h3>

                  </div>

                </div>

              )}

              {/* PENDING POPUP */}

              {pendingSOS && (

                <div className="sos-popup">

                  <div className="popup-top">

                    <h2>INCOMING SOS</h2>

                    <span>LIVE</span>

                  </div>

                  <p className="sector-text">
                    SECTOR 4 | RAPID RESPONSE
                  </p>

                  <div className="popup-content">

                    <h3>
                      {pendingSOS.type}
                    </h3>

                    <p>
                      Severity:
                      {" "}
                      {pendingSOS.severity}
                    </p>

                    <p>
                      Latitude:
                      {" "}
                      {pendingSOS.latitude}
                    </p>

                    <p>
                      Longitude:
                      {" "}
                      {pendingSOS.longitude}
                    </p>

                  </div>

                  <div className="popup-buttons">

                    <button
                      className="accept-btn"
                      onClick={() =>
                        acceptSOS(
                          pendingSOS.id
                        )
                      }
                    >
                      ACCEPT CALL
                    </button>

                    <button
                      className="reject-btn"
                      onClick={() =>
                        rejectSOS(
                          pendingSOS.id
                        )
                      }
                    >
                      REJECT
                    </button>

                  </div>

                </div>

              )}

              {/* MAP CONTROLS */}

              <div className="map-controls">

                <button>
                  <Plus />
                </button>

                <button>
                  <Minus />
                </button>

                <button>
                  <LocateFixed />
                </button>

              </div>

            </div>

          </div>

          {/* RIGHT PANEL */}

          <div className="right-panel">

            {/* ACCEPTED SOS */}

            <div className="accepted-panel">

              <div className="panel-top">

                <h2>Accepted SOS</h2>

                <span>
                  {acceptedSOS.length}
                  {" "}
                  ACTIVE
                </span>

              </div>

              <div className="sos-scroll">

                {acceptedSOS.length === 0 ? (

                  <div className="empty-sos">

                    <h3>
                      No Accepted SOS
                    </h3>

                    <p>
                      Accepted emergency
                      requests will appear
                      here.
                    </p>

                  </div>

                ) : (

                  acceptedSOS.map((sos) => (

                    <div
                      className={`accepted-card ${
                        selectedSOS?.id ===
                        sos.id
                          ? "selected-card"
                          : ""
                      }`}
                      key={sos.id}
                      onClick={() =>
                        setSelectedSOS(sos)
                      }
                      onDoubleClick={() =>
                        navigate(
                          "/resource-map"
                        )
                      }
                    >

                      <div className="badge">
                        ACTIVE RESPONSE
                      </div>

                      <h3>{sos.type}</h3>

                      <p>
                        Severity:
                        {" "}
                        {sos.severity}
                      </p>

                      <p>
                        Distance:
                        {" "}
                        2.1km
                      </p>

                      <div className="sos-buttons">

                        <button className="view-btn">
                          View Details
                        </button>

                      </div>

                    </div>

                  ))

                )}

              </div>

            </div>

            {/* DOCTORS */}

            <div className="doctor-panel">

              <div className="panel-top">

                <h2>
                  Available Doctors
                </h2>

                <span>3 ON DUTY</span>

              </div>

              <div className="doctor-card">

                <h3>
                  Dr. Aditi Sharma
                </h3>

                <p>Trauma Surgeon</p>

              </div>

              <div className="doctor-card">

                <h3>
                  Dr. Vikram Singh
                </h3>

                <p>Cardiologist</p>

              </div>

              <div className="doctor-card">

                <h3>
                  Dr. Priya Iyer
                </h3>

                <p>Neurologist</p>

              </div>

            </div>

          </div>

        </div>

        {/* AMBULANCE */}

        <div className="ambulance-section">

          <div className="section-top">

            <h2>
              Live Unit Tracking
            </h2>

          </div>

          <div className="ambulance-grid">

            {ambulances.length === 0 ? (

              <div className="ambulance-empty">

                <h3>
                  Update Ambulance Data
                </h3>

                <p>
                  Add ambulance logistics
                  to activate live dispatch.
                </p>

              </div>

            ) : (

              ambulances.map((unit) => (

                <div
                  className="ambulance-card"
                  key={unit.id}
                >

                  <div className="ambulance-top">

                    <h3>{unit.id}</h3>

                    <span
                      className={
                        unit.available
                          ? "unit-available"
                          : "unit-active"
                      }
                    >
                      {unit.available
                        ? "AVAILABLE"
                        : "DISPATCHED"}
                    </span>

                  </div>

                  <p>
                    {unit.driverName}
                  </p>

                  <h2>{unit.eta}</h2>

                  <div className="progress-bar">

                    <div className="progress"></div>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

      </main>

    </div>
  );
}

export default HospitalDashboard;