import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';
import UploadModal from './UploadModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UploadCloud, TrendingUp, Package, DollarSign } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token, logout } = useAuth();

  const fetchDashboard = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      if (!data.error) {
        setDashData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, [token]);

  if (loading) {
    return <div className="dashboard"><p style={{ color: '#9ca3af', padding: '40px' }}>Loading dashboard...</p></div>;
  }

  // Empty state — no data uploaded
  if (!dashData || !dashData.trends || dashData.trends.length === 0) {
    return (
      <div className="dashboard">
        {showUpload && (
          <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); fetchDashboard(); }} />
        )}
        <div className="empty-state">
          <UploadCloud size={64} style={{ color: '#3f3f46', marginBottom: '16px' }} />
          <h2>No Data Yet</h2>
          <p>Upload your historical sales CSV to see charts, trends, and insights.</p>
          <button className="upload-hero-btn" onClick={() => setShowUpload(true)} style={{ marginTop: '24px' }}>
            <UploadCloud size={20} />
            Upload Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); fetchDashboard(); }} />
      )}
      <header className="dashboard-header">
        <div className="welcome-section">
          <h2>Dashboard</h2>
          <p>Real-time insights from your uploaded data</p>
        </div>
        <button className="upload-hero-btn" onClick={() => setShowUpload(true)} style={{ padding: '10px 20px', fontSize: '14px' }}>
          <UploadCloud size={16} /> Upload More Data
        </button>
      </header>

      <div className="kpi-row">
        <div className="kpi-card bg-card">
          <div className="kpi-icon" style={{ background: 'rgba(190, 242, 100, 0.1)' }}><Package size={22} style={{ color: '#bef264' }} /></div>
          <div>
            <p className="kpi-label">SKUs Managed</p>
            <h3 className="kpi-value">{dashData.total_skus}</h3>
          </div>
        </div>
        <div className="kpi-card bg-card">
          <div className="kpi-icon" style={{ background: 'rgba(253, 186, 116, 0.1)' }}><DollarSign size={22} style={{ color: '#fb923c' }} /></div>
          <div>
            <p className="kpi-label">Total Sales</p>
            <h3 className="kpi-value">{dashData.total_sales?.toLocaleString()}</h3>
          </div>
        </div>
        <div className="kpi-card bg-card">
          <div className="kpi-icon" style={{ background: 'rgba(190, 242, 100, 0.1)' }}><TrendingUp size={22} style={{ color: '#bef264' }} /></div>
          <div>
            <p className="kpi-label">Data Points</p>
            <h3 className="kpi-value">{dashData.trends.length} months</h3>
          </div>
        </div>
      </div>

      <div className="chart-card bg-card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h4>Monthly Sales Trend</h4>
          <p className="subtitle">Aggregated from uploaded data</p>
        </div>
        <div className="chart-container" style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashData.trends} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#202022', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="quantity" fill="#bef264" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
