// ---- Scene ----

export interface TScene {
	id: string;
	name: string;
	isMain: boolean;
	tracks: TimelineTrack[];
	bookmarks: number[];
	createdAt: Date;
	updatedAt: Date;
}

// ---- Track Types ----

export type TrackType = "video" | "text" | "audio" | "sticker";

interface BaseTrack {
	id: string;
	name: string;
}

export interface VideoTrack extends BaseTrack {
	type: "video";
	elements: (VideoElement | ImageElement)[];
	isMain: boolean;
	muted: boolean;
	hidden: boolean;
}

export interface TextTrack extends BaseTrack {
	type: "text";
	elements: TextElement[];
	hidden: boolean;
}

export interface AudioTrack extends BaseTrack {
	type: "audio";
	elements: AudioElement[];
	muted: boolean;
}

export interface StickerTrack extends BaseTrack {
	type: "sticker";
	elements: StickerElement[];
	hidden: boolean;
}

export type TimelineTrack = VideoTrack | TextTrack | AudioTrack | StickerTrack;

// ---- Shared: Transform ----

export interface Transform {
	scale: number;
	position: {
		x: number;
		y: number;
	};
	rotate: number;
	/** Flip horizontally (mirror on Y-axis). Default false. */
	flipX?: boolean;
	/** Flip vertically (mirror on X-axis). Default false. */
	flipY?: boolean;
}

// ---- Shared: Video/Image Filters ----

/** Color and light adjustment filters applied during canvas rendering. */
export interface VideoFilters {
	/** Brightness adjustment, -100 to 100. Maps to CSS brightness(). Default 0. */
	brightness: number;
	/** Contrast adjustment, -100 to 100. Maps to CSS contrast(). Default 0. */
	contrast: number;
	/** Saturation adjustment, -100 to 100. Maps to CSS saturate(). Default 0. */
	saturation: number;
	/** White overlay fade strength, 0 to 100. Drawn as a semi-transparent overlay. Default 0. */
	fade: number;
	/** Radial darkening around edges, 0 to 100. Drawn as a radial gradient overlay. Default 0. */
	vignette: number;
	/**
	 * Color temperature shift, -100 (cool/blue) to +100 (warm/yellow).
	 * Applied via per-pixel R/B channel shift. Default 0.
	 */
	temperature?: number;
	/**
	 * Color tint shift, -100 (green) to +100 (magenta).
	 * Applied via per-pixel G channel shift. Default 0.
	 */
	tint?: number;
	/**
	 * Highlight recovery/boost, -100 to +100.
	 * Affects pixels in the 192–255 luminance range. Default 0.
	 */
	highlights?: number;
	/**
	 * Shadow lift/crush, -100 to +100.
	 * Affects pixels in the 0–64 luminance range. Default 0.
	 */
	shadows?: number;
	/**
	 * White point clipping, -100 to +100.
	 * Shifts the upper end of the tone curve. Default 0.
	 */
	whites?: number;
	/**
	 * Black point clipping, -100 to +100.
	 * Shifts the lower end of the tone curve. Default 0.
	 */
	blacks?: number;
	/**
	 * Sharpening strength, 0 to 100.
	 * Applied via 3×3 unsharp mask convolution kernel. Default 0.
	 */
	sharpen?: number;
	/**
	 * Clarity (local contrast), 0 to 100.
	 * Applied as a high-radius, low-amount unsharp mask targeting midtones. Default 0.
	 */
	clarity?: number;
}

/** Default VideoFilters with all values at neutral. */
export const DEFAULT_VIDEO_FILTERS: VideoFilters = {
	brightness: 0,
	contrast: 0,
	saturation: 0,
	fade: 0,
	vignette: 0,
	temperature: 0,
	tint: 0,
	highlights: 0,
	shadows: 0,
	whites: 0,
	blacks: 0,
	sharpen: 0,
	clarity: 0,
};

// ---- Shared: Animations ----

