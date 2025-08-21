// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Load API Key from .env
const RAQKID_API_KEY = process.env.RAQKID_API_KEY || "";

// API Proxy Endpoint
app.post("/api/generate", async (req, res) => {
  try {
    const prompt = (req.body?.prompt ?? "").toString().trim();
    if (!prompt) return res.status(400).json({ status: false, error: "Prompt is required" });
    if (!RAQKID_API_KEY) return res.status(500).json({ status: false, error: "Missing API key" });

    // Build API URL
    const encoded = encodeURIComponent(prompt);
    const externalUrl = `https://raqkidaiapi.onrender.com/cohere?prompt=${encoded}&key=${encodeURIComponent(RAQKID_API_KEY)}`;

    // Use native fetch from Node.js v20
    const apiResp = await fetch(externalUrl);

    if (!apiResp.ok) {
      const text = await apiResp.text();
      return res.status(apiResp.status).json({ status: false, error: "Upstream API error", details: text });
    }

    const json = await apiResp.json();
    return res.json(json);
  } catch (err) {
    console.error("Proxy Error:", err);
    return res.status(500).json({ status: false, error: "Server error", details: err.message });
  }
});

// Handle SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Extreme AI Site running at: http://localhost:${PORT}`);
});
