import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import MapView from 'react-native-maps/lib/MapView';
import Marker from 'react-native-maps/lib/MapMarker';
import { Region } from 'react-native-maps/lib/sharedTypes';
import * as Location from 'expo-location';
import {
  ArrowLeft,
  Compass,
  HeartPulse,
  Map as MapIcon,
  MapPin,
  Navigation as NavigationIcon,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react-native';

type NearbyFilter = 'all' | 'hospital' | 'police';

type NearbyPlace = {
  id: string;
  type: 'hospital' | 'police';
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  distanceMeters: number;
};

type GooglePlaceResult = {
  id?: string;
  name?: string;
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  types?: string[];
};

const DEFAULT_REGION: Region = {
  latitude: 23.2599,
  longitude: 77.4126,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

const SEARCH_RADIUS_METERS = 5000;

const filterOptions: Array<{ id: NearbyFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'hospital', label: 'Hospitals' },
  { id: 'police', label: 'Police' },
];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(fromLat: number, fromLon: number, toLat: number, toLon: number) {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLon - fromLon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${meters} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

function getPlaceKey(place: NearbyPlace) {
  return [
    place.type,
    place.name.toLowerCase(),
    place.latitude.toFixed(4),
    place.longitude.toFixed(4),
  ].join(':');
}

function getGoogleMapsApiKey() {
  const extra = (Constants.expoConfig?.extra ?? Constants.manifest2?.extra ?? {}) as Record<string, unknown>;
  return typeof extra.googleMapsApiKey === 'string' ? extra.googleMapsApiKey : '';
}

async function fetchNearbyPlaces(latitude: number, longitude: number): Promise<NearbyPlace[]> {
  const googleMapsApiKey = getGoogleMapsApiKey();

  if (!googleMapsApiKey) {
    throw new Error('Google Maps API key is missing. Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local.');
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleMapsApiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types',
    },
    body: JSON.stringify({
      includedTypes: ['hospital', 'police'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: SEARCH_RADIUS_METERS,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Nearby places could not be loaded from Google Places.');
  }

  const data = (await response.json()) as { places?: Array<GooglePlaceResult & { displayName?: { text?: string } }> };

  const mappedPlaces = (data.places ?? [])
    .map((element): NearbyPlace | null => {
      const placeLat = element.location?.latitude;
      const placeLon = element.location?.longitude;
      const placeType = element.types?.includes('hospital') ? 'hospital' : element.types?.includes('police') ? 'police' : null;

      if (!placeLat || !placeLon || !placeType) {
        return null;
      }

      return {
        id: element.id || `${placeType}-${placeLat}-${placeLon}`,
        type: placeType,
        name:
          element.displayName?.text ||
          element.name ||
          (placeType === 'hospital' ? 'Nearby hospital' : 'Nearby police station'),
        latitude: placeLat,
        longitude: placeLon,
        address: element.formattedAddress,
        distanceMeters: getDistanceMeters(latitude, longitude, placeLat, placeLon),
      };
    })
    .filter((place): place is NearbyPlace => Boolean(place));

  const uniquePlaces = new Map<string, NearbyPlace>();

  mappedPlaces.forEach((place) => {
    const key = getPlaceKey(place);
    const current = uniquePlaces.get(key);

    if (!current || place.distanceMeters < current.distanceMeters) {
      uniquePlaces.set(key, place);
    }
  });

  return Array.from(uniquePlaces.values()).sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export default function MapScreen({ navigation }: any) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<NearbyFilter>('all');
  const [isLocating, setIsLocating] = useState(true);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const hasGoogleMapsApiKey = Boolean(getGoogleMapsApiKey());

  const filteredPlaces = useMemo(() => {
    if (selectedFilter === 'all') {
      return places;
    }

    return places.filter((place) => place.type === selectedFilter);
  }, [places, selectedFilter]);

  const loadNearbyPlaces = async (latitude: number, longitude: number) => {
    setIsLoadingPlaces(true);

    try {
      const nextPlaces = await fetchNearbyPlaces(latitude, longitude);
      setPlaces(nextPlaces);
    } catch (error) {
      console.error('Error loading nearby map places:', error);
      Alert.alert(
        'Nearby places unavailable',
        'The map is working, but nearby hospitals and police stations could not be refreshed right now.',
      );
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const locateUser = async () => {
    setIsLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Location access needed', 'Allow location access to show nearby hospitals and police stations.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const nextRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.045,
        longitudeDelta: 0.045,
      };

      setUserLocation(location.coords);
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 650);
      await loadNearbyPlaces(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error locating user for map:', error);
      Alert.alert('Location unavailable', 'We could not read your current location. Showing the default city map.');
    } finally {
      setIsLocating(false);
    }
  };

  const openRoute = (place: NearbyPlace) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Route unavailable', 'Could not open maps for directions.');
    });
  };

  useEffect(() => {
    locateUser();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#ac2b2e" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Raksha Safe Map</Text>
        <MapIcon size={22} color="#ac2b2e" />
      </View>

      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={DEFAULT_REGION}
          region={region}
          mapType="standard"
          showsUserLocation={Boolean(userLocation)}
          showsMyLocationButton={false}
          onRegionChangeComplete={setRegion}
        >
          {userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title="You are here"
            >
              <View style={styles.userMarkerOuter}>
                <View style={styles.userMarkerInner} />
              </View>
            </Marker>
          )}

          {filteredPlaces.map((place) => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              title={place.name}
              description={`${place.type === 'hospital' ? 'Hospital' : 'Police station'} - ${formatDistance(place.distanceMeters)}`}
              pinColor={place.type === 'hospital' ? '#ac2b2e' : '#2b59ac'}
            />
          ))}
        </MapView>

        <View style={styles.filterBar}>
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.locateButton} onPress={locateUser} disabled={isLocating}>
          {isLocating ? <ActivityIndicator size="small" color="#59413f" /> : <Compass size={22} color="#59413f" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => loadNearbyPlaces(region.latitude, region.longitude)}
          disabled={isLoadingPlaces}
        >
          {isLoadingPlaces ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <RefreshCw size={18} color="#fff" />
          )}
          <Text style={styles.refreshText}>Refresh Nearby</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        {!hasGoogleMapsApiKey && (
          <View style={styles.setupBanner}>
            <Text style={styles.setupTitle}>Google Maps API key needed</Text>
            <Text style={styles.setupText}>
              Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local to enable the map and nearby hospital/police search.
            </Text>
          </View>
        )}

        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Nearby Emergency Help</Text>
            <Text style={styles.panelSubtitle}>
              {filteredPlaces.length} result{filteredPlaces.length === 1 ? '' : 's'} within {SEARCH_RADIUS_METERS / 1000} km
            </Text>
          </View>
          {(isLocating || isLoadingPlaces) && <ActivityIndicator color="#ac2b2e" />}
        </View>

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredPlaces.length === 0 ? (
            <View style={styles.emptyCard}>
              <MapPin size={22} color="#ac2b2e" />
              <Text style={styles.emptyTitle}>No nearby results loaded</Text>
              <Text style={styles.emptyText}>Refresh nearby places or allow location access.</Text>
            </View>
          ) : (
            filteredPlaces.map((place) => (
              <View key={place.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.placeIcon}>
                    {place.type === 'hospital' ? (
                      <HeartPulse size={18} color="#ac2b2e" />
                    ) : (
                      <ShieldCheck size={18} color="#2b59ac" />
                    )}
                  </View>
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeType}>
                      {place.type === 'hospital' ? 'Hospital' : 'Police station'} - {formatDistance(place.distanceMeters)}
                    </Text>
                    {place.address ? <Text style={styles.placeAddress}>{place.address}</Text> : null}
                  </View>
                </View>

                <TouchableOpacity style={styles.routeButton} onPress={() => openRoute(place)}>
                  <NavigationIcon size={16} color="#fff" />
                  <Text style={styles.routeButtonText}>Get Route</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0bfbc',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1c1b',
    flex: 1,
    marginLeft: 8,
  },
  mapArea: {
    height: 360,
    position: 'relative',
    backgroundColor: '#e6dedc',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  filterBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 58,
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flex: 1,
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0bfbc',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  filterChipActive: {
    backgroundColor: '#ac2b2e',
    borderColor: '#ac2b2e',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#59413f',
  },
  filterTextActive: {
    color: '#fff',
  },
  userMarkerOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(43, 89, 172, 0.22)',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2b59ac',
  },
  locateButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0bfbc',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#ac2b2e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
  },
  refreshText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  panel: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginTop: -14,
    paddingTop: 16,
  },
  setupBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0bfbc',
    borderRadius: 10,
    backgroundColor: '#fff1f0',
    padding: 12,
  },
  setupTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ac2b2e',
  },
  setupText: {
    marginTop: 4,
    fontSize: 12,
    color: '#59413f',
    lineHeight: 17,
  },
  panelHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1c1b',
  },
  panelSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#59413f',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: '#e0bfbc',
    backgroundColor: '#faf9f7',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1a1c1b',
  },
  emptyText: {
    fontSize: 12,
    color: '#59413f',
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e0bfbc',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#faf9f7',
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 10,
  },
  placeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ead5d5',
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1a1c1b',
  },
  placeType: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#ac2b2e',
  },
  placeAddress: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: '#59413f',
  },
  routeButton: {
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: '#ac2b2e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  routeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
});
