// ============================================================
// RakshaSOS — server.js (Firebase Cloud Functions)
// Schema: users, medical_profiles, emergency_contacts,
//         sos_alerts, live_tracking, emergency_timeline,
//         hospitals, police_stations
// ============================================================

const functions = require("firebase-functions/v1");
const admin     = require("firebase-admin");
const twilio    = require("twilio");

admin.initializeApp();
const db = admin.firestore();

// // Replace this:
// const twilioClient = twilio(
//   functions.config().twilio.sid,
//   functions.config().twilio.auth_token
// );
// const TWILIO_NUMBER = functions.config().twilio.phone;

// With this:
let twilioClient = null;
let TWILIO_NUMBER = null;

try {
  const cfg = functions.config().twilio;
  if (cfg?.sid) {
    twilioClient = twilio(cfg.sid, cfg.auth_token);
    TWILIO_NUMBER = cfg.phone;
  }
} catch (e) {
  console.warn("[TWILIO] Config not found — SMS disabled in emulator");
}
// ============================================================
// FEATURE 1 — SOS TRIGGERED
// Mobile app creates sos_alerts doc → function fires
// ============================================================

exports.onSOSTriggered = functions.firestore
  .document("sos_alerts/{sosId}")
  .onCreate(async (snap, context) => {
    const sos   = snap.data();
    const sosId = context.params.sosId;

    console.log(`[SOS] Triggered: ${sosId} | User: ${sos.user_id} | Type: ${sos.trigger_type}`);

    try {

      // ── Step 1: Log timeline event ─────────────────────────
      await addTimelineEvent(sosId, "sos_triggered", {
        trigger_type: sos.trigger_type,
        lat: sos.last_known_lat,
        lng: sos.last_known_lng,
      });

      // ── Step 2: Fetch user + medical profile ───────────────
      const userSnap = await db.collection("users").doc(sos.user_id).get();
      if (!userSnap.exists) {
        console.error(`[SOS] User not found: ${sos.user_id}`);
        return;
      }
      const user = userSnap.data();

      const medSnap = await db.collection("medical_profiles")
        .where("user_id", "==", sos.user_id)
        .limit(1)
        .get();
      const medical = medSnap.empty ? {} : medSnap.docs[0].data();

      // ── Step 3: Find 10 nearest hospitals ──────────────────
      const hospitalsSnap = await db.collection("hospitals")
        .where("is_open_24_7", "==", true)
        .get();

      const nearest10 = hospitalsSnap.docs
        .map((doc) => {
          const h = doc.data();
          const distance = getDistanceKm(
            sos.last_known_lat, sos.last_known_lng,
            h.latitude, h.longitude
          );
          return { id: doc.id, name: h.name, phone: h.phone_number, distance };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10);

      const hospitalIds = nearest10.map((h) => h.id);

      // ── Step 4: Find nearest police station ────────────────
      const policeSnap = await db.collection("police_stations")
        .where("is_active_duty", "==", true)
        .get();

      const nearestPolice = policeSnap.docs
        .map((doc) => {
          const p = doc.data();
          return {
            id: doc.id,
            name: p.name,
            phone: p.phone_number,
            distance: getDistanceKm(
              sos.last_known_lat, sos.last_known_lng,
              p.latitude, p.longitude
            ),
          };
        })
        .sort((a, b) => a.distance - b.distance)[0];

      // ── Step 5: Update sos_alerts doc ─────────────────────
      await snap.ref.update({
        status: "active",
        hospitals_notified: hospitalIds,
        police_station_id: nearestPolice?.id || null,
        victim_name: user.full_name,
        blood_group: medical.blood_group || null,
        known_allergies: medical.known_allergies || [],
        chronic_conditions: medical.chronic_conditions || null,
        broadcasted_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ── Step 6: Fetch emergency contacts ──────────────────
      const contactsSnap = await db.collection("emergency_contacts")
        .where("user_id", "==", sos.user_id)
        .where("is_notified_on_sos", "==", true)
        .orderBy("priority")
        .get();

      const contacts = contactsSnap.docs.map((d) => d.data());
      const uniqueContacts = [];
      const seenPhones = new Set();

      contacts.forEach((contact) => {
        if (!contact.phone_number || seenPhones.has(contact.phone_number)) return;
        seenPhones.add(contact.phone_number);
        uniqueContacts.push(contact);
      });

      const familyContacts = uniqueContacts.filter(isFamilyContact);
      const mapsLink = `https://maps.google.com/?q=${sos.last_known_lat},${sos.last_known_lng}`;

      if (twilioClient) {
        const smsPromises = uniqueContacts.map((contact) =>
          twilioClient.messages.create({
            to: contact.phone_number,
            from: TWILIO_NUMBER,
            body: buildSosSmsBody(user, medical, mapsLink, contact),
          }).catch((err) =>
            console.error(`[SMS] Failed to ${contact.phone_number}:`, err)
          )
        );

        await Promise.all(smsPromises);
      } else {
        console.log("[SMS MOCK] Twilio client not configured — skipped emergency SMS to family/emergency contacts");
      }

      // ── Step 8: Log contacts_notified timeline ────────────
      await addTimelineEvent(sosId, "contacts_notified", {
        contacts_count: uniqueContacts.length,
        phones: uniqueContacts.map((c) => c.phone_number),
        family_contacts_count: familyContacts.length,
        family_phones: familyContacts.map((c) => c.phone_number),
      });

      if (familyContacts.length > 0) {
        await addTimelineEvent(sosId, "family_contacts_notified", {
          contacts_count: familyContacts.length,
          phones: familyContacts.map((c) => c.phone_number),
        });
      }

      // ── Step 9: Log police_notified timeline ──────────────
      if (nearestPolice) {
        await addTimelineEvent(sosId, "police_notified", {
          station_name: nearestPolice.name,
          station_id: nearestPolice.id,
          distance_km: nearestPolice.distance,
        });
      }

      // ── Step 10: Alert nearby bystanders (2km) ───────────
      await alertNearbyUsers(sosId, sos);

      console.log(`[SOS] ${sosId} fully processed ✅`);

    } catch (err) {
      console.error(`[SOS] Error:`, err);
    }
  });


// ============================================================
// FEATURE 2 — HOSPITAL ACCEPTS SOS
// Hospital dashboard updates sos_alerts → function fires
// ============================================================

exports.onSOSAccepted = functions.firestore
  .document("sos_alerts/{sosId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after  = change.after.data();
    const sosId  = context.params.sosId;

    // Only fire when accepted_by_hospital is newly set
    if (before.accepted_by_hospital === after.accepted_by_hospital) return null;
    if (!after.accepted_by_hospital) return null;

    console.log(`[ACCEPT] ${sosId} accepted by ${after.accepted_by_name}`);

    try {

      // ── Log ambulance_dispatched timeline ─────────────────
      await addTimelineEvent(sosId, "ambulance_dispatched", {
        hospital_name: after.accepted_by_name,
        hospital_id:   after.accepted_by_hospital,
        eta_minutes:   after.ambulance_eta,
      });

      // ── FCM to victim ──────────────────────────────────────
      const userSnap = await db.collection("users").doc(after.user_id).get();
      const fcmToken = userSnap.data()?.fcm_token;

      if (fcmToken) {

        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: "Help is on the way! 🚑",
            body: `${after.accepted_by_name} accepted your SOS. ETA: ~${after.ambulance_eta} min.`,
          },
          data: {
            type: "sos_accepted",
            sos_id: sosId,
            hospital_name: after.accepted_by_name,
            eta: String(after.ambulance_eta),
          },
          android: { priority: "high" },
        });

        console.log(`[FCM] Victim notified`);
      }


      // ── SMS acknowledgement to victim ─────────────────────
      if (twilioClient) {

        const userPhone = userSnap.data()?.phone_number;

        if (userPhone) {

          const mapsLink =
            `https://maps.google.com/?q=${after.last_known_lat},${after.last_known_lng}`;

          await twilioClient.messages.create({
            to: userPhone,
            from: TWILIO_NUMBER,
            body:
              `✅ RakshaSOS — Help is on the way!\n` +
              `Hospital: ${after.accepted_by_name}\n` +
              `Ambulance ETA: ~${after.ambulance_eta} minutes\n` +
              `Location: ${mapsLink}\n` +
              `Stay calm. Do not move if seriously injured.\n` +
              `— RakshaSOS Emergency`,
          });

          console.log(`[SMS] Acknowledgement sent to victim ${userPhone}`);
        }

      } else {

        console.log("[SMS MOCK] Would send acknowledgement to victim");

      }

      // ── FCM to remaining 9 hospitals (case locked) ─────────
      const otherIds = (after.hospitals_notified || [])
        .filter((id) => id !== after.accepted_by_hospital)
        .slice(0, 10);

      if (otherIds.length > 0) {
        const staffSnap = await db.collection("hospital_staff")
          .where("hospital_id", "in", otherIds)
          .get();

        const tokens = staffSnap.docs
          .map((d) => d.data().fcm_token)
          .filter(Boolean);

        if (tokens.length > 0) {
          await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
              title: "SOS Already Accepted",
              body:  `Case accepted by ${after.accepted_by_name}. No action needed.`,
            },
            data: {
              type:        "sos_locked",
              sos_id:      sosId,
              accepted_by: after.accepted_by_name,
            },
          });
        }
      }

      // ── FCM to police dashboard ────────────────────────────
      if (after.police_station_id) {
        const policeStaffSnap = await db.collection("police_staff")
          .where("station_id", "==", after.police_station_id)
          .get();

        const policeTokens = policeStaffSnap.docs
          .map((d) => d.data().fcm_token)
          .filter(Boolean);

        if (policeTokens.length > 0) {
          await admin.messaging().sendEachForMulticast({
            tokens: policeTokens,
            notification: {
              title: "🚨 New SOS Alert",
              body:  `Accident reported near your jurisdiction. Hospital: ${after.accepted_by_name}`,
            },
            data: {
              type:   "new_sos_police",
              sos_id: sosId,
              lat:    String(after.last_known_lat),
              lng:    String(after.last_known_lng),
            },
          });
        }
      }

    } catch (err) {
      console.error(`[ACCEPT] Error:`, err);
    }

    return null;
  });


