#!/usr/bin/env python3
import os
import subprocess
import numpy as np
import wave

SOURCE_VIDEO = "/Users/admin/.gemini/antigravity/brain/829cd3f3-a37e-4d65-ae8a-5783bbb904cb/.user_uploaded/media_1793494786814_864f774b.mp4"
HERTZ_MP3 = "/tmp/hertz_timballe.mp3"
OUTPUT_DIR = "web/assets"
OUTPUT_VIDEO = os.path.join(OUTPUT_DIR, "intro_cinematic.mp4")
TEMP_DIR = "/tmp/bw_intro_build"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

print("=== [BEATWAVE PRO] BUILDING AUTHENTIC HERTZ - TIMBALLE CINEMATIC INTRO ===")

# -------------------------------------------------------------
# STEP 1: Video Assembly with 100% Watermark Removal & Slowmo
# -------------------------------------------------------------
# Cut 1: 0.0 - 7.125 (Arriving at booth, crowd)
seg1 = f"{TEMP_DIR}/cine_seg1.mp4"
subprocess.run([
    "ffmpeg", "-y", "-ss", "0.0", "-to", "7.125", "-i", SOURCE_VIDEO,
    "-vf", "crop=1280:460:0:130,scale=1280:720",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg1
], check=True)

# Cut 2: 7.125 - 10.166 (DJ hand reaching for play button in slow-motion)
seg2 = f"{TEMP_DIR}/cine_seg2.mp4"
subprocess.run([
    "ffmpeg", "-y", "-ss", "7.125", "-to", "10.166", "-i", SOURCE_VIDEO,
    "-vf", "setpts=1.45*PTS,crop=1280:460:0:130,scale=1280:720",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg2
], check=True)

# Cut 3: 10.166 - 13.208 (Button press & laser explosion)
seg3 = f"{TEMP_DIR}/cine_seg3.mp4"
subprocess.run([
    "ffmpeg", "-y", "-ss", "10.166", "-to", "13.208", "-i", SOURCE_VIDEO,
    "-vf", "crop=1280:460:0:130,scale=1280:720",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg3
], check=True)

# Cut 4: 13.208 - 15.250 (Strobes & crowd euphoria)
seg4 = f"{TEMP_DIR}/cine_seg4.mp4"
subprocess.run([
    "ffmpeg", "-y", "-ss", "13.208", "-to", "15.250", "-i", SOURCE_VIDEO,
    "-vf", "crop=1280:460:0:130,scale=1280:720",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg4
], check=True)

concat_txt = f"{TEMP_DIR}/cine_concat.txt"
with open(concat_txt, "w") as f:
    for s in [seg1, seg2, seg3, seg4]:
        f.write(f"file '{s}'\n")

raw_combined = f"{TEMP_DIR}/cine_combined.mp4"
subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_txt, "-c", "copy", raw_combined], check=True)

# Measure final video duration
probe = subprocess.run([
    "ffprobe", "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", raw_combined
], stdout=subprocess.PIPE, text=True)
total_duration = float(probe.stdout.strip())
t_drop = 7.125 + (10.166 - 7.125) * 1.45
print(f"✓ Video cuts ready: duration={total_duration:.2f}s, drop={t_drop:.3f}s")

# -------------------------------------------------------------
# STEP 2: Authentic Audio Master (Crowd Ovation + Hertz - Timballe)
# -------------------------------------------------------------
print("Generating master audio track...")
sr = 44100
total_samples = int(sr * (total_duration + 0.5))
left_ch = np.zeros(total_samples, dtype=np.float32)
right_ch = np.zeros(total_samples, dtype=np.float32)

t_axis = np.linspace(0, total_samples / sr, total_samples, endpoint=False)

# A) CROWD OVATION (Pre-drop: 0 to t_drop)
pre_mask = t_axis < t_drop
t_pre = t_axis[pre_mask]

np.random.seed(42)
crowd_raw = np.cumsum(np.random.normal(0, 1, len(t_pre)))
crowd_raw = crowd_raw - np.mean(crowd_raw)
crowd_raw = crowd_raw / (np.max(np.abs(crowd_raw)) + 1e-9)

crowd_env = np.ones_like(t_pre) * 0.55
crowd_env += 0.35 * (t_pre / t_drop)
# Slowdown dip in last 1.4s before drop
dip_mask = t_pre > (t_drop - 1.4)
crowd_env[dip_mask] *= np.linspace(1.0, 0.12, np.sum(dip_mask))

