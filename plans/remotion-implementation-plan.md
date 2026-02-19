# Remotion Integration - Implementation Plan

> **Created:** February 2026  
> **Project:** Prawn Video Editor  
> **Scope:** High-priority Remotion integration features

---

## Overview

This document provides detailed implementation plans for the high-priority Remotion integration features:

1. **Enhanced Animation System** - Spring physics and advanced interpolation
2. **Remotion Player for Preview** - Better playback controls
3. **AI-Powered Video Generation** - UI-first approach with provider integration

---

## Feature 1: Enhanced Animation System

### Goal
Enhance Prawn's animation system with Remotion's `spring()` and `interpolate()` functions for more natural, physics-based animations.

### Current State

**File:** [`src/services/renderer/nodes/visual-node.ts`](src/services/renderer/nodes/visual-node.ts)

```typescript
// Current animation calculation - simple cubic ease-out
private computeAnimFrame(type: AnimationType, t: number): AnimOverride {
  const eased = 1 - Math.pow(1 - t, 3);  // Basic easing
  
  switch (type) {
    case "fade":
      return { ...ANIM_NEUTRAL, opacityMultiplier: eased };
    // ... more types
  }
}
```

### Implementation Steps

#### Step 1.1: Install Remotion Core Package

```bash
bun add @remotion/core
```

**Note:** Only install the core package, not the full Remotion framework.

#### Step 1.2: Create Animation Utilities Module

**New File:** `src/lib/animation/remotion-animations.ts`

```typescript
/**
 * Animation utilities adapted from Remotion's spring and interpolate functions.
 * These provide physics-based animations for the Prawn video editor.
 */

// Spring configuration options
export interface SpringConfig {
  damping?: number;      // Default: 10
  stiffness?: number;    // Default: 100
  mass?: number;         // Default: 1
  overshootClamping?: boolean;  // Default: false
}

// Animation easing functions
export type EasingFunction = (t: number) => number;

// Bezier easing (from Remotion)
export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t * t * (3 - 2 * t),
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  bezier: (x1: number, y1: number, x2: number, y2: number): EasingFunction => {
    // Cubic bezier implementation
    // ... (implementation details)
  },
};

// Spring physics calculation (adapted from Remotion)
export function spring({
  frame,
  fps,
  config = {},
  from = 0,
  to = 1,
}: {
  frame: number;
  fps: number;
  config?: SpringConfig;
  from?: number;
  to?: number;
}): number {
  const { damping = 10, stiffness = 100, mass = 1, overshootClamping = false } = config;
  
  // Spring physics calculation
  // ... (implementation adapted from Remotion)
}

// Interpolation helper (from Remotion)
export function interpolate(
  input: number,
  inputRange: number[],
  outputRange: number[],
  options?: {
    extrapolateLeft?: 'clamp' | 'identity' | 'wrap';
    extrapolateRight?: 'clamp' | 'identity' | 'wrap';
    easing?: EasingFunction;
  }
): number {
  // Linear interpolation with extrapolation options
  // ... (implementation)
}
```

#### Step 1.3: Extend Animation Types

**File:** `src/types/timeline.ts`

```typescript
/** Available clip entry/exit animation types. */
export type AnimationType =
  | "fade"
  | "slide-left"
  | "slide-right"
  // ... existing types
  | "spring-bounce"     // NEW: Spring-based bounce
  | "spring-elastic"    // NEW: Elastic spring
  | "spring-gentle";    // NEW: Gentle spring

/** Extended animation configuration. */
export interface ClipAnimation {
  type: AnimationType;
  duration: number;
  intensity?: number;
  direction?: "up" | "down" | "left" | "right";
  // NEW: Spring configuration
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
  // NEW: Easing type
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
}
```

#### Step 1.4: Update VisualNode Animation Logic

**File:** `src/services/renderer/nodes/visual-node.ts`

