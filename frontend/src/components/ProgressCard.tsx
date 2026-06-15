import React from 'react';
import './ProgressCard.css';

interface ProgressCardProps {
  title: string;
  automated: number;
  manual: number;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ title, automated, manual }) => {
  return (
    <div className="progress-card bg-card">
      <div className="card-header flex-between">
        <h4>{title}</h4>
        <button className="dropdown-btn">6 months <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg></button>
      </div>
      
      <div className="progress-container">
        <div 
          className="progress-bar automated" 
          style={{ width: `${automated}%` }}
        >
          <span className="progress-value">{automated}%</span>
        </div>
        <div 
          className="progress-bar manual" 
          style={{ width: `${manual}%` }}
        >
          <span className="progress-value">{manual}%</span>
        </div>
      </div>
      
      <div className="legend">
        <div className="legend-item">
          <div className="legend-dot automated-dot"></div>
          <span>Automated</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot manual-dot"></div>
          <span>Manual</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;