cheer_voices = np.zeros_like(t_pre)
for f_base, amp in [(440, 0.08), (620, 0.07), (880, 0.10), (1350, 0.06), (2100, 0.05)]:
    wobble = np.sin(2 * np.pi * 2.5 * t_pre) * 15
    cheer_voices += amp * np.sin(2 * np.pi * (f_base + wobble) * t_pre) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * t_pre))

crowd_mix = (crowd_raw * 0.65 + cheer_voices * 0.35) * crowd_env
left_ch[pre_mask] += crowd_mix * 0.85
right_ch[pre_mask] += crowd_mix * 0.90

# CDJ Button click
click_idx = int(sr * (t_drop - 0.08))
click_len = int(sr * 0.04)
if click_idx + click_len < total_samples:
    tc = np.linspace(0, 0.04, click_len)
    click_snd = np.sin(2 * np.pi * 1800 * tc) * np.exp(-tc * 250) + np.sin(2 * np.pi * 3200 * tc) * np.exp(-tc * 350)
    left_ch[click_idx:click_idx+click_len] += click_snd * 0.85
    right_ch[click_idx:click_idx+click_len] += click_snd * 0.85

# B) HERTZ - TIMBALLE OFFICIAL AUDIO (From t_drop to end)
drop_dur = total_duration - t_drop + 0.5
hertz_wav = f"{TEMP_DIR}/hertz_drop_slice.wav"
# Extract from 0.0s of Hertz Timballe (starts immediately with 140 BPM kick & timbales)
subprocess.run([
    "ffmpeg", "-y", "-ss", "0.0", "-t", str(drop_dur),
    "-i", HERTZ_MP3,
    "-ar", str(sr), "-ac", "2",
    hertz_wav
], check=True)

with wave.open(hertz_wav, "rb") as hwf:
    h_frames = hwf.getnframes()
    h_bytes = hwf.readframes(h_frames)
    h_data = np.frombuffer(h_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    h_left = h_data[0::2]
    h_right = h_data[1::2]

drop_start_idx = int(sr * t_drop)
copy_len = min(len(h_left), total_samples - drop_start_idx)
left_ch[drop_start_idx:drop_start_idx+copy_len] += h_left[:copy_len] * 0.95
right_ch[drop_start_idx:drop_start_idx+copy_len] += h_right[:copy_len] * 0.95

# Add ecstatic crowd roar on top of the drop!
drop_samples = total_samples - drop_start_idx
drop_crowd = np.cumsum(np.random.normal(0, 1, drop_samples))
drop_crowd = drop_crowd - np.mean(drop_crowd)
drop_crowd = (drop_crowd / (np.max(np.abs(drop_crowd)) + 1e-9)) * 0.35
left_ch[drop_start_idx:] += drop_crowd * 0.7
right_ch[drop_start_idx:] += drop_crowd * 0.7

# Limiter
max_val = max(np.max(np.abs(left_ch)), np.max(np.abs(right_ch)))
if max_val > 0.95:
    left_ch = np.tanh(left_ch * (1.1 / max_val)) * 0.95
    right_ch = np.tanh(right_ch * (1.1 / max_val)) * 0.95

wav_path = os.path.join(TEMP_DIR, "master_hertz_soundtrack.wav")
with wave.open(wav_path, "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(sr)
    l_pcm = (left_ch * 32767).astype(np.int16)
    r_pcm = (right_ch * 32767).astype(np.int16)
    interleaved = np.empty((total_samples * 2,), dtype=np.int16)
    interleaved[0::2] = l_pcm
    interleaved[1::2] = r_pcm
    wf.writeframes(interleaved.tobytes())

print(f"✓ Master Hertz - Timballe soundtrack rendered: {wav_path}")

# MP3 standalone
mp3_soundtrack = os.path.join(OUTPUT_DIR, "intro_hard_techno.mp3")
subprocess.run([
    "ffmpeg", "-y", "-i", wav_path,
    "-codec:a", "libmp3lame", "-qscale:a", "2",
    mp3_soundtrack
], check=True)

# -------------------------------------------------------------
# STEP 3: Mux with Faststart Web Streaming
# -------------------------------------------------------------
print("Muxing final video and audio...")
subprocess.run([
    "ffmpeg", "-y",
    "-i", raw_combined,
    "-i", wav_path,
    "-c:v", "libx264", "-preset", "slow", "-crf", "19",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "256k",
    "-shortest",
    "-movflags", "+faststart",
    OUTPUT_VIDEO
], check=True)

print(f"🎉 FINAL VIDEO READY: {OUTPUT_VIDEO} ({os.path.getsize(OUTPUT_VIDEO)/1024/1024:.2f} MB)")