// ============================================================
// FEATURE 3 — OFFLINE SOS (Twilio SMS Webhook)
// Victim has no internet → sends SMS → Twilio hits this
// ============================================================

exports.offlineSOSWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { From, Body } = req.body;
    console.log(`[OFFLINE SOS] SMS from ${From}: ${Body}`);

    // Expected format: "SOS 23.2599 77.4126"
    const parts = Body.trim().split(" ");
    if (parts[0].toUpperCase() !== "SOS" || parts.length < 3) {
      return res.status(400).send("Invalid format. Send: SOS LAT LNG");
    }

    const lat = parseFloat(parts[1]);
    const lng = parseFloat(parts[2]);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).send("Invalid coordinates");
    }

    // Find user by phone
    const userSnap = await db.collection("users")
      .where("phone_number", "==", From)
      .limit(1)
      .get();

    if (userSnap.empty) {
      console.warn(`[OFFLINE SOS] User not found: ${From}`);
      return res.status(404).send("User not found");
    }

    const userDoc  = userSnap.docs[0];
    const user     = userDoc.data();

    // Create sos_alerts doc → onSOSTriggered fires automatically
    await db.collection("sos_alerts").add({
      user_id:         userDoc.id,
      status:          "active",
      trigger_type:    "offline_sms",
      last_known_lat:  lat,
      last_known_lng:  lng,
      audio_recording_url: null,
      is_offline_sos:  true,
      hospitals_notified: [],
      accepted_by_hospital: null,
      accepted_by_name: null,
      ambulance_eta:   null,
      start_time:      admin.firestore.FieldValue.serverTimestamp(),
      end_time:        null,
    });

    console.log(`[OFFLINE SOS] Created for ${user.full_name}`);
    res.status(200).send("<Response></Response>"); // Twilio expects XML

  } catch (err) {
    console.error(`[OFFLINE SOS] Error:`, err);
    res.status(500).send("Internal error");
  }
});


