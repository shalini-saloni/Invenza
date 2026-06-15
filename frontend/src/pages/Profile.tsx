import React, { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Camera, FileText, Database, Package, Edit2, Check, X } from 'lucide-react';
import './Profile.css';
import '../components/Dashboard.css';

const Profile: React.FC = () => {
  const { token, logout } = useAuth();
  const [user, setUser] = React.useState<any>(null);
  const [stats, setStats] = React.useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [imgError, setImgError] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }

      const statsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/user-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [token]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me/avatar`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (res.ok) {
          fetchData(); // Refresh user data to get new avatar URL
          // Force layout refresh by reloading page after a brief delay
          setTimeout(() => window.location.reload(), 500);
        }
      } catch (err) {
        console.error('Avatar upload failed', err);
        alert('Failed to upload avatar');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleEditName = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ full_name: editName })
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setIsEditingName(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update name');
    }
  };

  if (!user || !stats) return <div className="dashboard"><p style={{ color: '#9ca3af' }}>Loading profile...</p></div>;

  const initials = user.full_name
    ? user.full_name.trim().charAt(0).toUpperCase()
    : user.email[0].toUpperCase();

  const profilePicUrl = user.profile_picture ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.profile_picture}` : null;

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="welcome-section">
          <h2>My Profile</h2>
          <p>Manage your account and view usage statistics</p>
        </div>
      </header>

      <div className="profile-grid">
        {/* Left Column: Avatar & Summary */}
        <div className="bg-card profile-card">
          <div className="avatar-container" onClick={() => !uploadingAvatar && fileInputRef.current?.click()}>
            {!profilePicUrl || imgError ? (
              initials
            ) : (
              <img 
                src={profilePicUrl} 
                alt={initials} 
                className="avatar-image" 
                onError={() => setImgError(true)}
              />
            )}
            <div className="avatar-overlay">
              <Camera size={24} />
              <span>{uploadingAvatar ? 'Uploading...' : 'Change'}</span>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            {isEditingName ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: 'rgba(0,0,0,0.2)', color: '#fff' }} 
                />
                <button onClick={handleEditName} style={{ color: '#bef264', padding: '6px' }}><Check size={18} /></button>
                <button onClick={() => setIsEditingName(false)} style={{ color: '#ef4444', padding: '6px' }}><X size={18} /></button>
              </div>
            ) : (
              <>
                <h3 className="profile-name" style={{ marginBottom: 0 }}>{user.full_name || 'User'}</h3>
                <button onClick={() => { setEditName(user.full_name || ''); setIsEditingName(true); }} style={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                  <Edit2 size={16} />
                </button>
              </>
            )}
          </div>
          <p className="profile-email">{user.email}</p>
          <div className="profile-role-badge">Administrator</div>

          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-value text-green">{stats.total_uploads}</span>
              <span className="stat-label">Files Uploaded</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{stats.total_skus}</span>
              <span className="stat-label">SKUs Tracked</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{stats.total_rows}</span>
              <span className="stat-label">Data Points</span>
            </div>
            <div className="stat-box">
              <span className="stat-value text-orange">{stats.days_active}</span>
              <span className="stat-label">Days Active</span>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Activity */}
        <div className="bg-card details-card">
          <h3 className="section-title">Account Details</h3>
          <div className="details-list">
            <div className="info-row">
              <User size={20} className="info-icon" />
              <div>
                <p className="info-label">Full Name</p>
                <p className="info-value">{user.full_name || 'Not set'}</p>
              </div>
            </div>
            <div className="info-row">
              <Mail size={20} className="info-icon" />
              <div>
                <p className="info-label">Email Address</p>
                <p className="info-value">{user.email}</p>
              </div>
            </div>
            <div className="info-row">
              <Calendar size={20} className="info-icon" />
              <div>
                <p className="info-label">Member Since</p>
                <p className="info-value">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="activity-section">
            <h3 className="section-title">Recent Activity</h3>
            {stats.recent_uploads && stats.recent_uploads.length > 0 ? (
              <div className="activity-list">
                {stats.recent_uploads.map((upload: any, i: number) => (
                  <div key={i} className="activity-item">
                    <div className="activity-info">
                      <FileText size={18} className="activity-icon" />
                      <div>
                        <p className="activity-filename">{upload.filename}</p>
                        <p className="activity-date">{new Date(upload.date).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`activity-status status-${upload.status}`}>
                      {upload.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="info-row" style={{ justifyContent: 'center' }}>
                <Database size={18} className="info-icon text-secondary" style={{ marginRight: '8px' }} />
                <span className="info-label">No data uploaded yet. Head to the dashboard to get started.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
