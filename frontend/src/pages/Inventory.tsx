import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../components/Dashboard.css';

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, logout } = useAuth();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/inventory', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          logout();
          return;
        }
        const data = await res.json();
        setInventory(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [token]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="welcome-section">
          <h2>Inventory Decisions</h2>
          <p>Recommended restock levels and demand alerts based on historical data.</p>
        </div>
      </header>

      <div className="bg-card" style={{ padding: '24px', overflowX: 'auto' }}>
        {loading ? (
          <p style={{ color: '#9ca3af' }}>Loading recommendations...</p>
        ) : inventory.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No data available. Please upload your sales CSV on the Dashboard.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #3f3f46' }}>
                <th style={{ padding: '12px' }}>SKU</th>
                <th style={{ padding: '12px' }}>Product</th>
                <th style={{ padding: '12px' }}>Avg Monthly Sales</th>
                <th style={{ padding: '12px' }}>Recommended Stock</th>
                <th style={{ padding: '12px' }}>Reorder Point</th>
                <th style={{ padding: '12px' }}>Status / Trend</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{row.sku}</td>
                  <td style={{ padding: '12px', color: '#9ca3af' }}>{row.product}</td>
                  <td style={{ padding: '12px' }}>{row.avg_monthly_sales}</td>
                  <td style={{ padding: '12px', color: '#bef264', fontWeight: 600 }}>{row.recommended_stock}</td>
                  <td style={{ padding: '12px', color: '#fb923c', fontWeight: 600 }}>{row.reorder_point}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: row.status === 'Healthy' ? 'rgba(190, 242, 100, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: row.status === 'Healthy' ? '#bef264' : '#ef4444',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Inventory;
