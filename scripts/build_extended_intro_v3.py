#!/usr/bin/env python3
"""
BEATWAVE PRO - Extended Master Intro V3
- 24.5s total duration
- 0.0s - 7.125s: Arrival in booth, 1st person POV, loud stadium crowd roar (2.0s fade in)
- 7.125s - 11.534s: Slow motion hand approach to CDJ cue/play button, audio tape-slowdown curve
- 11.45s: CDJ cue click
- 11.534s - 24.5s: 140 BPM Hard Techno Drop (Hertz - Timballe)
  * Segment 3A (11.534 - 15.8s): Silhouette of DJ behind decks facing massive Aquasella crowd with bass camera shake!
  * Segment 3B (15.8 - 20.0s): Girls in front row dancing and headbanging at Tomorrowland with bass camera shake!
  * Segment 3C (20.0 - 24.5s): Massive festival arena jumping in ecstasy, ending with 2.0s fade to black!
"""
import os
import subprocess
import numpy as np
import wave

SOURCE_VIDEO = "/Users/admin/.gemini/antigravity/brain/829cd3f3-a37e-4d65-ae8a-5783bbb904cb/.user_uploaded/media_1793494786814_864f774b.mp4"
HERTZ_MP3 = "/tmp/hertz_timballe.mp3"
CROWD_WEBM = "/tmp/crowd_cheer.webm"
AQUASELLA_WEBM = "/tmp/aquasella.webm"
TML_GIRLS_MP4 = "/tmp/tml_girls.mp4"

OUTPUT_DIR = "web/assets"
OUTPUT_VIDEO = os.path.join(OUTPUT_DIR, "intro_cinematic.mp4")
TEMP_DIR = "/tmp/bw_intro_v3"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

print("=== [BEATWAVE PRO] GENERATING EXTENDED CINEMATIC INTRO V3 ===")

# -------------------------------------------------------------
# STEP 1: Video Segments
# -------------------------------------------------------------

# Cut 1: 0.0 - 7.125s (POV arrival at booth) with 2.0s fade-in from black
seg1 = f"{TEMP_DIR}/seg1.mp4"
print("Rendering Seg 1: POV booth arrival with 2s fade in...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "0.0", "-to", "7.125", "-i", SOURCE_VIDEO,
    "-vf", "crop=1280:460:0:130,scale=1280:720,fade=t=in:st=0:d=2.0",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg1
], check=True)

# Cut 2: 7.125 - 11.534s (DJ hand approaching play button in slow-motion, 4.409s duration)
seg2 = f"{TEMP_DIR}/seg2.mp4"
print("Rendering Seg 2: Slow-mo hand reach...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "7.125", "-to", "10.166", "-i", SOURCE_VIDEO,
    "-vf", "setpts=1.45*PTS,crop=1280:460:0:130,scale=1280:720",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg2
], check=True)

# Bass camera vibration filter for 140 BPM kicks (frequency = 2.3333 Hz, period = 0.42857 s)
# Simulates physical subwoofer kick displacement
bass_shake_filter = "crop=w=1264:h=710:x='8+5*sin(14.66*t)*exp(-4.5*mod(t,0.42857))':y='5+7*abs(sin(14.66*t))*exp(-5*mod(t,0.42857))',scale=1280:720"

# Cut 3A: 11.534 - 15.834s (4.3s): DJ Silhouette from behind decks facing roaring Aquasella crowd
seg3a = f"{TEMP_DIR}/seg3a.mp4"
print("Rendering Seg 3A: DJ Silhouette with massive crowd & bass shake...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "10.5", "-t", "4.3", "-i", AQUASELLA_WEBM,
    "-vf", f"crop=1080:608:0:480,scale=1280:720,{bass_shake_filter}",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg3a
], check=True)

