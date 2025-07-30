import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import TextEditor from "./TextEditor";
import axios from "axios";
import "./App.css"; // Optional if you use App.css separately

const formatDateTime = (isoString) => {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(isoString).toLocaleString(undefined, options);
};

function HomePage({ documents, handleDelete, createDocument }) {
  return (
    <section className="dashboard">
      <div className="home-header">
        <h2>📑 Your Documents</h2>
        <button className="toolbar-btn" onClick={createDocument}>
          ➕ Create New
        </button>
      </div>

      <div className="doc-list">
        {documents.length > 0 ? (
          documents.map((doc) => (
            <div key={doc._id} className="doc-card">
              <div className="doc-info">
                <p><strong>📄 Title:</strong> {doc.title || "Untitled"}</p>
                <p><strong>🕒 Created:</strong> {formatDateTime(doc.createdAt)}</p>
                <p><strong>🔄 Updated:</strong> {formatDateTime(doc.updatedAt)}</p>
              </div>
              <div className="doc-actions">
                <Link to={`/documents/${doc._id}`} className="toolbar-btn">
                  Open
                </Link>
                <button
                  className="toolbar-btn"
                  onClick={() => handleDelete(doc._id)}
                >
                  ❌ Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No documents available. Click “Create New” to begin!</p>
        )}
      </div>
    </section>
  );
}

function NotFound() {
  return (
    <section className="not-found">
      <h2>404 - Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="toolbar-btn">Return Home</Link>
    </section>
  );
}

function AppWrapper() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [lastSaved, setLastSaved] = useState("");

  const fetchDocuments = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/documents");
      setDocuments(res.data);
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/documents/${id}`);
      fetchDocuments();
    } catch (err) {
      console.error("Error deleting document:", err);
    }
  };

  const createDocument = async () => {
    const docTitle = prompt("Enter document title:");
    if (!docTitle || docTitle.trim() === "") return;

    try {
      const res = await axios.post("http://localhost:4000/api/documents", {
        title: docTitle.trim(),
        content: { ops: [{ insert: "\n" }] },
      });
      navigate(`/documents/${res.data._id}`);
    } catch (err) {
      console.error("Error creating document:", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const updateTime = () => {
      setLastSaved(new Date().toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`editor-container ${darkMode ? "dark-mode" : ""}`}>
      <header className="editor-toolbar">
        <h1>📄 CollabDocs</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="last-saved">💾 Last Saved: {lastSaved}</span>
          <button className="toolbar-btn" onClick={() => setDarkMode((prev) => !prev)}>
            {darkMode ? "🌞 Light" : "🌙 Dark"}
          </button>
        </div>
      </header>

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                documents={documents}
                handleDelete={handleDelete}
                createDocument={createDocument}
              />
            }
          />
          <Route
            path="/documents/:id"
            element={<TextEditor darkMode={darkMode} />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
