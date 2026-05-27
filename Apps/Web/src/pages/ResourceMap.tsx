import { useEffect, useState } from "react";

import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";

import {
  Plus,
  Minus,
  LocateFixed,
} from "lucide-react";

import "../styles/ResourceMap.css";

type SOSDataType = {
  id: string;
  latitude: number;
  longitude: number;
  type: string;
  status: string;
  victimName?: string;
};

declare global {

  interface Window {

    googleMapInstance: google.maps.Map;

  }

}

function ResourceMap() {

  const [selectedSOS, setSelectedSOS] =
    useState<SOSDataType | null>(null);

  const { isLoaded } =
    useJsApiLoader({
      googleMapsApiKey:
        import.meta.env
          .VITE_GOOGLE_MAPS_API,
    });

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

              status:
                firebaseData.status || "",

              victimName:
                firebaseData.victimName || "",

            };

          });

        const accepted =
          data.find(
            (sos) =>
              sos.status === "accepted"
          );

        if (accepted) {

          setSelectedSOS(accepted);

        }

      }
    );

    return () => unsubscribe();

  }, []);

  if (!isLoaded) {

    return (
      <h1 className="loading-map">
        Loading Map...
      </h1>
    );

  }

  return (

    <div className="resource-page">

      <div className="resource-body">

        {/* MAP */}

        <div className="resource-map-container">

          <GoogleMap
            mapContainerStyle={{
              width: "100%",
              height: "100%",
            }}

            center={{
              lat:
                selectedSOS?.latitude ||
                28.6139,

              lng:
                selectedSOS?.longitude ||
                77.2090,
            }}

            zoom={13}

            onLoad={(map) => {

              window.googleMapInstance =
                map;

            }}

            options={{
              disableDefaultUI: true,
              zoomControl: false,
            }}
          >

            {selectedSOS && (

              <Marker
                position={{
                  lat:
                    selectedSOS.latitude,

                  lng:
                    selectedSOS.longitude,
                }}
              />

            )}

          </GoogleMap>

          {/* CONTROLS */}

          <div className="resource-controls">

            <button
              onClick={() => {

                const map =
                  window.googleMapInstance;

                if (map) {

                  map.setZoom(
                    map.getZoom()! + 1
                  );

                }

              }}
            >
              <Plus size={24} />
            </button>

            <button
              onClick={() => {

                const map =
                  window.googleMapInstance;

                if (map) {

                  map.setZoom(
                    map.getZoom()! - 1
                  );

                }

              }}
            >
              <Minus size={24} />
            </button>

            <button
              onClick={() => {

                const map =
                  window.googleMapInstance;

                if (
                  map &&
                  selectedSOS
                ) {

                  map.panTo({
                    lat:
                      selectedSOS.latitude,

                    lng:
                      selectedSOS.longitude,
                  });

                }

              }}
            >
              <LocateFixed size={24} />
            </button>

          </div>

        </div>

        {/* RIGHT PANEL */}

        <div className="incident-panel">

          <div className="incident-header">

            <h2>
              INCIDENT FOCUS
            </h2>

            <span>
              URGENT
            </span>

          </div>

          {selectedSOS && (

            <div className="incident-card">

              <div className="incident-top">

                <div className="incident-icon">
                  🚨
                </div>

                <div>

                  <h1>
                    {selectedSOS.type}
                  </h1>

                  <p className="incident-location">
                    Live Emergency Location
                  </p>

                </div>

              </div>

              <div className="incident-divider"></div>

              <div className="incident-grid">

                <div>

                  <h4>STATUS</h4>

                  <p className="red-text">
                    {selectedSOS.status}
                  </p>

                </div>

                <div>

                  <h4>LATITUDE</h4>

                  <p>
                    {selectedSOS.latitude}
                  </p>

                </div>

                <div>

                  <h4>LONGITUDE</h4>

                  <p>
                    {selectedSOS.longitude}
                  </p>

                </div>

                {selectedSOS.victimName && (

                  <div>

                    <h4>VICTIM</h4>

                    <p>
                      {selectedSOS.victimName}
                    </p>

                  </div>

                )}

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}

export default ResourceMap;