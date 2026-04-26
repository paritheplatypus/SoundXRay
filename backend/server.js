// ─────────────────────────────────────────────────────────────────────────────
// server.js  (v2 — text + metrics relay)
//
// Phone/laptop POSTs both transcribed text AND audio metrics here.
// Spectacles GETs both. No OpenAI, no audio files, just structured data.
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// ── Transcript state ─────────────────────────────────────────────────────────
let latestText = "";
let textUpdated = 0;

// ── Audio metrics state ──────────────────────────────────────────────────────
let latestAmplitude = 0;
let latestBands = [0, 0, 0, 0, 0, 0, 0, 0];
let metricsUpdated = 0;


// ── Transcript endpoints ─────────────────────────────────────────────────────

app.post("/upload", (req, res) => {
    const text = (req.body && req.body.text) ? String(req.body.text) : "";
    if (text.length > 0) {
        latestText = text;
        textUpdated = Date.now();
    }
    res.sendStatus(200);
});

app.get("/latest", (req, res) => {
    res.json({ text: latestText, updated: textUpdated });
});


// ── Audio metrics endpoints ──────────────────────────────────────────────────

app.post("/metrics", (req, res) => {
    const body = req.body || {};
    if (typeof body.amplitude === "number") {
        latestAmplitude = body.amplitude;
    }
    if (Array.isArray(body.bands) && body.bands.length === 8) {
        // Validate each band is a number; default to 0 if not
        latestBands = body.bands.map(b => (typeof b === "number" ? b : 0));
    }
    metricsUpdated = Date.now();
    res.sendStatus(200);
});

app.get("/metrics", (req, res) => {
    res.json({
        amplitude: latestAmplitude,
        bands: latestBands,
        updated: metricsUpdated
    });
});


// ── Combined endpoint (one round-trip for both) ──────────────────────────────
// Spectacles can fetch both transcript AND metrics in a single GET to reduce
// network overhead. Useful when poll rates are high.

app.get("/all", (req, res) => {
    res.json({
        text: latestText,
        textUpdated: textUpdated,
        amplitude: latestAmplitude,
        bands: latestBands,
        metricsUpdated: metricsUpdated
    });
});


// ── Health check + web page ──────────────────────────────────────────────────

app.get("/", (req, res) => {
    res.send("STT relay running. Endpoints: /upload, /latest, /metrics, /all, /web");
});

app.use("/web", express.static(path.join(__dirname, "../web")));

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
});