/** Available clip entry/exit animation types. */
export type AnimationType =
	| "fade"
	| "slide-left"
	| "slide-right"
	| "slide-up"
	| "slide-down"
	| "zoom-in"
	| "zoom-out"
	| "spin"
	| "blur"           // Blur in/out effect
	| "rise"           // Rise up with fade
	| "fall"           // Fall down with fade
	| "breathe"        // Pulsing scale effect
	| "ken-burns-in"   // Ken Burns zoom in
	| "ken-burns-out"  // Ken Burns zoom out
	| "spring-bounce"  // Spring-based bounce animation
	| "spring-elastic" // Elastic spring animation
	| "spring-gentle"; // Gentle spring animation

/** Spring physics configuration for animations. */
export interface SpringConfig {
	/** Controls the damping of the spring. Higher = less oscillation. Default: 10 */
	damping?: number;
	/** Controls the stiffness of the spring. Higher = snappier. Default: 100 */
	stiffness?: number;
	/** The weight of the spring. Higher = slower animation. Default: 1 */
	mass?: number;
	/** Whether to clamp the overshoot. Default: false */
	overshootClamping?: boolean;
}

/** Easing type for animations. */
export type EasingType =
	| "linear"
	| "ease"
	| "ease-in"
	| "ease-out"
	| "ease-in-out"
	| "spring";

/** A single clip animation (in or out). */
export interface ClipAnimation {
	type: AnimationType;
	/** Duration of the animation in seconds. */
	duration: number;
	/** Intensity of the animation effect (used by blur, rise, fall). Default varies by type. */
	intensity?: number;
	/** Direction for directional animations. */
	direction?: "up" | "down" | "left" | "right";
	/** Spring configuration for spring-based animations. */
	springConfig?: SpringConfig;
	/** Easing type for the animation. */
	easing?: EasingType;
}

// ---- Audio Elements ----

interface BaseAudioElement extends BaseTimelineElement {
	type: "audio";
	volume: number;
	muted?: boolean;
	buffer?: AudioBuffer;
}

export interface UploadAudioElement extends BaseAudioElement {
	sourceType: "upload";
	mediaId: string;
}

export interface LibraryAudioElement extends BaseAudioElement {
	sourceType: "library";
	sourceUrl: string;
}

export type AudioElement = UploadAudioElement | LibraryAudioElement;

// ---- Base Timeline Element ----

interface BaseTimelineElement {
	id: string;
	name: string;
	duration: number;
	startTime: number;
	trimStart: number;
	trimEnd: number;
	/** Playback speed multiplier. Default 1.0. Values > 1 speed up, < 1 slow down. */
	speed?: number;
}

// ---- Video Element ----

export interface VideoElement extends BaseTimelineElement {
	type: "video";
	mediaId: string;
	muted?: boolean;
	hidden?: boolean;
	transform: Transform;
	opacity: number;
	/** Per-clip audio volume as a linear multiplier (0.0–2.0). Default 1.0. */
	volume?: number;
	/** Audio fade-in duration in seconds. Default 0. */
	fadeIn?: number;
	/** Audio fade-out duration in seconds. Default 0. */
	fadeOut?: number;
	/** Color/light filter adjustments applied in the renderer. */
	filters?: VideoFilters;
	/** Canvas 2D composite operation for layer blending. Default 'source-over'. */
	blendMode?: GlobalCompositeOperation;
	/** Entry animation applied at clip start. */
	animationIn?: ClipAnimation;
	/** Exit animation applied at clip end. */
	animationOut?: ClipAnimation;
}

// ---- Image Element ----

export interface ImageElement extends BaseTimelineElement {
	type: "image";
	mediaId: string;
	hidden?: boolean;
	transform: Transform;
	opacity: number;
	/** Color/light filter adjustments applied in the renderer. */
	filters?: VideoFilters;
	/** Canvas 2D composite operation for layer blending. Default 'source-over'. */
	blendMode?: GlobalCompositeOperation;
	/** Entry animation applied at clip start. */
	animationIn?: ClipAnimation;
	/** Exit animation applied at clip end. */
	animationOut?: ClipAnimation;
}

// ---- Text Effects ----

/** Text-specific animation effect types. */
export type TextEffectType =
	// Reveal effects (Priority 1)
	| "typewriter"      // Character-by-character reveal
	| "stream-word"     // Word-by-word reveal
	| "fade-char"       // Fade characters sequentially
	| "fade-word"       // Fade words sequentially
	// Motion effects (Priority 2)
	| "elastic"         // Bouncy scale effect
	| "bounce"          // Drop bounce effect
	| "wave"            // Wave motion effect
	// Style effects (Priority 3)
	| "glitch"          // Glitch/distort effect
	| "neon-glow"       // Neon glow pulse
	| "outline-draw";   // Outline drawing effect

