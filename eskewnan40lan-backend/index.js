const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const { google } = require("googleapis");

const app = express();
const PORT = process.env.PORT || 3000;
const tokens = new Map();
const loggedStats = new Set();

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

app.get("/video/:filename", async (req, res) => {
  const filePath = path.join(__dirname, "videos", req.params.filename);
  const tokenProvided = req.query.token;
  const lang = req.query.lang || "unknown";
  const validToken = tokens.get(req.params.filename);

  const region = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const device = req.headers["user-agent"] || "Unknown";
  const status = (!validToken || tokenProvided !== validToken) ? "fail" : (fs.existsSync(filePath) ? "success" : "fail");

  // ✅ Google Sheets API tracking
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "/etc/secrets/eskewnan40lan-stats",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = "1a7liRRfIKhDOzdtCyd9DgiZBTEse6src8D9M6y_TCBA"; // 

    await sheets.spreadsheets.values.append({
      spreadsheetId,
     range: "database!B7:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          new Date().toLocaleDateString("en-US"),
          1, // total video = 1
          lang,
          status === "success" ? 1 : 0,
          status === "fail" ? 1 : 0,
          region,
          device
        ]],
      },
    });

    console.log("✅ Statistik mete nan Google Sheets");
  } catch (err) {
    console.error("❌ Pa ka mete done nan Sheets:", err.message);
  }

  // ✅ Retounen repons videyo a
  if (!validToken || tokenProvided !== validToken) {
    return res.status(403).send("❌ Ou pa gen aksè ak videyo sa a.");
  }

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  } else {
    return res.status(404).send("❌ Videyo pa jwenn");
  }
});

// ✅ Demare sèvè a
app.listen(PORT, () => {
  console.log(`🚀 API ap koute sou http://localhost:${PORT}`);
});

