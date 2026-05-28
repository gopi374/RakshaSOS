import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  Dimensions,
  Alert
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Phone,
  Navigation as NavigationIcon,
  Clock,
  MapPin,
  HeartPulse,
  Flame,
  ShieldCheck
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Hospital {
  id: string;
  name: string;
  distance: string;
  eta: string;
  status: 'Open' | 'Busy' | 'Emergency Only';
  address: string;
  phone: string;
  type: string;
}

export default function NearbyHospitalsScreen({ navigation }: any) {  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'ICU' | 'Trauma' | 'General'>('All');

  const hospitals: Hospital[] = [
    {
      id: '1',
      name: 'City Care Emergency Hospital',
      distance: '1.2 km',
      eta: '4 mins',
      status: 'Open',
      address: '452, Main Market Road, Sector 4',
      phone: '+91 98765 43210',
      type: 'Trauma',
    },
    {
      id: '2',
      name: 'St. Jude General & Cardiac Center',
      distance: '2.8 km',
      eta: '8 mins',
      status: 'Busy',
      address: 'Block B, Ring Road intersection',
      phone: '+91 98765 43211',
      type: 'ICU',
    },
    {
      id: '3',
      name: 'Apex Trauma & Trauma Care Clinic',
      distance: '4.5 km',
      eta: '11 mins',
      status: 'Open',
      address: 'Opposite Metro Station Pillar 128',
      phone: '+91 98765 43212',
      type: 'Trauma',
    },
    {
      id: '4',
      name: 'Metro Wellness & Maternity Hospital',
      distance: '6.0 km',
      eta: '15 mins',
      status: 'Emergency Only',
      address: 'Plot 12, Tech Zone, Phase 1',
      phone: '+91 98765 43213',
      type: 'General',
    }
  ];

  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || h.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleCall = (hospitalName: string, phone: string) => {       
    Alert.alert(
      "Emergency Call",
      `Are you sure you want to call ${hospitalName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call Now", onPress: () => Alert.alert("Dialing", `Calling ${phone}...`) }
      ]
    );
  };

  const handleRoute = (hospitalName: string) => {
    Alert.alert(
      "Navigation Launched",
      `Routing coordinates generated to ${hospitalName}. Keep moving towards well-lit public paths.`,
      [{ text: "OK" }]
    );
  };

  const handleRequestAmbulance = () => {
    Alert.alert(
      "Ambulance Dispatch",
      "Confirm request for the nearest trauma response vehicle? Your current GPS coordinates will be sent automatically.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Request Now", onPress: () => Alert.alert("Dispatched", "Ambulance dispatched. ETA: 8-12 minutes.") }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ac2b2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Hospitals</Text>      
        <HeartPulse size={22} color="#ac2b2e" />
      </View>

      {/* Map Mockup Zone */}
      <View style={styles.mapMockContainer}>
        <View style={styles.mapBase}>
          {/* Simulated Roads/Grid lines */}
          <View style={[styles.mapLine, { top: '30%', width: '100%', height: 4 }]} />
          <View style={[styles.mapLine, { top: '70%', width: '100%', height: 4 }]} />
          <View style={[styles.mapLine, { left: '40%', height: '100%', width: 4 }]} />

          {/* Current location pin */}
          <View style={styles.userPinContainer}>
            <View style={styles.userPinRadar} />
            <View style={styles.userPin} />
          </View>

          {/* Hospital Pins */}
          <View style={[styles.hospitalPin, { top: '25%', left: '20%' }]}>
            <MapPin size={18} color="#ac2b2e" />
            <Text style={styles.pinLabel}>City Care (4m)</Text>       
          </View>

          <View style={[styles.hospitalPin, { top: '60%', left: '75%' }]}>
            <MapPin size={18} color="#ac2b2e" />
            <Text style={styles.pinLabel}>St. Jude (8m)</Text>        
          </View>
        </View>

        {/* Dispatch Trigger Bar */}
        <TouchableOpacity style={styles.dispatchBar} onPress={handleRequestAmbulance}>
          <Flame size={18} color="#FFF" style={{ marginRight: 8 }} /> 
          <Text style={styles.dispatchText}>QUICK DISPATCH NEAREST AMBULANCE</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#777" style={styles.searchIcon} /> 
          <TextInput
            placeholder="Search hospitals, clinics..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          {(['All', 'ICU', 'Trauma', 'General'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive  
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextActive
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Hospital list */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredHospitals.map(hospital => (
          <View key={hospital.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hospitalName}>{hospital.name}</Text>
                <View style={styles.typeRow}>
                  <ShieldCheck size={12} color="#ac2b2e" />
                  <Text style={styles.hospitalType}>{hospital.type} Emergency Facility</Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  hospital.status === 'Open' && styles.statusOpen,    
                  hospital.status === 'Busy' && styles.statusBusy,    
                  hospital.status === 'Emergency Only' && styles.statusEmergency,
                ]}
              >
                <Text style={styles.statusBadgeText}>{hospital.status}</Text>
              </View>
            </View>

            <Text style={styles.addressText}>
              <MapPin size={11} color="#777" /> {hospital.address}    
            </Text>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Clock size={14} color="#555" />
                <Text style={styles.detailText}>{hospital.eta} ({hospital.distance})</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.callButton]}      
                onPress={() => handleCall(hospital.name, hospital.phone)}
              >
                <Phone size={16} color="#ac2b2e" style={{ marginRight: 6 }} />
                <Text style={styles.callButtonText}>Call Hospital</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.routeButton]}     
                onPress={() => handleRoute(hospital.name)}
              >
                <NavigationIcon size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.routeButtonText}>Get Route</Text> 
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
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
  },
  mapMockContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#e6dedc',
  },
  mapBase: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mapLine: {
    position: 'absolute',
    backgroundColor: '#d8cdcb',
  },
  userPinContainer: {
    position: 'absolute',
    top: '45%',
    left: '48%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPinRadar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 144, 226, 0.25)',
    position: 'absolute',
  },
  userPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  hospitalPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    backgroundColor: '#ac2b2e',
    color: '#FFF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
  },
  dispatchBar: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: '#ac2b2e',
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ac2b2e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  dispatchText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0bfbc',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf9f7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0bfbc',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1c1b',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#faf9f7',
    borderWidth: 1,
    borderColor: '#e0bfbc',
  },
  filterChipActive: {
    backgroundColor: '#ac2b2e',
    borderColor: '#ac2b2e',
  },
  filterText: {
    fontSize: 12,
    color: '#59413f',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0bfbc',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1c1b',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hospitalType: {
    fontSize: 11,
    color: '#ac2b2e',
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusOpen: {
    backgroundColor: '#f5fff3',
  },
  statusBusy: {
    backgroundColor: '#fffbeb',
  },
  statusEmergency: {
    backgroundColor: '#fff1f0',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 12,
    color: '#59413f',
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#59413f',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButton: {
    backgroundColor: '#fff1f0',
    borderWidth: 1,
    borderColor: '#e0bfbc',
  },
  callButtonText: {
    color: '#ac2b2e',
    fontWeight: 'bold',
    fontSize: 13,
  },
  routeButton: {
    backgroundColor: '#ac2b2e',
  },
  routeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
