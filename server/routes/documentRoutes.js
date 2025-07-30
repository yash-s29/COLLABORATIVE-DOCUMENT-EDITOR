const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const Document = require("../models/Document");
const PDFDocument = require("pdfkit");
const { Document: Docx, Packer, Paragraph } = require("docx");
const { Response } = require("express");

// Existing routes...
// [No changes to GET, POST, PUT, DELETE routes above]

// @route   GET /api/documents/download/pdf/:id
// @desc    Download a document as PDF
router.get("/download/pdf/:id", async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const pdfDoc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.title}.pdf"`);

    pdfDoc.pipe(res);
    pdfDoc.fontSize(20).text(doc.title, { align: "center" });
    pdfDoc.moveDown();
    pdfDoc.fontSize(12).text(doc.content.text || "No content available.");
    pdfDoc.end();
  } catch (err) {
    res.status(500).json({ error: "Failed to generate PDF", details: err.message });
  }
});

// @route   GET /api/documents/download/docx/:id
// @desc    Download a document as DOCX
router.get("/download/docx/:id", async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const docx = new Docx({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: doc.title, heading: "Heading1" }),
          new Paragraph({ text: doc.content.text || "No content available." }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(docx);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.title}.docx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate DOCX", details: err.message });
  }
});

module.exports = router;
