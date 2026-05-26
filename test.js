// ============================================================
// RakshaSOS — Cloud Functions Test File
// Run: node test.js
// ============================================================

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ── Test Config ──────────────────────────────────────────────
const TEST_USER_ID   = "test_user_gopi";
const TEST_HOSPITAL_ID = "test_hospital_citycare";
const TEST_PHONE     = "+919876543210";
const TEST_LAT       = 23.2599;
const TEST_LNG       = 77.4126;

// ── Colors for console ───────────────────────────────────────
const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET  = "\x1b[0m";

const pass = (msg) => console.log(`${GREEN}✅ PASS${RESET} — ${msg}`);
const fail = (msg) => console.log(`${RED}❌ FAIL${RESET} — ${msg}`);
const info = (msg) => console.log(`${YELLOW}ℹ️  INFO${RESET} — ${msg}`);


// ============================================================
// SETUP — Insert dummy data before tests
// ============================================================

async function setupDummyData() {
  console.log("\n── Setting up dummy data ──────────────────────");

  // Dummy user
  await db.collection("users").doc(TEST_USER_ID).set({
    name: "gopi",
    phone: TEST_PHONE,
    blood_group: "B+",
    medical_info: "Diabetic. Allergic to Penicillin.",
    emergency_contacts: ["+919999999901", "+919999999902"],
    fcm_token: "dummy_fcm_token_gopi",
    location: new admin.firestore.GeoPoint(TEST_LAT, TEST_LNG),
    is_active: true,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });
  info("Dummy user inserted");

  // Dummy nearby bystander (1km away)
  await db.collection("users").doc("test_user_priya").set({
    name: "Priya Verma",
    phone: "+918765432109",
    blood_group: "O+",
    medical_info: "No allergies.",
    emergency_contacts: ["+919111111111"],
    fcm_token: "dummy_fcm_token_priya",
    location: new admin.firestore.GeoPoint(23.2650, 77.4150),
    is_active: true,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });
  info("Dummy bystander inserted");

  // Dummy hospitals
  await db.collection("hospitals").doc(TEST_HOSPITAL_ID).set({
    name: "City Care Hospital",
    phone: "+917612345601",
    address: "MP Nagar, Bhopal",
    location: new admin.firestore.GeoPoint(23.2580, 77.4100),
    status: "operational",
    beds_available: 42,
    icu_available: 7,
  });

  await db.collection("hospitals").doc("test_hospital_hamidia").set({
    name: "Hamidia Hospital",
    phone: "+917612345602",
    address: "Royal Market, Bhopal",
    location: new admin.firestore.GeoPoint(23.2650, 77.4200),
    status: "operational",
    beds_available: 80,
    icu_available: 12,
  });

  info("Dummy hospitals inserted");

  // Dummy hospital staff
  await db.collection("hospital_staff").doc("test_staff_admin").set({
    name: "Dr. Admin",
    hospital_id: TEST_HOSPITAL_ID,
    fcm_token: "dummy_fcm_token_hospital_staff",
    role: "operator",
    is_active: true,
  });
  info("Dummy hospital staff inserted");

  console.log("── Dummy data ready ✅\n");
}


// ============================================================
// TEST 1 — SOS Trigger
// ============================================================

async function testSOSTrigger() {
  console.log("── TEST 1: SOS Trigger ─────────────────────────");

  const sosRef = await db.collection("sos_requests").add({
    case_id: `SOS-${Date.now()}`,
    victim_id: TEST_USER_ID,
    victim_name: "gopi",
    blood_group: "B+",
    medical_info: "Diabetic. Allergic to Penicillin.",
    emergency_contacts: ["+919999999901", "+919999999902"],
    latitude: TEST_LAT,
    longitude: TEST_LNG,
    address_text: "NH 12, Bhopal, MP",
    status: "triggered",
    triggered_by: "app_button",
    is_offline_sos: false,
    hospitals_notified: [],
    accepted_by_hospital: null,
    accepted_by_name: null,
    ambulance_eta: null,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  info(`SOS document created: ${sosRef.id}`);
  info("Waiting 5 seconds for Cloud Function to process...");
  await sleep(5000);

  // Check if function updated the SOS
  const updatedSOS = await sosRef.get();
  const data = updatedSOS.data();

  if (data.status === "broadcasted") {
    pass(`Status updated to "broadcasted"`);
  } else {
    fail(`Status is "${data.status}" — expected "broadcasted"`);
  }

  if (data.hospitals_notified?.length > 0) {
    pass(`Hospitals notified: ${data.hospitals_notified.length}`);
  } else {
    fail("No hospitals notified");
  }

  if (data.nearby_users_notified?.length > 0) {
    pass(`Nearby users alerted: ${data.nearby_users_notified.length}`);
  } else {
    fail("No nearby users alerted (check FCM tokens)");
  }

  return sosRef.id;
}


// ============================================================
// TEST 2 — Hospital Accepts SOS
// ============================================================

async function testHospitalAccept(sosId) {
  console.log("\n── TEST 2: Hospital Accept ─────────────────────");

  const sosRef = db.collection("sos_requests").doc(sosId);

  await sosRef.update({
    status: "accepted",
    accepted_by_hospital: TEST_HOSPITAL_ID,
    accepted_by_name: "City Care Hospital",
    ambulance_eta: 10,
    accepted_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  info("Hospital accepted SOS — waiting 5 seconds for function...");
  await sleep(5000);

  const updated = await sosRef.get();
  const data = updated.data();

  if (data.status === "accepted") {
    pass("SOS status confirmed as accepted");
  } else {
    fail(`Status is "${data.status}"`);
  }

  if (data.accepted_by_name === "City Care Hospital") {
    pass("Accepted by correct hospital");
  } else {
    fail("Hospital name mismatch");
  }

  info("Check Firebase Console logs for FCM sent to victim + other hospitals");
}


// ============================================================
// TEST 3 — Offline SOS via SMS Webhook
// ============================================================

async function testOfflineSOS() {
  console.log("\n── TEST 3: Offline SOS (SMS Webhook) ───────────");

  const fetch = require("node-fetch");

  // Your deployed Cloud Function URL
  const WEBHOOK_URL = "https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/offlineSOSWebhook";

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        From: TEST_PHONE,
        Body: `SOS ${TEST_LAT} ${TEST_LNG}`,
      }),
    });

    if (response.status === 200) {
      pass("Offline SOS webhook responded 200");
      info("Check Firestore sos_requests — new doc should appear");
    } else {
      fail(`Webhook returned status ${response.status}`);
    }

  } catch (err) {
    fail(`Webhook call failed: ${err.message}`);
    info("Make sure functions are deployed: firebase deploy --only functions");
  }
}