```typescript
import { spring, interpolate, Easing } from '@/lib/animation/remotion-animations';

// Update computeAnimFrame method
private computeAnimFrame(type: AnimationType, t: number, localTime: number): AnimOverride {
  const { fps } = this.renderer;
  const frame = Math.floor(t * fps * 30); // Convert to frames at 30fps reference
  
  // Check for spring-based animation
  if (type.startsWith('spring-')) {
    return this.computeSpringAnimFrame(type, frame, fps);
  }
  
  // Use Remotion's interpolate for smoother easing
  const eased = this.applyEasing(t, type);
  
  switch (type) {
    case "fade":
      return { ...ANIM_NEUTRAL, opacityMultiplier: eased };
    // ... update other cases to use interpolate()
  }
}

private computeSpringAnimFrame(type: AnimationType, frame: number, fps: number): AnimOverride {
  const springValue = spring({
    frame,
    fps,
    config: this.getSpringConfig(type),
  });
  
  switch (type) {
    case "spring-bounce":
      return { 
        ...ANIM_NEUTRAL, 
        scaleMultiplier: springValue,
        opacityMultiplier: Math.min(1, springValue * 1.5)
      };
    case "spring-elastic":
      // ... elastic spring implementation
    case "spring-gentle":
      // ... gentle spring implementation
  }
}
```

#### Step 1.5: Update Animation Tab UI

**File:** `src/components/editor/panels/properties/video-properties/animation-tab.tsx`

Add new animation presets and spring configuration UI:

```typescript
const ANIMATION_PRESETS = [
  // ... existing presets
  { type: "spring-bounce", label: "Spring Bounce", icon: Zap },
  { type: "spring-elastic", label: "Spring Elastic", icon: Activity },
  { type: "spring-gentle", label: "Spring Gentle", icon: Feather },
];

// Add spring configuration controls
function SpringConfigControls({ anim, onChange }: { anim: ClipAnimation; onChange: (config: SpringConfig) => void }) {
  if (!anim.type.startsWith('spring-')) return null;
  
  return (
    <PropertyGroup title="Spring Settings">
      <PropertyItem>
        <PropertyItemLabel>Damping</PropertyItemLabel>
        <Slider
          value={[anim.springConfig?.damping ?? 10]}
          onValueChange={([damping]) => onChange({ ...anim.springConfig, damping })}
          min={1}
          max={30}
        />
      </PropertyItem>
      <PropertyItem>
        <PropertyItemLabel>Stiffness</PropertyItemLabel>
        <Slider
          value={[anim.springConfig?.stiffness ?? 100]}
          onValueChange={([stiffness]) => onChange({ ...anim.springConfig, stiffness })}
          min={50}
          max={500}
        />
      </PropertyItem>
    </PropertyGroup>
  );
}
```

### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add `@remotion/core` dependency |
| `src/types/timeline.ts` | Add new animation types and spring config |
| `src/services/renderer/nodes/visual-node.ts` | Implement spring animations |
| `src/components/editor/panels/properties/video-properties/animation-tab.tsx` | Add spring presets and controls |
| `src/lib/animation/remotion-animations.ts` | NEW: Animation utilities |

### Testing Checklist

- [ ] Spring animations render correctly in preview
- [ ] Spring animations export correctly in final video
- [ ] Spring config controls update animation in real-time
- [ ] Existing animations still work as expected
- [ ] Performance is acceptable for real-time preview

---

## Feature 2: Remotion Player for Preview

### Goal
Integrate Remotion's Player component for a more feature-rich preview experience with better playback controls.

### Current State

**File:** [`src/components/editor/panels/preview/index.tsx`](src/components/editor/panels/preview/index.tsx)

The current preview panel uses a custom canvas-based approach with basic play/pause controls.

### Implementation Steps

#### Step 2.1: Install Remotion Player

```bash
bun add @remotion/player
```

#### Step 2.2: Create Timeline-to-Composition Converter

**New File:** `src/lib/remotion/timeline-converter.ts`

