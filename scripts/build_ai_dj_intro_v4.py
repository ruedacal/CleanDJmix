#!/usr/bin/env python3
"""
BEATWAVE PRO - Extended Master Intro V4 (AI Generated Consistent DJ)
- Replaces blonde/redhead guy at 5s with AI DJ Booth Silhouette (no face visible)
- Replaces YouTube DJ Pepo at drop with AI DJ Festival Headliner Silhouette (no face visible, arms outstretched)
- Real festival crowd jumping (each person unique) & gorgeous front row girls
- 140 BPM Bass Camera Vibration synchronized with Hertz - Timballe kicks
- 2.0s Fade In at start, 2.0s Fade Out to pure black at end
- 24.534s total duration
"""
import os
import subprocess
import numpy as np
import wave

SOURCE_VIDEO = "/Users/admin/.gemini/antigravity/brain/829cd3f3-a37e-4d65-ae8a-5783bbb904cb/.user_uploaded/media_1793494786814_864f774b.mp4"
HERTZ_MP3 = "/tmp/hertz_timballe.mp3"
CROWD_WEBM = "/tmp/crowd_cheer.webm"
TML_GIRLS_MP4 = "/tmp/tml_girls.mp4"
TML_LASERS_MKV = "/tmp/tml_lasers.mkv"

IMG_BOOTH = "/Users/admin/.gemini/antigravity/brain/829cd3f3-a37e-4d65-ae8a-5783bbb904cb/dj_booth_silhouette_v2_1793500443767.jpg"
IMG_DROP = "/Users/admin/.gemini/antigravity/brain/829cd3f3-a37e-4d65-ae8a-5783bbb904cb/dj_festival_headliner_silhouette_1793500228279.jpg"

OUTPUT_DIR = "web/assets"
OUTPUT_VIDEO = os.path.join(OUTPUT_DIR, "intro_cinematic.mp4")
TEMP_DIR = "/tmp/bw_intro_v4"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

print("=== [BEATWAVE PRO] GENERATING CONSISTENT AI DJ EXTENDED INTRO V4 ===")

# -------------------------------------------------------------
# STEP 1: Video Segments
# -------------------------------------------------------------

# Cut 1: 0.0 - 4.8s (POV arrival at arena) with 2.0s fade-in from black
seg1 = f"{TEMP_DIR}/seg1.mp4"
print("Rendering Seg 1: POV booth arrival with 2s fade in...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "0.0", "-to", "4.8", "-i", SOURCE_VIDEO,
    "-vf", "setpts=PTS-STARTPTS,crop=1280:460:0:130,scale=1280:720,fade=t=in:st=0:d=2.0",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg1
], check=True)

# Cut 2: 4.8 - 7.125s (2.325s): AI DJ Booth Silhouette (Replaces blonde guy, NO face, matches drop DJ)
seg2 = f"{TEMP_DIR}/seg2.mp4"
print("Rendering Seg 2: AI DJ Booth Silhouette with smooth cinematic motion...")
subprocess.run([
    "ffmpeg", "-y", "-loop", "1", "-i", IMG_BOOTH,
    "-vf", "scale=1920:1080,zoompan=z='min(zoom+0.0012,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=56:s=1280x720:fps=24,setpts=PTS-STARTPTS",
    "-t", "2.325",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg2
], check=True)

# Cut 3: 7.125 - 11.534s (4.409s): DJ hand reaching for play button in slow-motion
seg3 = f"{TEMP_DIR}/seg3.mp4"
print("Rendering Seg 3: Slow-mo hand reach...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "7.125", "-to", "10.166", "-i", SOURCE_VIDEO,
    "-vf", "setpts=1.45*(PTS-STARTPTS),crop=1280:460:0:130,scale=1280:720",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg3
], check=True)

# Bass camera vibration filter for 140 BPM kicks (frequency = 2.3333 Hz, period = 0.42857 s)
bass_shake_filter = "crop=w=1264:h=710:x='8+6*sin(14.66*t)*exp(-4.5*mod(t,0.42857))':y='5+8*abs(sin(14.66*t))*exp(-5*mod(t,0.42857))',scale=1280:720"

# Cut 4: 11.534 - 15.834s (4.3s): AI DJ Headliner Silhouette (Arms outstretched commanding the crowd, 140BPM bass shake)
seg4 = f"{TEMP_DIR}/seg4.mp4"
print("Rendering Seg 4: AI DJ Headliner Climax with 140 BPM bass shake...")
subprocess.run([
    "ffmpeg", "-y", "-loop", "1", "-i", IMG_DROP,
    "-vf", f"scale=1920:1080,zoompan=z='min(zoom+0.0018,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=104:s=1280x720:fps=24,{bass_shake_filter},setpts=PTS-STARTPTS",
    "-t", "4.3",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg4
], check=True)

# Cut 5: 15.834 - 20.134s (4.3s): Real festival girls dancing in front row with 140BPM bass shake
seg5 = f"{TEMP_DIR}/seg5.mp4"
print("Rendering Seg 5: Front row festival girls dancing with bass shake...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "13.2", "-t", "4.3", "-i", TML_GIRLS_MP4,
    "-vf", f"setpts=PTS-STARTPTS,scale=1280:720,{bass_shake_filter}",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg5
], check=True)

