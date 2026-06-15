import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../components/Dashboard.css';

const Forecast: React.FC = () => {
  const [sku, setSku] = useState('');
  const [skus, setSkus] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const { token, logout } = useAuth();

  useEffect(() => {
    const fetchSkus = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/skus`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          logout();
          return;
        }
        const data = await res.json();
        if (data && data.length > 0) {
          setSkus(data);
          setSku(data[0].sku);
        }
      } catch (e) {
        console.error("Failed to fetch SKUs", e);
      }
    };
    fetchSkus();
  }, [token]);

  const handleForecast = async () => {
    if (!sku) {
      alert("Please select a SKU first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/forecast?sku=${sku}&periods=6`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setForecast(data);
      }
    } catch (e) {
      console.error(e);
      alert('Error fetching forecast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="welcome-section">
          <h2>Forecasting Engine</h2>
          <p>Predict future demand using Time-Series models (SES)</p>
        </div>
      </header>

      <div className="bg-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af', fontSize: '13px' }}>Select SKU</label>
            <select 
              value={sku} 
              className="sku-select"
              onChange={e => setSku(e.target.value)}
            >
              {skus.length === 0 && <option value="">No data available</option>}
              {skus.map(s => (
                <option key={s.sku} value={s.sku}>{s.product_name} ({s.sku})</option>
              ))}
            </select>
          </div>
          <button className="auth-btn" style={{ marginTop: '22px', padding: '10px 20px', borderRadius: '8px' }} onClick={handleForecast} disabled={skus.length === 0}>
            {loading ? 'Running Model...' : 'Generate Forecast'}
          </button>
        </div>
      </div>

      {forecast && (
        <div className="chart-card bg-card">
          <div className="card-header">
            <h4>6-Month Forecast for {sku}</h4>
            <p className="subtitle">Predicted quantities</p>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '16px' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #3f3f46' }}>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Predicted Quantity</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((row: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px' }}>{row.date}</td>
                    <td style={{ padding: '12px', color: '#bef264' }}>{row.predicted_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forecast;
