# Video Timeline Improvement Implementation

## Summary

This document describes the implementation of docked audio waveforms for video tracks in the timeline, similar to professional video editors like CapCut, DaVinci Resolve, and Premiere Pro.

## Changes Made

### 1. Type Updates (`src/services/storage/types.ts`)

Added two new fields to `MediaAssetData`:
- `audioWaveformPeaks?: number[][]` - Pre-computed audio waveform peaks for visualization
- `hasAudio?: boolean` - Whether the media has an audio track

### 2. Audio Peak Extraction (`src/lib/media/processing.ts`)

Added new function `extractAudioWaveformPeaks()`:
- Extracts audio peaks from video or audio files
- Uses Web Audio API's `decodeAudioData()` to process audio
- Returns normalized peak values per channel
- Gracefully handles files without audio

Updated `processMediaAssets()` to:
- Extract audio peaks when processing video files
- Extract audio peaks when processing audio files
- Store peaks in the new `audioWaveformPeaks` field
- Store audio presence in `hasAudio` field

### 3. Timeline Constants (`src/constants/timeline-constants.tsx`)

Increased video track height from 60px to 80px to accommodate the docked waveform.

### 4. New Component (`src/components/editor/panels/timeline/docked-waveform.tsx`)

Created `DockedWaveform` component:
- Lightweight canvas-based waveform visualization
- Uses pre-computed peaks (no WaveSurfer.js dependency)
- Supports muted state with visual feedback
- High-DPI display support

### 5. Timeline Element Rendering (`src/components/editor/panels/timeline/timeline-element.tsx`)

Updated `ElementContent` function to:
- Detect videos with audio waveform data
- Split video element into two sections: thumbnails (top) + waveform (bottom)
- Render docked waveform for videos with audio
- Handle muted state for waveform visualization

## Visual Layout

```
┌─────────────────────────────────────────────┐
│  [thumb][thumb][thumb][thumb][thumb][thumb] │ ← Video thumbnails (top)
├─────────────────────────────────────────────┤
│  ▃▅▇▅▃▅▇▅▃▅▇▅▃▅▇▅▃▅▇▅▃▅▇▅▃▅▇▅▃▅▇▅▃▅▇▅▃   │ ← Audio waveform (bottom, docked)
└─────────────────────────────────────────────┘
```

## Features

1. **Automatic Audio Detection**: Videos with audio automatically show the docked waveform
2. **Muted State**: When a video is muted, the waveform appears greyed out
3. **Performance**: Uses pre-computed peaks, no real-time audio processing
4. **High-DPI Support**: Canvas rendering supports Retina displays

## Testing

To test the implementation:
1. Import a video file with audio
2. Observe the timeline showing filmstrip thumbnails with docked waveform below
3. Toggle mute on the video to see waveform visual state change
4. Import a video without audio - no waveform should appear

## Future Enhancements

Potential improvements for future iterations:
1. Click on waveform to seek within clip
2. Drag handles for audio fade in/out
3. Waveform zoom level synchronization with timeline zoom
4. Stereo channel visualization (L/R separate displays)

---

## Update: Fixed Thumbnail Zoom Behavior (Feb 2026)

### Problem
When the timeline was zoomed, thumbnails would get:
- **Pixelated** - stretched horizontally beyond their native resolution
- **Cut off** - `object-fit: cover` with stretched width caused top/bottom cropping

### Solution
Changed thumbnail rendering from "stretch to fill" to "position by time offset":

**Before (broken):**
```jsx
// Thumbnails stretched to fill the space
<img width={baseWidth * step} /> // Width scales with zoom → pixelation
```

**After (fixed):**
```jsx
// Thumbnails positioned at their time offset with fixed aspect-ratio
<img 
  style={{
    left: `${(thumbnailTime - trimStart) * pixelsPerSecond}px`,
    width: `${availableHeight * videoAspectRatio}px`, // Fixed width based on height
    height: `${availableHeight}px`,                   // Height always fits track
    objectFit: "cover",
  }}
/>
```

### Key Changes
1. **Fixed thumbnail dimensions**: Width is calculated from aspect ratio × available height (not affected by zoom)
2. **Position by time offset**: Each thumbnail is positioned at its correct time position using absolute positioning
3. **Zoom reveals more thumbnails**: As you zoom in, thumbnails spread apart and more become visible
4. **Visibility culling**: Only render thumbnails within the visible element bounds for performance
5. **Adaptive step**: When zoomed out, skip some thumbnails to prevent overlapping; when zoomed in, show all

### Visual Behavior

```
ZOOMED OUT (zoom = 0.5x):
┌─────────────────────────────────────────────────────────┐
│ [thumb1]      [thumb2]      [thumb3]      [thumb4]      │
│   0s            2s            4s            6s          │
└─────────────────────────────────────────────────────────┘
   (fewer thumbnails, spread apart, step=2)

ZOOMED IN (zoom = 2x):
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [thumb1]  [thumb2]  [thumb3]  [thumb4]  [thumb5]  [thumb6]  [thumb7]  [thumb8]  │
│   0s        1s        2s        3s        4s        5s        6s        7s       │
└─────────────────────────────────────────────────────────────────────────────────┘
   (more thumbnails, same size, step=1)
```

### Benefits
- **No pixelation**: Thumbnails always render at their native aspect ratio
- **No cropping**: Height always fits within the track, `object-fit: cover` works correctly
- **Smooth zoom experience**: Thumbnails stay crisp and properly positioned at any zoom level
