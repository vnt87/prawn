# P1 Core Features Implementation Plans

> **Created:** February 2026  
> **Project:** Prawn Video Editor

This document provides detailed implementation plans for 6 P1 core video editing features:

1. Extract Audio from Video
2. Replace Media
3. Audio Ducking
4. Keyframe Volume
5. Crop Tool
6. Export Current Frame as Still Image

---

## 1. Extract Audio from Video

### Overview
Allow users to extract the audio track from a video clip and add it as a separate audio clip on the timeline, while optionally keeping or removing the audio from the original video.

### User Experience
- Right-click on video clip → "Extract Audio" option
- Or: Select video → Properties panel → Audio tab → "Extract Audio" button
- Option dialog: "Keep original audio in video?" (Yes/No)

### Technical Implementation

#### Data Type Changes
```typescript
// src/types/timeline.ts - Add to VideoElement
interface VideoElement {
  // ... existing
  extractAudioAction?: "none" | "extract-keep" | "extract-remove";
}
```

#### UI Components
1. **Context Menu Item** - Add to [`src/components/editor/panels/timeline/timeline-element.tsx`]
2. **Audio Tab Button** - Add "Extract Audio" button to [`src/components/editor/panels/properties/video-properties/audio-tab.tsx`]

#### Action Implementation
```typescript
// src/core/managers/timeline-manager.ts or new file

interface ExtractAudioParams {
  trackId: string;
  elementId: string;
  action: "extract-keep" | "extract-remove";
  projectId: string;
}

async function extractAudioFromVideo({
  trackId,
  elementId,
  action,
  projectId,
}: ExtractAudioParams) {
  // 1. Get the video element and its media source
  const videoElement = getElement(trackId, elementId);
  const mediaAsset = await mediaManager.getAsset(videoElement.mediaId);
  
  // 2. Use FFmpeg to extract audio track
  const audioBlob = await ffmpegService.extractAudio(mediaAsset.sourceUrl);
  
  // 3. Upload extracted audio as new asset
  const audioAsset = await mediaManager.uploadAsset({
    projectId,
    file: audioBlob,
    type: "audio",
    name: `${videoElement.name} - Audio`,
  });
  
  // 4. Create new audio element on audio track
  const audioElement = createAudioElement({
    sourceType: "upload",
    mediaId: audioAsset.id,
    name: `${videoElement.name} - Audio`,
    duration: videoElement.duration,
    startTime: videoElement.startTime,
    trimStart: videoElement.trimStart,
    trimEnd: videoElement.trimEnd,
    volume: 1,
  });
  
  // 5. Add to timeline
  await timelineManager.addElements({
    trackType: "audio",
    elements: [audioElement],
  });
  
  // 6. If extract-remove, update original video element
  if (action === "extract-remove") {
    await timelineManager.updateElements({
      updates: [{
        trackId,
        elementId,
        updates: { muted: true },
      }],
    });
  }
}
```

#### FFmpeg Integration
```typescript
// src/lib/media/ffmpeg-service.ts

async function extractAudio(videoUrl: string): Promise<Blob> {
  const inputName = 'input' + getExtension(videoUrl);
  const outputName = 'output.mp3';
  
  await ffmpeg.writeFile(inputName, await fetchFile(videoUrl));
  
  // Extract audio track (AAC/MP3 depending on source)
  await ffmpeg.exec([
    '-i', inputName,
    '-vn',           // No video
    '-acodec', 'libmp3lame',
    '-q:a', '2',     // High quality
    outputName
  ]);
  
  const data = await ffmpeg.readFile(outputName);
  return new Blob([data], { type: 'audio/mp3' });
}
```

#### Integration Points
| File | Change |
|------|--------|
| `src/types/timeline.ts` | Add `extractAudioAction` to VideoElement |
| `src/components/editor/panels/timeline/timeline-element.tsx` | Add context menu item |
| `src/components/editor/panels/properties/video-properties/audio-tab.tsx` | Add Extract button |
| `src/core/managers/timeline-manager.ts` | Add `extractAudio()` action |
| `src/lib/media/ffmpeg-service.ts` | Add `extractAudio()` method |

