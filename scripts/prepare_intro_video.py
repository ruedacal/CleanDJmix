#!/usr/bin/env python3
import os
import subprocess
import numpy as np
import wave

SOURCE_VIDEO = "/Users/admin/.gemini/antigravity/brain/829cd3f3-a37e-4d65-ae8a-5783bbb904cb/.user_uploaded/media_1793494786814_864f774b.mp4"
OUTPUT_DIR = "web/assets"
OUTPUT_VIDEO = os.path.join(OUTPUT_DIR, "intro_cinematic.mp4")
TEMP_DIR = "/tmp/bw_intro_build"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

print("=== [BEATWAVE PRO] GENERATING SPECTACULAR CINEMATIC INTRO ===")

# -------------------------------------------------------------
# STEP 1: Process and clean video segments with delogo and slow-motion
# -------------------------------------------------------------
# Cut 1: 0.000 - 7.125 (Approaching booth, backstage, crowd)
# Remove watermark: delogo on top-center / bottom-left / bottom-right
print("1. Processing Segment 1 (Crowd / Backstage)...")
seg1_path = os.path.join(TEMP_DIR, "seg1.mp4")
subprocess.run([
    "ffmpeg", "-y", "-ss", "0.0", "-to", "7.125",
    "-i", SOURCE_VIDEO,
    "-vf", "delogo=x=15:y=15:w=480:h=140:show=0,delogo=x=20:y=570:w=500:h=140:show=0,delogo=x=760:y=570:w=510:h=140:show=0",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg1_path
], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)

# Cut 2: 7.125 - 10.166 (Hand reaching for Cue/Play button)
# We slow it down by 1.45x for dramatic cinematic tension before the drop!
# duration = 3.041 * 1.45 = 4.41s
print("2. Processing Segment 2 (Slow-motion DJ deck approach)...")
seg2_path = os.path.join(TEMP_DIR, "seg2.mp4")
subprocess.run([
    "ffmpeg", "-y", "-ss", "7.125", "-to", "10.166",
    "-i", SOURCE_VIDEO,
    "-vf", "setpts=1.45*PTS,delogo=x=15:y=15:w=510:h=160:show=0,delogo=x=20:y=570:w=500:h=140:show=0",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg2_path
], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)

# Cut 3: 10.166 - 13.208 (Play button hit & Laser explosion)
print("3. Processing Segment 3 (Laser explosion & crowd drop)...")
seg3_path = os.path.join(TEMP_DIR, "seg3.mp4")
subprocess.run([
    "ffmpeg", "-y", "-ss", "10.166", "-to", "13.208",
    "-i", SOURCE_VIDEO,
    "-vf", "delogo=x=750:y=560:w=520:h=150:show=0,delogo=x=15:y=15:w=500:h=140:show=0,delogo=x=20:y=570:w=500:h=140:show=0",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg3_path
], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)

# Cut 4: 13.208 - 15.250 (Strobe lights & crowd euphoria)
print("4. Processing Segment 4 (Euphoric crowd finish)...")
seg4_path = os.path.join(TEMP_DIR, "seg4.mp4")
subprocess.run([
    "ffmpeg", "-y", "-ss", "13.208", "-to", "15.250",
    "-i", SOURCE_VIDEO,
    "-vf", "delogo=x=20:y=560:w=510:h=150:show=0,delogo=x=750:y=560:w=520:h=150:show=0,delogo=x=15:y=15:w=500:h=140:show=0",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    seg4_path
], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)

# Concatenate all 4 segments
concat_list = os.path.join(TEMP_DIR, "concat.txt")
with open(concat_list, "w") as f:
    f.write(f"file '{seg1_path}'\n")
    f.write(f"file '{seg2_path}'\n")
    f.write(f"file '{seg3_path}'\n")
    f.write(f"file '{seg4_path}'\n")

raw_combined = os.path.join(TEMP_DIR, "combined_clean.mp4")
subprocess.run([
    "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list,
    "-c", "copy", raw_combined
], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)

