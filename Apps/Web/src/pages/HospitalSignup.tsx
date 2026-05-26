import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/HospitalSignup.css";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

import { auth } from "../firebase/firebaseConfig";


function HospitalSignup() {
  const [email, setEmail] = useState("");

const [password, setPassword] = useState("");

const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async () => {

  if (!email || !password) {

    alert("Please fill required fields.");

    return;
  }

  if (password !== confirmPassword) {

    alert("Passwords do not match.");

    return;
  }

  try {

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await sendEmailVerification(
      userCredential.user
    );

    alert(
      "Verification email sent. Please verify your email."
    );

    navigate("/hospital-login");

  } catch (error: any) {

    alert(error.message);

  }

};

  const navigate = useNavigate();

  return (

    <div className="hospital-signup-page">

      {/* Navbar */}
      <nav className="hospital-navbar">

        <div className="hospital-logo">
          RakshaSOS
        </div>

        <div className="hospital-nav-links">

          <span>Emergency Network</span>

          <span className="active-link">
            Hospital Coordination
          </span>

          <span>Police Response</span>

          <span>Help Desk</span>

        </div>

        <div className="hospital-status">
          System Status
        </div>

      </nav>

      {/* Main */}
      <div className="hospital-main-wrapper">

        {/* LEFT */}
        <div className="hospital-left">

          {/* Header Card */}
          <div className="top-info-card">

            <div className="medical-badge">
              VERIFIED MEDICAL INFRASTRUCTURE ACCESS
            </div>

            <h1>
              Hospital Emergency Network Registration
            </h1>

            <p>
              Register your hospital, trauma center,
              or emergency response department into
              the RakshaSOS real-time emergency
              coordination system.
            </p>

          </div>

          {/* Hospital Information */}
          <div className="form-card">

            <h2>
              Hospital Information
            </h2>

            <div className="input-grid">

              <input placeholder="Hospital Name" />
             <input
  type="email"
  placeholder="Official Email"
  value={email}
  onChange={(e) =>
    setEmail(e.target.value)
  }
/>

              <input placeholder="Emergency Contact" />
              <input placeholder="Address" />

              <input placeholder="City" />
              <input placeholder="State" />

            </div>

          </div>

          {/* Emergency Operations */}
          <div className="form-card">

            <h2>
              Emergency Operations
            </h2>

            <div className="input-grid">

              <select>
                <option>
                  Private Tertiary Hospital
                </option>
              </select>

              <input placeholder="Emergency Beds Count" />

            </div>

            <div className="checkbox-row">

              <div className="feature-box">
                ICU Available
              </div>

              <div className="feature-box">
                Ambulance Fleet
              </div>

              <div className="feature-box">
                24/7 Service
              </div>

            </div>

          </div>

          {/* Verification */}
          <div className="form-card">

            <h2>
              Verification Documents
            </h2>

            <div className="upload-row">

              <div className="upload-box">

                <h4>
                  Authorization Document
                </h4>

                <p>
                  PDF, JPG or PNG
                </p>

              </div>

              <div className="upload-box">

                <h4>
                  Medical Registration Certificate
                </h4>

                <p>
                  Government Issued Certificate
                </p>

              </div>

            </div>

            <div className="verify-note">

              Verification usually takes 24–48 business hours.

            </div>

          </div>

          {/* Secure Access */}
          <div className="form-card">

            <h2>
              Secure Access
            </h2>

            <div className="input-grid">

          <input
  type="password"
  placeholder="Create Admin Password"
  value={password}
  onChange={(e) =>
    setPassword(e.target.value)
  }
/>

            <input
  type="password"
  placeholder="Confirm Password"
  value={confirmPassword}
  onChange={(e) =>
    setConfirmPassword(
      e.target.value
    )
  }
/>

            </div>

          </div>

          {/* Button */}
         <button
  className="register-hospital-btn"
  onClick={handleSignup}
>

            Register Hospital Network

          </button>

          <div className="login-link">

            Already registered?

            <span
              onClick={() =>
                navigate("/hospital-login")
              }
            >
              Access Hospital Dashboard
            </span>

          </div>

        </div>

        {/* RIGHT */}
        <div className="hospital-right">

          {/* Preview */}
          <div className="preview-panel">

            <div className="preview-header">

              <h2>
                Live Preview
              </h2>

              <span>
                LIVE SOS
              </span>

            </div>

            <div className="alert-card red">

              <h4>
                Critical: Cardiac Arrest
              </h4>

              <p>
                Ambulance ETA: 4m
              </p>

            </div>

            <div className="alert-card yellow">

              <h4>
                Dispatch: Trauma Ward 4
              </h4>

              <p>
                Police Escort Assigned
              </p>

            </div>

            <div className="stats-row">

              <div className="stat-box">

                <span>
                  AVAILABLE BEDS
                </span>

                <h3>12</h3>

              </div>

              <div className="stat-box">

                <span>
                  STAFF ACTIVE
                </span>

                <h3>24</h3>

              </div>

            </div>

            <img
              className="dashboard-image"
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
              alt="dashboard"
            />

          </div>

          {/* Feature Cards */}

          <div className="side-feature">
            Secure Communication
          </div>

          <div className="side-feature">
            Verified Network
          </div>

          <div className="side-feature">
            Real-Time SOS
          </div>

          <div className="side-feature">
            Encrypted Patient Routing
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="hospital-footer">

        <div className="footer-logo">
          RakshaSOS
        </div>

        <p>
          © 2024 RakshaSOS Emergency Response.
        </p>

        <div className="footer-links">

          <span>Privacy Policy</span>
          <span>Emergency Protocols</span>
          <span>Contact Support</span>
          <span>Department Directory</span>

        </div>

      </footer>

    </div>

  );

}

export default HospitalSignup;