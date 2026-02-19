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