#### Complexity
- **UI:** Low — button and context menu item
- **Backend/FFmpeg:** Medium — audio extraction requires FFmpeg
- **Timeline Logic:** Low — create new audio element

---

## 2. Replace Media

### Overview
Allow users to replace the source media of a clip while preserving all edits (trim points, transforms, effects, animations, etc.).

### User Experience
- Right-click on clip → "Replace Media..."
- Opens file picker filtered to matching media type
- Preview of new media before confirming
- All edits preserved, duration adjusts to match new media length

### Technical Implementation

#### UI Components
1. **Context Menu Item** - Add to timeline element context menu
2. **Media Picker Dialog** - New dialog component for selecting replacement

#### Action Implementation
```typescript
// src/core/managers/timeline-manager.ts

interface ReplaceMediaParams {
  trackId: string;
  elementId: string;
  newMediaId: string;
}

async function replaceMedia({
  trackId,
  elementId,
  newMediaId,
}: ReplaceMediaParams) {
  // 1. Get existing element with all its properties
  const element = getElement(trackId, elementId);
  
  // 2. Get new media asset to check duration
  const newAsset = await mediaManager.getAsset(newMediaId);
  
  // 3. Calculate new duration based on trim points
  const originalDuration = element.trimEnd - element.trimStart;
  const newDuration = Math.min(
    originalDuration,
    newAsset.duration
  );
  
  // 4. Update element with new media ID
  // Preserve: trimStart, trimEnd (clamped to new duration), 
  // transform, opacity, filters, animations, speed, volume, etc.
  await timelineManager.updateElements({
    updates: [{
      trackId,
      elementId,
      updates: {
        mediaId: newMediaId,
        // Adjust trimEnd if new media is shorter
        trimEnd: Math.min(element.trimEnd, newAsset.duration),
      },
    }],
  });
  
  // 5. If duration changed, notify user
  if (newDuration !== originalDuration) {
    toast.info(`Duration adjusted from ${originalDuration.toFixed(1)}s to ${newDuration.toFixed(1)}s`);
  }
}
```

#### Edge Cases
| Scenario | Handling |
|----------|----------|
| New media shorter than original trim | Clamp trimEnd, show warning |
| Different aspect ratio | Keep transform, user adjusts |
| New media has no audio | Keep audio settings, apply to silence |
| Video → Image | Set image duration, remove speed controls |

#### Integration Points
| File | Change |
|------|--------|
| `src/components/editor/panels/timeline/timeline-element.tsx` | Add "Replace Media" context menu |
| `src/core/managers/timeline-manager.ts` | Add `replaceMedia()` action |
| New: `src/components/editor/dialogs/replace-media-dialog.tsx` | Media picker dialog |

#### Complexity
- **UI:** Medium — picker dialog with preview
- **Logic:** Low — update media ID, handle duration edge cases
- **Testing:** Medium — verify all edits preserved

---

## 3. Audio Ducking

### Overview
Automatically lower the volume of background music when voice/speech is detected in another track, then restore it when speech ends.

### User Experience
- Select music clip → Audio tab → "Auto-Duck" button
- Dialog options:
  - Sensitivity (Low/Medium/High)
  - Ducking amount (-6dB to -40dB)
  - Attack/Release time
- Preview before applying
- Manual keyframe mode for fine-tuning

### Technical Implementation

#### Data Types
```typescript
// src/types/timeline.ts - Add to AudioElement

interface AudioElement {
  // ... existing
  ducking?: {
    enabled: boolean;
    sensitivity: "low" | "medium" | "high";
    duckLevel: number; // dB reduction, e.g., -12
    attackTime: number; // seconds
    releaseTime: number; // seconds
  };
}
```

#### Implementation Approach
```
┌─────────────────────────────────────────────────────────────┐
│                    Audio Ducking Pipeline                   │
├─────────────────────────────────────────────────────────────┤
│  1. Detect voice on voice track                             │
│     ↓                                                       │
│  2. Generate voice activity waveform (0 = silence, 1 = speech)│
│     ↓                                                       │
│  3. Apply ducking curve (attack/hold/release envelope)       │
│     ↓                                                       │
│  4. Convert to keyframes OR apply in real-time render        │
└─────────────────────────────────────────────────────────────┘
```

#### Voice Detection Options

