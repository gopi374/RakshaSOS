import { useNavigate } from "react-router-dom";
function PoliceLogin() {
    const navigate = useNavigate();
  return (
    <div className="login-page">

      {/* Navbar */}
      <nav className="login-navbar">
        <div className="logo">
          GOLDEN HOUR SYSTEM
        </div>

        <div className="nav-links">
          <span>Network Status</span>
          <span>Agency Portal</span>
          <span>Help Desk</span>
        </div>

        <div className="status-box">
          🛡 System Status: Active
        </div>
      </nav>

      {/* Login Container */}
      <div className="login-container">

        <div className="login-card">

          <div className="secure-badge">
            SECURE GOVERNMENT ACCESS ONLY
          </div>

          <h1>Authorized Personnel Login</h1>

          <p>
            Access restricted to Tier 3 First Responders
            and Command staff.
          </p>

          {/* Email */}
          <div className="input-group">
            <label>Organization Email</label>

            <input
              type="email"
              placeholder="name@agency.gov"
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <div className="password-row">
              <label>Password</label>

              <span>Forgot Password</span>
            </div>

            <input
              type="password"
              placeholder="••••••••••"
            />
          </div>

          {/* Department ID */}
          <div className="input-group">
            <label>Department ID / Access Code</label>

            <input
              type="text"
              placeholder="EOC-TX-4492"
            />
          </div>

          {/* Checkbox */}
          <div className="remember-box">
            <input type="checkbox" />

            <span>
              Remember Device for 24 hours
            </span>
          </div>

          {/* Info Box */}
          <div className="info-box">
            <p>
              Two-Factor Authentication (2FA) required.
              A security token will be requested upon
              successful credential validation.
            </p>
          </div>

          {/* Button */}
      <button
  className="auth-btn"
  onClick={() => navigate("/police-dashboard")}
>
  AUTHENTICATE →
</button>

        </div>

      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <span>Security Protocol</span>
          <span>Privacy Policy</span>
          <span>Terms Of Service</span>
          <span>Department Directory</span>
        </div>

        <p>
          © 2024 EMERGENCY OPERATIONS COMMAND.
          SECURE GOVERNMENT ACCESS ONLY.
        </p>
      </footer>

    </div>
  );
}

export default PoliceLogin;