# Cut 3B: 15.834 - 20.134s (4.3s): Gorgeous girls dancing in front row at Tomorrowland
seg3b = f"{TEMP_DIR}/seg3b.mp4"
print("Rendering Seg 3B: Front row girls dancing at festival with bass shake...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "13.2", "-t", "4.3", "-i", TML_GIRLS_MP4,
    "-vf", f"scale=1280:720,{bass_shake_filter}",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg3b
], check=True)

# Cut 3C: 20.134 - 24.534s (4.4s): Massive festival arena jumping with 2.0s fade-out to black
seg3c = f"{TEMP_DIR}/seg3c.mp4"
print("Rendering Seg 3C: Epic panoramic crowd jumping with 2s fade out to black...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "23.2", "-t", "4.4", "-i", AQUASELLA_WEBM,
    "-vf", f"crop=1080:608:0:680,scale=1280:720,{bass_shake_filter},fade=t=out:st=2.4:d=2.0",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg3c
], check=True)

# Concat video parts
concat_list = f"{TEMP_DIR}/concat_video.txt"
with open(concat_list, "w") as f:
    f.write(f"file '{seg1}'\n")
    f.write(f"file '{seg2}'\n")
    f.write(f"file '{seg3a}'\n")
    f.write(f"file '{seg3b}'\n")
    f.write(f"file '{seg3c}'\n")

video_only = f"{TEMP_DIR}/video_combined.mp4"
subprocess.run([
    "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list,
    "-c", "copy", video_only
], check=True)

print("✓ Video tracks successfully stitched together!")

# -------------------------------------------------------------
# STEP 2: Audio Synthesis & Mastering
# -------------------------------------------------------------
SR = 44100
t_drop = 7.125 + 4.409 # = 11.534s
total_dur = 24.534
total_samples = int(total_dur * SR)

print("Synthesizing audio: Crowd arrival -> slow-mo tape stop -> CDJ click -> Hertz Timballe 140BPM Drop...")

# 1. Convert CROWD_WEBM to WAV
crowd_wav = f"{TEMP_DIR}/crowd_raw.wav"
subprocess.run([
    "ffmpeg", "-y", "-i", CROWD_WEBM,
    "-ar", str(SR), "-ac", "2", crowd_wav
], check=True)

# 2. Convert HERTZ_MP3 to WAV
hertz_wav = f"{TEMP_DIR}/hertz_raw.wav"
subprocess.run([
    "ffmpeg", "-y", "-ss", "0.0", "-t", str(total_dur - t_drop + 2.0), "-i", HERTZ_MP3,
    "-ar", str(SR), "-ac", "2", hertz_wav
], check=True)

def read_wav(path):
    with wave.open(path, 'rb') as w:
        frames = w.readframes(w.getnframes())
        audio = np.frombuffer(frames, dtype=np.int16).reshape(-1, w.getnchannels())
        return audio.astype(np.float32) / 32768.0

crowd_audio = read_wav(crowd_wav)
hertz_audio = read_wav(hertz_wav)

# Build Master Stereo Buffer
master = np.zeros((total_samples, 2), dtype=np.float32)

# Part A: Crowd Ovation (0s to t_drop)
# User specifically requested: "no se escucha el bullicio de la gente se tiene que escuchar, la entrada con fade in de 2 seg"
crowd_len = int(t_drop * SR)
crowd_slice = crowd_audio[:crowd_len].copy()

# Apply 2.0s fade in
fade_in_samples = int(2.0 * SR)
fade_in_curve = np.linspace(0.0, 1.0, fade_in_samples)
crowd_slice[:fade_in_samples, 0] *= fade_in_curve
crowd_slice[:fade_in_samples, 1] *= fade_in_curve

# Slow-motion curve from 7.5s to 11.4s (building tension before play button)
t_slow_start = 7.5
slow_start_idx = int(t_slow_start * SR)
slow_len = crowd_len - slow_start_idx
if slow_len > 0:
    # Gentle tape slowdown & lowpass damping
    decay = np.linspace(1.0, 0.45, slow_len)
    crowd_slice[slow_start_idx:, 0] *= decay
    crowd_slice[slow_start_idx:, 1] *= decay