// ============================================================
// TEST 4 — ETA Update
// ============================================================

async function testETAUpdate(sosId) {
  console.log("\n── TEST 4: ETA Update ──────────────────────────");

  // Simulate ambulance 2km away from victim
  const ambulanceLat = 23.2750;
  const ambulanceLng = 77.4200;

  await db.collection("sos_requests").doc(sosId).update({
    ambulance_lat: ambulanceLat,
    ambulance_lng: ambulanceLng,
    ambulance_eta: 8,
    eta_updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  info("Ambulance location updated");
  await sleep(2000);

  const sos = await db.collection("sos_requests").doc(sosId).get();
  const data = sos.data();

  if (data.ambulance_eta !== null) {
    pass(`ETA set: ${data.ambulance_eta} minutes`);
  } else {
    fail("ETA not updated");
  }

  if (data.ambulance_lat && data.ambulance_lng) {
    pass(`Ambulance location saved: ${data.ambulance_lat}, ${data.ambulance_lng}`);
  } else {
    fail("Ambulance location not saved");
  }
}


// ============================================================
// TEST 5 — Bystander Response
// ============================================================

async function testBystanderResponse(sosId) {
  console.log("\n── TEST 5: Bystander Response ──────────────────");

  await db.collection("sos_requests").doc(sosId).update({
    bystander_responses: admin.firestore.FieldValue.arrayUnion({
      user_id: "test_user_priya",
      response: "coming",
      responded_at: new Date().toISOString(),
    }),
  });

  info("Bystander response added");
  await sleep(2000);

  const sos = await db.collection("sos_requests").doc(sosId).get();
  const data = sos.data();

  if (data.bystander_responses?.length > 0) {
    pass(`Bystander responses: ${data.bystander_responses.length}`);
    pass(`Response: ${data.bystander_responses[0].response}`);
  } else {
    fail("No bystander response found");
  }
}


// ============================================================
// CLEANUP — Remove test data
// ============================================================

async function cleanup(sosId) {
  console.log("\n── Cleaning up test data ───────────────────────");

  await db.collection("users").doc(TEST_USER_ID).delete();
  await db.collection("users").doc("test_user_priya").delete();
  await db.collection("hospitals").doc(TEST_HOSPITAL_ID).delete();
  await db.collection("hospitals").doc("test_hospital_hamidia").delete();
  await db.collection("hospital_staff").doc("test_staff_admin").delete();
  await db.collection("sos_requests").doc(sosId).delete();

  info("All test data deleted");
}


// ============================================================
// UTILITY
// ============================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


// ============================================================
// RUN ALL TESTS
// ============================================================

async function runTests() {
  console.log("\n🚨 RakshaSOS — Cloud Functions Test Suite");
  console.log("==========================================\n");

  try {
    await setupDummyData();

    const sosId = await testSOSTrigger();
    await testHospitalAccept(sosId);
    await testOfflineSOS();
    await testETAUpdate(sosId);
    await testBystanderResponse(sosId);

    await cleanup(sosId);

    console.log("\n==========================================");
    console.log("✅ All tests completed");
    console.log("Check Firebase Console logs for FCM + SMS details");

  } catch (err) {
    console.error(`\n${RED}Test suite crashed:${RESET}`, err);
  }

  process.exit(0);
}

runTests();