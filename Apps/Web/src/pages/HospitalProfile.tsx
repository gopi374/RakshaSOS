import { useEffect, useMemo, useState } from "react";

import {
  collection,
  addDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebaseConfig";

import "../styles/HospitalProfile.css";

import {
  Activity,
  Building2,
  Phone,
  MapPin,
  Shield,
  Ambulance,
  Users,
  Plus,
  Stethoscope,
  HeartPulse,
  Brain,
  Baby,
  Save,
} from "lucide-react";

type HospitalType = {
  hospitalName: string;

  location: string;

  emergencyPhone: string;

  latitude?: number;

  longitude?: number;

  acceptingEmergency?: boolean;

  facilities?: {
    emergencyBeds: boolean;

    icuAvailable: boolean;

    ventilatorAvailable: boolean;

    bloodBank: boolean;

    traumaCare: boolean;

    cardiacCenter: boolean;
  };
};

type DoctorType = {
  id: string;

  hospitalId: string;

  doctorName: string;

  specialization: string;

  phone: string;

  available: boolean;

  createdAt: any;
};

type AmbulanceType = {
  id: string;

  hospitalId: string;

  status: string;
};

function HospitalProfile() {

  const currentUser =
    auth.currentUser;

  const hospitalId =
    currentUser?.uid || "";

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    hospital,
    setHospital,
  ] =
    useState<HospitalType>({
      hospitalName: "",
      location: "",
      emergencyPhone: "",

      acceptingEmergency:
        true,

      facilities: {
        emergencyBeds:
          false,

        icuAvailable:
          false,

        ventilatorAvailable:
          false,

        bloodBank:
          false,

        traumaCare:
          false,

        cardiacCenter:
          false,
      },
    });

  const [
    doctors,
    setDoctors,
  ] = useState<
    DoctorType[]
  >([]);

  const [
    ambulances,
    setAmbulances,
  ] = useState<
    AmbulanceType[]
  >([]);

  const [
    doctorName,
    setDoctorName,
  ] = useState("");

  const [
    specialization,
    setSpecialization,
  ] = useState("");

  const [
    doctorPhone,
    setDoctorPhone,
  ] = useState("");

  /* HOSPITAL */

  useEffect(() => {

    if (!hospitalId)
      return;

    const hospitalRef =
      doc(
        db,
        "hospitals",
        hospitalId
      );

    const unsubscribe =
      onSnapshot(
        hospitalRef,
        (
          snapshot
        ) => {

          if (
            snapshot.exists()
          ) {

            const data =
              snapshot.data();

            setHospital({
              hospitalName:
                data.hospitalName ||
                "",

              location:
                data.location ||
                "",

              emergencyPhone:
                data.emergencyPhone ||
                "",

              latitude:
                data.latitude ||
                0,

              longitude:
                data.longitude ||
                0,

              acceptingEmergency:
                data.acceptingEmergency ??
                true,

              facilities:
                data.facilities || {
                  emergencyBeds:
                    false,

                  icuAvailable:
                    false,

                  ventilatorAvailable:
                    false,

                  bloodBank:
                    false,

                  traumaCare:
                    false,

                  cardiacCenter:
                    false,
                },
            });

          }

          setLoading(false);

        }
      );

    return () =>
      unsubscribe();

  }, [hospitalId]);

  /* DOCTORS */

  useEffect(() => {

    if (!hospitalId)
      return;

    const q = query(
      collection(
        db,
        "doctors"
      ),

      where(
        "hospitalId",
        "==",
        hospitalId
      ),

      orderBy(
        "createdAt",
        "desc"
      )
    );

    const unsubscribe =
      onSnapshot(
        q,
        (
          snapshot
        ) => {

          const data =
            snapshot.docs.map(
              (
                firebaseDoc
              ) => ({

                id:
                  firebaseDoc.id,

                ...(firebaseDoc.data() as Omit<
                  DoctorType,
                  "id"
                >),
              })
            );

          setDoctors(data);

        }
      );

    return () =>
      unsubscribe();

  }, [hospitalId]);

  /* AMBULANCES */

  useEffect(() => {

    if (!hospitalId)
      return;

    const q = query(
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
        q,
        (
          snapshot
        ) => {

          const data =
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

          setAmbulances(data);

        }
      );

    return () =>
      unsubscribe();

  }, [hospitalId]);

  /* COUNTS */

  const availableCount =
    ambulances.filter(
      (
        ambulance
      ) =>
        ambulance.status ===
        "available"
    ).length;

  const dispatchedCount =
    ambulances.filter(
      (
        ambulance
      ) =>
        ambulance.status ===
        "dispatched"
    ).length;

  const maintenanceCount =
    ambulances.filter(
      (
        ambulance
      ) =>
        ambulance.status ===
        "maintenance"
    ).length;

  /* TOGGLE */

  const toggleFacility =
    async (
      key:
        keyof HospitalType["facilities"]
    ) => {

      if (!hospitalId)
        return;

      const updated =
        {
          ...hospital.facilities,

          [key]:
            !hospital
              .facilities?.[
              key
            ],
        };


      

      await updateDoc(
        doc(
          db,
          "hospitals",
          hospitalId
        ),

        {
          facilities:
            updated,
        }
      );

    };

  /* SAVE */

  const saveHospital =
    async () => {

      if (!hospitalId)
        return;

      await updateDoc(
        doc(
          db,
          "hospitals",
          hospitalId
        ),

        {
          hospitalName:
            hospital.hospitalName,

          location:
            hospital.location,

          emergencyPhone:
            hospital.emergencyPhone,

          acceptingEmergency:
            hospital.acceptingEmergency,

          facilities:
            hospital.facilities,
        }
      );

      alert(
        "Hospital profile updated"
      );

    };

  /* ADD DOCTOR */

  const addDoctor =
    async () => {

      if (
        !doctorName ||
        !specialization ||
        !doctorPhone
      ) {

        alert(
          "Fill all fields"
        );

        return;

      }

      await addDoc(
        collection(
          db,
          "doctors"
        ),

        {
          hospitalId,

          doctorName,

          specialization,

          phone:
            doctorPhone,

          available:
            true,

          createdAt:
            serverTimestamp(),
        }
      );

      setDoctorName("");

      setSpecialization(
        ""
      );

      setDoctorPhone("");

    };

  /* DOCTOR STATUS */

  const toggleDoctor =
    async (
      doctorId: string,
      current:
        boolean
    ) => {

      await updateDoc(
        doc(
          db,
          "doctors",
          doctorId
        ),

        {
          available:
            !current,
        }
      );

    };

  const mapPreview =
    useMemo(() => {

      if (
        hospital.latitude &&
        hospital.longitude
      ) {

        return `https://maps.google.com/maps?q=${hospital.latitude},${hospital.longitude}&z=15&output=embed`;

      }

      return "";

    }, [
      hospital.latitude,
      hospital.longitude,
    ]);

  if (loading) {

    return (
      <div className="profile-loading">

        Loading...

      </div>
    );

  }

  return (

    <div className="hospital-profile-page">

      {/* HEADER */}

      <div className="profile-header">

        <div>

          <h1>
            Hospital
            Profile
          </h1>

          <p>
            Manage
            facilities,
            staff,
            and
            emergency
            readiness.
          </p>

        </div>

        <button
          className="save-profile-btn"
          onClick={
            saveHospital
          }
        >

          <Save size={18} />

          Save Changes

        </button>

      </div>

      {/* TOP */}

      <div className="profile-top-grid">

        {/* PROFILE */}

        <div className="hospital-main-card">

          <div className="hospital-main-left">

            <div className="hospital-name-row">

              <Building2
                size={28}
              />

              <input
                type="text"
                value={
                  hospital.hospitalName
                }
                onChange={(
                  e
                ) =>
                  setHospital(
                    (
                      previous
                    ) => ({
                      ...previous,

                      hospitalName:
                        e
                          .target
                          .value,
                    })
                  )
                }
                placeholder="Hospital Name"
              />

            </div>

            <div className="hospital-status-pill">

              <Activity
                size={16}
              />

              {hospital.acceptingEmergency
                ? "Accepting Emergencies"
                : "Closed"}

            </div>

            <div className="hospital-info-grid">

              <div className="hospital-info-box">

                <MapPin
                  size={18}
                />

                <div>

                  <span>
                    Address
                  </span>

                  <textarea
                    value={
                      hospital.location
                    }
                    onChange={(
                      e
                    ) =>
                      setHospital(
                        (
                          previous
                        ) => ({
                          ...previous,

                          location:
                            e
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Enter hospital address"
                  />

                </div>

              </div>

              <div className="hospital-info-box">

                <Phone
                  size={18}
                />

                <div>

                  <span>
                    Emergency
                    Hotline
                  </span>

                  <input
                    type="text"
                    value={
                      hospital.emergencyPhone
                    }
                    onChange={(
                      e
                    ) =>
                      setHospital(
                        (
                          previous
                        ) => ({
                          ...previous,

                          emergencyPhone:
                            e
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="+91 XXXXX XXXXX"
                  />

                </div>

              </div>

            </div>

          </div>

          <div className="hospital-map-card">

            {mapPreview ? (

              <iframe
                src={
                  mapPreview
                }
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="hospital-map"
              />

            ) : (

              <div className="no-map">

                Add hospital
                coordinates
                during signup

              </div>

            )}

          </div>

        </div>

        {/* STATS */}

        <div className="hospital-stats-grid">

          <div className="stats-card">

            <Ambulance
              size={24}
            />

            <h2>

              {
                ambulances.length
              }

            </h2>

            <p>
              Total Fleet
            </p>

          </div>

          <div className="stats-card active-stat">

            <Activity
              size={24}
            />

            <h2>

              {
                availableCount
              }

            </h2>

            <p>
              Available
            </p>

          </div>

          <div className="stats-card dispatch-stat">

            <Shield
              size={24}
            />

            <h2>

              {
                dispatchedCount
              }

            </h2>

            <p>
              Dispatched
            </p>

          </div>

          <div className="stats-card maintenance-stat">

            <Users
              size={24}
            />

            <h2>

              {
                maintenanceCount
              }

            </h2>

            <p>
              Maintenance
            </p>

          </div>

        </div>

      </div>

      {/* BOTTOM */}

      <div className="profile-bottom-grid">

        {/* FACILITIES */}

        <div className="facilities-card">

          <div className="section-title">

            <HeartPulse
              size={20}
            />

            <h2>
              Facilities
            </h2>

          </div>

          <div className="facility-list">

            {[
              {
                key:
                  "emergencyBeds",

                label:
                  "Emergency Beds",
              },

              {
                key:
                  "icuAvailable",

                label:
                  "ICU Availability",
              },

              {
                key:
                  "ventilatorAvailable",

                label:
                  "Ventilators",
              },

              {
                key:
                  "bloodBank",

                label:
                  "Blood Bank",
              },

              {
                key:
                  "traumaCare",

                label:
                  "Trauma Care",
              },

              {
                key:
                  "cardiacCenter",

                label:
                  "Cardiac Center",
              },
            ].map(
              (
                item
              ) => (

                <div
                  key={
                    item.key
                  }
                  className="facility-item"
                >

                  <span>

                    {
                      item.label
                    }

                  </span>

                  <button
                    className={`toggle-btn ${
                      hospital
                        .facilities?.[
                        item.key as keyof HospitalType["facilities"]
                      ]
                        ? "toggle-active"
                        : ""
                    }`}
                    onClick={() =>
                      toggleFacility(
                        item.key as keyof HospitalType["facilities"]
                      )
                    }
                  >

                    <div className="toggle-circle" />

                  </button>

                </div>

              )
            )}

          </div>

        </div>

        {/* DOCTORS */}

        <div className="doctor-wrapper">

          {/* ADD */}

          <div className="doctor-add-card">

            <div className="section-title">

              <Plus
                size={20}
              />

              <h2>
                Register New
                Doctor
              </h2>

            </div>

            <div className="doctor-form-grid">

              <input
                type="text"
                placeholder="Doctor Name"
                value={
                  doctorName
                }
                onChange={(
                  e
                ) =>
                  setDoctorName(
                    e.target.value
                  )
                }
              />

              <select
                value={
                  specialization
                }
                onChange={(
                  e
                ) =>
                  setSpecialization(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select
                  Specialization
                </option>

                <option>
                  Cardiology
                </option>

                <option>
                  Neurosurgeon
                </option>

                <option>
                  Pediatrician
                </option>

                <option>
                  General
                  Physician
                </option>

              </select>

              <input
                type="text"
                placeholder="+91 XXXXX XXXXX"
                value={
                  doctorPhone
                }
                onChange={(
                  e
                ) =>
                  setDoctorPhone(
                    e.target.value
                  )
                }
              />

            </div>

            <button
              className="doctor-register-btn"
              onClick={
                addDoctor
              }
            >

              Register Doctor

            </button>

          </div>

          {/* STAFF */}

          <div className="staff-card">

            <div className="section-title">

              <Users
                size={20}
              />

              <h2>
                Staff
                Availability
              </h2>

            </div>

            <div className="doctor-list">

              {doctors.length ===
              0 ? (

                <div className="empty-doctor">

                  No doctors
                  added yet.

                </div>

              ) : (

                doctors.map(
                  (
                    doctor
                  ) => (

                    <div
                      key={
                        doctor.id
                      }
                      className="doctor-item"
                    >

                      <div className="doctor-left">

                        <div className="doctor-avatar">

                          {doctor.specialization ===
                          "Cardiology" ? (
                            <HeartPulse size={20} />
                          ) : doctor.specialization ===
                            "Neurosurgeon" ? (
                            <Brain size={20} />
                          ) : (
                            <Baby size={20} />
                          )}

                        </div>

                        <div>

                          <h3>

                            {
                              doctor.doctorName
                            }

                          </h3>

                          <p>

                            {
                              doctor.specialization
                            }

                          </p>

                        </div>

                      </div>

                      <div className="doctor-right">

                        <span>

                          {
                            doctor.phone
                          }

                        </span>

                        <button
                          className={`toggle-btn ${
                            doctor.available
                              ? "toggle-active"
                              : ""
                          }`}
                          onClick={() =>
                            toggleDoctor(
                              doctor.id,
                              doctor.available
                            )
                          }
                        >

                          <div className="toggle-circle" />

                        </button>

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}

export default HospitalProfile;