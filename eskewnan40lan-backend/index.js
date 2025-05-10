const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const rateLimit = require("express-rate-limit");
const { google } = require("googleapis");

const app = express();
const PORT = process.env.PORT || 3000;
const tokens = new Map();
const loggedStats = new Set();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.use(cors({
  origin: ["https://eskewnan40lan.com"],
  methods: ["POST"],
  credentials: false
}));

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: "Twòp demann. Tanpri eseye ankò pita.",
});

const upload = multer({ dest: "uploads/" });

app.post("/upload", uploadLimiter, upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Pa gen fichye telechaje." });

  const inputPath = req.file.path;
  const outputName = `${req.file.filename}.mp4`;
  const outputPath = path.join("videos", outputName);

  const cmd = `./ffmpeg -i ${inputPath} -c:v libx264 -preset ultrafast -crf 23 ${outputPath}`;

  exec(cmd, (error, stdout, stderr) => {
    fs.unlink(inputPath, () => {});
    if (error) return res.status(500).json({ error: "Conversion failed" });

    const token = Math.random().toString(36).substring(2, 15);
    tokens.set(outputName, token);

    setTimeout(() => {
      fs.unlink(outputPath, err => {
        if (!err) console.log("🗑️ Videyo efase:", outputName);
      });
    }, 5 * 60 * 1000); // efase apre 5 minit

    res.json({ success: true, filename: outputName, token });
  });
});

app.get("/video/:filename", async (req, res) => {
  const filePath = path.join(__dirname, "videos", req.params.filename);
  const tokenProvided = req.query.token;
  const lang = req.query.lang || "unknown";
  const validToken = tokens.get(req.params.filename);
  const region = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const device = req.headers["user-agent"] || "Unknown";
  const spreadsheetId = process.env.GSHEET_ID;
  const keyFilePath = process.env.GSHEET_KEY_PATH;

  let status = "fail";

  if (!validToken || tokenProvided !== validToken) {
    status = "fail";
    await logStatOnce(req.params.filename, tokenProvided, lang, status, region, device, spreadsheetId, keyFilePath);
    return res.status(403).send("❌ Ou pa gen aksè ak videyo sa a.");
  }

  if (fs.existsSync(filePath)) {
    status = "success";
    await logStatOnce(req.params.filename, tokenProvided, lang, status, region, device, spreadsheetId, keyFilePath);
    return res.sendFile(filePath);
  } else {
    status = "fail";
    await logStatOnce(req.params.filename, tokenProvided, lang, status, region, device, spreadsheetId, keyFilePath);
    return res.status(404).send("❌ Videyo pa jwenn");
  }
});

// ✅ Sove done sèlman yon sèl fwa pou chak token + filename
async function logStatOnce(filename, token, lang, status, region, device, spreadsheetId, keyFilePath) {
  const id = `${filename}-${token}`;
  if (loggedStats.has(id)) return;
  loggedStats.add(id);

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "database!B7:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          new Date().toLocaleDateString("en-US"),
          1,
          lang,
          status === "success" ? 1 : 0,
          status === "fail" ? 1 : 0,
          region,
          device
        ]]
      }
    });

    console.log("✅ Statistik mete pou:", id);
  } catch (err) {
    console.error("❌ Google Sheets error:", err.message);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 API koute sou http://localhost:${PORT}`);
});
