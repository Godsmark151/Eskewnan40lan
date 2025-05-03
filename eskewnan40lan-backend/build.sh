#!/bin/bash
echo "📦 Kreye folder videos..."
mkdir -p videos

echo "⬇️ Telechaje ffmpeg static binary..."
curl -L -o ffmpeg.tar.xz https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz

echo "📂 Dekonprese ffmpeg..."
tar -xf ffmpeg.tar.xz

echo "🚚 Deplase ffmpeg nan rasin projet la..."
mv ffmpeg-*-static/ffmpeg ./ffmpeg
chmod +x ./ffmpeg

echo "✅ Fini! FFmpeg pare pou itilize sou Render."
