import React from 'react';
import './DocumentCard.css';

function DocumentCard({ doc, onOpen, onDelete }) {
  const handleOpen = () => {
    if (!doc?._id) {
      console.error("Missing document ID for open.");
      return;
    }
    onOpen(doc._id);
  };

  const handleDelete = () => {
    if (!doc?._id) {
      console.error("Missing document ID for delete.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this document?")) {
      onDelete(doc._id);
    }
  };

  const handleDownload = async () => {
    if (!doc?._id) {
      console.error("Missing document ID for download.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/documents/${doc._id}`);
      if (!response.ok) throw new Error("Failed to fetch document");

      const data = await response.json();
      const content = data.content?.ops?.map(op => op.insert).join('') || 'No content available';

      const blob = new Blob([content], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title?.trim() || 'Document'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error.message);
    }
  };

  return (
    <div className="document-card">
      <div className="document-info">
        <div className="document-title">
          📄 <strong>{doc.title || 'Untitled Document'}</strong>
        </div>
        <div className="last-edited">
          🕒 Last edited: {doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : 'Unknown'}
        </div>
      </div>

      <div className="document-actions">
        <button
          className="open-button"
          onClick={handleOpen}
          disabled={!doc?._id}
          title="Open document"
        >
          🔓 Open
        </button>
        <button
          className="delete-button"
          onClick={handleDelete}
          disabled={!doc?._id}
          title="Delete document"
        >
          🗑️ Delete
        </button>
        <button
          className="download-button"
          onClick={handleDownload}
          disabled={!doc?._id}
          title="Download document as DOCX"
        >
          ⬇️ Download
        </button>
      </div>
    </div>
  );
}

export default DocumentCard;
