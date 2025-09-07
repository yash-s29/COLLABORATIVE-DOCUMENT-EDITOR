import React, { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import "./styles.css";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  ["link", "image", "video"],
  ["clean"],
];

const SAVE_INTERVAL_MS = 2000;

export default function TextEditor() {
  const { id: docId } = useParams();
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [quill, setQuill] = useState(null);
  const [title, setTitle] = useState("Untitled");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const s = io("http://localhost:4000");
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const wrapperRef = useCallback((wrapper) => {
    if (!wrapper) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);

  useEffect(() => {
    if (!quill) return;
    const loadDocument = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/documents/${docId}`);
        const doc = res.data;
        setTitle(doc.title || "Untitled");
        quill.setContents(doc.content || { ops: [] });
        quill.enable();
      } catch (err) {
        console.error("Error loading document:", err);
        alert("Document not found. Redirecting...");
        navigate("/");
      }
    };
    loadDocument();
  }, [docId, quill, navigate]);

  useEffect(() => {
    if (!socket || !quill) return;
    socket.emit("get-document", docId);
    socket.once("load-document", ({ data }) => {
      if (data) {
        quill.setContents(data);
        quill.enable();
      }
    });
  }, [socket, quill, docId]);

  useEffect(() => {
    if (!socket || !quill) return;
    const sendHandler = (delta, _, source) => {
      if (source === "user") {
        socket.emit("send-changes", delta);
      }
    };
    quill.on("text-change", sendHandler);
    return () => quill.off("text-change", sendHandler);
  }, [socket, quill]);

  useEffect(() => {
    if (!socket || !quill) return;
    const receiveHandler = (delta) => quill.updateContents(delta);
    socket.on("receive-changes", receiveHandler);
    return () => socket.off("receive-changes", receiveHandler);
  }, [socket, quill]);

  useEffect(() => {
    if (!quill || !title) return;
    const interval = setInterval(async () => {
      const content = quill.getContents();
      socket?.emit("save-document", { data: content, title });
      try {
        await axios.put(`http://localhost:4000/api/documents/${docId}`, {
          title,
          content,
        });
        console.log("Auto-saved document:", new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [quill, title, socket, docId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!quill) return;
        const text = quill.getText();
        const pdf = new jsPDF();
        const lines = pdf.splitTextToSize(text, 180);
        pdf.text(lines, 10, 10);
        pdf.save(`${title || "document"}.pdf`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quill, title]);

  const handleDocxDownload = () => {
    if (!quill) return;
    const content = quill.getText();
    const blob = new Blob([content], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `${title || "document"}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`editor-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="editor-toolbar">
        <div className="left-controls">
          <button onClick={() => navigate("/")} className="toolbar-btn" title="Back to Home">🏠</button>
          <input
            className="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document Title"
          />
        </div>

        <div className="right-controls">
          <button onClick={handleDocxDownload} className="toolbar-btn" title="Download DOCX">
            ⬇️ DOCX
          </button>
          <button onClick={() => setDarkMode((prev) => !prev)} className="toolbar-btn" title="Toggle Theme">
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      <div className="editor-wrapper">
        <div className="editor" ref={wrapperRef}></div>
      </div>
    </div>
  );
}