# Crowd gain = 1.1 (loud, authentic, clear crowd roar)
master[:crowd_len, :] += crowd_slice * 1.1

# Part B: Tactile CDJ CUE / PLAY Button Click at 11.45s
click_time = t_drop - 0.084 # = 11.450s
click_idx = int(click_time * SR)
click_dur = int(0.05 * SR) # 50ms click
t_click = np.linspace(0, 0.05, click_dur, endpoint=False)
click_sound = (
    0.65 * np.sin(2 * np.pi * 1800 * t_click) * np.exp(-t_click * 120) +
    0.85 * np.sin(2 * np.pi * 320 * t_click) * np.exp(-t_click * 80) +
    0.35 * (np.random.rand(click_dur) * 2 - 1) * np.exp(-t_click * 200)
)
master[click_idx:click_idx+click_dur, 0] += click_sound
master[click_idx:click_idx+click_dur, 1] += click_sound

# Part C: Hertz - Timballe 140 BPM Hard Techno Drop at t_drop = 11.534s
drop_idx = int(t_drop * SR)
drop_avail = total_samples - drop_idx
hertz_take = min(drop_avail, len(hertz_audio))

hertz_seg = hertz_audio[:hertz_take].copy()

# 2.0s fade out at the very end
fade_out_samples = int(2.0 * SR)
fade_out_curve = np.linspace(1.0, 0.0, fade_out_samples)
if hertz_take >= fade_out_samples:
    hertz_seg[-fade_out_samples:, 0] *= fade_out_curve
    hertz_seg[-fade_out_samples:, 1] *= fade_out_curve

# Add Hertz - Timballe at full punchy club volume
master[drop_idx:drop_idx+hertz_take, :] += hertz_seg * 1.25

# Add sustained cheering roar in the background during the first 6 seconds of the drop
cheer_burst_len = int(6.0 * SR)
cheer_burst_take = min(cheer_burst_len, len(crowd_audio) - crowd_len, drop_avail)
if cheer_burst_take > 0:
    cheer_burst = crowd_audio[crowd_len:crowd_len+cheer_burst_take].copy()
    cheer_decay = np.linspace(0.85, 0.15, cheer_burst_take)
    cheer_burst[:, 0] *= cheer_decay
    cheer_burst[:, 1] *= cheer_decay
    master[drop_idx:drop_idx+cheer_burst_take, :] += cheer_burst * 0.55

# Master Limiter / Soft Clipper
max_val = np.max(np.abs(master))
if max_val > 0.98:
    print(f"Applying master soft-knee limiter (peak was {max_val:.2f})...")
    master = np.tanh(master * (0.95 / max_val)) * 0.95

# Export Master Audio WAV
audio_master_wav = f"{TEMP_DIR}/master_audio.wav"
with wave.open(audio_master_wav, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    audio_int16 = (np.clip(master, -1.0, 1.0) * 32767.0).astype(np.int16)
    w.writeframes(audio_int16.tobytes())

print("✓ Master audio synthesized!")

# -------------------------------------------------------------
# STEP 3: Mux Audio + Video with AAC 256k & faststart
# -------------------------------------------------------------
print("Muxing final MP4 with +faststart...")
subprocess.run([
    "ffmpeg", "-y",
    "-i", video_only,
    "-i", audio_master_wav,
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "256k",
    "-movflags", "+faststart",
    OUTPUT_VIDEO
], check=True)

# Also update the mp3 file for direct inspection
subprocess.run([
    "ffmpeg", "-y", "-i", audio_master_wav,
    "-c:a", "libmp3lame", "-b:a", "256k",
    "web/assets/intro_hard_techno.mp3"
], check=True)

print(f"🎉 FINAL MASTER EXTENDED INTRO READY AT: {OUTPUT_VIDEO}")
size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
print(f"File size: {size_mb:.2f} MB")