**Option A: Client-side (Web Audio API)**
```typescript
// Use AudioContext to analyze frequency patterns
// Simple energy-based voice detection (not accurate)
```

**Option B: FFmpeg Voice Detection**
```typescript
// Use FFmpeg's silenceremoval or voice detection filters
// More accurate but requires processing time
```

**Option C: Backend AI Service (Recommended)**
```typescript
// Send audio to backend for voice activity detection
// Returns timestamp array of speech segments
// Most accurate, async processing
```

#### Ducking Curve Generation
```typescript
function generateDuckingCurve(
  voiceSegments: { start: number; end: number }[],
  params: {
    duckLevel: number;
    attackTime: number;
    releaseTime: number;
  },
  duration: number
): { time: number; volume: number }[] {
  const curve: { time: number; volume: number }[] = [];
  
  for (let t = 0; t <= duration; t += 0.1) {
    let duckAmount = 1; // Full volume
    
    for (const segment of voiceSegments) {
      if (t >= segment.start && t <= segment.end) {
        // Within speech segment - apply ducking
        const timeInSegment = t - segment.start;
        
        // Attack phase
        if (timeInSegment < params.attackTime) {
          const progress = timeInSegment / params.attackTime;
          duckAmount = 1 - ((1 - params.duckLevel) * progress);
        } 
        // Hold phase
        else if (t > segment.end - params.releaseTime) {
          const timeToEnd = segment.end - t;
          const progress = timeToEnd / params.releaseTime;
          duckAmount = 1 - ((1 - params.duckLevel) * progress);
        }
        // Sustained phase
        else {
          duckAmount = params.duckLevel;
        }
      }
    }
    
    curve.push({ time: t, volume: duckAmount });
  }
  
  return curve;
}
```

#### Integration Points
| File | Change |
|------|--------|
| `src/types/timeline.ts` | Add `ducking` to AudioElement |
| `src/components/editor/panels/properties/video-properties/audio-tab.tsx` | Add Auto-Duck button and dialog |
| `src/core/managers/timeline-manager.ts` | Add `applyAudioDucking()` action |
| `src/lib/media/audio.ts` | Add voice detection / curve generation |

#### Complexity
- **UI:** Medium — dialog with sensitivity controls
- **Audio Processing:** Medium-High — voice detection + curve generation
- **Real-time Preview:** High — compute ducking during playback

---

## 4. Keyframe Volume

### Overview
Allow users to add keyframes to audio volume, enabling fade-ins, fade-outs, and volume automation curves.

### User Experience
- Click on audio clip to reveal volume curve in timeline
- Click on curve to add keyframe
- Drag keyframe to adjust time/value
- Right-click keyframe to delete
- Volume envelope visible as line graph on clip

### Technical Implementation

#### Data Types
```typescript
// src/types/timeline.ts - Extend AudioElement

interface VolumeKeyframe {
  time: number; // seconds from clip start
  value: number; // 0.0 to 2.0 (linear)
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

interface AudioElement {
  // ... existing
  volumeKeyframes?: VolumeKeyframe[];
  // OR: Replace simple volume with keyframe-driven system
  volumeMode: "constant" | "keyframed";
}
```

#### Timeline UI Changes
```
┌──────────────────────────────────────────────────────────────┐
│ Audio Track                                                   │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ████████████████████████████████████████████               │ │
│ │     ●────────●───────────●                               │ │
│ │          0.2        0.8         0.3  (keyframe values)     │ │
│ └──────────────────────────────────────────────────────────┘ │
│          ↑ Click to add keyframe, drag to adjust            │
└──────────────────────────────────────────────────────────────┘
```

