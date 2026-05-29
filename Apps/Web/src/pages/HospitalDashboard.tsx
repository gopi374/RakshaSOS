
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  GoogleMap,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";

import {
  auth,
  db,
} from "../firebase/firebaseConfig";

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
  onAuthStateChanged,
} from "firebase/auth";

import "../styles/HospitalDashboard.css";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

export default function HospitalDashboard() {

  const [
    currentUser,
    setCurrentUser,
  ] = useState<any>(null);

  const [
    hospitalData,
    setHospitalData,
  ] = useState<any>(null);

  const [
    hospitalLocation,
    setHospitalLocation,
  ] = useState(
    defaultCenter
  );

  const [
    pendingSOS,
    setPendingSOS,
  ] = useState<any[]>([]);

  const [
    acceptedSOS,
    setAcceptedSOS,
  ] = useState<any[]>([]);

  const [
    ambulances,
    setAmbulances,
  ] = useState<any[]>([]);

  const [
    mapLoaded,
    setMapLoaded,
  ] = useState(false);

  const { isLoaded } =
    useLoadScript({

      googleMapsApiKey:
        import.meta.env
          .VITE_GOOGLE_MAPS_API,

    });

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

  /* HOSPITAL */

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

            setHospitalData(
              data
            );

            if (
              data.latitude &&
              data.longitude
            ) {

              setHospitalLocation({

                lat: Number(
                  data.latitude
                ),

                lng: Number(
                  data.longitude
                ),

              });

            }

          }

        } catch (error) {

          console.error(
            error
          );

        }

      };

    fetchHospital();

  }, [currentUser]);

  /* PENDING SOS */

  useEffect(() => {

    if (!currentUser)
      return;

    const sosRef =
      collection(
        db,
        "sos"
      );

    const pendingQuery =
      query(

        sosRef,

        where(
          "hospitalStatus",
          "==",
          "pending"
        )

      );

    const unsubscribe =
      onSnapshot(
        pendingQuery,
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({

                id:
                  doc.id,

                ...doc.data(),

              })
            );

          setPendingSOS(
            data
          );

        }
      );

    return () =>
      unsubscribe();

  }, [currentUser]);

  /* ACCEPTED SOS */

  useEffect(() => {

    if (!currentUser)
      return;

    const sosRef =
      collection(
        db,
        "sos"
      );

    const acceptedQuery =
      query(

        sosRef,

        where(
          "hospitalStatus",
          "==",
          "accepted"
        ),

        where(
          "acceptedHospitalId",
          "==",
          currentUser.uid
        )

      );

    const unsubscribe =
      onSnapshot(
        acceptedQuery,
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({

                id:
                  doc.id,

                ...doc.data(),

              })
            );

          setAcceptedSOS(
            data
          );

        }
      );

    return () =>
      unsubscribe();

  }, [currentUser]);

  /* AMBULANCES */

  useEffect(() => {

    if (!currentUser)
      return;

    const ambulanceRef =
      collection(
        db,
        "ambulances"
      );

    const ambulanceQuery =
      query(

        ambulanceRef,

        where(
          "hospitalId",
          "==",
          currentUser.uid
        )

      );

    const unsubscribe =
      onSnapshot(
        ambulanceQuery,
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({

                id:
                  doc.id,

                ...doc.data(),

              })
            );

          setAmbulances(
            data
          );

        }
      );

    return () =>
      unsubscribe();

  }, [currentUser]);

  /* ACCEPT SOS */

  const acceptSOS =
    async (
      sosId: string
    ) => {

      if (!currentUser)
        return;

      try {

        await updateDoc(

          doc(
            db,
            "sos",
            sosId
          ),

          {

            hospitalStatus:
              "accepted",

            acceptedHospitalId:
              currentUser.uid,

          }

        );

      } catch (error) {

        console.error(
          error
        );

      }

    };

  /* REJECT SOS */

  const rejectSOS =
    async (
      sosId: string
    ) => {

      try {

        await updateDoc(

          doc(
            db,
            "sos",
            sosId
          ),

          {

            hospitalStatus:
              "rejected",

          }

        );

      } catch (error) {

        console.error(
          error
        );

      }

    };

  /* MAP CENTER */

  const mapCenter =
    useMemo(() => {

      if (
        acceptedSOS.length >
        0
      ) {

        return {

          lat: Number(
            acceptedSOS[0]
              .latitude
          ),

          lng: Number(
            acceptedSOS[0]
              .longitude
          ),

        };

      }

      return hospitalLocation;

    }, [
      acceptedSOS,
      hospitalLocation,
    ]);

  useEffect(() => {

    if (isLoaded) {

      setMapLoaded(
        true
      );

    }

  }, [isLoaded]);

  if (!mapLoaded) {

    return (
      <div className="dashboard-loading">

        Loading Tactical
        Map...

      </div>
    );

  }

  return (
    <>

      {/* SOS POPUP */}

      {pendingSOS.length >
        0 && (

        <div className="sos-modal-overlay">

          <div className="sos-modal">

            <div className="sos-modal-header">

              <h1>
                INCOMING SOS
              </h1>

              <p>
                RAPID RESPONSE
              </p>

            </div>

            <div className="modal-alert-box">

              <div className="modal-alert-top">

                <span>
                  CRITICAL ALERT
                </span>

                <span>
                  JUST NOW
                </span>

              </div>

              <h2>

                {
                  pendingSOS[0]
                    .type ||
                  "Emergency"
                }

              </h2>

              <p>

                Location:
                {" "}

                {
                  pendingSOS[0]
                    .address ||
                  "N/A"
                }

              </p>

            </div>

            <div className="modal-actions">

              <button
                className="accept-btn"
                onClick={() =>
                  acceptSOS(
                    pendingSOS[0]
                      .id
                  )
                }
              >

                ACCEPT CALL

              </button>

              <button
                className="reject-btn"
                onClick={() =>
                  rejectSOS(
                    pendingSOS[0]
                      .id
                  )
                }
              >

                REJECT

              </button>

            </div>

          </div>

        </div>

      )}

      <div className="hospital-dashboard">

        {/* LEFT */}

        <div className="dashboard-left">

          {/* MAP */}

          <div className="dashboard-map-card">

            <div className="map-header">

              <div>

                <p className="map-subtitle">

                  Tactical Response

                </p>

                <h2 className="map-title">

                  Live Command Map

                </h2>

              </div>

              <div className="live-badge">

                LIVE

              </div>

            </div>

            <div className="map-wrapper">

              <GoogleMap
                mapContainerStyle={
                  mapContainerStyle
                }
                zoom={13}
                center={
                  mapCenter
                }
                options={{

                  disableDefaultUI:
                    true,

                  zoomControl:
                    true,

                }}
              >

                {/* HOSPITAL */}

                {hospitalData?.latitude &&
                  hospitalData?.longitude && (

                  <Marker
                    position={{

                      lat: Number(
                        hospitalData.latitude
                      ),

                      lng: Number(
                        hospitalData.longitude
                      ),

                    }}
                  />

                )}

                {/* ACCEPTED SOS */}

                {acceptedSOS.map(
                  (sos) => (

                    <Marker
                      key={
                        sos.id
                      }
                      position={{

                        lat: Number(
                          sos.latitude
                        ),

                        lng: Number(
                          sos.longitude
                        ),

                      }}
                    />

                  )
                )}

              </GoogleMap>

            </div>

          </div>

          {/* LIVE UNIT TRACKING */}

          <div className="live-tracking-card">

            <div className="live-tracking-header">

              <div className="tracking-title">

                <h2>
                  Live Unit Tracking
                </h2>

              </div>

              <div className="tracking-stats">

                <div className="available-stat">

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

                <div className="active-stat">

                  {
                    ambulances.filter(
                      (
                        ambulance
                      ) =>
                        ambulance.status ===
                        "on_route"
                    ).length
                  }
                  {" "}
                  Active

                </div>

              </div>

            </div>

            {ambulances.filter(
              (
                ambulance
              ) =>
                ambulance.status ===
                "on_route"
            ).length === 0 ? (

              <div className="empty-state">

                <h2>
                  No Active Unit
                </h2>

                <p>
                  Ambulance dispatches
                  will appear here in
                  realtime after SOS
                  assignment.
                </p>

              </div>

            ) : (

              <div className="tracking-grid">

                {ambulances
                  .filter(
                    (
                      ambulance
                    ) =>
                      ambulance.status ===
                      "on_route"
                  )
                  .map(
                    (
                      ambulance
                    ) => (

                      <div
                        key={
                          ambulance.id
                        }
                        className="tracking-unit-card"
                      >

                        <div className="tracking-top">

                          <div>

                            <h3>

                              {
                                ambulance.ambulanceNumber ||
                                "N/A"
                              }

                            </h3>

                            <p>

                              {
                                ambulance.driverName ||
                                "N/A"
                              }

                            </p>

                            <strong>

                              {
                                ambulance.driverPhone ||
                                "N/A"
                              }

                            </strong>

                          </div>

                          <div className="tracking-badges">

                            <span>
                              ON
                            </span>

                            <span>
                              ROUTE
                            </span>

                          </div>

                        </div>

                        <div className="tracking-eta">

                          <span>
                            ESTIMATED ARRIVAL
                          </span>

                          <h1>

                            {
                              ambulance.estimatedArrivalMinutes ||
                              "--"
                            }
                            m

                          </h1>

                        </div>

                        <div className="tracking-progress">

                          <div className="tracking-line" />

                        </div>

                        <div className="tracking-actions">

                          <button
                            onClick={() => {

                              const message =
`
🚑 Live Ambulance Dispatch

Ambulance:
${ambulance.ambulanceNumber}

Driver:
${ambulance.driverName}

ETA:
${ambulance.estimatedArrivalMinutes} mins
`;

                              window.open(

                                `https://wa.me/?text=${encodeURIComponent(
                                  message
                                )}`

                              );

                            }}
                          >

                            Share Location

                          </button>

                          <button
                            className="arrived-btn"
                            onClick={async () => {

                              try {

                                await updateDoc(

                                  doc(
                                    db,
                                    "ambulances",
                                    ambulance.id
                                  ),

                                  {

                                    status:
                                      "available",

                                    currentSOSId:
                                      null,

                                    assignedVictimName:
                                      null,

                                    estimatedArrivalMinutes:
                                      null,

                                  }

                                );

                                if (
                                  ambulance.currentSOSId
                                ) {

                                  await updateDoc(

                                    doc(
                                      db,
                                      "sos",
                                      ambulance.currentSOSId
                                    ),

                                    {

                                      ambulanceStatus:
                                        "arrived",

                                      arrivedAt:
                                        Date.now(),

                                    }

                                  );

                                }

                              } catch (
                                error
                              ) {

                                console.error(
                                  error
                                );

                              }

                            }}
                          >

                            Arrived

                          </button>

                        </div>

                      </div>

                    )
                  )}

              </div>

            )}

          </div>

        </div>

        {/* RIGHT */}

        <div className="dashboard-right">

          <div className="right-card">

            <div className="right-card-header">

              <h2>
                SOS Stream
              </h2>

              <span>

                {
                  acceptedSOS.length
                }
                {" "}
                Active

              </span>

            </div>

            {acceptedSOS.length ===
            0 ? (

              <div className="empty-stream">

                No Active SOS

              </div>

            ) : (

              acceptedSOS.map(
                (sos) => (

                  <div
                    key={
                      sos.id
                    }
                    className="stream-card"
                  >

                    <div className="stream-severity">

                      {
                        sos.severity ||
                        "Critical"
                      }

                    </div>

                    <h3>

                      {
                        sos.type ||
                        "Emergency"
                      }

                    </h3>

                    <div className="medical-grid">

                      <div className="medical-item">

                        <span>
                          Victim
                        </span>

                        <strong>

                          {
                            sos.victimName ||
                            "N/A"
                          }

                        </strong>

                      </div>

                      <div className="medical-item">

                        <span>
                          Age
                        </span>

                        <strong>

                          {
                            sos.age ||
                            "N/A"
                          }

                        </strong>

                      </div>

                      <div className="medical-item">

                        <span>
                          Gender
                        </span>

                        <strong>

                          {
                            sos.gender ||
                            "N/A"
                          }

                        </strong>

                      </div>

                      <div className="medical-item">

                        <span>
                          Blood Group
                        </span>

                        <strong>

                          {
                            sos.bloodGroup ||
                            "N/A"
                          }

                        </strong>

                      </div>

                      <div className="medical-item">

                        <span>
                          Pulse
                        </span>

                        <strong>

                          {
                            sos.pulse ||
                            "N/A"
                          }

                        </strong>

                      </div>

                      <div className="medical-item">

                        <span>
                          Condition
                        </span>

                        <strong>

                          {
                            sos.condition ||
                            "N/A"
                          }

                        </strong>

                      </div>

                      <div className="medical-item full-width">

                        <span>
                          Address
                        </span>

                        <strong>

                          {
                            sos.address ||
                            "N/A"
                          }

                        </strong>

                      </div>

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </div>

      </div>

    </>
  );

}
