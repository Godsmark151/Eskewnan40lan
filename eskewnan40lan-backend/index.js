const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const tokens = new Map();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));


// ✅ CORS pou frontend lan sèlman
app.use(cors({
  origin: ["https://eskewnan40lan.com"],
  methods: ["POST"],
  credentials: false
}));

app.use(express.json());

// ✅ Rate limit: max 500 demann / minit
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: "Twòp demann. Tanpri eseye ankò pita.",
  standardHeaders: true,
  legacyHeaders: false,
});

const upload = multer({
  dest: "uploads/"
  // ❌ pa mete limits: { fileSize } si ou vle sispann limit
});


// ✅ Resevwa fichye epi konvèti ak ffmpeg
app.post("/upload", uploadLimiter, upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Pa gen fichye telechaje." });

  const inputPath = req.file.path;
  const outputName = `${req.file.filename}.mp4`;
  const outputPath = path.join("videos", outputName);

  const cmd = `./ffmpeg -i ${inputPath} -c:v libx264 -preset ultrafast -crf 23 ${outputPath}`;

  exec(cmd, (error, stdout, stderr) => {
    fs.unlink(inputPath, () => {}); // efase fichye webm lan
    console.error("❌ ffmpeg error:", error);
    console.log("📝 ffmpeg stdout:", stdout);
    console.log("⚠️ ffmpeg stderr:", stderr);

    if (error) {
      console.error("❌ ffmpeg error:", error);
      return res.status(500).json({ error: "Conversion failed" });
    }

    const token = Math.random().toString(36).substring(2, 15);
    tokens.set(outputName, token);

    // Efase videyo apre 10 minit
    setTimeout(() => {
      fs.unlink(outputPath, err => {
        if (err) console.error("❌ Pa ka efase videyo a:", err);
        else console.log("🗑️ Videyo efase:", outputName);
      });
    }, 10 * 60 * 1000);

    return res.json({
      success: true,
      filename: outputName,
      token: token
    });
  });
});

// ✅ Resevwa videyo ak token sèlman
app.get("/video/:filename", (req, res) => {
  const filePath = path.join(__dirname, "videos", req.params.filename);
  const tokenProvided = req.query.token;
  const validToken = tokens.get(req.params.filename);

  if (!validToken || tokenProvided !== validToken) {
    axios.post("https://script.google.com/macros/s/AKfycbwGeAHfdzu2XPhb3wiu7b5NW26IT9VQJUZ1DZCdVXVZ1HrQ6qgeDrdXMq5KLV5AZF31Rg/exec", {
      timestamp: new Date().toISOString(),
      device: req.headers["user-agent"],
      region: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      status: "fail"
    }).catch(err => console.error("❌ Pa ka voye done echèk:", err.message));

    return res.status(403).send("❌ Ou pa gen aksè ak videyo sa a.");
  }

  if (fs.existsSync(filePath)) {
    axios.post("https://script.google.com/macros/s/AKfycbxc2HRk_SqejBOm8zJdb_K18nAWHu3dd3YYDqX7PT2znV0lDj861PPOJidIyPxFp1ShOQ/exec", {
      timestamp: new Date().toISOString(),
      device: req.headers["user-agent"],
      region: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      status: "success"
    }).catch(err => console.error("❌ Pa ka voye done siksè:", err.message));

    return res.sendFile(filePath);
  } else {
    return res.status(404).send("❌ Videyo pa jwenn");
  }
});