#### Rendering Implementation
```typescript
// src/services/renderer/nodes/audio-node.ts (new or modified)

function getVolumeAtTime(
  element: AudioElement,
  clipLocalTime: number
): number {
  // Constant volume mode (existing)
  if (element.volumeMode === "constant") {
    return element.volume ?? 1;
  }
  
  // Keyframed volume mode
  const keyframes = element.volumeKeyframes ?? [];
  if (keyframes.length === 0) return 1;
  if (keyframes.length === 1) return keyframes[0].value;
  
  // Find surrounding keyframes
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  
  // Before first keyframe
  if (clipLocalTime <= sorted[0].time) return sorted[0].value;
  
  // After last keyframe
  if (clipLocalTime >= sorted[sorted.length - 1].time) {
    return sorted[sorted.length - 1].value;
  }
  
  // Between keyframes - interpolate
  for (let i = 0; i < sorted.length - 1; i++) {
    const k1 = sorted[i];
    const k2 = sorted[i + 1];
    
    if (clipLocalTime >= k1.time && clipLocalTime <= k2.time) {
      const progress = (clipLocalTime - k1.time) / (k2.time - k1.time);
      const easedProgress = applyEasing(progress, k2.easing);
      return k1.value + (k2.value - k1.value) * easedProgress;
    }
  }
  
  return 1;
}
```

#### UI Components
1. **Timeline Track View** - Show volume curve on audio clips
2. **Keyframe Editor** - Click to add, drag to move, right-click to delete
3. **Properties Panel** - Optional list view of all keyframes

#### Integration Points
| File | Change |
|------|--------|
| `src/types/timeline.ts` | Add `volumeKeyframes` to AudioElement |
| `src/components/editor/panels/timeline/timeline-element.tsx` | Add keyframe UI on audio clips |
| `src/components/editor/panels/timeline/timeline-track.tsx` | Render volume curve |
| `src/core/managers/timeline-manager.ts` | Add keyframe CRUD actions |
| `src/services/renderer/nodes/audio-node.ts` | Implement keyframe interpolation |

#### Complexity
- **UI:** Medium-High — keyframe editor on timeline
- **Data:** Low — array of keyframe objects
- **Rendering:** Low — interpolation function

---

## 5. Crop Tool

### Overview
Allow users to crop (zoom in/out and reposition) video and image clips without affecting the original media file.

### User Experience
- Select clip → Properties → Video tab → "Crop" section
- Adjust crop percentage (0-100%)
- Drag inside preview to reposition
- Reset button to restore full frame
- Alternatively: Use transform handles on canvas

### Technical Implementation

#### Data Types
```typescript
// src/types/timeline.ts - Add to VideoElement and ImageElement

interface CropRect {
  x: number;      // 0-100 percentage
  y: number;      // 0-100 percentage
  width: number;  // 0-100 percentage (100 = full frame)
  height: number; // 0-100 percentage
}

interface VideoElement {
  // ... existing
  crop?: CropRect;
}
```

#### Rendering Implementation
```typescript
// src/services/renderer/nodes/video-node.ts

function renderWithCrop(
  ctx: CanvasRenderingContext2D,
  mediaElement: HTMLVideoElement | HTMLImageElement,
  crop: CropRect,
  destinationRect: Rect
) {
  // Calculate source rectangle from crop
  const sourceX = (crop.x / 100) * mediaElement.videoWidth;
  const sourceY = (crop.y / 100) * mediaElement.videoHeight;
  const sourceW = (crop.width / 100) * mediaElement.videoWidth;
  const sourceH = (crop.height / 100) * mediaElement.videoHeight;
  
  ctx.drawImage(
    mediaElement,
    sourceX, sourceY, sourceW, sourceH,  // Source
    destinationRect.x, destinationRect.y, 
    destinationRect.width, destinationRect.height  // Destination
  );
}
```

#### UI Components
1. **Crop Controls in Video Tab** - Sliders for X, Y, Width, Height
2. **Visual Crop Overlay** - On-canvas crop handles
3. **Preset Buttons** - 16:9, 4:3, 1:1, 9:16, etc.

#### Integration Points
| File | Change |
|------|--------|
| `src/types/timeline.ts` | Add `crop` to VideoElement/ImageElement |
| `src/components/editor/panels/properties/video-properties/video-tab.tsx` | Add crop controls |
| `src/components/editor/panels/properties/video-properties/basic-video-tab.tsx` | Or add to transform section |
| `src/services/renderer/nodes/video-node.ts` | Apply crop in render method |
| `src/services/renderer/nodes/image-node.ts` | Apply crop in render method |

#### Crop vs Scale Relationship
| Feature | What it affects | Resolution |
|---------|-----------------|-------------|
| Scale | Display size | May lose quality when scaled up |
| Crop | Visible portion | Maintains quality within cropped area |