/** A text effect configuration. */
export interface TextEffect {
	/** Type of text effect. */
	type: TextEffectType;
	/** Duration of the effect in seconds. */
	duration: number;
	/** Intensity of the effect (0-100). Default varies by type. */
	intensity?: number;
	/** Delay between characters/words in ms. Used by typewriter, stream-word, etc. */
	delay?: number;
	/** Whether the effect should loop continuously. For wave, neon-glow, etc. */
	loop?: boolean;
}

/** Text shadow configuration. */
export interface TextShadow {
	/** Horizontal offset in pixels. */
	offsetX: number;
	/** Vertical offset in pixels. */
	offsetY: number;
	/** Blur radius in pixels. */
	blur: number;
	/** Shadow color. */
	color: string;
}

/** Default text effect with neutral values. */
export const DEFAULT_TEXT_EFFECT: TextEffect = {
	type: "typewriter",
	duration: 1,
	intensity: 50,
	delay: 50,
	loop: false,
};

// ---- Text Element ----

export interface TextElement extends BaseTimelineElement {
	type: "text";
	content: string;
	fontSize: number;
	fontFamily: string;
	color: string;
	backgroundColor: string;
	textAlign: "left" | "center" | "right";
	fontWeight: "normal" | "bold";
	fontStyle: "normal" | "italic";
	textDecoration: "none" | "underline" | "line-through";
	hidden?: boolean;
	transform: Transform;
	opacity: number;
	/** Text effect applied on entry. */
	textEffectIn?: TextEffect;
	/** Text effect applied on exit. */
	textEffectOut?: TextEffect;
	/** Continuous text animation (wave, glow). */
	textAnimation?: TextEffect;
	/** Letter spacing in pixels. */
	letterSpacing?: number;
	/** Line height multiplier. */
	lineHeight?: number;
	/** Text shadow configuration. */
	textShadow?: TextShadow;
}

// ---- Sticker Element ----

export interface StickerElement extends BaseTimelineElement {
	type: "sticker";
	iconName: string;
	hidden?: boolean;
	transform: Transform;
	opacity: number;
	color?: string;
}

// ---- Union Types ----

export type TimelineElement =
	| AudioElement
	| VideoElement
	| ImageElement
	| TextElement
	| StickerElement;

export type ElementType = TimelineElement["type"];

// ---- Create helpers (Omit id) ----

export type CreateUploadAudioElement = Omit<UploadAudioElement, "id">;
export type CreateLibraryAudioElement = Omit<LibraryAudioElement, "id">;
export type CreateAudioElement =
	| CreateUploadAudioElement
	| CreateLibraryAudioElement;
export type CreateVideoElement = Omit<VideoElement, "id">;
export type CreateImageElement = Omit<ImageElement, "id">;
export type CreateTextElement = Omit<TextElement, "id">;
export type CreateStickerElement = Omit<StickerElement, "id">;
export type CreateTimelineElement =
	| CreateAudioElement
	| CreateVideoElement
	| CreateImageElement
	| CreateTextElement
	| CreateStickerElement;

// ---- Drag State ----

export interface ElementDragState {
	isDragging: boolean;
	elementId: string | null;
	trackId: string | null;
	startMouseX: number;
	startMouseY: number;
	startElementTime: number;
	clickOffsetTime: number;
	currentTime: number;
	currentMouseY: number;
}

export interface DropTarget {
	trackIndex: number;
	isNewTrack: boolean;
	insertPosition: "above" | "below" | null;
	xPosition: number;
}

export interface ComputeDropTargetParams {
	elementType: ElementType;
	mouseX: number;
	mouseY: number;
	tracks: TimelineTrack[];
	playheadTime: number;
	isExternalDrop: boolean;
	elementDuration: number;
	pixelsPerSecond: number;
	zoomLevel: number;
	verticalDragDirection?: "up" | "down" | null;
	startTimeOverride?: number;
	excludeElementId?: string;
}

export interface ClipboardItem {
	trackId: string;
	trackType: TrackType;
	element: CreateTimelineElement;
}
