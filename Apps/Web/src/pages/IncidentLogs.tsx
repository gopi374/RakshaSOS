import { useEffect, useMemo, useState } from "react";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebaseConfig";

import "../styles/IncidentLogs.css";

import {
  ShieldAlert,
  Ambulance,
  MapPinned,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Image as ImageIcon,
  AudioLines,
} from "lucide-react";

type IncidentType = {
  id: string;

  victimName: string;

  victimPhone?: string;

  type: string;

  severity: string;

  status: string;

  aiVerification: string;

  humanReadableLocation: string;

  latitude?: number;

  longitude?: number;

  medicalHistory?: string;

  bloodGroup?: string;

  acceptedHospitalId?: string;

  acceptedHospitalName?: string;

  assignedAmbulance?: string;

  ambulanceStatus?: string;

  estimatedMinutes?: number;

  dispatchTime?: number;

  driverName?: string;

  driverPhone?: string;

  imageUrl?: string;

  voiceNote?: string;

  createdAt: number;
};

function IncidentLogs() {

  const [authReady,
    setAuthReady] =
    useState(false);

  const [currentHospitalId,
    setCurrentHospitalId] =
    useState("");

  const [incidents,
    setIncidents] =
    useState<
      IncidentType[]
    >([]);

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

          setAuthReady(
            true
          );

        }
      );

    return () =>
      unsubscribe();

  }, []);

  /* INCIDENTS */

  useEffect(() => {

    if (
      !currentHospitalId
    )
      return;

    const incidentQuery =
      query(

        collection(
          db,
          "sos"
        ),

        where(
          "acceptedHospitalId",
          "==",
          currentHospitalId
        )

      );

    const unsubscribe =
      onSnapshot(

        incidentQuery,

        (
          snapshot
        ) => {

          const firebaseData:
            IncidentType[] =
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

                    victimPhone:
                      data.victimPhone ||
                      "",

                    type:
                      data.type ||
                      "Emergency",

                    severity:
                      data.severity ||
                      "medium",

                    status:
                      data.status ||
                      "accepted",

                    aiVerification:
                      data.aiVerification ||
                      "verified",

                    humanReadableLocation:
                      data.humanReadableLocation ||
                      "Unknown Location",

                    latitude:
                      data.latitude ||
                      0,

                    longitude:
                      data.longitude ||
                      0,

                    medicalHistory:
                      data.medicalHistory ||
                      "No medical history",

                    bloodGroup:
                      data.bloodGroup ||
                      "Unknown",

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

                    driverName:
                      data.driverName ||
                      "",

                    driverPhone:
                      data.driverPhone ||
                      "",

                    imageUrl:
                      data.imageUrl ||
                      "",

                    voiceNote:
                      data.voiceNote ||
                      "",

                    createdAt:
                      data.createdAt ||
                      Date.now(),

                  };

                }
              )

              .filter(
                (
                  incident
                ) =>

                  incident.status !==
                  "pending"

              )

              .sort(
                (
                  a,
                  b
                ) =>
                  (b.createdAt ||
                    0) -
                  (a.createdAt ||
                    0)
              );

          setIncidents(
            firebaseData
          );

        }
      );

    return () =>
      unsubscribe();

  }, [currentHospitalId]);

  /* STATS */

  const activeAmbulanceCount =
    useMemo(() => {

      return incidents.filter(
        (
          incident
        ) =>

          incident.assignedAmbulance &&
          incident.ambulanceStatus ===
            "dispatched"

      ).length;

    }, [incidents]);

  const criticalCount =
    useMemo(() => {

      return incidents.filter(
        (
          incident
        ) =>

          incident.severity ===
          "critical"

      ).length;

    }, [incidents]);

  const resolvedCount =
    useMemo(() => {

      return incidents.filter(
        (
          incident
        ) =>

          incident.status ===
          "completed"

      ).length;

    }, [incidents]);

  const activeIncidentCount =
    useMemo(() => {

      return incidents.filter(
        (
          incident
        ) =>

          incident.status ===
            "accepted" ||
          incident.status ===
            "dispatched"

      ).length;

    }, [incidents]);

  if (!authReady) {

    return null;

  }

  return (

    <div className="incident-page">

      {/* TOP STATS */}

      <div className="incident-top">

        <div className="incident-card">

          <div>

            <p>
              Active Incidents
            </p>

            <h2>

              {
                activeIncidentCount
              }

            </h2>

          </div>

          <ShieldAlert
            size={38}
          />

        </div>

        <div className="incident-card">

          <div>

            <p>
              Active Ambulances
            </p>

            <h2>

              {
                activeAmbulanceCount
              }

            </h2>

          </div>

          <Ambulance
            size={38}
          />

        </div>

        <div className="incident-card">

          <div>

            <p>
              Critical Cases
            </p>

            <h2>

              {
                criticalCount
              }

            </h2>

          </div>

          <AlertTriangle
            size={38}
          />

        </div>

        <div className="incident-card">

          <div>

            <p>
              Resolved Cases
            </p>

            <h2>

              {
                resolvedCount
              }

            </h2>

          </div>

          <CheckCircle2
            size={38}
          />

        </div>

      </div>

      {/* TABLE */}

      <div className="incident-table">

        <div className="table-head">

          <div>
            SOS ID
          </div>

          <div>
            Victim
          </div>

          <div>
            Emergency
          </div>

          <div>
            Severity
          </div>

          <div>
            AI Check
          </div>

          <div>
            Active Ambulance
          </div>

          <div>
            Location
          </div>

          <div>
            Evidence
          </div>

        </div>

        {incidents.length ===
        0 ? (

          <div className="empty-incidents">

            <h3>
              No Incidents Found
            </h3>

            <p>

              Accepted incidents
              will appear here.

            </p>

          </div>

        ) : (

          incidents.map(
            (
              incident
            ) => {

              const dispatchMinutes =
                incident.dispatchTime
                  ? Math.floor(
                      (
                        Date.now() -
                        incident.dispatchTime
                      ) /
                        60000
                    )
                  : 0;

              return (

                <div
                  className="table-row"
                  key={
                    incident.id
                  }
                >

                  {/* ID */}

                  <div className="table-id">

                    <strong>

                      #
                      {
                        incident.id.slice(
                          0,
                          6
                        )
                      }

                    </strong>

                    <p>

                      <Clock3
                        size={12}
                      />

                      {" "}

                      {
                        new Date(
                          incident.createdAt
                        ).toLocaleDateString()
                      }

                    </p>

                  </div>

                  {/* VICTIM */}

                  <div className="incident-type">

                    <div>

                      <strong>

                        {
                          incident.victimName
                        }

                      </strong>

                      <p>

                        {
                          incident.bloodGroup
                        }

                      </p>

                    </div>

                  </div>

                  {/* TYPE */}

                  <div>

                    <strong>

                      {
                        incident.type
                      }

                    </strong>

                    <p>

                      {
                        incident.medicalHistory
                      }

                    </p>

                  </div>

                  {/* SEVERITY */}

                  <div>

                    <span
                      className={`severity-badge ${incident.severity}`}
                    >

                      {
                        incident.severity
                      }

                    </span>

                  </div>

                  {/* AI */}

                  <div>

                    <span
                      className={`ai-badge ${
                        incident.aiVerification ===
                        "verified"
                          ? "real"
                          : "fake"
                      }`}
                    >

                      {
                        incident.aiVerification
                      }

                    </span>

                  </div>

                  {/* AMBULANCE */}

                  <div>

                    {incident.assignedAmbulance ? (

                      <>

                        <span className="status-badge accepted">

                          {
                            incident.assignedAmbulance
                          }

                        </span>

                        <p className="ambulance-meta">

                          ETA:
                          {" "}
                          {
                            incident.estimatedMinutes
                          }
                          m

                        </p>

                        <p className="ambulance-meta">

                          {
                            incident.driverName
                          }

                        </p>

                      </>

                    ) : (

                      <span className="status-badge pending">

                        Waiting Dispatch

                      </span>

                    )}

                  </div>

                  {/* LOCATION */}

                  <div className="location-box">

                    <div className="location-top">

                      <MapPinned
                        size={14}
                      />

                      <span>

                        {
                          incident.humanReadableLocation
                        }

                      </span>

                    </div>

                    <p className="coordinates">

                      {
                        incident.latitude?.toFixed(
                          4
                        )
                      }

                      {", "}

                      {
                        incident.longitude?.toFixed(
                          4
                        )
                      }

                    </p>

                  </div>

                  {/* EVIDENCE */}

                  <div className="evidence-box">

                    {incident.imageUrl && (

                      <img
                        src={
                          incident.imageUrl
                        }
                        alt="evidence"
                      />

                    )}

                    {incident.voiceNote && (

                      <audio controls>

                        <source
                          src={
                            incident.voiceNote
                          }
                        />

                      </audio>

                    )}

                    {!incident.imageUrl &&
                      !incident.voiceNote && (

                      <div className="no-proof">

                        <ImageIcon
                          size={15}
                        />

                        <AudioLines
                          size={15}
                        />

                        No Evidence

                      </div>

                    )}

                  </div>

                </div>

              );

            }
          )

        )}

      </div>

    </div>

  );

}

export default IncidentLogs;