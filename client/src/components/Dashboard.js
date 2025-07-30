import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import { FiPlus, FiFileText, FiClock, FiRefreshCcw, FiTrash2, FiExternalLink } from 'react-icons/fi';

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axios.get('http://localhost:4000/api/documents');
        setDocuments(res.data);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('❌ Failed to load documents. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const createNewDocument = async () => {
    const title = prompt('Enter a name for your new document:');
    const trimmedTitle = title?.trim();
    if (!trimmedTitle) return;

    try {
      const res = await axios.post('http://localhost:4000/api/documents', {
        title: trimmedTitle,
        content: { ops: [{ insert: '\n' }] },
      });
      navigate(`/editor/${res.data._id}`);
    } catch (err) {
      console.error('Failed to create document:', err);
      alert('❌ Error creating document. Try again.');
    }
  };

  const deleteDocument = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`http://localhost:4000/api/documents/${id}`);
        setDocuments((prevDocs) => prevDocs.filter((doc) => doc._id !== id));
      } catch (err) {
        console.error('Failed to delete document:', err);
        alert('❌ Error deleting document. Try again.');
      }
    }
  };

  const openDocument = (id) => {
    navigate(`/editor/${id}`);
  };

  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1><FiFileText size={28} style={{ marginRight: '8px' }} /> Your Documents</h1>
        <button className="new-doc-btn" onClick={createNewDocument}>
          <FiPlus style={{ marginRight: '6px' }} /> Create New
        </button>
      </div>

      {loading ? (
        <p className="status-msg">⏳ Loading documents...</p>
      ) : error ? (
        <p className="status-msg error">{error}</p>
      ) : documents.length === 0 ? (
        <p className="status-msg">📭 No documents yet. Click "Create New" to begin!</p>
      ) : (
        <div className="document-grid">
          {documents.map((doc) => (
            <div className="document-card" key={doc._id}>
              <h3 className="doc-title" title={doc.title?.trim() || 'Untitled'}>
                <FiFileText /> {doc.title?.trim() || 'Untitled'}
              </h3>
              <p className="timestamp"><FiClock /> Created: {formatDateTime(doc.createdAt)}</p>
              <p className="timestamp"><FiRefreshCcw /> Updated: {formatDateTime(doc.updatedAt)}</p>
              <div className="doc-actions">
                <button className="btn open" onClick={() => openDocument(doc._id)}>
                  <FiExternalLink /> Open
                </button>
                <button className="btn delete" onClick={() => deleteDocument(doc._id)}>
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
