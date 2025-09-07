require("dotenv").config(); 
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const { v4: uuidv4 } = require("uuid");
const Document = require("./models/Document");

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

const app = express();
const server = http.createServer(app);

const defaultValue = { ops: [{ insert: "\n" }] };

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

mongoose.set("strictQuery", true);
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", socket => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", { data: document.content, name: document._id });

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async ({ data, name }) => {
      try {
        await Document.findByIdAndUpdate(name, { content: data });
        console.log(`💾 Saved document: ${name}`);
      } catch (err) {
        console.error(`❌ Error saving document ${name}:`, err.message);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

async function findOrCreateDocument(id) {
  if (!id) return null;

  const existing = await Document.findById(id);
  if (existing) return existing;

  return await Document.create({
    _id: id,
    title: `Untitled - ${new Date().toLocaleString()}`,
    content: defaultValue,
  });
}

app.get("/api/documents", async (req, res) => {
  try {
    const docs = await Document.find().sort({ updatedAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error("❌ Error fetching documents:", err.message);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

app.get("/api/documents/:id", async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json(doc);
  } catch (err) {
    console.error("❌ Error fetching document:", err.message);
    res.status(500).json({ error: "Error fetching document" });
  }
});

app.post("/api/documents", async (req, res) => {
  const { title, content = defaultValue } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const newDoc = new Document({
      _id: uuidv4(),
      title: title.trim(),
      content,
    });

    await newDoc.save();
    res.status(201).json(newDoc);
  } catch (error) {
    console.error("❌ Error creating document:", error.message);
    res.status(500).json({ error: "Error creating document" });
  }
});

app.put("/api/documents/:id", async (req, res) => {
  const { title, content } = req.body;

  try {
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;

    const updated = await Document.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ error: "Document not found" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating document:", err.message);
    res.status(500).json({ error: "Error updating document" });
  }
});

app.delete("/api/documents/:id", async (req, res) => {
  try {
    const deleted = await Document.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Document not found" });
    res.status(204).send();
  } catch (err) {
    console.error("❌ Error deleting document:", err.message);
    res.status(500).json({ error: "Error deleting document" });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
