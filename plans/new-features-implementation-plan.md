# New Features Implementation Plan

**Created:** February 20, 2026
**Status:** ✅ Complete

This document outlines the detailed implementation plans for three new features:
1. Functions Search (Command Palette)
2. On-Screen Transform Controls
3. Enhanced Export Options

---

## Feature 1: Functions Search (Command Palette)

### Overview
Implement a command palette that provides quick access to all editor actions with keyboard shortcuts, accessible via the search field in the header.

### Current State
- Search field exists in `src/components/editor/editor-header.tsx` but is marked `readOnly`
- Actions system in `src/lib/actions/definitions.ts` defines 24 actions
- Shortcuts infrastructure exists via `useKeyboardShortcutsHelp` hook

### Files to Create/Modify
```
src/
├── components/
│   └── editor/
│       ├── command-palette.tsx          (NEW)
│       └── editor-header.tsx            (MODIFY)
├── stores/
│   └── dialog-store.ts                  (MODIFY - add "command-palette" dialog type)
└── locales/
    ├── en.json                          (MODIFY)
    └── vi.json                          (MODIFY)
```

### Implementation Steps
- [x] Analyze existing actions system
- [x] Create CommandPalette component with:
  - [x] Fuzzy search input
  - [x] Filtered action list grouped by category
  - [x] Keyboard navigation (arrow keys, Enter, Escape)
  - [x] Display shortcuts next to each action
  - [x] Execute action on selection
- [x] Wire up search input in editor-header.tsx
- [x] Add keyboard shortcut (Cmd/Ctrl+K) to open palette
- [x] Add translations

### Estimated Time: 1-2 days

---

## Feature 2: On-Screen Transform Controls

### Overview
Interactive transform handles (bounding box, resize handles, rotation handle) overlaid on the preview canvas for selected video/image/text elements. **Only visible when playback is paused.**

### Current State
- `PreviewInteractionOverlay` handles pointer drag for position only
- `usePreviewInteraction` hook translates canvas coordinates
- Transform system supports scale, position, rotate, flipX, flipY

### Files to Create/Modify
```
src/
├── components/
│   └── editor/
│       └── panels/
│           └── preview/
│               ├── preview-interaction-overlay.tsx  (MODIFY)
│               ├── transform-controls.tsx           (NEW)
│               ├── selection-bounds.tsx             (NEW)
│               └── transform-handle.tsx             (NEW)
├── hooks/
│   └── use-transform-handles.ts                     (NEW)
└── types/
    └── transform-controls.ts                        (NEW)
```

### Implementation Steps
- [x] Create type definitions for transform controls
- [x] Create TransformHandle component
- [x] Create SelectionBounds component with:
  - [x] Bounding rectangle
  - [x] 8 resize handles (corners + edges)
  - [x] 1 rotation handle (above bounding box)
  - [x] Only render when playback is paused
- [x] Create useTransformHandles hook:
  - [x] Calculate bounding box from selected elements
  - [x] Map canvas coordinates to screen coordinates
  - [x] Detect which handle is being dragged
  - [x] Apply transform updates during drag
  - [x] Support proportional scaling (Shift key)
  - [x] Support rotation with snap-to-angle (Shift key)
- [x] Modify PreviewInteractionOverlay to include TransformControls
- [x] Handle coordinate system (zoom, quality, container offset)

### Interaction Behaviors
| Handle | Drag Behavior | Shift Key |
|--------|---------------|-----------|
| Corner (NW, NE, SW, SE) | Scale from corner | Proportional scale |
| Edge (N, S, E, W) | Scale along axis | Proportional scale |
| Rotate | Rotate around center | Snap to 15° increments |

### Estimated Time: 3-5 days

---

## Feature 3: Enhanced Export Options

### Overview
Expand export capabilities with additional formats, resolution presets, and user-configurable quality settings.

### Current State
- Formats: MP4 (H.264), WebM (VP9)
- Quality levels: low, medium, high, very_high
- Options: includeAudio, fps

### Files to Create/Modify
```
src/
├── types/
│   └── export.ts                         (MODIFY)
├── constants/
│   └── export-constants.ts               (MODIFY)
├── components/
│   └── editor/
│       └── export-button.tsx             (MODIFY)
└── lib/
    └── export.ts                         (MODIFY)
```

### Implementation Steps
- [x] Update export type definitions:
  - [x] Add GIF format
  - [x] Add MP3/WAV audio formats
  - [x] Add resolution presets
  - [x] Add bitrate option
  - [x] Add social media presets
- [x] Update export constants:
  - [x] Add MIME types for new formats
  - [x] Add resolution preset values
  - [x] Add social media preset values
- [x] Update ExportButton UI:
  - [x] Reorganize with sections
  - [x] Add resolution preset selector
  - [x] Add bitrate slider (advanced)
  - [x] Add format descriptions
- [x] Add GIF options configuration
- [x] Add translations

**Note:** GIF and audio export implementation requires backend FFmpeg.wasm integration which is already present in the project. The UI now supports these formats.

### New Export Options

#### Formats
| Format | Type | Description |
|--------|------|-------------|
| MP4 | Video | H.264 codec, wide compatibility |
| WebM | Video | VP9 codec, web optimized |
| GIF | Animated | For social media sharing |
| MP3 | Audio | Compressed audio |
| WAV | Audio | Uncompressed audio |

#### Resolution Presets
| Preset | Width | Height | Use Case |
|--------|-------|--------|----------|
| 4K | 3840 | 2160 | High quality |
| 1080p | 1920 | 1080 | Standard HD |
| 720p | 1280 | 720 | Web/social |
| 480p | 854 | 480 | Small file size |
| Custom | - | - | User defined |

#### Social Media Presets
| Platform | Resolution | Aspect Ratio |
|----------|------------|--------------|
| YouTube | 1920x1080 | 16:9 |
| TikTok/Reels | 1080x1920 | 9:16 |
| Instagram Feed | 1080x1080 | 1:1 |
| Instagram Story | 1080x1920 | 9:16 |
| Twitter/X | 1280x720 | 16:9 |

### Estimated Time: 2-4 days

---

## Implementation Order

1. **Command Palette** (Quick win, 1-2 days)
2. **Enhanced Export Options** (Quick win, 2-4 days)
3. **Transform Controls** (More complex, 3-5 days)

Total Estimated Time: 6-11 days

---

## Notes

- All features should follow existing code patterns and conventions
- Use existing i18n system for all user-facing text
- Ensure accessibility (keyboard navigation, screen readers)
- Test on both macOS and Windows keyboard shortcuts