# Measure final video duration
probe = subprocess.run([
    "ffprobe", "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", raw_combined
], stdout=subprocess.PIPE, text=True)
total_duration = float(probe.stdout.strip())
print(f"✓ Video cuts assembled cleanly. Total duration: {total_duration:.2f}s")
# The drop happens at t_drop = 7.125 + (3.041 * 1.45) = 11.534s
t_drop = 7.125 + (10.166 - 7.125) * 1.45
print(f"✓ Exact Drop timestamp (Button press & lasers): {t_drop:.3f}s")

# -------------------------------------------------------------
# STEP 2: Synthesize 140 BPM Hard Techno & Crowd Ovation
# -------------------------------------------------------------
print("5. Synthesizing 140 BPM Hard Techno Soundtrack + Ovation...")
sr = 44100
total_samples = int(sr * (total_duration + 0.5))
left_ch = np.zeros(total_samples, dtype=np.float32)
right_ch = np.zeros(total_samples, dtype=np.float32)

t_axis = np.linspace(0, total_samples / sr, total_samples, endpoint=False)

# A) CROWD OVATION (Pre-drop: 0 to t_drop)
# Starts exciting, builds up, slows down / filters down right before button press
pre_mask = t_axis < t_drop
t_pre = t_axis[pre_mask]

# Brown/Pink noise generator for roar
np.random.seed(42)
crowd_raw = np.cumsum(np.random.normal(0, 1, len(t_pre)))
crowd_raw = crowd_raw - np.mean(crowd_raw)
crowd_raw = crowd_raw / (np.max(np.abs(crowd_raw)) + 1e-9)

# Build-up envelope: grows from 0.4 to 0.9, then right before drop (last 1.2s) pitch/lowpass drops (slowdown)
crowd_env = np.ones_like(t_pre) * 0.5
crowd_env += 0.4 * (t_pre / t_drop)
# Slowdown dip in last 1.2s before drop
dip_mask = t_pre > (t_drop - 1.2)
crowd_env[dip_mask] *= np.linspace(1.0, 0.15, np.sum(dip_mask))

# Add cheering formant harmonics (crowd whistling, yelling in arena)
cheer_voices = np.zeros_like(t_pre)
for f_base, amp in [(440, 0.08), (620, 0.07), (880, 0.09), (1350, 0.06), (2100, 0.04)]:
    wobble = np.sin(2 * np.pi * 2.5 * t_pre) * 15
    cheer_voices += amp * np.sin(2 * np.pi * (f_base + wobble) * t_pre) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * t_pre))

crowd_mix = (crowd_raw * 0.65 + cheer_voices * 0.35) * crowd_env

left_ch[pre_mask] += crowd_mix * 0.85
right_ch[pre_mask] += crowd_mix * 0.90

# Mechanical Pioneer CDJ CUE/PLAY button click at t_drop - 0.08s
click_idx = int(sr * (t_drop - 0.08))
click_len = int(sr * 0.04)
if click_idx + click_len < total_samples:
    tc = np.linspace(0, 0.04, click_len)
    click_snd = np.sin(2 * np.pi * 1800 * tc) * np.exp(-tc * 250) + np.sin(2 * np.pi * 3200 * tc) * np.exp(-tc * 350)
    left_ch[click_idx:click_idx+click_len] += click_snd * 0.8
    right_ch[click_idx:click_idx+click_len] += click_snd * 0.8

# B) HARD TECHNO DROP AT 140 BPM (Peak Time Hard Techno like Hertz - Timballe)
# 140 BPM => 1 beat = 60 / 140 = 0.42857 seconds. 1 16th note = beat / 4 = 0.10714s
bpm = 140.0
sec_per_beat = 60.0 / bpm
sec_per_16th = sec_per_beat / 4.0

drop_start_idx = int(sr * t_drop)
drop_samples = total_samples - drop_start_idx
t_drop_axis = t_axis[drop_start_idx:] - t_drop