```typescript
import type { TScene, TimelineTrack, TimelineElement } from '@/types/timeline';

/**
 * Converts Prawn timeline data to Remotion composition format.
 */

interface RemotionComposition {
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  sequences: RemotionSequence[];
}

interface RemotionSequence {
  id: string;
  from: number;  // Start frame
  durationInFrames: number;
  component: string;  // Component type identifier
  props: Record<string, any>;
}

export function convertTimelineToComposition(
  scene: TScene,
  settings: { fps: number; width: number; height: number }
): RemotionComposition {
  const sequences: RemotionSequence[] = [];
  
  for (const track of scene.tracks) {
    const trackSequences = convertTrackToSequences(track, settings.fps);
    sequences.push(...trackSequences);
  }
  
  // Calculate total duration from all elements
  const durationInFrames = calculateTotalDuration(scene, settings.fps);
  
  return {
    durationInFrames,
    fps: settings.fps,
    width: settings.width,
    height: settings.height,
    sequences,
  };
}

function convertTrackToSequences(
  track: TimelineTrack,
  fps: number
): RemotionSequence[] {
  // Convert each element to a Remotion sequence
  // ... implementation
}
```

#### Step 2.3: Create Remotion Composition Components

**New File:** `src/lib/remotion/composition-components.tsx`

```typescript
import React from 'react';
import type { VideoElement, ImageElement, TextElement, AudioElement } from '@/types/timeline';

/**
 * Remotion-compatible components for rendering timeline elements.
 */

interface CompositionContextValue {
  fps: number;
  width: number;
  height: number;
  currentTime: number;
}

const CompositionContext = React.createContext<CompositionContextValue>({
  fps: 30,
  width: 1920,
  height: 1080,
  currentTime: 0,
});

// Video component wrapper
export function VideoComposition({ element }: { element: VideoElement }) {
  const { currentTime, fps } = React.useContext(CompositionContext);
  const frame = Math.floor(currentTime * fps);
  
  // Apply animations, filters, transforms
  // ... implementation
}

// Image component wrapper
export function ImageComposition({ element }: { element: ImageElement }) {
  // ... implementation
}

// Text component wrapper
export function TextComposition({ element }: { element: TextElement }) {
  // ... implementation
}
```

#### Step 2.4: Create Player Wrapper Component

**New File:** `src/components/editor/panels/preview/remotion-player.tsx`

```typescript
import { Player } from '@remotion/player';
import { useMemo } from 'react';
import { convertTimelineToComposition } from '@/lib/remotion/timeline-converter';
import { PrawnComposition } from './prawn-composition';
import { useEditor } from '@/hooks/use-editor';

export function RemotionPlayerWrapper() {
  const editor = useEditor();
  const project = editor.project.getActive();
  
  // Convert timeline to composition
  const composition = useMemo(() => {
    if (!project) return null;
    return convertTimelineToComposition(project.scene, project.settings);
  }, [project?.scene, project?.settings]);
  
  if (!composition || !project) return null;
  
  return (
    <Player
      component={PrawnComposition}
      inputProps={{ composition }}
      durationInFrames={composition.durationInFrames}
      compositionWidth={composition.width}
      compositionHeight={composition.height}
      fps={composition.fps}
      controls
      loop
      style={{ width: '100%', height: '100%' }}
    />
  );
}
```

#### Step 2.5: Update Preview Panel

**File:** `src/components/editor/panels/preview/index.tsx`

Add option to switch between legacy and Remotion player:

```typescript
import { RemotionPlayerWrapper } from './remotion-player';

export function PreviewPanel() {
  const [useRemotionPlayer, setUseRemotionPlayer] = useState(false);
  
  return (
    <div className="preview-panel">
      {useRemotionPlayer ? (
        <RemotionPlayerWrapper />
      ) : (
        <LegacyPreviewCanvas />
      )}
      
      {/* Toggle for testing */}
      <button onClick={() => setUseRemotionPlayer(!useRemotionPlayer)}>
        {useRemotionPlayer ? 'Use Legacy Player' : 'Use Remotion Player'}
      </button>
    </div>
  );
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Add `@remotion/player` |
| `src/lib/remotion/timeline-converter.ts` | NEW | Timeline to composition converter |
| `src/lib/remotion/composition-components.tsx` | NEW | Remotion-compatible components |
| `src/components/editor/panels/preview/remotion-player.tsx` | NEW | Player wrapper |
| `src/components/editor/panels/preview/index.tsx` | Modify | Integrate Remotion player |

### Testing Checklist

- [ ] Timeline elements render correctly in Remotion player
- [ ] Playback controls work (play, pause, seek, loop)
- [ ] Timeline updates reflect in player in real-time
- [ ] Audio plays correctly
- [ ] Performance is acceptable

---

## Feature 3: AI-Powered Video Generation

### Goal
Implement UI for AI-powered video generation with provider integration in the Integrations panel. Mark AI features as "Coming Soon" in the UI.

### Implementation Steps

#### Step 3.1: Extend Integrations Store for AI Providers

**File:** `src/stores/integrations-store.ts`

```typescript
interface IntegrationsState {
  // ... existing fields
  
