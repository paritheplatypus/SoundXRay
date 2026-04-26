// ─────────────────────────────────────────────────────────────────────────────
// server.js
// Minimal text-relay server for the live caption demo.
// Phone POSTs transcribed text → server stores it → Spectacles GETs it.
// No OpenAI, no audio, no API keys. Just a text middleman.
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

let latestText = "";
let lastUpdated = 0;

// Phone POSTs new transcription here
app.post("/upload", (req, res) => {
    const text = (req.body && req.body.text) ? String(req.body.text) : "";
    if (text.length > 0) {
        latestText = text;
        lastUpdated = Date.now();
        console.log("[" + new Date().toISOString() + "] " + text);
    }
    res.sendStatus(200);
});

// Spectacles GETs the latest transcription here
app.get("/latest", (req, res) => {
    res.json({ text: latestText, updated: lastUpdated });
});

// Simple health check
app.get("/", (req, res) => {
    res.send("STT relay running. POST /upload, GET /latest.");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
    console.log("Phone:        open http://YOUR-LAPTOP-IP:" + PORT + "/web");
    console.log("Spectacles:   GET http://YOUR-LAPTOP-IP:" + PORT + "/latest");
});

// Serve the web page from /web
// app.use("/web", express.static("../web"));

// import path from "path";
// import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/web", express.static(path.join(__dirname, "../web")));