# 1. Brutal 909 Hard Techno Kick:
# Fast pitch drop (180 Hz -> 42 Hz) with hard clipping & saturation
def make_hard_kick():
    k_len = int(sr * 0.38)
    tk = np.linspace(0, 0.38, k_len)
    # Exponential pitch envelope
    freq = 45.0 + (180.0 - 45.0) * np.exp(-tk * 32.0)
    phase = 2 * np.pi * np.cumsum(freq) / sr
    # Sub body + transient click
    body = np.sin(phase) * np.exp(-tk * 8.5)
    click = (np.random.normal(0, 1, k_len) * np.exp(-tk * 120.0)) * 0.35
    raw_kick = body * 1.4 + click
    # Hard saturation / overdrive
    dist_kick = np.tanh(raw_kick * 2.2)
    return dist_kick

kick_sample = make_hard_kick()

# 2. Distorted Rolling Rumble Sub Bass (The signature Peak-Time Hard Techno rumble):
# Offbeat & 16th-note syncopated rumble tail
def make_rumble_tail():
    r_len = int(sr * sec_per_beat)
    tr = np.linspace(0, sec_per_beat, r_len)
    # 48 Hz rolling sub
    sub = np.sin(2 * np.pi * 48.0 * tr)
    # Envelope ducked on the kick hit, rises on 2nd, 3rd, 4th 16th
    env = np.clip((tr - 0.08) * 12.0, 0, 1) * np.exp(-(tr - 0.28)**2 / 0.02)
    rumble = np.tanh(sub * env * 2.8) * 0.65
    return rumble

rumble_sample = make_rumble_tail()

# 3. High Energy Percussion / Timbales (Hertz style timballe rimshots):
def make_timbal():
    tb_len = int(sr * 0.18)
    tt = np.linspace(0, 0.18, tb_len)
    # Resonant metallic ring: 410 Hz + 780 Hz + 1420 Hz
    timb = (np.sin(2 * np.pi * 410 * tt) * 0.5 +
            np.sin(2 * np.pi * 780 * tt) * 0.35 +
            np.sin(2 * np.pi * 1420 * tt) * 0.2) * np.exp(-tt * 24.0)
    return np.tanh(timb * 1.8) * 0.7

timbal_sample = make_timbal()

# 4. Rave Synth Stab (Detuned saws):
def make_rave_stab():
    st_len = int(sr * 0.32)
    ts = np.linspace(0, 0.32, st_len)
    f0 = 130.81 # C3
    stab = (np.sin(2 * np.pi * f0 * ts) +
            np.sin(2 * np.pi * (f0 * 1.01) * ts) +
            np.sin(2 * np.pi * (f0 * 0.99) * ts) +
            np.sin(2 * np.pi * (f0 * 1.5) * ts) * 0.5) * np.exp(-ts * 11.0)
    return np.tanh(stab * 1.5) * 0.45

synth_sample = make_rave_stab()

# Populate the drop beat by beat!
num_beats = int(np.ceil((total_duration - t_drop) / sec_per_beat)) + 1
for b in range(num_beats):
    beat_time = b * sec_per_beat
    b_idx = int(sr * (t_drop + beat_time))
    
    # KICK on every quarter beat (4-to-the-floor)
    k_end = min(b_idx + len(kick_sample), total_samples)
    if b_idx < total_samples:
        k_slice = kick_sample[:k_end - b_idx]
        left_ch[b_idx:k_end] += k_slice * 0.95
        right_ch[b_idx:k_end] += k_slice * 0.95
        
    # RUMBLE on every beat
    r_end = min(b_idx + len(rumble_sample), total_samples)
    if b_idx < total_samples:
        r_slice = rumble_sample[:r_end - b_idx]
        left_ch[b_idx:r_end] += r_slice * 0.75
        right_ch[b_idx:r_end] += r_slice * 0.75
        
    # TIMBALES on 2nd and 4th 16th notes (syncopated groove)
    for sixteenth_step in [1, 2.5, 3]:
        timb_idx = b_idx + int(sr * sixteenth_step * sec_per_16th)
        t_end = min(timb_idx + len(timbal_sample), total_samples)
        if 0 <= timb_idx < total_samples:
            t_slice = timbal_sample[:t_end - timb_idx]
            # Pan timbales slightly wide
            left_ch[timb_idx:t_end] += t_slice * 0.65
            right_ch[timb_idx:t_end] += t_slice * 0.45

    # RAVE STAB on beat 1 and 3 of every 2-bar cycle
    if b % 2 == 0:
        s_end = min(b_idx + len(synth_sample), total_samples)
        if b_idx < total_samples:
            s_slice = synth_sample[:s_end - b_idx]
            left_ch[b_idx:s_end] += s_slice * 0.55
            right_ch[b_idx:s_end] += s_slice * 0.70

