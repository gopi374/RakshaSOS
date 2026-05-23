import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">GOLDEN HOUR SYSTEM</div>

        <div className="nav-links">
          <span>Network Status</span>
          <span>Agency Portal</span>
          <span>Help Desk</span>
        </div>

        <div className="status-box">
          <span className="dot"></span>
          System Status: Active
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="badge">
          Authorized Personnel Only
        </div>

        <h1>
          Secure Emergency Response
          <br />
          Network
        </h1>

        <p>
          Authorized access for emergency organizations
          and response departments.
        </p>
      </div>

      {/* Cards */}
      <div className="cards-container">
        {/* Hospital Card */}
        <div className="portal-card">
          <div className="icon-box">+</div>

          <h2>Hospital Access</h2>

          <p>
            Manage emergency cases, ambulance coordination,
            and medical response systems.
          </p>

          <button
            className="hospital-btn"
            onClick={() => navigate("/hospital-login")}
          >
            Initialize Portal
          </button>

          <small>MED-NODE: 771-H</small>
        </div>

        {/* Police Card */}
        <div className="portal-card">
          <div className="icon-box">🛡</div>

          <h2>Police Access</h2>

          <p>
            Monitor incidents, coordinate response units,
            and manage emergency operations.
          </p>

          <button
            className="police-btn"
            onClick={() => navigate("/police-login")}
          >
            Tactical Interface
          </button>

          <small>UNIT-AUTH: LE-09</small>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bottom-status">
        <span>● System Status: Online</span>
        <span>256-bit Encryption Active</span>
        <span>Latency: 14ms</span>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <span>Security Protocol</span>
          <span>Privacy Policy</span>
          <span>Terms Of Service</span>
          <span>Department Directory</span>
        </div>

        <div className="footer-brand">
          GOLDEN HOUR SYSTEM
        </div>

        <p>
          © 2024 EMERGENCY OPERATIONS COMMAND.
          SECURE GOVERNMENT ACCESS ONLY.
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;