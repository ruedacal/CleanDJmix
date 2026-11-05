#!/usr/bin/env python3
"""
BEATWAVE PRO - Master Intro V6
- Integrates user-provided video (media_1793897056658_33b0d286.mp4 / intro-beatwave.mp4)
- Exact audio synchronization:
  - 0.0s - 9.259s: Stadium crowd ovation with 2.0s fade in + slowdown dip
  - 9.200s: Tactile Pioneer CDJ CUE/PLAY button click
  - 9.259s: Hertz - Timballe 140 BPM Hard Techno Drop hits with full punch
  - 20.689s - 22.689s: 2.0s fade out to pure black and silence
- Video Effects:
  - Darkened & deep club contrast (eq=brightness=-0.08:contrast=1.20:saturation=1.12)
  - 2.0s Fade In at start
  - 2.0s Fade Out to black at end
  - 140 BPM Bass Camera Shake synchronized with kick drums from 9.259s onwards
- Muxed with AAC 320k + faststart for instant streaming
"""
import os
import subprocess
import wave
import numpy as np

VIDEO_SRC = "/Users/admin/.gemini/antigravity/brain/829cd3f3-a37e-4d65-ae8a-5783bbb904cb/.user_uploaded/media_1793897056658_33b0d286.mp4"
OUTPUT_DIR = "web/assets"
OUTPUT_VIDEO = os.path.join(OUTPUT_DIR, "intro_cinematic.mp4")
OUTPUT_MP3 = os.path.join(OUTPUT_DIR, "intro_hard_techno.mp3")
TEMP_DIR = "/tmp/bw_intro_v6"

os.makedirs(TEMP_DIR, exist_ok=True)

# 1. Probe source video duration
probe = subprocess.run([
    "ffprobe", "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", VIDEO_SRC
], stdout=subprocess.PIPE, text=True, check=True)
total_dur = float(probe.stdout.strip())
t_drop = 9.259
print(f"Source video duration: {total_dur:.3f}s, t_drop: {t_drop:.3f}s")

# 2. Build Audio Track
print("Building synchronized audio track...")
sr = 44100
total_samples = int(total_dur * sr)

# Extract reference audio from existing mp3
subprocess.run(["ffmpeg", "-y", "-i", OUTPUT_MP3, f"{TEMP_DIR}/ref_audio.wav"], check=True)
with wave.open(f"{TEMP_DIR}/ref_audio.wav", "rb") as w:
    ref_sr = w.getframerate()
    ref_ch = w.getnchannels()
    ref_data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, ref_ch).astype(np.float32) / 32768.0

master = np.zeros((total_samples, 2), dtype=np.float32)

# Pre-drop crowd (0 to 9.259s)
crowd_samples = int(t_drop * sr)
crowd_slice = ref_data[:crowd_samples].copy()

# Smooth fade in for crowd
fade_in_samples = int(2.0 * sr)
fade_in = np.linspace(0.0, 1.0, fade_in_samples)
crowd_slice[:fade_in_samples, 0] *= fade_in
crowd_slice[:fade_in_samples, 1] *= fade_in

# Slowdown curve before button press (from 7.2s to 9.2s)
t_slow = 7.2
slow_idx = int(t_slow * sr)
if slow_idx < crowd_samples:
    slow_len = crowd_samples - slow_idx
    decay = np.linspace(1.0, 0.42, slow_len)
    crowd_slice[slow_idx:, 0] *= decay
    crowd_slice[slow_idx:, 1] *= decay

# Pioneer tactile CDJ click at t_drop - 0.059s
click_t = t_drop - 0.059
click_idx = int(click_t * sr)
click_dur = int(0.045 * sr)
tc = np.linspace(0, 0.045, click_dur, endpoint=False)
click_snd = (0.75 * np.sin(2 * np.pi * 1850 * tc) * np.exp(-tc * 200) +
             0.55 * np.sin(2 * np.pi * 3200 * tc) * np.exp(-tc * 280) +
             0.30 * (np.random.rand(click_dur) * 2 - 1) * np.exp(-tc * 150))
crowd_slice[click_idx:click_idx+click_dur, 0] += click_snd
crowd_slice[click_idx:click_idx+click_dur, 1] += click_snd

master[:crowd_samples] = crowd_slice

# Hertz - Timballe drop from 9.259s
prev_drop_start = int(11.534 * sr)
drop_needed = total_samples - crowd_samples
drop_slice = ref_data[prev_drop_start : prev_drop_start + drop_needed].copy()

# 2.0s fade out at the end
fade_out_samples = int(2.0 * sr)
fade_out = np.linspace(1.0, 0.0, fade_out_samples)
drop_slice[-fade_out_samples:, 0] *= fade_out
drop_slice[-fade_out_samples:, 1] *= fade_out

master[crowd_samples:crowd_samples+len(drop_slice)] += drop_slice

# Master Limiter
max_val = np.max(np.abs(master))
if max_val > 0.98:
    master = np.tanh(master * (0.95 / max_val)) * 0.95

wav_out = f"{TEMP_DIR}/master_audio.wav"
with wave.open(wav_out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(sr)
    w.writeframes((np.clip(master, -1.0, 1.0) * 32767.0).astype(np.int16).tobytes())

print("✓ Audio master ready!")

# 3. Process Video with Effects:
# - Darkening (Enhanced dark grading for the girls segment from 15.18s to end)
# - 2s fade in
# - 2s fade out
# - 140BPM camera shake from drop (9.259s)
print("Rendering video with cinematic effects & 140BPM bass shake...")
darken_filter = "eq=brightness='if(lt(t,15.18),-0.08,if(lt(t,15.8),-0.08-(t-15.18)*0.22,-0.22))':contrast='if(gte(t,15.18),1.30,1.20)':saturation='if(gte(t,15.18),1.04,1.12)'"
fade_in_filter = "fade=t=in:st=0:d=2.0"
fade_out_filter = f"fade=t=out:st={total_dur - 2.0:.3f}:d=2.0"
bass_shake_filter = "crop=w=1264:h=710:x='if(gte(t,9.259),8+6*sin(14.66*t)*exp(-4.5*mod(t-9.259,0.42857)),8)':y='if(gte(t,9.259),5+8*abs(sin(14.66*t))*exp(-5*mod(t-9.259,0.42857)),5)',scale=1280:720,setsar=1"

vf_chain = f"{darken_filter},{fade_in_filter},{fade_out_filter},{bass_shake_filter}"

video_proc = f"{TEMP_DIR}/video_proc.mp4"
subprocess.run([
    "ffmpeg", "-y", "-i", VIDEO_SRC,
    "-vf", vf_chain,
    "-r", "24", "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    video_proc
], check=True)

# 4. Mux Video + Audio
print("Muxing final video with master audio...")
subprocess.run([
    "ffmpeg", "-y",
    "-i", video_proc,
    "-i", wav_out,
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "320k",
    "-movflags", "+faststart",
    OUTPUT_VIDEO
], check=True)

# Export synchronized MP3
subprocess.run([
    "ffmpeg", "-y", "-i", wav_out,
    "-c:a", "libmp3lame", "-b:a", "320k",
    OUTPUT_MP3
], check=True)

print(f"🎉 INTRO GENERATION COMPLETE! Output: {OUTPUT_VIDEO}")
print(f"Size: {os.path.getsize(OUTPUT_VIDEO) / (1024*1024):.2f} MB")