// ============================================================
// FEATURE 4 — LIVE TRACKING + ETA UPDATE
// Ambulance/victim location update every 30s
// ============================================================

exports.updateLiveTracking = functions.https.onCall(async (data, context) => {
  const { sos_id, latitude, longitude, battery_level, is_ambulance, ambulance_lat, ambulance_lng } = data;

  try {
    // ── Save to live_tracking collection ──────────────────────
    await db.collection("live_tracking").add({
      sos_id,
      latitude,
      longitude,
      battery_level: battery_level || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ── Update last known location in sos_alerts ──────────────
    await db.collection("sos_alerts").doc(sos_id).update({
      last_known_lat: latitude,
      last_known_lng: longitude,
    });

    // ── If ambulance location sent → recalculate ETA ──────────
    if (is_ambulance && ambulance_lat && ambulance_lng) {
      const sosSnap = await db.collection("sos_alerts").doc(sos_id).get();
      const sos     = sosSnap.data();

      const distanceKm = getDistanceKm(
        ambulance_lat, ambulance_lng,
        sos.last_known_lat, sos.last_known_lng
      );

      // Avg city speed 40 km/h
      const etaMinutes = Math.ceil((distanceKm / 40) * 60);

      await sosSnap.ref.update({
        ambulance_eta:     etaMinutes,
        ambulance_lat,
        ambulance_lng,
        eta_updated_at:    admin.firestore.FieldValue.serverTimestamp(),
      });

      // FCM to victim with updated ETA
      const userSnap = await db.collection("users").doc(sos.user_id).get();
      const fcmToken = userSnap.data()?.fcm_token;

      if (fcmToken) {
        await admin.messaging().send({
          token: fcmToken,
          data: {
            type:        "eta_update",
            sos_id,
            eta_minutes: String(etaMinutes),
            message:     `Ambulance arriving in ${etaMinutes} min — ${sos.accepted_by_name}`,
          },
          android: { priority: "high" },
        });
      }

      console.log(`[ETA] ${sos_id} → ${etaMinutes} min`);
      return { success: true, eta_minutes: etaMinutes };
    }

    return { success: true };

  } catch (err) {
    console.error(`[TRACKING] Error:`, err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});


// ============================================================
// FEATURE 5 — SOS RESOLVED
// Hospital/user marks SOS resolved
// ============================================================

exports.onSOSResolved = functions.firestore
  .document("sos_alerts/{sosId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after  = change.after.data();
    const sosId  = context.params.sosId;

    if (before.status === after.status) return null;
    if (after.status !== "resolved" && after.status !== "false_alarm") return null;

    console.log(`[RESOLVED] ${sosId} → ${after.status}`);

    try {

      // ── Log resolved timeline ──────────────────────────────
      await addTimelineEvent(sosId, "resolved", {
        status:      after.status,
        resolved_by: after.resolved_by || "unknown",
      });

      // ── FCM to victim ──────────────────────────────────────
      const userSnap = await db.collection("users").doc(after.user_id).get();
      const fcmToken = userSnap.data()?.fcm_token;

      if (fcmToken) {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: after.status === "resolved" ? "Case Resolved ✅" : "False Alarm Marked",
            body:  after.status === "resolved"
              ? "Your SOS case has been resolved. Stay safe!"
              : "SOS marked as false alarm.",
          },
          data: { type: "sos_resolved", sos_id: sosId, status: after.status },
        });
      }

    } catch (err) {
      console.error(`[RESOLVED] Error:`, err);
    }

    return null;
  });


