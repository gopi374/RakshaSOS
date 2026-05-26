import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Dimensions
} from 'react-native';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Map,
  Plus,
  Users,
  Compass,
  User
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Incident {
  id: string;
  type: string;
  desc: string;
  x: number;
  y: number;
  reportedBy: string;
}

export default function MapScreen({ navigation }: any) {
  const [incidents, setIncidents] = useState<Incident[]>([
    { id: '1', type: 'Unlit Alleyway', desc: 'No functional streetlights near Sector 4 lane.', x: 120, y: 70, reportedBy: 'Anonymous' },    
    { id: '2', type: 'Police Patrol', desc: 'Active police checkpoint.', x: 220, y: 150, reportedBy: 'System Verification' },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [reportType, setReportType] = useState('Poor Lighting');      
  const [reportDesc, setReportDesc] = useState('');

  const handleReport = () => {
    if (!reportDesc) {
      Alert.alert("Input Error", "Please provide a description of the issue.");
      return;
    }
    const newIncident: Incident = {
      id: Date.now().toString(),
      type: reportType,
      desc: reportDesc,
      x: Math.random() * 200 + 50,
      y: Math.random() * 180 + 40,
      reportedBy: 'You',
    };
    setIncidents([...incidents, newIncident]);
    setReportDesc('');
    setModalVisible(false);
    Alert.alert("Report Submitted", "Your safety report has been added to the neighborhood map for other users.");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#ac2b2e" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Raksha Safe Map</Text>       
        <Map size={22} color="#ac2b2e" />
      </View>

      {/* Map Mockup Area */}
      <View style={styles.mapArea}>
        {/* Grids and roads mockup */}
        <View style={[styles.road, { top: '30%', width: '100%', height: 6 }]} />
        <View style={[styles.road, { top: '65%', width: '100%', height: 6 }]} />
        <View style={[styles.road, { left: '35%', height: '100%', width: 6 }]} />
        <View style={[styles.road, { left: '70%', height: '100%', width: 6 }]} />

        {/* User Location */}
        <View style={[styles.marker, { top: '50%', left: '52%' }]}>   
          <View style={styles.userDotPulse} />
          <View style={styles.userDot} />
          <Text style={styles.userMarkerText}>You</Text>
        </View>

        {/* Safe Checkpoint markers */}
        <View style={[styles.marker, { top: '20%', left: '30%' }]}>   
          <ShieldCheck size={20} color="#346645" />
          <Text style={styles.markerText}>Safe Haven</Text>
        </View>

        {/* Dynamic Incidents */}
        {incidents.map(inc => (
          <View key={inc.id} style={[styles.marker, { top: inc.y, left: inc.x }]}>
            {inc.type === 'Police Patrol' ? (
              <ShieldCheck size={20} color="#2b59ac" />
            ) : (
              <AlertTriangle size={20} color="#ac2b2e" />
            )}
            <Text style={styles.markerText}>{inc.type}</Text>
          </View>
        ))}

        {/* Float buttons */}
        <TouchableOpacity style={styles.fabReport} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="#FFF" />
          <Text style={styles.fabText}>Report Hotspot</Text>
        </TouchableOpacity>

        <View style={styles.compassContainer}>
          <Compass size={24} color="#59413f" />
        </View>
      </View>

      {/* Info Panel */}
      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.panelTitle}>Active Safety Hotspots</Text> 
        <Text style={styles.panelSubtitle}>Crowdsourced neighborhood alerts and verified check-ins</Text>

        <View style={styles.cardList}>
          {incidents.map(inc => (
            <View key={inc.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  {inc.type === 'Police Patrol' ? (
                    <ShieldCheck size={16} color="#2b59ac" />
                  ) : (
                    <AlertTriangle size={16} color="#ac2b2e" />       
                  )}
                  <Text style={styles.cardTypeName}>{inc.type}</Text> 
                </View>
                <Text style={styles.cardReporter}>By: {inc.reportedBy}</Text>
              </View>
              <Text style={styles.cardDesc}>{inc.desc}</Text>
            </View>
          ))}
        </View>

        <View style={styles.neighborhoodScoreCard}>
          <Users size={20} color="#346645" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.scoreTitle}>Community Safety Rating</Text>
            <Text style={styles.scoreText}>High safety score in Sector 4 based on active police patrols and user checkpoints.</Text>        
          </View>
        </View>
      </ScrollView>

      {/* Incident Reporting Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Danger / Safety Issue</Text>

            <Text style={styles.label}>Issue Type</Text>
            <View style={styles.pickerRow}>
              {['Poor Lighting', 'Harassment Zone', 'Stray Animals', 'Police Patrol'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerChip,
                    reportType === type && styles.pickerChipActive    
                  ]}
                  onPress={() => setReportType(type)}
                >
                  <Text
                    style={[
                      styles.pickerChipText,
                      reportType === type && styles.pickerChipTextActive
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide details about the hazard or incident..."
              multiline={true}
              numberOfLines={4}
              value={reportDesc}
              onChangeText={setReportDesc}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelBtn]}        
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>      
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveBtn]}
                onPress={handleReport}
              >
                <Text style={styles.saveBtnText}>Submit Report</Text> 
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    height: 300,
    backgroundColor: '#e6dedc',
    position: 'relative',
    overflow: 'hidden',
  },
  road: {
    position: 'absolute',
    backgroundColor: '#FFF',
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1a1c1b',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  userMarkerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4A90E2',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userDotPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
  },
  fabReport: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#ac2b2e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 4,
  },
  fabText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  compassContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  panel: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
    paddingTop: 16,
  },
  panelContent: {
    padding: 16,
    paddingBottom: 40,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1c1b',
  },
  panelSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
    marginBottom: 16,
  },
  cardList: {
    gap: 12,
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e0bfbc',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#faf9f7',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTypeName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1c1b',
  },
  cardReporter: {
    fontSize: 10,
    color: '#777',
  },
  cardDesc: {
    fontSize: 12,
    color: '#59413f',
    lineHeight: 18,
  },
  neighborhoodScoreCard: {
    flexDirection: 'row',
    backgroundColor: '#f5fff3',
    borderWidth: 1,
    borderColor: '#d2ebc4',
    padding: 14,
    borderRadius: 10,
  },
  scoreTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#346645',
  },
  scoreText: {
    fontSize: 11,
    color: '#346645',
    lineHeight: 16,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1c1b',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#59413f',
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  pickerChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#faf9f7',
    borderWidth: 1,
    borderColor: '#e0bfbc',
  },
  pickerChipActive: {
    backgroundColor: '#ac2b2e',
    borderColor: '#ac2b2e',
  },
  pickerChipText: {
    fontSize: 11,
    color: '#59413f',
    fontWeight: '600',
  },
  pickerChipTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0bfbc',
    backgroundColor: '#faf9f7',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#faf9f7',
    borderWidth: 1,
    borderColor: '#e0bfbc',
  },
  cancelBtnText: {
    color: '#59413f',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#ac2b2e',
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
