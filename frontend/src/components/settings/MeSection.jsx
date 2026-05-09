function MeSection({ user, onLogout }) {
  return (
    <div className="info-box settings-full-box settings-me-box">
      <div className="me-content">
        <div className="me-title-row">
          <h4>Account Information</h4>
        </div>
        <div className="user-details">
          <div className="detail-row">
            <span className="label">Name:</span>
            <span className="value">{user?.name || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email:</span>
            <span className="value">{user?.email || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Role:</span>
            <span className="value">{user?.role || 'User'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Member Since:</span>
            <span className="value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>
      <button className="logout-button" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export default MeSection;
