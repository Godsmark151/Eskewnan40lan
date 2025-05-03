
#!/bin/bash
mkdir -p videos
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz
tar -xf ffmpeg.tar.xz
cp ffmpeg-*-amd64-static/ffmpeg ./
chmod +x ffmpeg