# C) MASSIVE CROWD ROAR & ECSTATIC CHEERS DURING THE DROP
drop_crowd_noise = np.random.normal(0, 1, drop_samples)
drop_crowd = np.cumsum(drop_crowd_noise)
drop_crowd = drop_crowd - np.mean(drop_crowd)
drop_crowd = drop_crowd / (np.max(np.abs(drop_crowd)) + 1e-9)

# Continuous cheering roar
for f_cheer in [750, 1100, 1600, 2400]:
    mod = np.sin(2 * np.pi * f_cheer * t_drop_axis + np.sin(2 * np.pi * 4.0 * t_drop_axis))
    drop_crowd += mod * 0.08

drop_crowd_env = np.clip(t_drop_axis * 5.0, 0, 1) * 0.45
left_ch[drop_start_idx:] += drop_crowd * drop_crowd_env * 0.75
right_ch[drop_start_idx:] += drop_crowd * drop_crowd_env * 0.80

# MASTERING: Soft clipping limiter
max_val = max(np.max(np.abs(left_ch)), np.max(np.abs(right_ch)))
if max_val > 0.95:
    left_ch = np.tanh(left_ch * (1.1 / max_val)) * 0.94
    right_ch = np.tanh(right_ch * (1.1 / max_val)) * 0.94

# Save master WAV
wav_path = os.path.join(TEMP_DIR, "master_soundtrack.wav")
with wave.open(wav_path, "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(sr)
    # Convert float to 16-bit PCM
    l_pcm = (left_ch * 32767).astype(np.int16)
    r_pcm = (right_ch * 32767).astype(np.int16)
    stereo_interleaved = np.empty((total_samples * 2,), dtype=np.int16)
    stereo_interleaved[0::2] = l_pcm
    stereo_interleaved[1::2] = r_pcm
    wf.writeframes(stereo_interleaved.tobytes())

print(f"✓ Master 140 BPM Hard Techno + Ovation soundtrack rendered: {wav_path}")

# Also copy an MP3 soundtrack to assets for fast standalone Web Audio / fallback
mp3_soundtrack = os.path.join(OUTPUT_DIR, "intro_hard_techno.mp3")
subprocess.run([
    "ffmpeg", "-y", "-i", wav_path,
    "-codec:a", "libmp3lame", "-qscale:a", "2",
    mp3_soundtrack
], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)
print(f"✓ Standalone audio MP3 ready: {mp3_soundtrack}")

# -------------------------------------------------------------
# STEP 3: Mux final video and audio with faststart web streaming
# -------------------------------------------------------------
print("6. Muxing final video and audio into web/assets/intro_cinematic.mp4...")
subprocess.run([
    "ffmpeg", "-y",
    "-i", raw_combined,
    "-i", wav_path,
    "-c:v", "libx264", "-preset", "slow", "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "256k",
    "-shortest",
    "-movflags", "+faststart",
    OUTPUT_VIDEO
], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)

final_size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
print(f"🎉 FINAL INTRO VIDEO GENERATED: {OUTPUT_VIDEO} ({final_size_mb:.2f} MB)")
print("=== INTRO PROCESSING COMPLETE ===")
