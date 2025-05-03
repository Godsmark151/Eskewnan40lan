#!/bin/bash

echo "📁 Kreye folder videos..."
mkdir -p videos

echo "⬇️ Ap telechaje ffmpeg..."
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz

echo "📦 Ap dekonprese ffmpeg..."
tar -xf ffmpeg.tar.xz

echo "⚙️ Ap mete ffmpeg binè a..."
cp ffmpeg-*-amd64-static/ffmpeg ./
chmod +x ffmpeg

echo "📦 Ap enstale dependans npm..."
npm install

