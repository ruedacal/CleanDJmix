#!/usr/bin/env python3
"""
BEATWAVE PRO - Master Intro V6 (Final Synchronized Release)
- Source Video: media_1793897056658_33b0d286.mp4 (intro-beatwave.mp4)
- Exact Audio & Bass Kick Synchronization:
  - 0.0s - 9.259s: Stadium crowd ovation with 2.0s smooth fade in + tape slowdown dip (7.2s - 9.2s)
  - 9.200s: Tactile Pioneer CDJ CUE/PLAY button click
  - 9.258s: Hertz - Timballe Drop hits as DJ presses play
  - 12.342s, 12.800s, 13.342s, 13.800s, 14.258s: DJ arms pump in exact rhythm with thunderous sub-bass kicks!
  - 15.175s: Dancing girls cut with massive bass drop impact + cheering crowd
  - 20.689s - 22.689s: 2.0s fade out to pure black and silence
- Video Effects:
  - Darkened deep club aesthetic (extra dark grading for the girls segment from 15.175s to end)
  - 2.0s Fade In at start, 2.0s Fade Out to black at end
  - Dynamic camera shake synchronized with kicks and DJ arm pumps
- Muxed with AAC 320k + faststart for instant playback
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
CLEAN_AUDIO = "/tmp/git_audio.wav"

os.makedirs(TEMP_DIR, exist_ok=True)

# 1. Probe video duration
probe = subprocess.run([
    "ffprobe", "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", VIDEO_SRC
], stdout=subprocess.PIPE, text=True, check=True)
total_dur = float(probe.stdout.strip())
t_drop = 9.259
print(f"Source video duration: {total_dur:.3f}s, t_drop: {t_drop:.3f}s")

# 2. Extract clean drop from /tmp/git_audio.wav with tempo warp (atempo=0.96)
print("Time-stretching clean drop audio for exact arm pump lock...")
warped_drop_wav = f"{TEMP_DIR}/warped_drop.wav"
subprocess.run([
    "ffmpeg", "-y", "-ss", "11.534", "-i", CLEAN_AUDIO,
    "-filter:a", "atempo=0.96", warped_drop_wav
], check=True)

# Read clean audio and warped drop
sr = 44100
total_samples = int(total_dur * sr)

with wave.open(CLEAN_AUDIO, "rb") as w:
    clean_frames = w.readframes(w.getnframes())
    clean_audio = np.frombuffer(clean_frames, dtype=np.int16).reshape(-1, w.getnchannels()).astype(np.float32) / 32768.0

with wave.open(warped_drop_wav, "rb") as w:
    drop_frames = w.readframes(w.getnframes())
    drop_audio = np.frombuffer(drop_frames, dtype=np.int16).reshape(-1, w.getnchannels()).astype(np.float32) / 32768.0

master = np.zeros((total_samples, 2), dtype=np.float32)

# Part A: Pre-drop crowd (0 to 9.259s)
crowd_samples = int(t_drop * sr)
crowd_slice = clean_audio[:crowd_samples].copy()

# 2.0s Fade In
fade_in_samples = int(2.0 * sr)
fade_in = np.linspace(0.0, 1.0, fade_in_samples)
crowd_slice[:fade_in_samples, 0] *= fade_in
crowd_slice[:fade_in_samples, 1] *= fade_in

# Slowdown curve from 7.2s to 9.2s
slow_idx = int(7.2 * sr)
if slow_idx < crowd_samples:
    slow_len = crowd_samples - slow_idx
    decay = np.linspace(1.0, 0.40, slow_len)
    crowd_slice[slow_idx:, 0] *= decay
    crowd_slice[slow_idx:, 1] *= decay

# Pioneer CDJ tactile click at 9.200s
click_idx = int(9.200 * sr)
click_dur = int(0.045 * sr)
tc = np.linspace(0, 0.045, click_dur, endpoint=False)
click_snd = (0.80 * np.sin(2 * np.pi * 1850 * tc) * np.exp(-tc * 200) +
             0.60 * np.sin(2 * np.pi * 3200 * tc) * np.exp(-tc * 280) +
             0.35 * (np.random.rand(click_dur) * 2 - 1) * np.exp(-tc * 150))
crowd_slice[click_idx:click_idx+click_dur, 0] += click_snd
crowd_slice[click_idx:click_idx+click_dur, 1] += click_snd

master[:crowd_samples] = crowd_slice * 1.10

# Part B: Sliced Warped Drop from 9.259s
drop_avail = total_samples - crowd_samples
drop_take = min(drop_avail, len(drop_audio))
drop_seg = drop_audio[:drop_take].copy()

# 2.0s Fade Out at the end
fade_out_samples = int(2.0 * sr)
fade_out = np.linspace(1.0, 0.0, fade_out_samples)
if drop_take >= fade_out_samples:
    drop_seg[-fade_out_samples:, 0] *= fade_out
    drop_seg[-fade_out_samples:, 1] *= fade_out

master[crowd_samples:crowd_samples+drop_take] += drop_seg * 1.25

# Part C: Synthesized 909 Sub-Bass Punch on exact arm pump peaks & cuts
# Exact video peaks: 9.259s (play), 12.342s, 12.800s, 13.342s, 13.800s, 14.258s, 15.175s
kick_times = [9.259, 12.342, 12.800, 13.342, 13.800, 14.258, 15.175]
kick_dur_s = 0.22
kick_len = int(kick_dur_s * sr)
tk = np.linspace(0, kick_dur_s, kick_len, endpoint=False)
freq_k = 42 + (170 - 42) * np.exp(-tk * 32)
phase_k = 2 * np.pi * np.cumsum(freq_k) / sr
kick_wave = (np.sin(phase_k) * np.exp(-tk * 16) +
             0.25 * (np.random.rand(kick_len) * 2 - 1) * np.exp(-tk * 190))

for kt in kick_times:
    k_idx = int(kt * sr)
    if k_idx + kick_len <= total_samples:
        gain = 0.55 if kt == 15.175 or kt == 9.259 else 0.45
        master[k_idx:k_idx+kick_len, 0] += kick_wave * gain
        master[k_idx:k_idx+kick_len, 1] += kick_wave * gain

# Part D: Cheer burst at girls cut (15.175s)
cheer_idx = int(15.175 * sr)
cheer_len = int(4.0 * sr)
if cheer_idx + cheer_len <= total_samples and len(clean_audio) > int(12.0 * sr):
    cheer_src = clean_audio[int(6.0 * sr):int(6.0 * sr) + cheer_len].copy()
    cheer_decay = np.linspace(0.40, 0.05, cheer_len)[:, None]
    master[cheer_idx:cheer_idx+cheer_len] += cheer_src * cheer_decay

# Limiter / soft clipping
max_val = np.max(np.abs(master))
if max_val > 0.98:
    master = np.tanh(master * (0.95 / max_val)) * 0.95

wav_out = f"{TEMP_DIR}/master_audio.wav"
with wave.open(wav_out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(sr)
    w.writeframes((np.clip(master, -1.0, 1.0) * 32767.0).astype(np.int16).tobytes())

print("✓ Perfectly synchronized audio master created!")

# 3. Process Video with Effects:
# - Darkening: deep contrast with enhanced darkening for girls (15.175s to end)
# - 2s fade in, 2s fade out
# - Bass camera shake aligned with the kick rhythm
print("Rendering video with cinematic effects & synchronized bass shake...")
darken_filter = "eq=brightness='if(lt(t,15.175),-0.08,if(lt(t,15.8),-0.08-(t-15.175)*0.22,-0.22))':contrast='if(gte(t,15.175),1.30,1.20)':saturation='if(gte(t,15.175),1.04,1.12)'"
fade_in_filter = "fade=t=in:st=0:d=2.0"
fade_out_filter = f"fade=t=out:st={total_dur - 2.0:.3f}:d=2.0"
bass_shake_filter = "crop=w=1264:h=710:x='if(gte(t,9.258),8+6*sin(14.66*t)*exp(-4.5*mod(t-9.258,0.458)),8)':y='if(gte(t,9.258),5+8*abs(sin(14.66*t))*exp(-5*mod(t-9.258,0.458)),5)',scale=1280:720,setsar=1"

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
