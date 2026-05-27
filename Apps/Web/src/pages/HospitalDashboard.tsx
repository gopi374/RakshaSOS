import { useEffect, useMemo, useState } from "react";

import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebaseConfig";

import "../styles/HospitalDashboard.css";

import {
  ShieldAlert,
  Ambulance,
  Phone,
  Navigation,
  Siren,
} from "lucide-react";

type SOSData = {
  id: string;

  victimName: string;

  victimPhone: string;

  type: string;

  severity: string;

  latitude: number;

  longitude: number;

  humanReadableLocation: string;

  medicalHistory: string;

  bloodGroup: string;

  status: string;

  acceptedHospitalId?: string;

  acceptedHospitalName?: string;

  assignedAmbulance?: string;

  ambulanceStatus?: string;

  estimatedMinutes?: number;

  dispatchTime?: number;

  createdAt: number;
};

type AmbulanceData = {
  id: string;

  hospitalId: string;

  hospitalName: string;

  ambulanceNumber: string;

  driverName: string;

  driverPhone: string;

  status: string;

  progress: number;

  estimatedMinutes?: number;

  dispatchTime?: number;

  assignedSOS?: string;

  victimLat?: number;

  victimLng?: number;
};

function HospitalDashboard() {

  const [currentHospitalId,
    setCurrentHospitalId] =
    useState("");

  const [authReady,
    setAuthReady] =
    useState(false);

  const [hospitalName,
    setHospitalName] =
    useState("");

  const [hospitalLocation,
    setHospitalLocation] =
    useState("");

  const [hospitalLatitude,
    setHospitalLatitude] =
    useState(22.7196);

  const [hospitalLongitude,
    setHospitalLongitude] =
    useState(75.8577);

  const [allSOS,
    setAllSOS] =
    useState<SOSData[]>([]);

  const [ambulances,
    setAmbulances] =
    useState<
      AmbulanceData[]
    >([]);

  const [selectedSOS,
    setSelectedSOS] =
    useState<SOSData | null>(
      null
    );

  /* GOOGLE MAP */

  const { isLoaded } =
    useJsApiLoader({

      googleMapsApiKey:
        "YOUR_GOOGLE_MAPS_API_KEY",

    });

  /* AUTH */

  useEffect(() => {

    const unsubscribe =
      auth.onAuthStateChanged(
        (user) => {

          if (user) {

            setCurrentHospitalId(
              user.uid
            );

          } else {

            setCurrentHospitalId(
              ""
            );

          }

          setAuthReady(true);

        }
      );

    return () =>
      unsubscribe();

  }, []);

  /* HOSPITAL DATA */

  useEffect(() => {

    const fetchHospital =
      async () => {

        if (
          !currentHospitalId
        )
          return;

        const hospitalRef =
          doc(
            db,
            "hospitals",
            currentHospitalId
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
            data.fullAddress ||
            "Unknown Location"
          );

          setHospitalLatitude(
            data.latitude ||
            22.7196
          );

          setHospitalLongitude(
            data.longitude ||
            75.8577
          );

        }

      };

    fetchHospital();

  }, [currentHospitalId]);

  /* SOS LISTENER */

  useEffect(() => {

    const unsubscribe =
      onSnapshot(

        collection(
          db,
          "sos"
        ),

        (snapshot) => {

          const sosData:
            SOSData[] =
            snapshot.docs.map(
              (
                firebaseDoc
              ) => {

                const data =
                  firebaseDoc.data();

                return {

                  id:
                    firebaseDoc.id,

                  victimName:
                    data.victimName ||
                    "Victim",

                  victimPhone:
                    data.victimPhone ||
                    "",

                  type:
                    data.type ||
                    "Emergency",

                  severity:
                    data.severity ||
                    "medium",

                  latitude:
                    data.latitude ||
                    0,

                  longitude:
                    data.longitude ||
                    0,

                  humanReadableLocation:
                    data.humanReadableLocation ||
                    "Unknown Location",

                  medicalHistory:
                    data.medicalHistory ||
                    "No medical history",

                  bloodGroup:
                    data.bloodGroup ||
                    "Unknown",

                  status:
                    data.status ||
                    "pending",

                  acceptedHospitalId:
                    data.acceptedHospitalId ||
                    "",

                  acceptedHospitalName:
                    data.acceptedHospitalName ||
                    "",

                  assignedAmbulance:
                    data.assignedAmbulance ||
                    "",

                  ambulanceStatus:
                    data.ambulanceStatus ||
                    "",

                  estimatedMinutes:
                    data.estimatedMinutes ||
                    0,

                  dispatchTime:
                    data.dispatchTime ||
                    0,

                  createdAt:
                    data.createdAt ||
                    Date.now(),

                };

              }
            );

          setAllSOS(
            sosData
          );

        }
      );

    return () =>
      unsubscribe();

  }, []);

  /* AMBULANCES */

  useEffect(() => {

    if (
      !currentHospitalId
    )
      return;

    const q = query(

      collection(
        db,
        "ambulances"
      ),

      where(
        "hospitalId",
        "==",
        currentHospitalId
      )

    );

    const unsubscribe =
      onSnapshot(
        q,

        (
          snapshot
        ) => {

          const data:
            AmbulanceData[] =
            snapshot.docs.map(
              (
                firebaseDoc
              ) => ({

                id:
                  firebaseDoc.id,

                ...(firebaseDoc.data() as Omit<
                  AmbulanceData,
                  "id"
                >),

              })
            );

          setAmbulances(
            data
          );

        }
      );

    return () =>
      unsubscribe();

  }, [currentHospitalId]);

  /* PENDING SOS */

  const pendingSOS =
    useMemo(() => {

      return allSOS.find(
        (sos) =>
          sos.status ===
            "pending" &&
          !sos.acceptedHospitalId
      );

    }, [allSOS]);

  /* ACCEPTED SOS */

  const acceptedSOS =
    useMemo(() => {

      return allSOS.filter(
        (sos) =>
          sos.status ===
            "accepted" &&
          sos.acceptedHospitalId ===
            currentHospitalId
      );

    }, [
      allSOS,
      currentHospitalId,
    ]);

  /* ACTIVE AMBULANCES */

  const activeAmbulances =
    useMemo(() => {

      return ambulances.filter(
        (ambulance) =>
          ambulance.status ===
            "dispatched" ||
          ambulance.status ===
            "arrived"
      );

    }, [ambulances]);

  /* ACCEPT SOS */

  const acceptSOS =
    async (
      sosId: string
    ) => {

      await updateDoc(
        doc(
          db,
          "sos",
          sosId
        ),

        {
          status:
            "accepted",

          acceptedHospitalId:
            currentHospitalId,

          acceptedHospitalName:
            hospitalName,
        }
      );

    };

  /* REJECT */

  const rejectSOS =
    async (
      sosId: string
    ) => {

      await updateDoc(
        doc(
          db,
          "sos",
          sosId
        ),

        {
          status:
            "rejected",
        }
      );

    };

  if (!authReady) {

    return null;

  }

  return (

    <div className="dashboard-page">

      <div className="dashboard-grid">

        {/* LEFT */}

        <div className="map-section">

          <div className="map-header">

            <h2>
              Tactical Response Map
            </h2>

            <p>

              {hospitalName}
              {" • "}
              {
                hospitalLocation
              }

            </p>

          </div>

          <div className="map-box">

            {isLoaded && (

              <GoogleMap

                center={{
                  lat:
                    hospitalLatitude,
                  lng:
                    hospitalLongitude,
                }}

                zoom={12}

                mapContainerStyle={{
                  width:
                    "100%",

                  height:
                    "100%",
                }}

              >

                {/* HOSPITAL */}

                <Marker

                  position={{
                    lat:
                      hospitalLatitude,

                    lng:
                      hospitalLongitude,
                  }}

                />

                {/* PENDING */}

                {pendingSOS && (

                  <Marker

                    position={{
                      lat:
                        pendingSOS.latitude,

                      lng:
                        pendingSOS.longitude,
                    }}

                  />

                )}

                {/* ACCEPTED */}

                {acceptedSOS.map(
                  (
                    sos
                  ) => (

                    <Marker
                      key={
                        sos.id
                      }

                      position={{
                        lat:
                          sos.latitude,

                        lng:
                          sos.longitude,
                      }}

                    />

                  )
                )}

              </GoogleMap>

            )}

            {/* POPUP */}

            {pendingSOS && (

              <div className="sos-popup">

                <div className="popup-top">

                  <div className="alert-row">

                    <div className="alert-left">

                      <div className="alert-dot"></div>

                      <span>
                        LIVE SOS ALERT
                      </span>

                    </div>

                    <div className="live-chip">
                      ACTIVE
                    </div>

                  </div>

                  <h1 className="popup-title">

                    {
                      pendingSOS.type
                    }

                  </h1>

                  <p className="popup-location">

                    {
                      pendingSOS.humanReadableLocation
                    }

                  </p>

                </div>

                <div className="popup-middle">

                  <div className="popup-grid">

                    <div className="popup-card">

                      <p>
                        VICTIM
                      </p>

                      <h3>

                        {
                          pendingSOS.victimName
                        }

                      </h3>

                    </div>

                    <div className="popup-card">

                      <p>
                        SEVERITY
                      </p>

                      <h3>

                        {
                          pendingSOS.severity
                        }

                      </h3>

                    </div>

                    <div className="popup-card">

                      <p>
                        BLOOD GROUP
                      </p>

                      <h3>

                        {
                          pendingSOS.bloodGroup
                        }

                      </h3>

                    </div>

                    <div className="popup-card">

                      <p>
                        MEDICAL HISTORY
                      </p>

                      <h3>

                        {
                          pendingSOS.medicalHistory
                        }

                      </h3>

                    </div>

                  </div>

                </div>

                <div className="popup-bottom">

                  <div className="popup-buttons">

                    <button
                      className="accept-btn"
                      onClick={() =>
                        acceptSOS(
                          pendingSOS.id
                        )
                      }
                    >

                      Accept SOS

                    </button>

                    <button
                      className="reject-btn"
                      onClick={() =>
                        rejectSOS(
                          pendingSOS.id
                        )
                      }
                    >

                      Reject

                    </button>

                  </div>

                </div>

              </div>

            )}

          </div>

          {/* LIVE AMBULANCES */}

          <div className="ambulance-section">

            <div className="section-top">

              <div className="tracking-left">

                <Ambulance />

                <h2>
                  Active Ambulances
                </h2>

              </div>

              <div className="tracking-badges">

                <div className="available-badge">

                  {
                    ambulances.filter(
                      (
                        ambulance
                      ) =>
                        ambulance.status ===
                        "available"
                    ).length
                  }
                  {" "}
                  Available

                </div>

                <div className="active-badge">

                  {
                    activeAmbulances.length
                  }
                  {" "}
                  Active

                </div>

              </div>

            </div>

            {activeAmbulances.length ===
            0 ? (

              <div className="ambulance-empty">

                <h3>
                  No Active Ambulances
                </h3>

                <p>
                  Dispatch ambulance
                  after accepting SOS.
                </p>

              </div>

            ) : (

              <div className="ambulance-grid">

                {activeAmbulances.map(
                  (
                    ambulance
                  ) => (

                    <div
                      className="live-unit-card"
                      key={
                        ambulance.id
                      }
                    >

                      <div className="live-top">

                        <div className="driver-box">

                          <div className="driver-avatar">

                            <Siren />

                          </div>

                          <div>

                            <h3>

                              {
                                ambulance.ambulanceNumber
                              }

                            </h3>

                            <p>

                              {
                                ambulance.driverName
                              }

                            </p>

                            <span className="unit-phone">

                              {
                                ambulance.driverPhone
                              }

                            </span>

                          </div>

                        </div>

                        <div className="route-box">

                          <div className="route-status">

                            {
                              ambulance.status
                            }

                          </div>

                          <h2>

                            {
                              ambulance.estimatedMinutes
                            }
                            m

                          </h2>

                        </div>

                      </div>

                      <div className="hospital-row">

                        <span>

                          {
                            hospitalName
                          }

                        </span>

                        <span>

                          SOS:
                          {" "}
                          {
                            ambulance.assignedSOS
                          }

                        </span>

                      </div>

                      <div className="live-route">

                        <div className="route-head">

                          <span>
                            Route Progress
                          </span>

                          <span>

                            {
                              ambulance.progress
                            }
                            %

                          </span>

                        </div>

                        <div className="route-progress">

                          <div
                            className="route-fill"
                            style={{
                              width:
                                `${ambulance.progress}%`,
                            }}
                          />

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>

        {/* RIGHT */}

        <div className="right-panel">

          <div className="accepted-panel">

            <div className="panel-top">

              <h2>
                Accepted SOS
              </h2>

              <span>

                {
                  acceptedSOS.length
                }
                {" "}
                Active

              </span>

            </div>

            <div className="sos-scroll">

              {acceptedSOS.map(
                (
                  sos
                ) => (

                  <div
                    className={`accepted-card ${
                      selectedSOS?.id ===
                      sos.id
                        ? "selected-card"
                        : ""
                    }`}
                    key={sos.id}
                    onClick={() =>
                      setSelectedSOS(
                        sos
                      )
                    }
                  >

                    <div className="accepted-top">

                      <div className="response-badge">

                        ACCEPTED

                      </div>

                      <div className="severity-chip">

                        {
                          sos.severity
                        }

                      </div>

                    </div>

                    <h3>

                      {
                        sos.type
                      }

                    </h3>

                    <p className="accepted-location">

                      {
                        sos.humanReadableLocation
                      }

                    </p>

                    <div className="accepted-meta">

                      <div className="meta-box">

                        <p>
                          VICTIM
                        </p>

                        <h4>

                          {
                            sos.victimName
                          }

                        </h4>

                      </div>

                      <div className="meta-box">

                        <p>
                          BLOOD GROUP
                        </p>

                        <h4>

                          {
                            sos.bloodGroup
                          }

                        </h4>

                      </div>

                    </div>

                    {sos.assignedAmbulance && (

                      <div className="ambulance-mini">

                        <strong>

                          {
                            sos.assignedAmbulance
                          }

                        </strong>

                        <span>

                          ETA:
                          {" "}
                          {
                            sos.estimatedMinutes
                          }
                          m

                        </span>

                      </div>

                    )}

                    <button className="view-btn">

                      View Full Details

                    </button>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}

export default HospitalDashboard;