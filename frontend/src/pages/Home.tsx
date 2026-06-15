import React, { useState } from 'react';
import { UploadCloud, BarChart3, Brain, Package, TrendingUp, Shield } from 'lucide-react';
import UploadModal from '../components/UploadModal';
import './Home.css';

const Home: React.FC = () => {
  const [showUpload, setShowUpload] = useState(false);

  const features = [
    { icon: <BarChart3 size={28} />, title: 'Demand Forecasting', desc: 'Predict future sales using time-series models like SES and Holt-Winters.' },
    { icon: <Brain size={28} />, title: 'RAG Explainability', desc: 'Ask questions and get AI-powered explanations backed by your real data.' },
    { icon: <Package size={28} />, title: 'Inventory Insights', desc: 'Get smart restock recommendations, reorder points, and low-stock alerts.' },
    { icon: <TrendingUp size={28} />, title: 'Trend Analysis', desc: 'Visualize monthly sales trends, seasonal patterns, and anomalies.' },
    { icon: <Shield size={28} />, title: 'Data Cleaning', desc: 'Automated pipeline that handles nulls, duplicates, and inconsistencies.' },
    { icon: <UploadCloud size={28} />, title: 'CSV Upload', desc: 'Simply upload your historical sales data and let AI do the rest.' },
  ];

  return (
    <div className="home-page">
      {showUpload && (
        <UploadModal 
          onClose={() => setShowUpload(false)} 
          onSuccess={() => { setShowUpload(false); alert('Data uploaded and processed! Head to Dashboard to see insights.'); }} 
        />
      )}

      <section className="hero-section">
        {/* Background Video */}
        <div className="video-bg">
          <video autoPlay muted loop playsInline>
            <source src="/invenza.mp4" type="video/mp4" />
          </video>
          <div className="video-overlay"></div>
        </div>

        <h1>Intelligent Demand<br/>Forecasting with <span className="text-green-hero">RAG</span></h1>
        <p className="hero-desc">
          Upload your sales data, get accurate demand predictions, and understand 
          <em> why</em> trends happen — all in one platform. Invenza combines time-series 
          forecasting with Retrieval-Augmented Generation for truly interpretable insights.
        </p>
        <button className="upload-hero-btn" onClick={() => setShowUpload(true)}>
          <UploadCloud size={20} />
          Upload Your Data
        </button>
      </section>

      <section className="features-section">
        <h2>Unleash Your Data's Potential</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