Note: Crop + Scale can be combined. Crop reduces visible area, then Scale adjusts final size.

#### Complexity
- **UI:** Low-Medium — sliders and presets
- **Rendering:** Low — adjust source rectangle in drawImage
- **Export:** Low — FFmpeg crop filter handles it

---

## 6. Export Current Frame as Still Image

### Overview
Capture the current frame from the preview and save it as a PNG/JPG image file.

### User Experience
- Button in preview panel header: "📷 Export Frame"
- Keyboard shortcut: `Shift + S` (or `Cmd/Ctrl + Shift + S`)
- Downloads image with filename: `{project-name}-{timestamp}.png`
- Resolution options: Current preview, 1080p, 4K, Original

### Technical Implementation

#### Implementation Approach

**Option A: Canvas Capture (Quick)**
```typescript
// Use existing preview canvas
function exportCurrentFrame(options: {
  format: "png" | "jpg";
  resolution: "preview" | "1080p" | "4k" | "original";
}): void {
  const canvas = getPreviewCanvas();
  
  // Create export canvas at desired resolution
  const exportCanvas = document.createElement("canvas");
  // ... set dimensions based on options ...
  
  // Draw current frame
  const ctx = exportCanvas.getContext("2d");
  ctx.drawImage(canvas, 0, 0);
  
  // Trigger download
  const dataUrl = exportCanvas.toDataURL(`image/${format}`);
  const link = document.createElement("a");
  link.download = `frame-${Date.now()}.${format}`;
  link.href = dataUrl;
  link.click();
}
```

**Option B: Render at Original Resolution (Better Quality)**
```typescript
// Render at project resolution for best quality
async function exportCurrentFrameHighQuality(): Promise<void> {
  const project = getCurrentProject();
  const time = getCurrentPlaybackTime();
  
  // Create canvas at project resolution
  const canvas = document.createElement("canvas");
  canvas.width = project.width;
  canvas.height = project.height;
  
  // Use scene-builder to render current frame
  const ctx = canvas.getContext("2d");
  await renderSceneToCanvas({
    ctx,
    scene: getCurrentScene(),
    time,
    width: project.width,
    height: project.height,
  });
  
  // Download
  const link = document.createElement("a");
  link.download = `frame-${project.name}-${time.toFixed(2)}s.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
```

#### UI Components
1. **Toolbar Button** - In preview panel header
2. **Resolution Dropdown** - Preview/1080p/4K/Original
3. **Format Toggle** - PNG (lossless) / JPG (smaller)

#### Integration Points
| File | Change |
|------|--------|
| `src/components/editor/panels/preview/index.tsx` | Add export button to toolbar |
| `src/core/managers/playback-manager.ts` | Add `getCurrentTime()` for frame reference |
| `src/services/renderer/scene-builder.ts` | Add `renderToCanvas()` for high-res export |
| `src/app/editor/[project_id]/page.tsx` | Add keyboard shortcut |

#### Keyboard Shortcut
```typescript
// src/hooks/use-keyboard-shortcuts.ts or similar
{
  key: "s",
  shiftKey: true,
  action: () => exportCurrentFrame(),
}
```

#### Complexity
- **UI:** Low — button and dropdown
- **Rendering:** Low-Medium — capture canvas or re-render at resolution
- **Download:** Low — browser download API

---

## Summary: Feature Priorities

| Feature | UI | Logic | Rendering | Dependencies |
|---------|-----|-------|-----------|--------------|
| Export Frame | Low | Low | Low-Medium | None |
| Extract Audio | Low | Medium | Medium | FFmpeg |
| Replace Media | Medium | Low | None | File picker |
| Crop Tool | Low-Medium | Low | Low | None |
| Keyframe Volume | Medium-High | Low | Low | Timeline UI |
| Audio Ducking | Medium | Medium-High | Medium | Voice detection |

**Recommendation:** Implement in order:
1. **Export Frame** — Simplest, high value, no dependencies
2. **Crop Tool** — Simple rendering change, common feature
3. **Replace Media** — Simple logic, improves workflow
4. **Extract Audio** — Medium complexity, FFmpeg already integrated
5. **Keyframe Volume** — UI-heavy but valuable
6. **Audio Ducking** — Most complex, requires voice detection strategy
