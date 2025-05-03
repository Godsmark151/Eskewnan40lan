const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 3000;
const tokens = new Map(); // ✅ Kreye map pou estoke token pou chak videyo

// ✅ CORS pou frontend lan
app.use(cors({
  origin: ["https://eskewnan40lan.com"],
  methods: ["POST"],
  credentials: false
}));

app.use(express.json());
app.get("/video/:filename", (req, res) => {
  const filePath = path.join(__dirname, "videos", req.params.filename);
  const tokenProvided = req.query.token;
  const validToken = tokens.get(req.params.filename);

  if (!validToken || tokenProvided !== validToken) {
    return res.status(403).send("❌ Ou pa gen aksè ak videyo sa a.");
  }

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("❌ Videyo pa jwenn");
  }
});

// ✅ Upload route
app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const inputPath = req.file.path;
  const outputName = `${req.file.filename}.mp4`;
  const outputPath = path.join("videos", outputName);

  const cmd = `ffmpeg -i ${inputPath} -c:v libx264 -preset ultrafast -crf 23 ${outputPath}`;

  exec(cmd, (error, stdout, stderr) => {
    fs.unlink(inputPath, () => {}); // efase fichye webm lan

    if (error) {
      console.error("❌ ffmpeg error:", error);
      return res.status(500).json({ error: "Conversion failed" });
    }

    const token = Math.random().toString(36).substring(2, 15); // kreye token
    tokens.set(outputName, token); // sove token pou aksè
    setTimeout(() => {
  fs.unlink(outputPath, err => {
    if (err) console.error("❌ Pa ka efase videyo a:", err);
    else console.log("🗑️ Videyo efase apre 10 minit:", outputName);
  });
}, 10 * 60 * 1000);

    return res.json({
      success: true,
      filename: outputName,
      token: token
    });
  });
});


// ✅ Demare serve a
app.listen(PORT, () => {
  console.log(`🚀 API k ap koute sou http://localhost:${PORT}`);
});