  // AI Video Generation Providers
  openaiApiKey: string;
  openaiApiBaseUrl: string;  // For custom endpoints
  anthropicApiKey: string;
  anthropicApiBaseUrl: string;
  
  // AI Video Settings
  aiVideoProvider: 'openai' | 'anthropic' | 'custom';
  aiVideoModel: string;
  
  // Actions
  setIntegration: (key: keyof Omit<IntegrationsState, "setIntegration">, value: string) => void;
}

export const useIntegrationsStore = create<IntegrationsState>()(
  persist(
    (set) => ({
      // ... existing defaults
      
      // AI Video Generation
      openaiApiKey: "",
      openaiApiBaseUrl: "https://api.openai.com/v1",
      anthropicApiKey: "",
      anthropicApiBaseUrl: "https://api.anthropic.com",
      aiVideoProvider: "openai",
      aiVideoModel: "gpt-4o",
      
      setIntegration: (key, value) => {
        set((state) => ({ ...state, [key]: value }));
      },
    }),
    { name: "nvai-integrations" },
  ),
);
```

#### Step 3.2: Update Integrations Dialog

**File:** `src/components/editor/dialogs/integrations-dialog.tsx`

Add AI Video Generation section to the AI tab:

```typescript
<TabsContent value="ai" className="mt-0 space-y-6">
  {/* Existing Modal/STT section */}
  <div className="space-y-4">
    {/* ... existing content */}
  </div>
  
  {/* NEW: AI Video Generation Section */}
  <div className="space-y-4">
    <div className="flex items-center gap-2 pb-2 border-b">
      <Wand2 className="text-muted-foreground" />
      <h3 className="text-lg font-medium">{t("integrations.aiVideo.title")}</h3>
    </div>
    
    {/* Provider Selection */}
    <div className="grid gap-2">
      <Label>{t("integrations.aiVideo.provider")}</Label>
      <Select
        value={values.aiVideoProvider}
        onValueChange={(v) => handleChange("aiVideoProvider", v)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="openai">OpenAI</SelectItem>
          <SelectItem value="anthropic">Anthropic</SelectItem>
          <SelectItem value="custom">Custom Endpoint</SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    {/* OpenAI Configuration */}
    {values.aiVideoProvider === 'openai' && (
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="openaiApiKey">{t("integrations.aiVideo.openaiApiKey")}</Label>
          <Input
            id="openaiApiKey"
            type="password"
            value={values.openaiApiKey}
            onChange={(e) => handleChange("openaiApiKey", e.target.value)}
            placeholder="sk-..."
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="openaiApiBaseUrl">{t("integrations.aiVideo.baseUrl")}</Label>
          <Input
            id="openaiApiBaseUrl"
            value={values.openaiApiBaseUrl}
            onChange={(e) => handleChange("openaiApiBaseUrl", e.target.value)}
            placeholder="https://api.openai.com/v1"
          />
          <p className="text-xs text-muted-foreground">
            {t("integrations.aiVideo.baseUrlHint")}
          </p>
        </div>
      </div>
    )}
    
    {/* Anthropic Configuration */}
    {values.aiVideoProvider === 'anthropic' && (
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="anthropicApiKey">{t("integrations.aiVideo.anthropicApiKey")}</Label>
          <Input
            id="anthropicApiKey"
            type="password"
            value={values.anthropicApiKey}
            onChange={(e) => handleChange("anthropicApiKey", e.target.value)}
            placeholder="sk-ant-..."
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="anthropicApiBaseUrl">{t("integrations.aiVideo.baseUrl")}</Label>
          <Input
            id="anthropicApiBaseUrl"
            value={values.anthropicApiBaseUrl}
            onChange={(e) => handleChange("anthropicApiBaseUrl", e.target.value)}
            placeholder="https://api.anthropic.com"
          />
        </div>
      </div>
    )}
    
    {/* Model Selection */}
    <div className="grid gap-2">
      <Label htmlFor="aiVideoModel">{t("integrations.aiVideo.model")}</Label>
      <Input
        id="aiVideoModel"
        value={values.aiVideoModel}
        onChange={(e) => handleChange("aiVideoModel", e.target.value)}
        placeholder="gpt-4o"
      />
    </div>
  </div>
</TabsContent>
```

#### Step 3.3: Create AI Generation Panel UI

**New File:** `src/components/editor/panels/assets/views/ai-generation.tsx`

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wand2, Sparkles, Loader2 } from 'lucide-react';
import { useIntegrationsStore } from '@/stores/integrations-store';

export function AIGenerationView() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { openaiApiKey, anthropicApiKey, aiVideoProvider } = useIntegrationsStore();
  
  const hasApiKey = aiVideoProvider === 'openai' 
    ? !!openaiApiKey 
    : !!anthropicApiKey;
  
  const handleGenerate = async () => {
    if (!hasApiKey) {
      // Show integrations dialog
      return;
    }
    
    setIsGenerating(true);
    try {
      // TODO: Implement AI generation logic
      // This will be implemented in a future phase
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="p-4 space-y-4">
      {/* Header with Coming Soon badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          <h2 className="text-lg font-semibold">AI Video Generation</h2>
        </div>
        <Badge variant="secondary" className="text-xs">
          Coming Soon
        </Badge>
      </div>
      
      {/* Prompt Input */}
      <div className="space-y-2">
        <Label>Describe your video</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Create a 30-second product showcase video with smooth transitions and upbeat background music..."
          rows={4}
          className="resize-none"
        />
      </div>
      
      {/* Quick Prompts */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Quick prompts</Label>
        <div className="flex flex-wrap gap-2">
          {[
            "Product showcase",
            "Social media intro",
            "Tutorial video",
            "Promotional clip"
          ].map((quickPrompt) => (
            <Button
              key={quickPrompt}
              variant="outline"
              size="sm"
              onClick={() => setPrompt(quickPrompt)}
              className="text-xs"
            >
              {quickPrompt}
            </Button>
          ))}
        </div>
      </div>
      
      {/* API Key Warning */}
      {!hasApiKey && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Configure your AI provider API key in Settings → Integrations → AI to enable video generation.
          </p>
        </div>
      )}
      
      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || !hasApiKey || isGenerating}
        className="w-full gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Video
          </>
        )}
      </Button>
      
      {/* Feature Preview */}
      <div className="pt-4 border-t">
        <h3 className="text-sm font-medium mb-2">Upcoming Features</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Text-to-video generation</li>
          <li>• Auto-caption creation</li>
          <li>• Style transfer animations</li>
          <li>• Template generation from prompts</li>
        </ul>
      </div>
    </div>
  );
}
```

#### Step 3.4: Add AI Generation Tab to Assets Panel

**File:** `src/stores/assets-panel-store.ts`

```typescript
export type Tab = 
  | "media" 
  | "sounds" 
  | "text" 
  | "stickers"
  | "effects"
  | "transitions"
  | "captions"
  | "filters"
  | "ai-generation"  // NEW
  | "settings";
```

**File:** `src/components/editor/panels/assets/tabbar.tsx`

Add AI Generation tab:

```typescript
import { Wand2 } from 'lucide-react';

// Add to tabs array
{ id: 'ai-generation', label: t('assets.aiGeneration'), icon: Wand2 }
```

**File:** `src/components/editor/panels/assets/index.tsx`

```typescript
import { AIGenerationView } from './views/ai-generation';

const viewMap: Record<Tab, React.ReactNode> = {
  // ... existing views
  'ai-generation': <AIGenerationView />,
};
```

#### Step 3.5: Add Translation Keys

**File:** `public/locales/en/translation.json`

```json
{
  "integrations": {
    "aiVideo": {
      "title": "AI Video Generation",
      "provider": "Provider",
      "openaiApiKey": "OpenAI API Key",
      "anthropicApiKey": "Anthropic API Key",
      "baseUrl": "API Base URL",
      "baseUrlHint": "Override for custom endpoints or proxies",
      "model": "Model"
    }
  },
  "assets": {
    "aiGeneration": "AI Generate"
  }
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/stores/integrations-store.ts` | Modify | Add AI provider fields |
| `src/components/editor/dialogs/integrations-dialog.tsx` | Modify | Add AI video config UI |
| `src/components/editor/panels/assets/views/ai-generation.tsx` | NEW | AI generation panel |
| `src/stores/assets-panel-store.ts` | Modify | Add ai-generation tab |
| `src/components/editor/panels/assets/tabbar.tsx` | Modify | Add AI tab button |
| `src/components/editor/panels/assets/index.tsx` | Modify | Add AI view to map |
| `public/locales/en/translation.json` | Modify | Add translation keys |

### Testing Checklist

- [ ] AI Generation tab appears in assets panel
- [ ] "Coming Soon" badge is visible
- [ ] API key fields save correctly in integrations store
- [ ] Warning message shows when no API key configured
- [ ] Generate button is disabled without API key
- [ ] Quick prompts populate the textarea

---

## Implementation Timeline

### Phase 1: Enhanced Animation System
**Priority:** High  
**Dependencies:** None

| Task | Description |
|------|-------------|
| 1.1 | Install `@remotion/core` package |
| 1.2 | Create animation utilities module |
| 1.3 | Extend animation types in timeline.ts |
| 1.4 | Update VisualNode animation logic |
| 1.5 | Update Animation Tab UI |
| 1.6 | Testing and QA |

### Phase 2: AI Integration UI
**Priority:** High  
**Dependencies:** None (UI only)

| Task | Description |
|------|-------------|
| 2.1 | Extend integrations store for AI providers |
| 2.2 | Update integrations dialog with AI video section |
| 2.3 | Create AI Generation panel UI |
| 2.4 | Add AI Generation tab to assets panel |
| 2.5 | Add translation keys |
| 2.6 | Testing and QA |

### Phase 3: Remotion Player (Optional)
**Priority:** Medium  
**Dependencies:** Phase 1

| Task | Description |
|------|-------------|
| 3.1 | Install `@remotion/player` package |
| 3.2 | Create timeline-to-composition converter |
| 3.3 | Create composition components |
| 3.4 | Create player wrapper component |
| 3.5 | Update preview panel |
| 3.6 | Testing and QA |

---

## Architecture Diagram

```mermaid
graph TB
    subgraph Prawn Editor
        A[Timeline Data]
        B[Assets Panel]
        C[Preview Panel]
        D[Integrations Dialog]
    end
    
    subgraph New Components
        E[Animation Utils]
        F[AI Generation View]
        G[Remotion Player Wrapper]
        H[Timeline Converter]
    end
    
    subgraph Remotion
        I[@remotion/core]
        J[@remotion/player]
    end
    
    subgraph External
        K[OpenAI API]
        L[Anthropic API]
    end
    
    A --> H
    A --> E
    B --> F
    C --> G
    D --> F
    
    E --> I
    G --> J
    H --> G
    
    F --> K
    F --> L
```

---

## Summary

This implementation plan covers three high-priority features:

1. **Enhanced Animation System** - Leverages Remotion's spring physics for more natural animations
2. **AI Integration UI** - Provides user interface for AI video generation with provider configuration
3. **Remotion Player** - Optional upgrade for better preview controls

The AI features are implemented with a "UI-first" approach, allowing users to configure their AI providers while the actual generation logic will be implemented in a future phase.
