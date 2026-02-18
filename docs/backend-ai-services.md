# Backend AI Services — Implementation Plan

> **Hardware target:** Ryzen 5700X3D · NVIDIA RTX 4070Ti · 64 GB RAM  
> **Pattern:** Each service is a Python FastAPI microservice following the same structure as `stt-service/`.  
> **Status:** All features below are currently shown in the UI with a "Soon" badge.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Service: video-ai-service](#service-video-ai-service)
   - [Video Stabilization](#1-video-stabilization)
   - [Smooth Slow-Mo (Frame Interpolation)](#2-smooth-slow-mo-frame-interpolation)
   - [Background Removal (Video)](#3-background-removal-video)
   - [Auto Adjust](#4-auto-adjust)
   - [Color Match](#5-color-match)
   - [Color Correction (White Balance)](#6-color-correction-white-balance)
3. [Service: translate-service](#service-translate-service)
   - [Video Translator](#7-video-translator)
4. [Service: audio-ai-service](#service-audio-ai-service)
   - [Normalize Loudness](#8-normalize-loudness)
   - [Enhance Voice (Noise Reduction)](#9-enhance-voice-noise-reduction)
5. [Frontend Integration Pattern](#frontend-integration-pattern)
6. [Docker Compose Integration](#docker-compose-integration)
7. [API Contracts](#api-contracts)

---

## Architecture Overview

```
Browser (Next.js)
    │
    ├── /api/video-ai/*  ──proxy──►  video-ai-service:8001  (GPU)
    ├── /api/translate/* ──proxy──►  translate-service:8002  (GPU)
    └── /api/audio-ai/* ──proxy──►  audio-ai-service:8003   (CPU)
```

All services:
- Accept multipart/form-data with the video/audio file + JSON params
- Return processed file as a binary stream or a JSON result
- Run in Docker containers on the same host as the Next.js app
- Share a `/tmp/prawn-processing/` volume for large file transfers

---

## Service: video-ai-service

**Directory:** `video-ai-service/`  
**Port:** 8001  
**GPU:** Yes (CUDA via PyTorch/ONNX)  
**Base image:** `nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04`

### 1. Video Stabilization

**UI location:** Basic tab → Stabilize toggle (currently "Soon")  
**Algorithm:** VidStab via FFmpeg, or OpenCV `cv2.videostab`

#### Open-source libraries
| Library | License | Notes |
|---|---|---|
| `ffmpeg-python` | Apache 2.0 | Wraps FFmpeg's `vidstabdetect` + `vidstabtransform` filters |
| `opencv-python` | Apache 2.0 | `cv2.videostab` module — more control, slower |

#### Recommended approach
Use FFmpeg's two-pass VidStab:
```bash
# Pass 1: analyze motion
ffmpeg -i input.mp4 -vf vidstabdetect=shakiness=5:accuracy=15:result=transforms.trf -f null -

# Pass 2: apply stabilization
ffmpeg -i input.mp4 -vf vidstabtransform=input=transforms.trf:smoothing=30:crop=black -c:a copy output.mp4
```

#### API endpoint
```
POST /stabilize
Content-Type: multipart/form-data

Fields:
  file: <video file>
  shakiness: int (1-10, default 5)
  smoothing: int (1-100, default 30)

Response: video/mp4 stream
```

#### Performance estimate
- 1080p 60s clip: ~15–30 seconds on Ryzen 5700X3D (CPU-bound)
- No GPU needed for this feature

---

### 2. Smooth Slow-Mo (Frame Interpolation)

**UI location:** Speed tab → Smooth slow-mo toggle (currently "Soon")  
**Algorithm:** RIFE (Real-time Intermediate Flow Estimation)

#### Open-source libraries
| Library | License | Notes |
|---|---|---|
| `Practical-RIFE` | MIT | `hzwer/Practical-RIFE` on GitHub — production-ready |
| `rife-ncnn-vulkan` | MIT | Cross-platform, uses Vulkan (works on 4070Ti) |
| `IFNet` (ECCV2022-RIFE) | MIT | Latest model, best quality |

#### Recommended approach
```python
# Install: pip install torch torchvision
# Clone: git clone https://github.com/hzwer/Practical-RIFE

from model.RIFE_HDv3 import Model

model = Model()
model.load_model('./train_log', -1)
model.eval()
model.device()

# Interpolate between frame pairs
with torch.no_grad():
    middle = model.inference(img0, img1, scale=1.0)
```

#### API endpoint
```
POST /interpolate
Content-Type: multipart/form-data

Fields:
  file: <video file>
  target_fps: int (e.g., 60 for 30→60fps, 120 for 30→120fps)
  multiplier: int (2 or 4 — number of frames to insert between each pair)

Response: video/mp4 stream
```

#### Performance estimate
- 1080p, 2× interpolation (30→60fps): ~20–40 seconds for a 10s clip on 4070Ti
- 4× interpolation: ~60–90 seconds for a 10s clip

---

### 3. Background Removal (Video)

**UI location:** Remove BG tab (currently placeholder)  
**Note:** The browser-native `@imgly/background-removal` handles images well but is slow for video. The backend handles video frame-by-frame much faster.

#### Open-source libraries
| Library | License | Notes |
|---|---|---|
| `rembg` | MIT | Uses U2Net/ISNET models, GPU-accelerated |
| `backgroundremover` | MIT | Wraps rembg with video support |

#### Recommended approach
```python
# pip install rembg[gpu] onnxruntime-gpu
from rembg import remove, new_session

session = new_session("isnet-general-use")  # or "u2net"

# Process video frame by frame
cap = cv2.VideoCapture(input_path)
while True:
    ret, frame = cap.read()
    if not ret: break
    frame_rgba = remove(frame, session=session)
    # Write to output with alpha channel
```

#### API endpoint
```
POST /remove-background
Content-Type: multipart/form-data

Fields:
  file: <video or image file>
  model: string ("isnet-general-use" | "u2net" | "u2net_human_seg")
  output_format: string ("mp4" | "webm" | "png")

Response: video/webm or image/png stream (with alpha channel)
```

#### Performance estimate
- 1080p frame: ~50–100ms per frame on 4070Ti with ISNET model
- 30fps 10s clip (300 frames): ~15–30 seconds total

---

### 4. Auto Adjust

**UI location:** Adjust tab → Auto adjust toggle (currently removed from UI, add back when backend ready)  
**Algorithm:** Histogram analysis + automatic parameter selection

#### Implementation (no external ML model needed)
```python
import cv2
import numpy as np

def auto_adjust(frame):
    # Convert to LAB color space for perceptual adjustments
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # CLAHE for adaptive contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l)
    
    # Merge and convert back
    enhanced = cv2.merge([l_enhanced, a, b])
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
```

#### API endpoint
```
POST /auto-adjust
Content-Type: multipart/form-data

Fields:
  file: <video or image file>
  strength: float (0.0-1.0, default 0.8)

Response: { brightness, contrast, saturation, exposure } — suggested values to apply client-side
```

---

### 5. Color Match

**UI location:** Adjust tab → Color match toggle (currently removed from UI, add back when backend ready)  
**Algorithm:** Histogram matching between source and reference clips

#### Implementation
```python
import cv2
import numpy as np

def match_histograms(source_frame, reference_frame):
    """Match the color distribution of source to reference."""
    matched = np.zeros_like(source_frame)
    for channel in range(3):
        src_hist, _ = np.histogram(source_frame[:,:,channel].flatten(), 256, [0,256])
        ref_hist, _ = np.histogram(reference_frame[:,:,channel].flatten(), 256, [0,256])
        
        src_cdf = src_hist.cumsum() / src_hist.sum()
        ref_cdf = ref_hist.cumsum() / ref_hist.sum()
        
        # Build lookup table
        lut = np.interp(src_cdf, ref_cdf, np.arange(256))
        matched[:,:,channel] = lut[source_frame[:,:,channel]]
    
    return matched.astype(np.uint8)
```

#### API endpoint
```
POST /color-match
Content-Type: multipart/form-data

Fields:
  source: <video file to adjust>
  reference: <video file to match colors from>
  strength: float (0.0-1.0, default 1.0)

Response: video/mp4 stream
```

---

### 6. Color Correction (White Balance)

**UI location:** Adjust tab → Color correction toggle (currently removed from UI, add back when backend ready)  
**Algorithm:** Gray World or White Patch automatic white balance

#### Implementation
```python
def gray_world_white_balance(frame):
    """Gray World assumption: average of all channels should be equal."""
    result = frame.copy().astype(np.float32)
    avg_b = np.mean(result[:,:,0])
    avg_g = np.mean(result[:,:,1])
    avg_r = np.mean(result[:,:,2])
    avg = (avg_b + avg_g + avg_r) / 3
    
    result[:,:,0] = np.clip(result[:,:,0] * (avg / avg_b), 0, 255)
    result[:,:,1] = np.clip(result[:,:,1] * (avg / avg_g), 0, 255)
    result[:,:,2] = np.clip(result[:,:,2] * (avg / avg_r), 0, 255)
    
    return result.astype(np.uint8)
```

#### API endpoint
```
POST /color-correct
Content-Type: multipart/form-data

Fields:
  file: <video or image file>
  algorithm: string ("gray_world" | "white_patch" | "retinex")

Response: { temperature_shift, tint_shift } — suggested values to apply client-side
```

---

## Service: translate-service

**Directory:** `translate-service/`  
**Port:** 8002  
**GPU:** Yes (Whisper + XTTS require GPU for acceptable speed)  
**Base image:** `nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04`

### 7. Video Translator

**UI location:** Audio tab → Video translator toggle (currently removed from UI)  
**Pipeline:** ASR (Whisper) → Translation (Helsinki-NLP) → TTS (Coqui XTTS-v2)

#### Open-source libraries
| Component | Library | License | Notes |
|---|---|---|---|
| ASR | `openai-whisper` | MIT | Already used in `stt-service/` |
| Translation | `Helsinki-NLP/opus-mt-*` | Apache 2.0 | 100+ language pairs via HuggingFace |
| TTS | `coqui-tts` (XTTS-v2) | MPL 2.0 | Voice cloning, 17 languages |
| Lip sync (optional) | `Wav2Lip` | MIT | Matches mouth movements to new audio |

#### Pipeline
```python
import whisper
from transformers import MarianMTModel, MarianTokenizer
from TTS.api import TTS

# Step 1: Transcribe
whisper_model = whisper.load_model("large-v3")
result = whisper_model.transcribe(audio_path, word_timestamps=True)
segments = result["segments"]  # [{start, end, text}, ...]

# Step 2: Translate
model_name = f"Helsinki-NLP/opus-mt-{src_lang}-{tgt_lang}"
tokenizer = MarianTokenizer.from_pretrained(model_name)
mt_model = MarianMTModel.from_pretrained(model_name)

translated_segments = []
for seg in segments:
    inputs = tokenizer(seg["text"], return_tensors="pt", padding=True)
    translated = mt_model.generate(**inputs)
    translated_text = tokenizer.decode(translated[0], skip_special_tokens=True)
    translated_segments.append({**seg, "translated": translated_text})

# Step 3: Synthesize speech
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to("cuda")
for seg in translated_segments:
    tts.tts_to_file(
        text=seg["translated"],
        speaker_wav=original_audio_path,  # voice cloning
        language=tgt_lang,
        file_path=f"seg_{seg['id']}.wav"
    )

# Step 4: Mux audio back into video
# Use ffmpeg to replace audio track, timing each segment
```

#### API endpoint
```
POST /translate-video
Content-Type: multipart/form-data

Fields:
  file: <video file>
  source_language: string (e.g., "en", "vi", "fr")
  target_language: string (e.g., "vi", "en", "ja")
  voice_clone: bool (default true — use original speaker's voice)

Response: video/mp4 stream (video with translated audio track)
```

#### Performance estimate on 4070Ti
- Whisper large-v3: ~50× real-time (60s clip transcribed in ~1.2s)
- Helsinki-NLP translation: ~100ms per segment (CPU)
- XTTS-v2 synthesis: ~30s of audio generated per second of GPU time
- Total for 60s clip: ~3–5 minutes

#### Supported language pairs (Helsinki-NLP)
English ↔ Vietnamese, French, German, Spanish, Japanese, Korean, Chinese, Arabic, Russian, Portuguese, Italian, Dutch, Polish, Turkish, and 80+ more.

---

## Service: audio-ai-service

**Directory:** `audio-ai-service/`  
**Port:** 8003  
**GPU:** Optional (CPU is sufficient for both features)  
**Base image:** `python:3.11-slim`

### 8. Normalize Loudness

**UI location:** Audio tab → Normalize loudness toggle (currently "Soon")  
**Standard:** EBU R128 / ITU-R BS.1770-4 (industry standard for broadcast)

#### Open-source libraries
| Library | License | Notes |
|---|---|---|
| `pyloudnorm` | MIT | Pure Python EBU R128 implementation |
| `ffmpeg-python` | Apache 2.0 | FFmpeg's `loudnorm` filter (two-pass) |

#### Recommended approach (FFmpeg two-pass)
```bash
# Pass 1: measure loudness
ffmpeg -i input.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# Pass 2: apply normalization with measured values
ffmpeg -i input.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-23:measured_LRA=7:measured_TP=-2:measured_thresh=-33:offset=0:linear=true output.mp3
```

#### API endpoint
```
POST /normalize
Content-Type: multipart/form-data

Fields:
  file: <audio or video file>
  target_lufs: float (default -16.0 for streaming, -23.0 for broadcast)
  true_peak: float (default -1.5 dBTP)

Response: audio/mpeg or video/mp4 stream with normalized audio
```

#### Performance estimate
- 60s audio clip: ~2–5 seconds (CPU, two-pass FFmpeg)

---

### 9. Enhance Voice (Noise Reduction)

**UI location:** Audio tab → Enhance voice toggle (currently "Soon")  
**Algorithm:** RNNoise (Mozilla/Xiph) or Demucs (Meta)

#### Open-source libraries
| Library | License | Notes |
|---|---|---|
| `rnnoise` | BSD | Mozilla's neural noise suppressor, very fast |
| `demucs` | MIT | Meta's music source separation — separates voice from background |
| `noisereduce` | MIT | Spectral gating, simpler but effective |

#### Recommended approach
Use `demucs` for highest quality (separates voice from music/noise):
```python
# pip install demucs
import demucs.separate

# Separate vocals from background
demucs.separate.main(["--two-stems", "vocals", "-o", output_dir, input_path])
# Returns: vocals.wav + no_vocals.wav
# Optionally re-mix with reduced background: vocals + 0.1 * no_vocals
```

For simple noise reduction (faster), use `noisereduce`:
```python
import noisereduce as nr
import soundfile as sf

data, rate = sf.read(input_path)
reduced = nr.reduce_noise(y=data, sr=rate, stationary=False)
sf.write(output_path, reduced, rate)
```

#### API endpoint
```
POST /enhance-voice
Content-Type: multipart/form-data

Fields:
  file: <audio or video file>
  mode: string ("denoise" | "separate" | "both")
  background_level: float (0.0-1.0, how much background to keep when mode="separate")

Response: audio/mpeg or video/mp4 stream with enhanced audio
```

#### Performance estimate
- `noisereduce` on 60s clip: ~1–3 seconds (CPU)
- `demucs` on 60s clip: ~10–30 seconds (CPU), ~3–8 seconds (GPU)

---

## Frontend Integration Pattern

Each backend feature follows this pattern in the Next.js frontend:

### 1. API Route (proxy)
```typescript
// src/app/api/video-ai/stabilize/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const response = await fetch("http://video-ai-service:8001/stabilize", {
    method: "POST",
    body: formData,
  });
  return new Response(response.body, {
    headers: { "Content-Type": "video/mp4" },
  });
}
```

### 2. Hook
```typescript
// src/hooks/actions/use-stabilize.ts
export function useStabilize() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  async function stabilize(mediaId: string, options: StabilizeOptions) {
    setIsProcessing(true);
    const file = await getMediaFile(mediaId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("shakiness", String(options.shakiness));
    
    const response = await fetch("/api/video-ai/stabilize", {
      method: "POST",
      body: formData,
    });
    
    const blob = await response.blob();
    // Replace media asset with stabilized version
    await replaceMediaAsset(mediaId, blob);
    setIsProcessing(false);
  }

  return { stabilize, isProcessing, progress };
}
```

### 3. UI (in the relevant tab)
```tsx
// In basic-video-tab.tsx — Stabilize section
const { stabilize, isProcessing } = useStabilize();

<PropertyGroup title="Stabilize" hasBorderTop>
  <Button 
    onClick={() => stabilize(element.mediaId, { shakiness: 5 })}
    disabled={isProcessing}
  >
    {isProcessing ? <Spinner /> : "Stabilize clip"}
  </Button>
</PropertyGroup>
```

---

## Docker Compose Integration

Add to `docker-compose.yml`:

```yaml
services:
  # ... existing services ...

  video-ai-service:
    build: ./video-ai-service
    ports:
      - "8001:8001"
    volumes:
      - /tmp/prawn-processing:/tmp/prawn-processing
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      - CUDA_VISIBLE_DEVICES=0
    restart: unless-stopped

  translate-service:
    build: ./translate-service
    ports:
      - "8002:8002"
    volumes:
      - /tmp/prawn-processing:/tmp/prawn-processing
      - ./translate-service/models:/app/models  # cache HuggingFace models
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

  audio-ai-service:
    build: ./audio-ai-service
    ports:
      - "8003:8003"
    volumes:
      - /tmp/prawn-processing:/tmp/prawn-processing
    restart: unless-stopped
```

---

## API Contracts

### Common response format for analysis endpoints (no file output)
```json
{
  "success": true,
  "result": {
    "suggested_params": { ... },
    "processing_time_ms": 1234
  }
}
```

### Common error format
```json
{
  "success": false,
  "error": "File too large (max 500MB)",
  "code": "FILE_TOO_LARGE"
}
```

### File size limits
| Service | Max file size |
|---|---|
| video-ai-service | 500 MB |
| translate-service | 200 MB |
| audio-ai-service | 100 MB |

---

## Implementation Priority

| Priority | Feature | Service | Estimated effort |
|---|---|---|---|
| P3.1 | Normalize Loudness | audio-ai-service | 1 day |
| P3.2 | Enhance Voice | audio-ai-service | 1 day |
| P3.3 | Auto Adjust | video-ai-service | 1 day |
| P3.4 | Color Match | video-ai-service | 1 day |
| P3.5 | Color Correction | video-ai-service | 1 day |
| P3.6 | Background Removal (video) | video-ai-service | 2 days |
| P3.7 | Video Stabilization | video-ai-service | 2 days |
| P3.8 | Smooth Slow-Mo | video-ai-service | 3 days |
| P3.9 | Video Translator | translate-service | 5 days |

**Total estimated effort:** ~17 developer-days for all backend services.

---

*Last updated: 2026-02-18*  
*Hardware target: Ryzen 5700X3D · RTX 4070Ti · 64 GB RAM*
