import React, { useRef, useState, useEffect } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    Animated,
    PanResponder,
    Vibration,
} from 'react-native';
// Using lucide-react-native for clean icons, but Expo's Ionicons/MaterialIcons work great too
import {
    ArrowRight,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    MapPin,
    Mic,
    Phone,
    PlusSquare,
    ShieldAlert,
    Wifi,
    Flame,
    HeartPulse,
    UserCheck
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function RakshaSosScreen({ navigation }: any) {        
  // Radial menu state
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [joystickCoords, setJoystickCoords] = useState({ x: 0, y: 0, dist: 0, angle: 0 });

  // Animated values
  const expandAnim = useRef(new Animated.Value(0)).current;
  const touchXAnim = useRef(new Animated.Value(0)).current;
  const touchYAnim = useRef(new Animated.Value(0)).current;
  const holdProgress = useRef(new Animated.Value(0)).current;

  // Option specific scale and opacity animations
  const policeScale = useRef(new Animated.Value(1)).current;
  const hospitalScale = useRef(new Animated.Value(1)).current;        
  const guardiansScale = useRef(new Animated.Value(1)).current;       
  const fireScale = useRef(new Animated.Value(1)).current;

  const policeOpacity = useRef(new Animated.Value(1)).current;        
  const hospitalOpacity = useRef(new Animated.Value(1)).current;      
  const guardiansOpacity = useRef(new Animated.Value(1)).current;     
  const fireOpacity = useRef(new Animated.Value(1)).current;

  // Active option changes trigger spring/timing animations
  useEffect(() => {
    const getOpacity = (id: string) => {
      if (!activeOption) return 1.0;
      return activeOption === id ? 1.0 : 0.4;
    };
    Animated.parallel([
      Animated.spring(policeScale, { toValue: activeOption === 'police' ? 1.25 : 1, useNativeDriver: true }),
      Animated.spring(hospitalScale, { toValue: activeOption === 'hospital' ? 1.25 : 1, useNativeDriver: true }),
      Animated.spring(guardiansScale, { toValue: activeOption === 'guardians' ? 1.25 : 1, useNativeDriver: true }),
      Animated.spring(fireScale, { toValue: activeOption === 'fire' ? 1.25 : 1, useNativeDriver: true }),

      Animated.timing(policeOpacity, { toValue: getOpacity('police'), duration: 150, useNativeDriver: true }),
      Animated.timing(hospitalOpacity, { toValue: getOpacity('hospital'), duration: 150, useNativeDriver: true }),
      Animated.timing(guardiansOpacity, { toValue: getOpacity('guardians'), duration: 150, useNativeDriver: true }),
      Animated.timing(fireOpacity, { toValue: getOpacity('fire'), duration: 150, useNativeDriver: true }),
    ]).start();
  }, [activeOption]);

  // Keep track of the active option using a ref to read inside responder callbacks synchronously
  const activeOptionRef = useRef<string | null>(null);
  useEffect(() => {
    activeOptionRef.current = activeOption;
  }, [activeOption]);

  const pressStartTime = useRef<number>(0);
  const RADIAL_RADIUS = width * 0.38;
  const STRETCH_THRESHOLD = 40; // Snappier threshold of dragging distance to trigger an option

  const getActiveOptionFromGesture = (dx: number, dy: number) => {    
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < STRETCH_THRESHOLD) {
      return null;
    }
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle >= -135 && angle < -45) {
      return 'police'; // UP
    } else if (angle >= -45 && angle < 45) {
      return 'hospital'; // RIGHT
    } else if (angle >= 45 && angle < 135) {
      return 'guardians'; // DOWN
    } else {
      return 'fire'; // LEFT
    }
  };

  const getStemColor = () => {
    switch (activeOption) {
      case 'police': return '#1e88e5';
      case 'hospital': return '#e53935';
      case 'guardians': return '#43a047';
      case 'fire': return '#fb8c00';
      default: return '#B82C2C';
    }
  };

  const getOuterCircleBg = () => {
    if (!isMenuVisible) return '#F7E3E3';
    switch (activeOption) {
      case 'police': return 'rgba(30, 136, 229, 0.15)';
      case 'hospital': return 'rgba(229, 57, 53, 0.15)';
      case 'guardians': return 'rgba(67, 160, 71, 0.15)';
      case 'fire': return 'rgba(251, 140, 0, 0.15)';
      default: return '#F9EBEB';
    }
  };

  const triggerSos = () => {
    Alert.alert(
      "SOS Broadcast Active",
      "Emergency alert broadcasted with GPS coordinates and real-time audio stream to all registered guardians & local response dispatch.", 
      [{ text: "OK" }]
    );
  };

  const handleSosPress = () => {
    Alert.alert(
      "Press & Hold",
      "Please press and hold the SOS button for 1.5 seconds to broadcast emergency signal.",
      [{ text: "OK" }]
    );
  };

  const cancelSos = () => {
    Alert.alert(
      "SOS Deactivated",
      "Emergency distress signal successfully deactivated. Active safety tracking turned off.",
      [{ text: "OK" }]
    );
  };

  const triggerAction = (optionId: string) => {
    switch (optionId) {
      case 'police':
        Alert.alert(
          "Police Alert",
          "Police dispatch center has been notified with your live GPS location. Initiating audio recording.",
          [{ text: "OK" }]
        );
        break;
      case 'hospital':
        navigation.navigate('NearbyHospitals');
        break;
      case 'fire':
        Alert.alert(
          "Fire Brigade Alert",
          "Fire brigade services have been alerted to your current GPS coordinates.",
          [{ text: "OK" }]
        );
        break;
      case 'guardians':
        Alert.alert(
          "Guardian Alert",
          "Emergency notification sent to all registered guardians with your real-time coordinates.",
          [{ text: "OK" }]
        );
        break;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        pressStartTime.current = new Date().getTime();
        setIsMenuVisible(true);
        setScrollEnabled(false);
        Vibration.vibrate(60);

        Animated.spring(expandAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }).start();

        holdProgress.setValue(0);
        Animated.timing(holdProgress, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished && !activeOptionRef.current) {
            Vibration.vibrate([0, 80, 40, 80]);
          }
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        const dx = gestureState.dx;
        const dy = gestureState.dy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let clampX = dx;
        let clampY = dy;
        const MAX_LEASH = 90;

        if (dist > MAX_LEASH) {
          clampX = (dx / dist) * MAX_LEASH;
          clampY = (dy / dist) * MAX_LEASH;
        }

        const finalDist = Math.min(dist, MAX_LEASH);
        const angleRad = Math.atan2(clampY, clampX);
        const angleDeg = angleRad * (180 / Math.PI);

        touchXAnim.setValue(clampX);
        touchYAnim.setValue(clampY);
        setJoystickCoords({ x: clampX, y: clampY, dist: finalDist, angle: angleDeg });

        const newActive = getActiveOptionFromGesture(dx, dy);
        if (newActive !== activeOptionRef.current) {
          setActiveOption(newActive);
          if (newActive) {
            Vibration.vibrate(40);
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const elapsed = new Date().getTime() - pressStartTime.current;
        const finalActive = activeOptionRef.current;

        setScrollEnabled(true);
        holdProgress.setValue(0);
        setJoystickCoords({ x: 0, y: 0, dist: 0, angle: 0 });

        Animated.spring(touchXAnim, { toValue: 0, useNativeDriver: true }).start();
        Animated.spring(touchYAnim, { toValue: 0, useNativeDriver: true }).start();

        Animated.timing(expandAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsMenuVisible(false);
          setActiveOption(null);
        });

        if (finalActive) {
          triggerAction(finalActive);
        } else {
          if (elapsed > 1500) {
            triggerSos();
          } else {
            handleSosPress();
          }
        }
      },
      onPanResponderTerminate: () => {
        setScrollEnabled(true);
        holdProgress.setValue(0);
        setJoystickCoords({ x: 0, y: 0, dist: 0, angle: 0 });

        Animated.spring(touchXAnim, { toValue: 0, useNativeDriver: true }).start();
        Animated.spring(touchYAnim, { toValue: 0, useNativeDriver: true }).start();

        Animated.timing(expandAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsMenuVisible(false);
          setActiveOption(null);
        });
      }
    })
  ).current;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header / App Name */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RakshaSOS</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {/* Status Indicators */}
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <MapPin size={14} color="#555" />
            <Text style={styles.statusText}>GPS Active</Text>
          </View>
          <View style={styles.statusBadge}>
            <Wifi size={14} color="#555" />
            <Text style={styles.statusText}>Network</Text>
          </View>
          <View style={styles.statusBadge}>
            <CheckCircle2 size={14} color="#2e7d32" />
            <Text style={[styles.statusText, { color: '#2e7d32' }]}>Ready</Text>
          </View>
        </View>

        {/* Main Massive SOS Button */}
        <View style={styles.sosSection}>
          <View style={styles.sosWrapper}>

            {isMenuVisible && (
              <>
                {/* Backdrop dims screen but sits behind menu items */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.backdrop,
                    {
                      opacity: expandAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.45],
                      })
                    }
                  ]}
                />

                {/* Joystick/Rubber band Stem connecting center to touch pointer */}
                {joystickCoords.dist > 15 && (
                  <View
                    style={[
                      styles.joystickStem,
                      {
                        width: joystickCoords.dist,
                        backgroundColor: getStemColor(),
                        transform: [
                          { rotate: `${joystickCoords.angle}deg` },   
                          { translateX: joystickCoords.dist / 2 },    
                        ],
                      }
                    ]}
                  />
                )}

                {/* Concentric Arming Ring (Radar Pulse) when holding center */}
                {!activeOption && (
                  <Animated.View
                    style={[
                      styles.armingRing,
                      {
                        transform: [
                          {
                            scale: holdProgress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.35],
                            })
                          }
                        ],
                        opacity: holdProgress.interpolate({
                          inputRange: [0, 0.8, 1],
                          outputRange: [0.5, 0.8, 0],
                        })
                      }
                    ]}
                  />
                )}

                {/* UP: Police */}
                <Animated.View
                  style={[
                    styles.radialOption,
                    {
                      transform: [
                        { translateX: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0] }) },
                        { translateY: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -RADIAL_RADIUS] }) },
                        { scale: policeScale },
                      ],
                      opacity: Animated.multiply(expandAnim, policeOpacity),
                      backgroundColor: activeOption === 'police' ? '#1e88e5' : '#FFF',
                      borderColor: activeOption === 'police' ? '#1565c0' : '#EAE5E5',
                    }
                  ]}
                >
                  <ShieldAlert size={20} color={activeOption === 'police' ? '#FFF' : '#1e88e5'} />
                  <Text style={[styles.radialOptionText, { color: activeOption === 'police' ? '#FFF' : '#333' }]}>POLICE</Text>
                </Animated.View>

                {/* RIGHT: Hospital */}
                <Animated.View
                  style={[
                    styles.radialOption,
                    {
                      transform: [
                        { translateX: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, RADIAL_RADIUS] }) },
                        { translateY: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0] }) },
                        { scale: hospitalScale },
                      ],
                      opacity: Animated.multiply(expandAnim, hospitalOpacity),
                      backgroundColor: activeOption === 'hospital' ? '#e53935' : '#FFF',
                      borderColor: activeOption === 'hospital' ? '#c62828' : '#EAE5E5',
                    }
                  ]}
                >
                  <HeartPulse size={20} color={activeOption === 'hospital' ? '#FFF' : '#e53935'} />
                  <Text style={[styles.radialOptionText, { color: activeOption === 'hospital' ? '#FFF' : '#333' }]}>HOSPITAL</Text>
                </Animated.View>

                {/* DOWN: Guardians */}
                <Animated.View
                  style={[
                    styles.radialOption,
                    {
                      transform: [
                        { translateX: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0] }) },
                        { translateY: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, RADIAL_RADIUS] }) },
                        { scale: guardiansScale },
                      ],
                      opacity: Animated.multiply(expandAnim, guardiansOpacity),
                      backgroundColor: activeOption === 'guardians' ? '#43a047' : '#FFF',
                      borderColor: activeOption === 'guardians' ? '#2e7d32' : '#EAE5E5',
                    }
                  ]}
                >
                  <UserCheck size={20} color={activeOption === 'guardians' ? '#FFF' : '#43a047'} />
                  <Text style={[styles.radialOptionText, { color: activeOption === 'guardians' ? '#FFF' : '#333' }]}>GUARDIANS</Text>       
                </Animated.View>

                {/* LEFT: Fire */}
                <Animated.View
                  style={[
                    styles.radialOption,
                    {
                      transform: [
                        { translateX: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -RADIAL_RADIUS] }) },
                        { translateY: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0] }) },
                        { scale: fireScale },
                      ],
                      opacity: Animated.multiply(expandAnim, fireOpacity),
                      backgroundColor: activeOption === 'fire' ? '#fb8c00' : '#FFF',
                      borderColor: activeOption === 'fire' ? '#ef6c00' : '#EAE5E5',
                    }
                  ]}
                >
                  <Flame size={20} color={activeOption === 'fire' ? '#FFF' : '#fb8c00'} />
                  <Text style={[styles.radialOptionText, { color: activeOption === 'fire' ? '#FFF' : '#333' }]}>FIRE</Text>
                </Animated.View>

                {/* Touch Indicator Joystick / Leash */}
                <Animated.View
                  style={[
                    styles.touchIndicator,
                    {
                      transform: [
                        { translateX: touchXAnim },
                        { translateY: touchYAnim }
                      ],
                      borderColor: getStemColor(),
                    }
                  ]}
                >
                  <View style={[styles.touchIndicatorInner, { backgroundColor: getStemColor() }]} />
                </Animated.View>
              </>
            )}

            {/* The Main SOS Button with gesture handling */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.outerSosCircle,
                {
                  transform: [
                    {
                      scale: expandAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.93],
                      })
                    }
                  ],
                  backgroundColor: getOuterCircleBg(),
                }
              ]}
            >
              <View style={[
                styles.innerSosCircle,
                activeOption === 'police' && { backgroundColor: '#1e88e5' },
                activeOption === 'hospital' && { backgroundColor: '#e53935' },
                activeOption === 'guardians' && { backgroundColor: '#43a047' },
                activeOption === 'fire' && { backgroundColor: '#fb8c00' },
              ]}>
                {activeOption ? (
                  <View style={styles.centerFeedbackContainer}>       
                    {activeOption === 'police' && <ArrowUp size={24} color="#FFF" style={styles.centerArrow} />}
                    {activeOption === 'hospital' && <ArrowRight size={24} color="#FFF" style={styles.centerArrow} />}
                    {activeOption === 'guardians' && <ArrowDown size={24} color="#FFF" style={styles.centerArrow} />}
                    {activeOption === 'fire' && <ArrowLeft size={24} color="#FFF" style={styles.centerArrow} />}
                    <Text style={styles.centerFeedbackText}>RELEASE TO</Text>
                    <Text style={styles.centerFeedbackAction}>        
                      {activeOption === 'police' && 'CALL POLICE'}    
                      {activeOption === 'hospital' && 'MED HELP'}     
                      {activeOption === 'guardians' && 'ALERT CIRCLE'}
                      {activeOption === 'fire' && 'ALERT FIRE'}       
                    </Text>
                  </View>
                ) : isMenuVisible ? (
                  <View style={styles.centerFeedbackContainer}>       
                    <Text style={styles.centerFeedbackText}>HOLD FOR SOS</Text>
                    <Text style={styles.centerFeedbackAction}>DRAG TO SELECT</Text>
                  </View>
                ) : (
                  <Text style={styles.sosText}>SOS</Text>
                )}
              </View>
            </Animated.View>

          </View>
          <Text style={styles.sosInstruction}>
            {isMenuVisible
              ? "Drag in a direction to trigger specific service, or release to cancel."
              : "Press & hold to expand radial menu. Drag towards an option to trigger it."}
          </Text>
        </View>

        {/* Quick Actions Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>      
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('WomenSafety')}        
          >
            <ShieldAlert size={24} color="#8a1c1c" style={styles.cardIcon} />
            <Text style={styles.cardText}>Women Safety</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('VoiceSos')}
          >
            <Mic size={24} color="#8a1c1c" style={styles.cardIcon} /> 
            <Text style={styles.cardText}>Voice SOS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('NearbyHospitals')}    
          >
            <PlusSquare size={24} color="#8a1c1c" style={styles.cardIcon} />
            <Text style={styles.cardText}>Nearby Hospitals</Text>     
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('EmergencyCall')}      
          >
            <Phone size={24} color="#8a1c1c" style={styles.cardIcon} />
            <Text style={styles.cardText}>Emergency Call</Text>       
          </TouchableOpacity>
        </View>

        {/* Ambulance Tracking Status Card */}
        <View style={styles.trackingCard}>
          <View style={styles.trackingLeft}>
            <Text style={styles.helpLabel}>HELP ARRIVING IN</Text>    
            <Text style={styles.countdownText}>
              14:32 <Text style={styles.countdownUnit}>MIN SEC</Text> 
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.trackingRight}>
            <Text style={styles.statusRouteText}>Ambulance on the way</Text>
            <View style={styles.acceptedBadge}>
              <CheckCircle2 size={12} color="#2e7d32" />
              <Text style={styles.acceptedText}>ACCEPTED</Text>       
            </View>
            <Text style={styles.detailsText}>Distance: <Text style={styles.boldText}>6.2 km</Text></Text>
            <Text style={styles.detailsText}>Hospital: <Text style={styles.hospitalText}>City Care Hospital</Text></Text>
          </View>

          <ChevronRight size={20} color="#888" style={styles.cardArrow} />
        </View>

        {/* Slide to Cancel SOS Dynamic Trigger */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.sliderContainer}
          onPress={cancelSos}
        >
          <View style={styles.sliderCircle}>
            <ArrowRight size={20} color="#fff" />
          </View>
          <Text style={styles.sliderText}>SLIDE TO CANCEL SOS</Text>  
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF9F9', // Subtle off-white cream tone matching the screenshot
  },
  header: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBEB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8a1c1c', // Earthy Maroon color signature
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Cushion space for the absolute/fixed navbar
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFEAE9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
  sosSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  outerSosCircle: {
    width: width * 0.48,
    height: width * 0.48,
    borderRadius: (width * 0.48) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    // Soft outer ring shadow effect
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 12,
  },
  innerSosCircle: {
    width: width * 0.38,
    height: width * 0.38,
    borderRadius: (width * 0.38) / 2,
    backgroundColor: '#B82C2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sosInstruction: {
    textAlign: 'center',
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 24,
    paddingHorizontal: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  seeAllText: {
    fontSize: 13,
    color: '#B82C2C',
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE5E5',
    minHeight: 85,
    justifyContent: 'center',
  },
  cardIcon: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  cardText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#222',
  },
  trackingCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE5E5',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    position: 'relative',
  },
  trackingLeft: {
    flex: 1.1,
    justifyContent: 'center',
  },
  helpLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#777',
    letterSpacing: 0.5,
  },
  countdownText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#B82C2C',
    marginTop: 4,
  },
  countdownUnit: {
    fontSize: 9,
    color: '#555',
    fontWeight: 'normal',
    display: 'flex',
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: '#EAE5E5',
    marginHorizontal: 12,
  },
  trackingRight: {
    flex: 1.5,
  },
  statusRouteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF7EE',
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,    gap: 4,
    marginVertical: 4,
  },
  acceptedText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  detailsText: {
    fontSize: 11,
    color: '#666',
    marginTop: 1,
  },
  boldText: {
    fontWeight: '600',
    color: '#222',
  },
  hospitalText: {
    color: '#8a1c1c',
    fontWeight: '600',
  },
  cardArrow: {
    position: 'absolute',
    right: 12,
    bottom: 16,
  },
  sliderContainer: {
    backgroundColor: '#FCECEC',
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#F5D3D3',
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  sliderCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#B82C2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B82C2C',
    marginRight: 44, // Offset text to balance out the circle size center positioning
    letterSpacing: 0.5,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0EBEB',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 11,
    color: '#555',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#B82C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10, // Gives the active floating item look
  },
  activeNavText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'lowercase',
  },
  sosWrapper: {
    width: width * 0.75,
    height: width * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  radialOption: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 76,
    height: 76,
    borderRadius: 38,
    marginLeft: -38,
    marginTop: -38,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#EAE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 10,
  },
  radialOptionText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  touchIndicator: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: -22,
    marginTop: -22,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#B82C2C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  touchIndicatorInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  joystickStem: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    height: 3.5,
    borderRadius: 2,
    opacity: 0.75,
    zIndex: 9,
  },
  armingRing: {
    position: 'absolute',
    width: width * 0.48,
    height: width * 0.48,
    borderRadius: (width * 0.48) / 2,
    borderWidth: 3.5,
    borderColor: '#B82C2C',
    backgroundColor: 'transparent',
    zIndex: 8,
  },
  centerArrow: {
    marginBottom: 4,
  },
  centerFeedbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerFeedbackText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  centerFeedbackAction: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    bottom: -1000,
    left: -1000,
    right: -1000,
    backgroundColor: '#000',
    zIndex: 1,
  },
});
