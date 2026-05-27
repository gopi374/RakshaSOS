import { useEffect, useMemo, useState } from "react";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";

import {
  db,
  auth,
} from "../firebase/firebaseConfig";

import "../styles/AmbulanceLogistics.css";

import {
  Ambulance,
  Plus,
  X,
  Siren,
  Wrench,
  RotateCcw,
  MapPinned,
  CheckCircle2,
} from "lucide-react";

type AmbulanceType = {
  id: string;

  hospitalId: string;

  hospitalName: string;

  hospitalAddress: string;

  ambulanceNumber: string;

  driverName: string;

  driverPhone: string;

  status:
    | "available"
    | "dispatched"
    | "maintenance"
    | "arrived";

  progress: number;

  incidentTitle: string;

  dispatchTime?: number;

  estimatedMinutes?: number;

  victimLat?: number;

  victimLng?: number;

  assignedSOS?: string;

  createdAt: number;
};

type SOSDataType = {
  id: string;

  victimName?: string;

  type: string;

  severity?: string;

  latitude: number;

  longitude: number;

  humanReadableLocation?: string;

  status: string;

  acceptedHospitalId?: string;

  acceptedHospitalName?: string;

  assignedAmbulance?: string;

  dispatchTime?: number;

  estimatedMinutes?: number;
};

