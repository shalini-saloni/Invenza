import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send } from 'lucide-react';
import '../components/Dashboard.css';

const Insights: React.FC = () => {
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState<{role: string, content: string}[]>(() => {
    const saved = localStorage.getItem('invenza_chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const { token, logout } = useAuth();

  React.useEffect(() => {
    localStorage.setItem('invenza_chat_history', JSON.stringify(chat));
  }, [chat]);

  const clearChat = () => {
    setChat([]);
  };

  const handleSend = async () => {
    if (!query) return;
    const newChat = [...chat, { role: 'user', content: query }];
    setChat(newChat);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ query: newChat[newChat.length - 1].content })
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      setChat([...newChat, { role: 'ai', content: data.answer }]);
    } catch (e) {
      console.error(e);
      setChat([...newChat, { role: 'ai', content: 'Error fetching insights.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <header className="dashboard-header">
        <div className="welcome-section">
          <h2>RAG Insights</h2>
          <p>Ask questions about your data trends and get explainable AI answers.</p>
        </div>
        {chat.length > 0 && (
          <button 
            className="upload-hero-btn" 
            onClick={clearChat}
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '10px 20px', 
              fontSize: '14px' 
            }}
          >
            Clear History
          </button>
        )}
      </header>

      <div className="bg-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {chat.length === 0 && (
            <p style={{ color: '#6b7280', textAlign: 'center', marginTop: '40px' }}>
              Try asking: "Why did sales drop?" or "Which product should I not restock next month?"
            </p>
          )}
          {chat.map((msg, i) => (
            <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
              <div style={{ 
                background: msg.role === 'user' ? 'var(--grad-green)' : 'rgba(0,0,0,0.3)',
                color: msg.role === 'user' ? '#000' : '#fff',
                padding: '12px 16px',
                borderRadius: '12px',
                border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', color: '#9ca3af' }}>Thinking...</div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your inventory..."
            style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid #3f3f46', color: '#fff', padding: '12px 16px', borderRadius: '12px' }}
          />
          <button 
            className="auth-btn" 
            style={{ margin: 0, padding: '12px 20px', borderRadius: '12px' }}
            onClick={handleSend}
            disabled={loading}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Insights;