# Cut 6: 20.134 - 24.534s (4.4s): Panoramic festival lasers & crowd jumping with 2.0s fade-out to black
seg6 = f"{TEMP_DIR}/seg6.mp4"
print("Rendering Seg 6: Epic panoramic festival lasers & crowd with 2s fade out to black...")
subprocess.run([
    "ffmpeg", "-y", "-ss", "2.0", "-t", "4.4", "-i", TML_LASERS_MKV,
    "-vf", f"setpts=PTS-STARTPTS,crop=960:540:0:90,scale=1280:720,{bass_shake_filter},fade=t=out:st=2.4:d=2.0",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg6
], check=True)

# Concat video parts with setsar & continuous PTS
print("Concatenating all 6 segments via filter_complex...")
video_only = f"{TEMP_DIR}/video_combined.mp4"
subprocess.run([
    "ffmpeg", "-y",
    "-i", seg1,
    "-i", seg2,
    "-i", seg3,
    "-i", seg4,
    "-i", seg5,
    "-i", seg6,
    "-filter_complex", "[0:v]setsar=1[v0];[1:v]setsar=1[v1];[2:v]setsar=1[v2];[3:v]setsar=1[v3];[4:v]setsar=1[v4];[5:v]setsar=1[v5];[v0][v1][v2][v3][v4][v5]concat=n=6:v=1:a=0[v]",
    "-map", "[v]",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    video_only
], check=True)

print("✓ Video tracks successfully stitched together!")

# -------------------------------------------------------------
# STEP 2: Audio Synthesis & Mastering
# -------------------------------------------------------------
SR = 44100
t_drop = 4.8 + 2.325 + 4.409 # = 11.534s
total_dur = 24.534
total_samples = int(total_dur * SR)

print("Synthesizing audio: Loud stadium crowd -> tape slowdown -> CDJ click -> Hertz Timballe 140BPM Drop...")

crowd_wav = f"{TEMP_DIR}/crowd_raw.wav"
subprocess.run([
    "ffmpeg", "-y", "-i", CROWD_WEBM,
    "-ar", str(SR), "-ac", "2", crowd_wav
], check=True)

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

master = np.zeros((total_samples, 2), dtype=np.float32)

# Part A: Loud Crowd Ovation (0s to t_drop = 11.534s) with 2.0s Fade In
crowd_len = int(t_drop * SR)
crowd_slice = crowd_audio[:crowd_len].copy()

fade_in_samples = int(2.0 * SR)
fade_in_curve = np.linspace(0.0, 1.0, fade_in_samples)
crowd_slice[:fade_in_samples, 0] *= fade_in_curve
crowd_slice[:fade_in_samples, 1] *= fade_in_curve

# Slowdown curve from 7.5s to 11.4s
t_slow_start = 7.5
slow_start_idx = int(t_slow_start * SR)
slow_len = crowd_len - slow_start_idx
if slow_len > 0:
    decay = np.linspace(1.0, 0.45, slow_len)
    crowd_slice[slow_start_idx:, 0] *= decay
    crowd_slice[slow_start_idx:, 1] *= decay

master[:crowd_len, :] += crowd_slice * 1.15

# Part B: Tactile CDJ CUE / PLAY Button Click at 11.450s
click_time = t_drop - 0.084
click_idx = int(click_time * SR)
click_dur = int(0.05 * SR)
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

# 2.0s Fade Out at end
fade_out_samples = int(2.0 * SR)
fade_out_curve = np.linspace(1.0, 0.0, fade_out_samples)
if hertz_take >= fade_out_samples:
    hertz_seg[-fade_out_samples:, 0] *= fade_out_curve
    hertz_seg[-fade_out_samples:, 1] *= fade_out_curve

master[drop_idx:drop_idx+hertz_take, :] += hertz_seg * 1.25

# Cheering crowd layer on drop
cheer_burst_len = int(6.0 * SR)
cheer_burst_take = min(cheer_burst_len, len(crowd_audio) - crowd_len, drop_avail)
if cheer_burst_take > 0:
    cheer_burst = crowd_audio[crowd_len:crowd_len+cheer_burst_take].copy()
    cheer_decay = np.linspace(0.85, 0.15, cheer_burst_take)
    cheer_burst[:, 0] *= cheer_decay
    cheer_burst[:, 1] *= cheer_decay
    master[drop_idx:drop_idx+cheer_burst_take, :] += cheer_burst * 0.55

# Master Limiter
max_val = np.max(np.abs(master))
if max_val > 0.98:
    master = np.tanh(master * (0.95 / max_val)) * 0.95

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

subprocess.run([
    "ffmpeg", "-y", "-i", audio_master_wav,
    "-c:a", "libmp3lame", "-b:a", "256k",
    "web/assets/intro_hard_techno.mp3"
], check=True)

print(f"🎉 FINAL MASTER EXTENDED INTRO READY AT: {OUTPUT_VIDEO}")
size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
print(f"File size: {size_mb:.2f} MB")
