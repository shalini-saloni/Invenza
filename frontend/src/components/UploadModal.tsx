import React, { useState, useRef } from 'react';
import { UploadCloud, File, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './UploadModal.css';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token, logout } = useAuth();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.status === 401) {
        logout();
        onClose();
        return;
      }
      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.detail || 'Upload failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content bg-card">
        <button className="close-btn" onClick={onClose}><X size={20} /></button>
        <h2>Upload Data</h2>
        <p className="subtitle">Upload your historical sales data (CSV) for analysis.</p>
        
        <div 
          className="drop-zone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {file ? (
            <div className="file-info">
              <File size={32} className="text-green" />
              <span>{file.name}</span>
            </div>
          ) : (
            <>
              <UploadCloud size={48} className="text-secondary" />
              <p>Drag & Drop your CSV file here or <span>browse</span></p>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv"
            style={{ display: 'none' }}
          />
        </div>

        <div style={{ marginTop: '16px', marginBottom: '16px', textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46' }}>
          <p style={{ color: '#bef264', margin: '0 0 6px 0', fontSize: '13px', fontWeight: 500 }}>Required CSV Format:</p>
          <code style={{ color: '#9ca3af', fontSize: '11px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            Date,SKU,Product Name,Sales Quantity,Revenue,Stock Remaining,Category<br/>
            2023-01-01,LAP-13,Laptop Pro 15,10,10000,50,Electronics
          </code>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button 
          className="auth-btn" 
          onClick={handleUpload} 
          disabled={!file || uploading}
          style={{ width: '100%' }}
        >
          {uploading ? 'Processing...' : 'Upload & Analyze'}
        </button>
      </div>
    </div>
  );
};

export default UploadModal;