// ============================================================
// HELPER — Build SOS SMS body
// ============================================================

function isFamilyContact(contact) {
  if (!contact) return false;
  const relationship = String(contact.relationship || contact.relation || "").toLowerCase();
  const familyKeys = [
    "family", "father", "mother", "parent", "guardian",
    "spouse", "husband", "wife", "brother", "sister",
    "son", "daughter",
  ];
  return contact.is_family_contact === true || familyKeys.includes(relationship);
}

function buildSosSmsBody(user, medical, mapsLink, contact) {
  const lines = [
    `🚨 EMERGENCY — ${user.full_name} ne SOS trigger kiya!`,
    `Location: ${mapsLink}`,
    `Blood Group: ${medical.blood_group || "Unknown"}`,
    `Allergies: ${medical.known_allergies?.join(", ") || "None"}`,
  ];

  if (isFamilyContact(contact)) {
    lines.push("Family alert: Please share this with close relatives immediately.");
  }

  lines.push("— RakshaSOS");
  return lines.join("\n");
}

// ============================================================
// HELPER — Alert nearby users within 2km
// ============================================================

async function alertNearbyUsers(sosId, sos) {
  try {
    const usersSnap = await db.collection("users")
      .where("is_verified", "==", true)
      .get();

    const nearbyTokens  = [];
    const nearbyUserIds = [];

    usersSnap.docs.forEach((doc) => {
      if (doc.id === sos.user_id) return;

      const user = doc.data();
      if (!user.fcm_token || !user.last_known_lat) return;

      const distance = getDistanceKm(
        sos.last_known_lat, sos.last_known_lng,
        user.last_known_lat, user.last_known_lng
      );

      if (distance <= 2) {
        nearbyTokens.push(user.fcm_token);
        nearbyUserIds.push(doc.id);
      }
    });

    if (nearbyTokens.length === 0) return;

    await admin.messaging().sendEachForMulticast({
      tokens: nearbyTokens,
      notification: {
        title: "Accident Nearby 🚨",
        body:  "Someone needs help near you. Can you assist?",
      },
      data: {
        type:         "bystander_alert",
        sos_id:       sosId,
        latitude:     String(sos.last_known_lat),
        longitude:    String(sos.last_known_lng),
        address_text: sos.address_text || "",
      },
      android: { priority: "high" },
    });

    await db.collection("sos_alerts").doc(sosId).update({
      nearby_users_notified: nearbyUserIds,
    });

    console.log(`[BYSTANDER] Alerted ${nearbyTokens.length} nearby users`);

  } catch (err) {
    console.error("[BYSTANDER] Error:", err);
  }
}


// ============================================================
// HELPER — Add emergency_timeline event
// ============================================================

async function addTimelineEvent(sosId, eventType, details = {}) {
  await db.collection("emergency_timeline").add({
    sos_id:        sosId,
    event_type:    eventType,
    event_details: details,
    timestamp:     admin.firestore.FieldValue.serverTimestamp(),
  });
}


// ============================================================
// UTILITY — Haversine distance (km)
// ============================================================

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a    =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}