function AmbulanceLogistics() {

  const [hospitalId,
    setHospitalId] =
    useState("");

  const [authReady,
    setAuthReady] =
    useState(false);

  const [hospitalName,
    setHospitalName] =
    useState("");

  const [hospitalAddress,
    setHospitalAddress] =
    useState("");

  const [hospitalLatitude,
    setHospitalLatitude] =
    useState(0);

  const [hospitalLongitude,
    setHospitalLongitude] =
    useState(0);

  const [ambulances,
    setAmbulances] =
    useState<
      AmbulanceType[]
    >([]);

  const [acceptedSOS,
    setAcceptedSOS] =
    useState<
      SOSDataType[]
    >([]);

  const [showModal,
    setShowModal] =
    useState(false);

  const [showDispatchModal,
    setShowDispatchModal] =
    useState(false);

  const [selectedAmbulance,
    setSelectedAmbulance] =
    useState<
      AmbulanceType | null
    >(null);

  const [selectedSOS,
    setSelectedSOS] =
    useState<
      SOSDataType | null
    >(null);

  const [ambulanceNumber,
    setAmbulanceNumber] =
    useState("");

  const [driverName,
    setDriverName] =
    useState("");

  const [driverPhone,
    setDriverPhone] =
    useState("");

  /* AUTH */

  useEffect(() => {

    const unsubscribe =
      auth.onAuthStateChanged(
        (user) => {

          if (user) {

            setHospitalId(
              user.uid
            );

          } else {

            setHospitalId(
              ""
            );

          }

          setAuthReady(
            true
          );

        }
      );

    return () =>
      unsubscribe();

  }, []);

  /* HOSPITAL */

  useEffect(() => {

    const fetchHospital =
      async () => {

        if (!hospitalId)
          return;

        const hospitalRef =
          doc(
            db,
            "hospitals",
            hospitalId
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
            ""
          );

          setHospitalAddress(
            data.fullAddress ||
            ""
          );

          setHospitalLatitude(
            data.latitude ||
            0
          );

          setHospitalLongitude(
            data.longitude ||
            0
          );

        }

      };

    fetchHospital();

  }, [hospitalId]);

  /* AMBULANCES */

  useEffect(() => {

    if (!hospitalId)
      return;

    const ambulanceQuery =
      query(

        collection(
          db,
          "ambulances"
        ),

        where(
          "hospitalId",
          "==",
          hospitalId
        )

      );

    const unsubscribe =
      onSnapshot(

        ambulanceQuery,

        (
          snapshot
        ) => {

          const firebaseData:
            AmbulanceType[] =
            snapshot.docs.map(
              (
                firebaseDoc
              ) => ({

                id:
                  firebaseDoc.id,

                ...(firebaseDoc.data() as Omit<
                  AmbulanceType,
                  "id"
                >),

              })
            );

          setAmbulances(
            firebaseData
          );

        }
      );

    return () =>
      unsubscribe();

  }, [hospitalId]);

  /* ACCEPTED SOS */

  useEffect(() => {

    if (!hospitalId)
      return;

    const sosQuery =
      query(

        collection(
          db,
          "sos"
        ),

        where(
          "acceptedHospitalId",
          "==",
          hospitalId
        )

      );

    const unsubscribe =
      onSnapshot(

        sosQuery,

        (
          snapshot
        ) => {

          const firebaseSOS:
            SOSDataType[] =
            snapshot.docs

              .map(
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

                    status:
                      data.status ||
                      "",

                    acceptedHospitalId:
                      data.acceptedHospitalId ||
                      "",

                    acceptedHospitalName:
                      data.acceptedHospitalName ||
                      "",

                    assignedAmbulance:
                      data.assignedAmbulance ||
                      "",

                    dispatchTime:
                      data.dispatchTime ||
                      0,

                    estimatedMinutes:
                      data.estimatedMinutes ||
                      0,

                  };

                }
              )

              .filter(
                (
                  sos
                ) =>
                  sos.status ===
                    "accepted" &&
                  !sos.assignedAmbulance
              );

          setAcceptedSOS(
            firebaseSOS
          );

        }
      );

    return () =>
      unsubscribe();

  }, [hospitalId]);

  /* DISTANCE */

  const calculateDistance =
    (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ) => {

      const R = 6371;

      const dLat =
        ((lat2 - lat1) *
          Math.PI) /
        180;

      const dLon =
        ((lon2 - lon1) *
          Math.PI) /
        180;

      const a =
        Math.sin(
          dLat / 2
        ) *
          Math.sin(
            dLat / 2
          ) +

        Math.cos(
          (lat1 *
            Math.PI) /
            180
        ) *

        Math.cos(
          (lat2 *
            Math.PI) /
            180
        ) *

        Math.sin(
          dLon / 2
        ) *

        Math.sin(
          dLon / 2
        );

      const c =
        2 *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(1 - a)
        );

      return R * c;

    };

  /* ETA */

  const calculateETA =
    (
      victimLat: number,
      victimLng: number
    ) => {

      const distance =
        calculateDistance(

          hospitalLatitude,
          hospitalLongitude,

          victimLat,
          victimLng

        );

      return Math.max(
        3,
        Math.round(
          distance * 3
        )
      );

    };

  /* SAVE AMBULANCE */

  const saveAmbulance =
    async () => {

      if (
        !ambulanceNumber ||
        !driverName ||
        !driverPhone
      ) {

        alert(
          "Fill all fields"
        );

        return;

      }

      await addDoc(

        collection(
          db,
          "ambulances"
        ),

        {
          hospitalId,

          hospitalName,

          hospitalAddress,

          ambulanceNumber,

          driverName,

          driverPhone,

          status:
            "available",

          progress: 0,

          incidentTitle:
            "",

          createdAt:
            Date.now(),
        }

      );

      setAmbulanceNumber(
        ""
      );

      setDriverName("");

      setDriverPhone("");

      setShowModal(
        false
      );

    };

  /* OPEN DISPATCH */

  const openDispatch =
    (
      ambulance:
        AmbulanceType
    ) => {

      setSelectedAmbulance(
        ambulance
      );

      setShowDispatchModal(
        true
      );

    };

  /* DISPATCH */

  const dispatchAmbulance =
    async () => {

      if (
        !selectedAmbulance ||
        !selectedSOS
      ) {

        alert(
          "Select SOS"
        );

        return;

      }

      const estimatedMinutes =
        calculateETA(

          selectedSOS.latitude,

          selectedSOS.longitude

        );

      await updateDoc(

        doc(
          db,
          "ambulances",
          selectedAmbulance.id
        ),

        {
          status:
            "dispatched",

          progress: 10,

          incidentTitle:
            selectedSOS.type,

          dispatchTime:
            Date.now(),

          estimatedMinutes,

          victimLat:
            selectedSOS.latitude,

          victimLng:
            selectedSOS.longitude,

          assignedSOS:
            selectedSOS.id,
        }

      );

      await updateDoc(

        doc(
          db,
          "sos",
          selectedSOS.id
        ),

        {
          assignedAmbulance:
            selectedAmbulance.ambulanceNumber,

          acceptedHospitalId:
            hospitalId,

          acceptedHospitalName:
            hospitalName,

          ambulanceStatus:
            "dispatched",

          driverName:
            selectedAmbulance.driverName,

          driverPhone:
            selectedAmbulance.driverPhone,

          dispatchTime:
            Date.now(),

          estimatedMinutes,

          progress: 10,
        }

      );

      setShowDispatchModal(
        false
      );

      setSelectedSOS(
        null
      );

    };

  /* LIVE TIMER */

  useEffect(() => {

    ambulances.forEach(
      async (
        ambulance
      ) => {

        if (
          ambulance.status !==
            "dispatched" ||
          ambulance.progress >=
            100
        )
          return;

        setTimeout(
          async () => {

            await updateDoc(

              doc(
                db,
                "ambulances",
                ambulance.id
              ),

              {
                progress:
                  ambulance.progress +
                  10,
              }

            );

          },

          60000
        );

      }
    );

  }, [ambulances]);

  /* ARRIVED */

  const markArrived =
    async (
      ambulanceId:
        string
    ) => {

      await updateDoc(

        doc(
          db,
          "ambulances",
          ambulanceId
        ),

        {
          status:
            "arrived",

          progress: 100,
        }

      );

    };

  /* RESET */

  const resetAmbulance =
    async (
      ambulance:
        AmbulanceType
    ) => {

      await updateDoc(

        doc(
          db,
          "ambulances",
          ambulance.id
        ),

        {
          status:
            "available",

          progress: 0,

          incidentTitle:
            "",

          dispatchTime:
            null,

          estimatedMinutes:
            null,

          assignedSOS:
            null,
        }

      );

    };

  /* MAINTENANCE */

  const maintenanceAmbulance =
    async (
      ambulanceId:
        string
    ) => {

      await updateDoc(

        doc(
          db,
          "ambulances",
          ambulanceId
        ),

        {
          status:
            "maintenance",
        }

      );

    };

  /* SEND LOCATION */

  const sendLocationToDriver =
    (
      ambulance:
        AmbulanceType
    ) => {

      if (
        !ambulance.victimLat ||
        !ambulance.victimLng
      ) {

        alert(
          "Victim location unavailable"
        );

        return;

      }

      const mapsLink =
        `https://maps.google.com/?q=${ambulance.victimLat},${ambulance.victimLng}`;

      const message =
        `Emergency Dispatch%0A%0AAmbulance: ${ambulance.ambulanceNumber}%0A%0ALocation:%0A${mapsLink}`;

      window.open(

        `https://wa.me/91${ambulance.driverPhone}?text=${message}`

      );

    };

  const activeUnits =
    useMemo(() => {

      return ambulances.filter(
        (ambulance) =>
          ambulance.status ===
            "dispatched" ||
          ambulance.status ===
            "arrived"
      );

    }, [ambulances]);

  if (!authReady) {

    return null;

  }

  return (

    <div className="ambulance-page">

      {/* HEADER */}

      <div className="fleet-header">

        <h1>
          Ambulance Fleet
        </h1>

        <button
          className="top-add-btn"
          onClick={() =>
            setShowModal(
              true
            )
          }
        >

          <Plus size={18} />

          Add Ambulance

        </button>

      </div>

      {/* EMPTY */}

      {ambulances.length ===
        0 && (

        <div className="empty-container">

          <div className="empty-card">

            <div className="empty-icon">

              <Ambulance
                size={70}
              />

            </div>

            <h1>
              No Ambulance
              Added
            </h1>

            <p>

              Add your hospital
              ambulance fleet
              to start dispatch
              operations.

            </p>

            <button
              className="add-btn"
              onClick={() =>
                setShowModal(
                  true
                )
              }
            >

              <Plus size={20} />

              Add Ambulance

            </button>

          </div>

        </div>

      )}

      {/* GRID */}

      {ambulances.length >
        0 && (

        <div className="fleet-grid">

          {ambulances.map(
            (
              ambulance
            ) => {

              const dispatchMinutes =
                ambulance.dispatchTime
                  ? Math.floor(
                      (
                        Date.now() -
                        ambulance.dispatchTime
                      ) /
                        60000
                    )
                  : 0;

              const etaLeft =
                ambulance.estimatedMinutes
                  ? Math.max(
                      ambulance.estimatedMinutes -
                        dispatchMinutes,
                      0
                    )
                  : 0;

              return (

                <div
                  className="fleet-card"
                  key={
                    ambulance.id
                  }
                >

                  <div className="fleet-top">

                    <div>

                      <h2>

                        {
                          ambulance.ambulanceNumber
                        }

                      </h2>

                      <p>

                        {
                          ambulance.driverName
                        }

                      </p>

                      <span className="hospital-name">

                        {
                          ambulance.hospitalName
                        }

                      </span>

                    </div>

                    <span
                      className={`status ${ambulance.status}`}
                    >

                      {
                        ambulance.status
                      }

                    </span>

                  </div>

                  <div className="fleet-info">

                    <p>

                      <strong>
                        Driver:
                      </strong>

                      {" "}

                      {
                        ambulance.driverPhone
                      }

                    </p>

                    <p>

                      <strong>
                        Hospital:
                      </strong>

                      {" "}

                      {
                        ambulance.hospitalAddress
                      }

                    </p>

                    {ambulance.status ===
                      "dispatched" && (

                      <>

                        <p className="incident-text">

                          {
                            ambulance.incidentTitle
                          }

                        </p>

                        <p>

                          ETA:
                          {" "}
                          {
                            etaLeft
                          }
                          mins

                        </p>

                      </>

                    )}

                  </div>

                  {(ambulance.status ===
                    "dispatched" ||
                    ambulance.status ===
                      "arrived") && (

                    <div className="progress-wrapper">

                      <div
                        className="progress-bar"
                        style={{
                          width:
                            `${ambulance.progress}%`,
                        }}
                      />

                    </div>

                  )}

                  <div className="fleet-actions">

                    {ambulance.status ===
                      "available" && (

                      <button
                        onClick={() =>
                          openDispatch(
                            ambulance
                          )
                        }
                      >

                        <Siren size={18} />

                        Dispatch

                      </button>

                    )}

                    {ambulance.status ===
                      "dispatched" && (

                      <button
                        onClick={() =>
                          sendLocationToDriver(
                            ambulance
                          )
                        }
                      >

                        <MapPinned size={18} />

                        Share Location

                      </button>

                    )}

                    {ambulance.status ===
                      "dispatched" && (

                      <button
                        className="maintenance-btn"
                        onClick={() =>
                          markArrived(
                            ambulance.id
                          )
                        }
                      >

                        <CheckCircle2 size={18} />

                        Arrived

                      </button>

                    )}

                    {ambulance.status ===
                      "available" && (

                      <button
                        className="maintenance-btn"
                        onClick={() =>
                          maintenanceAmbulance(
                            ambulance.id
                          )
                        }
                      >

                        <Wrench size={18} />

                        Maintenance

                      </button>

                    )}

                    {(ambulance.status ===
                      "arrived" ||
                      ambulance.status ===
                        "maintenance") && (

                      <button
                        className="reset-btn"
                        onClick={() =>
                          resetAmbulance(
                            ambulance
                          )
                        }
                      >

                        <RotateCcw size={18} />

                        Reset

                      </button>

                    )}

                  </div>

                </div>

              );

            }
          )}

        </div>

      )}

      {/* ADD MODAL */}

      {showModal && (

        <div className="modal-overlay">

          <div className="modal-box">

            <div className="modal-header">

              <h2>
                Add Ambulance
              </h2>

              <button
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
              >

                <X />

              </button>

            </div>

            <div className="form-grid">

              <input
                type="text"
                placeholder="Ambulance Number"
                value={
                  ambulanceNumber
                }
                onChange={(e) =>
                  setAmbulanceNumber(
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="Driver Name"
                value={
                  driverName
                }
                onChange={(e) =>
                  setDriverName(
                    e.target.value
                  )
                }
              />

              <input
                type="text"
                placeholder="Driver Phone"
                value={
                  driverPhone
                }
                onChange={(e) =>
                  setDriverPhone(
                    e.target.value
                  )
                }
              />

            </div>

            <button
              className="save-btn"
              onClick={
                saveAmbulance
              }
            >

              Save Ambulance

            </button>

          </div>

        </div>

      )}

      {/* DISPATCH MODAL */}

      {showDispatchModal && (

        <div className="modal-overlay">

          <div className="modal-box">

            <div className="modal-header">

              <h2>
                Assign SOS
              </h2>

              <button
                onClick={() =>
                  setShowDispatchModal(
                    false
                  )
                }
              >

                <X />

              </button>

            </div>

            <div className="sos-list">

              {acceptedSOS.length ===
              0 ? (

                <p className="no-sos">

                  No accepted SOS
                  available.

                </p>

              ) : (

                acceptedSOS.map(
                  (
                    sos
                  ) => (

                    <div
                      key={sos.id}
                      className={`sos-item ${
                        selectedSOS?.id ===
                        sos.id
                          ? "selected-sos"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedSOS(
                          sos
                        )
                      }
                    >

                      <h3>

                        {
                          sos.type
                        }

                      </h3>

                      <p>

                        SOS ID:
                        {" "}
                        {
                          sos.id
                        }

                      </p>

                      <p>

                        Victim:
                        {" "}
                        {
                          sos.victimName
                        }

                      </p>

                      <p>

                        Location:
                        {" "}
                        {
                          sos.humanReadableLocation
                        }

                      </p>

                      <span className="severity-tag">

                        {
                          sos.severity
                        }

                      </span>

                    </div>

                  )
                )

              )}

            </div>

            <button
              className="save-btn"
              onClick={
                dispatchAmbulance
              }
            >

              Confirm Dispatch

            </button>

          </div>

        </div>

      )}

    </div>

  );

}

export default AmbulanceLogistics;