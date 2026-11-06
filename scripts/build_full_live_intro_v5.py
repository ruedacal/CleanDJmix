#!/usr/bin/env python3
"""
BEATWAVE PRO - Master Intro V5 (100% Live Video - No Static Images)
- Exactly 24.534s total duration, uniform 24 fps
- 0.0s - 7.125s: Arrival in booth, 1st person POV behind mixer (2.0s fade in from black, darkened)
- 7.125s - 11.534s: Slow motion hand reach to CDJ cue/play button in real live video (click at 11.45s)
- 11.534s - 15.834s (4.3s): Live festival DJ with arms in the air facing massive crowd jumping & dancing with 140BPM bass shake
- 15.834s - 20.134s (4.3s): Real festival crowd dancing in front row with 140BPM bass shake
- 20.134s - 24.534s (4.4s): Epic stadium lasers & crowd jumping with 2.0s fade out to black
- Audio: Synchronized 140 BPM Hard Techno Drop (Hertz - Timballe) + Crowd Roar + CDJ Click
- Darkened & contrast enhanced for deep cinematic club aesthetic
"""
import os
import subprocess

SOURCE_VIDEO = "/Users/admin/.gemini/antigravity/brain/829cd3f3-a37e-4d65-ae8a-5783bbb904cb/.user_uploaded/media_1793494786814_864f774b.mp4"
AQUASELLA_WEBM = "/tmp/aquasella.webm"
TML_GIRLS_MKV = "/tmp/tml_girls.mkv"
TML_LASERS_MKV = "/tmp/tml_lasers.mkv"
AUDIO_MASTER = "web/assets/intro_hard_techno.mp3"

OUTPUT_DIR = "web/assets"
OUTPUT_VIDEO = os.path.join(OUTPUT_DIR, "intro_cinematic.mp4")
TEMP_DIR = "/tmp/bw_intro_v5"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

print("=== [BEATWAVE PRO] GENERATING 100% LIVE VIDEO MASTER INTRO V5 ===")

# Darkening filter: deep cinematic contrast and reduced brightness
darken_filter = "eq=brightness=-0.09:contrast=1.22:saturation=1.15"

# 140 BPM Bass camera shake filter
bass_shake_filter = "crop=w=1264:h=710:x='8+6*sin(14.66*t)*exp(-4.5*mod(t,0.42857))':y='5+8*abs(sin(14.66*t))*exp(-5*mod(t,0.42857))',scale=1280:720,setsar=1"

# Cut 1: 0.0 - 7.125s (POV arrival at DJ booth behind mixer) with 2.0s fade-in from black
seg1 = f"{TEMP_DIR}/seg1.mp4"
print("Rendering Seg 1: Live POV booth arrival behind mixer (2s fade-in)...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "0.0", "-to", "7.125", "-i", SOURCE_VIDEO,
    "-vf", f"setpts=PTS-STARTPTS,crop=1280:460:0:130,scale=1280:720,setsar=1,{darken_filter},fade=t=in:st=0:d=2.0",
    "-r", "24", "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg1
], check=True)

# Cut 2: 7.125 - 11.534s (4.409s): DJ hand reaching for play button in slow-motion (100% live video)
seg2 = f"{TEMP_DIR}/seg2.mp4"
print("Rendering Seg 2: Slow-mo hand reach to play button...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "7.125", "-to", "10.166", "-i", SOURCE_VIDEO,
    "-vf", f"setpts=1.45*(PTS-STARTPTS),crop=1280:460:0:130,scale=1280:720,setsar=1,{darken_filter}",
    "-r", "24", "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg2
], check=True)

# Cut 3: 11.534 - 15.834s (4.3s): Live festival DJ with arms in the air facing massive crowd jumping (Aquasella)
seg3 = f"{TEMP_DIR}/seg3.mp4"
print("Rendering Seg 3: Live festival DJ with arms in the air facing jumping crowd...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "10.5", "-t", "4.3", "-i", AQUASELLA_WEBM,
    "-vf", f"setpts=PTS-STARTPTS,crop=608:342:0:400,scale=1280:720,setsar=1,{darken_filter},{bass_shake_filter}",
    "-r", "24", "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg3
], check=True)

# Cut 4: 15.834 - 20.134s (4.3s): Real festival crowd dancing in front row with 140BPM bass shake
seg4 = f"{TEMP_DIR}/seg4.mp4"
print("Rendering Seg 4: Live festival front row crowd dancing...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "5.0", "-t", "4.3", "-i", TML_GIRLS_MKV,
    "-vf", f"setpts=PTS-STARTPTS,scale=1280:720,setsar=1,{darken_filter},{bass_shake_filter}",
    "-r", "24", "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg4
], check=True)

# Cut 5: 20.134 - 24.534s (4.4s): Epic panoramic stadium lasers & crowd jumping with 2.0s fade out to black
seg5 = f"{TEMP_DIR}/seg5.mp4"
print("Rendering Seg 5: Live stadium lasers & jumping crowd with 2s fade out...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "2.0", "-t", "4.4", "-i", TML_LASERS_MKV,
    "-vf", f"setpts=PTS-STARTPTS,crop=960:540:0:90,scale=1280:720,setsar=1,{darken_filter},{bass_shake_filter},fade=t=out:st=2.4:d=2.0",
    "-r", "24", "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg5
], check=True)

# Re-encode concat filter for perfect timestamp continuity
print("Concatenating seamlessly with re-encode...")
video_only = f"{TEMP_DIR}/video_combined.mp4"
subprocess.run([
    "ffmpeg", "-y",
    "-i", seg1, "-i", seg2, "-i", seg3, "-i", seg4, "-i", seg5,
    "-filter_complex", "[0:v][1:v][2:v][3:v][4:v]concat=n=5:v=1:a=0[outv]",
    "-map", "[outv]",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "24",
    video_only
], check=True)

# Mux with master audio
print("Muxing with master synchronized audio...")
subprocess.run([
    "ffmpeg", "-y",
    "-i", video_only,
    "-i", AUDIO_MASTER,
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "320k",
    "-shortest",
    OUTPUT_VIDEO
], check=True)

print(f"SUCCESS: Generated {OUTPUT_VIDEO} (100% Live Video Master)")
