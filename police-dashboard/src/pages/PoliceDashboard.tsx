function PoliceDashboard() {
  return (
    <div className="dashboard-layout">

      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="sidebar-logo">
          GoldenHour
        </h2>

        <nav className="sidebar-nav">
          <button>Dashboard</button>
          <button>Live Emergencies</button>
          <button>Active Cases</button>
          <button>Women Safety</button>
          <button>Accidents</button>
          <button>Nearby Units</button>
          <button>Hospital Coordination</button>
          <button>History</button>
          <button>Analytics</button>
          <button>Settings</button>
        </nav>

        <button className="dispatch-btn">
          DISPATCH UNIT
        </button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">

        {/* Topbar */}
        <div className="topbar">

          <input
            type="text"
            placeholder="Search incidents, units..."
            className="search-bar"
          />

          <div className="topbar-actions">
            <div className="active-alert">
              12 Active SOS
            </div>

            <button>🔔</button>
            <button>📡</button>
            <button>📎</button>
          </div>
        </div>

        {/* Content */}
        <div className="dashboard-content">

          {/* Map Section */}
          <section className="map-section">
            <div className="map-placeholder">
              LIVE EMERGENCY MAP
            </div>
          </section>

          {/* SOS Feed */}
          <section className="sos-feed">

            <h3>LIVE SOS FEED</h3>

            <div className="sos-card">
              <h4>Women Safety Alert</h4>

              <p>1.2 KM Away</p>

              <div className="card-actions">
                <button>Assign</button>
                <button>Resolve</button>
              </div>
            </div>

            <div className="sos-card">
              <h4>Medical Emergency</h4>

              <p>0.4 KM Away</p>

              <div className="card-actions">
                <button>Assign</button>
                <button>Resolve</button>
              </div>
            </div>

          </section>

        </div>

      </main>

    </div>
  );
}

export default PoliceDashboard;