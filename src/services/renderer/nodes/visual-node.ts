import type { CanvasRenderer } from "../canvas-renderer";
import { BaseNode } from "./base-node";
import type { AnimationType, ClipAnimation, Transform, VideoFilters, SpringConfig } from "@/types/timeline";
import { spring, interpolate, Easing, SpringPresets } from "@/lib/animation/remotion-animations";

/** Small epsilon to avoid off-by-one frame visibility bugs. */
const VISUAL_EPSILON = 1 / 1000;

export interface VisualNodeParams {
	duration: number;
	timeOffset: number;
	trimStart: number;
	trimEnd: number;
	transform: Transform;
	opacity: number;
	/** Playback speed multiplier. Default 1.0. */
	speed?: number;
	/** Color / light filters to apply via Canvas 2D CSS filter. */
	filters?: VideoFilters;
	/** Canvas 2D compositing operation. Default 'source-over'. */
	blendMode?: GlobalCompositeOperation;
	/** Entry animation applied at clip start. */
	animationIn?: ClipAnimation;
	/** Exit animation applied at clip end. */
	animationOut?: ClipAnimation;
}

/** Intermediate transform overrides produced by an animation frame calculation. */
interface AnimOverride {
	opacityMultiplier: number;
	translateX: number;
	translateY: number;
	scaleMultiplier: number;
	rotateExtra: number;
	/** Blur amount in pixels for blur animation. */
	blurAmount: number;
}

const ANIM_NEUTRAL: AnimOverride = {
	opacityMultiplier: 1,
	translateX: 0,
	translateY: 0,
	scaleMultiplier: 1,
	rotateExtra: 0,
	blurAmount: 0,
};

/**
 * Apply a 3x3 convolution kernel to the image data in the given region.
 * Reads from the canvas, writes back the convolved result.
 * Border pixels (1px edge) are left unchanged.
 */
type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function applyConvolution(
	ctx: Ctx2D,
	x: number,
	y: number,
	w: number,
	h: number,
	kernel: number[],
): void {
	const src = ctx.getImageData(x, y, w, h);
	const dst = ctx.createImageData(w, h);
	const s = src.data;
	const d = dst.data;

	for (let row = 1; row < h - 1; row++) {
		for (let col = 1; col < w - 1; col++) {
			const idx = (row * w + col) * 4;
			for (let c = 0; c < 3; c++) {
				let sum = 0;
				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						const ki = (ky + 1) * 3 + (kx + 1);
						const si = ((row + ky) * w + (col + kx)) * 4 + c;
						sum += s[si] * kernel[ki];
					}
				}
				d[idx + c] = Math.max(0, Math.min(255, Math.round(sum)));
			}
			d[idx + 3] = s[idx + 3]; // preserve alpha
		}
	}
	ctx.putImageData(dst, x, y);
}

export abstract class VisualNode<
	Params extends VisualNodeParams = VisualNodeParams,
> extends BaseNode<Params> {
	/**
	 * Convert global timeline time → local media time, accounting for
	 * speed multiplier so that e.g. 2× speed sees the media at 2× rate.
	 */
	protected getLocalTime(time: number): number {
		const speed = this.params.speed ?? 1;
		// Offset from clip start, multiplied by speed, then offset by trimStart
		return (time - this.params.timeOffset) * speed + this.params.trimStart;
	}

	/**
	 * Returns true when the global timeline time falls inside this clip's
	 * visible range (trimStart … trimStart + duration).
	 */
	protected isInRange(time: number): boolean {
		const localTime = this.getLocalTime(time);
		return (
			localTime >= this.params.trimStart - VISUAL_EPSILON &&
			localTime < this.params.trimStart + this.params.duration
		);
	}

	/**
	 * Calculate the animation transform override for the current local time.
	 * Returns ANIM_NEUTRAL when no animation applies.
	 */
	private getAnimOverride(localTime: number): AnimOverride {
		const { animationIn, animationOut, duration, trimStart } = this.params;
		const relTime = localTime - trimStart; // time relative to clip start (0 … duration)

		// ---- In animation ----
		if (animationIn && animationIn.duration > 0 && relTime < animationIn.duration) {
			// t goes from 0 (at start) to 1 (when in-animation ends)
			const t = Math.max(0, Math.min(1, relTime / animationIn.duration));
			return this.computeAnimFrame(animationIn.type, t, animationIn);
		}

		// ---- Out animation ----
		if (animationOut && animationOut.duration > 0) {
			const outStart = duration - animationOut.duration;
			if (relTime >= outStart) {
				// t goes from 0 (when out starts) to 1 (at clip end)
				const t = Math.max(0, Math.min(1, (relTime - outStart) / animationOut.duration));
				// Out = reverse of in (t=1 means fully gone)
				return this.computeAnimFrame(animationOut.type, 1 - t, animationOut);
			}
		}

		return ANIM_NEUTRAL;
	}

	/**
	 * Map an animation type + progress `t` (0→1 = entering, fully visible)
	 * to an AnimOverride object.
	 */
	private computeAnimFrame(type: AnimationType, t: number, animation?: ClipAnimation): AnimOverride {
		// Check for spring-based animations
		if (type.startsWith('spring-')) {
			return this.computeSpringAnimFrame(type, t, animation);
		}

		// Apply easing based on animation config or default
		const eased = this.applyEasing(t, animation);

		switch (type) {
			case "fade":
				return { ...ANIM_NEUTRAL, opacityMultiplier: eased };

			case "slide-left":
				// Slides in from the left (negative X) to center
				return { ...ANIM_NEUTRAL, translateX: (1 - eased) * -300, opacityMultiplier: eased };

			case "slide-right":
				return { ...ANIM_NEUTRAL, translateX: (1 - eased) * 300, opacityMultiplier: eased };

			case "slide-up":
				return { ...ANIM_NEUTRAL, translateY: (1 - eased) * -300, opacityMultiplier: eased };

			case "slide-down":
				return { ...ANIM_NEUTRAL, translateY: (1 - eased) * 300, opacityMultiplier: eased };

			case "zoom-in":
				// Scales from 0 to 1 while fading in
				return { ...ANIM_NEUTRAL, scaleMultiplier: eased, opacityMultiplier: eased };

			case "zoom-out":
				// Scales from 2 down to 1 while fading in
				return { ...ANIM_NEUTRAL, scaleMultiplier: 1 + (1 - eased), opacityMultiplier: eased };

			case "spin":
				// Spins in from -180° to 0° while fading
				return { ...ANIM_NEUTRAL, rotateExtra: (1 - eased) * -180, opacityMultiplier: eased };

			// ---- New animations ported from Twick ----

			case "blur":
				// Blurs in/out: starts blurred, becomes clear (or vice versa for exit)
				// Default intensity: 20px blur
				return {
					...ANIM_NEUTRAL,
					opacityMultiplier: eased,
					blurAmount: (1 - eased) * 20,
				};

			case "rise":
				// Rises up from below while fading in
				// Default intensity: 200px vertical offset
				return {
					...ANIM_NEUTRAL,
					translateY: (1 - eased) * 200,
					opacityMultiplier: eased,
				};

			case "fall":
				// Falls down from above while fading in
				// Default intensity: 200px vertical offset
				return {
					...ANIM_NEUTRAL,
					translateY: (1 - eased) * -200,
					opacityMultiplier: eased,
				};

			case "breathe":
				// Pulsing scale effect - oscillates between 0.95 and 1.05
				// Uses sine wave for smooth oscillation
				const breatheScale = 1 + Math.sin(t * Math.PI * 2) * 0.05;
				return {
					...ANIM_NEUTRAL,
					scaleMultiplier: breatheScale,
				};

			case "ken-burns-in":
				// Ken Burns zoom in effect: slowly zooms from 1.0 to 1.15
				// No opacity change - continuous effect
				return {
					...ANIM_NEUTRAL,
					scaleMultiplier: 1 + eased * 0.15,
				};

			case "ken-burns-out":
				// Ken Burns zoom out effect: slowly zooms from 1.15 to 1.0
				// No opacity change - continuous effect
				return {
					...ANIM_NEUTRAL,
					scaleMultiplier: 1.15 - eased * 0.15,
				};

			default:
				return ANIM_NEUTRAL;
		}
	}

	/**
	 * Compute spring-based animation frame.
	 * Uses physics-based spring calculations for natural motion.
	 */
	private computeSpringAnimFrame(type: AnimationType, t: number, animation?: ClipAnimation): AnimOverride {
		// Get spring config from animation or use preset
		const springConfig = animation?.springConfig ?? this.getSpringPreset(type);
		
		// Calculate frame number based on progress (t is 0-1, we need actual frame)
		// Assuming 30fps reference for spring calculation
		const fps = 30;
		const durationInFrames = Math.round((animation?.duration ?? 0.4) * fps);
		const frame = Math.round(t * durationInFrames);

		// Calculate spring value
		const springValue = spring({
			frame,
			fps,
			config: springConfig,
		});

		switch (type) {
			case "spring-bounce":
				// Bouncy spring with scale and opacity
				return {
					...ANIM_NEUTRAL,
					scaleMultiplier: springValue,
					opacityMultiplier: Math.min(1, springValue * 1.2),
				};

			case "spring-elastic":
				// Elastic spring with overshoot
				return {
					...ANIM_NEUTRAL,
					scaleMultiplier: springValue,
					opacityMultiplier: interpolate(springValue, [0, 0.5, 1], [0, 0.8, 1], {
						extrapolateRight: 'clamp',
					}),
				};

			case "spring-gentle":
				// Gentle spring with smooth motion
				return {
					...ANIM_NEUTRAL,
					opacityMultiplier: springValue,
					translateY: interpolate(springValue, [0, 1], [50, 0], {
						extrapolateRight: 'clamp',
					}),
				};

			default:
				return ANIM_NEUTRAL;
		}
	}

	/**
	 * Get spring preset based on animation type.
	 */
	private getSpringPreset(type: AnimationType): SpringConfig {
		switch (type) {
			case "spring-bounce":
				return SpringPresets.bouncy;
			case "spring-elastic":
				return SpringPresets.snappy;
			case "spring-gentle":
				return SpringPresets.gentle;
			default:
				return SpringPresets.default;
		}
	}

	/**
	 * Apply easing function based on animation config.
	 */
	private applyEasing(t: number, animation?: ClipAnimation): number {
		const easingType = animation?.easing ?? 'ease-out';
		
		switch (easingType) {
			case 'linear':
				return t;
			case 'ease':
				return Easing.ease(t);
			case 'ease-in':
				return Easing.easeIn(t);
			case 'ease-out':
				return Easing.easeOut(t);
			case 'ease-in-out':
				return Easing.easeInOut(t);
			case 'spring':
				// Spring easing is handled separately in computeSpringAnimFrame
				return Easing.easeOut(t);
			default:
				// Default: cubic ease-out
				return 1 - Math.pow(1 - t, 3);
		}
	}

	/**
	 * Build a Canvas 2D CSS filter string from a VideoFilters object.
	 * Uses the supported CSS filter functions available on CanvasRenderingContext2D.
	 *
	 * Mapping:
	 *   brightness: -100…+100  → CSS brightness(0…2) where 0 = neutral
	 *   contrast:   -100…+100  → CSS contrast(0…2)
	 *   saturation: -100…+100  → CSS saturate(0…2)
	 */
	private buildCssFilter(filters: VideoFilters): string {
		const brightness = 1 + filters.brightness / 100; // -100→0, 0→1, 100→2
		const contrast = 1 + filters.contrast / 100;
		const saturation = 1 + filters.saturation / 100;

		const parts: string[] = [];
		if (Math.abs(filters.brightness) > 0) parts.push(`brightness(${brightness})`);
		if (Math.abs(filters.contrast) > 0) parts.push(`contrast(${contrast})`);
		if (Math.abs(filters.saturation) > 0) parts.push(`saturate(${saturation})`);

		return parts.length > 0 ? parts.join(" ") : "none";
	}

	/**
	 * Apply pixel-level filters (temperature, tint, tone curve, sharpen, clarity)
	 * using Canvas 2D getImageData / putImageData.
	 *
	 * Sharpen and clarity convolutions are applied first (before the LUT pass)
	 * so that the tone/colour adjustments are applied to the already-sharpened pixels.
	 */
	private applyPixelFilters(
		ctx: Ctx2D,
		x: number,
		y: number,
		w: number,
		h: number,
		filters: VideoFilters,
	): void {
		// Guard: skip if region is too small for convolution
		if (w < 3 || h < 3) return;

		// ---- Sharpen convolution (unsharp mask, 3×3) ----
		if ((filters.sharpen ?? 0) > 0) {
			const strength = (filters.sharpen ?? 0) / 100; // 0-1
			const s = strength * 0.5; // scale down to avoid over-sharpening
			const kernel = [-s, -s, -s, -s, 1 + 8 * s, -s, -s, -s, -s];
			applyConvolution(ctx, x, y, w, h, kernel);
		}

		// ---- Clarity convolution (large-radius unsharp mask approximation) ----
		if ((filters.clarity ?? 0) > 0) {
			const clarityStrength = ((filters.clarity ?? 0) / 100) * 0.3;
			const s = clarityStrength;
			const kernel = [-s / 4, -s / 4, -s / 4, -s / 4, 1 + 2 * s, -s / 4, -s / 4, -s / 4, -s / 4];
			applyConvolution(ctx, x, y, w, h, kernel);
		}

		// ---- Build per-channel LUTs (0-255 → 0-255) ----
		const rLUT = new Uint8Array(256);
		const gLUT = new Uint8Array(256);
		const bLUT = new Uint8Array(256);

		const temp = (filters.temperature ?? 0) / 100; // -1 to +1
		const tint = (filters.tint ?? 0) / 100;        // -1 to +1
		const hi   = (filters.highlights ?? 0) / 100;  // -1 to +1
		const sh   = (filters.shadows ?? 0) / 100;     // -1 to +1
		const wh   = (filters.whites ?? 0) / 100;      // -1 to +1
		const bl   = (filters.blacks ?? 0) / 100;      // -1 to +1

		for (let i = 0; i < 256; i++) {
			const t = i / 255; // normalised 0-1

			// Tone curve: blacks lift/crush + whites clip
			const toneMin = bl * 0.15;          // blacks shift (0.15 = max 38/255 shift)
			const toneMax = 1.0 - wh * -0.15;   // whites shift
			let toned = toneMin + t * (toneMax - toneMin);

			// Highlights: boost/cut values in 0.75-1.0 range
			const hiMask = Math.max(0, (t - 0.75) / 0.25); // 0 below 0.75, 1 at 1.0
			toned += hi * 0.3 * hiMask;

			// Shadows: boost/cut values in 0.0-0.25 range
			const shMask = Math.max(0, (0.25 - t) / 0.25); // 1 at 0, 0 above 0.25
			toned += sh * 0.3 * shMask;

			toned = Math.max(0, Math.min(1, toned));
			const base = Math.round(toned * 255);

			// Temperature: warm = +R, -B; cool = -R, +B
			// Tint: magenta = +R, -G; green = -R, +G (simplified: just G channel)
			rLUT[i] = Math.max(0, Math.min(255, base + Math.round(temp * 30)));
			gLUT[i] = Math.max(0, Math.min(255, base - Math.round(tint * 15)));
			bLUT[i] = Math.max(0, Math.min(255, base - Math.round(temp * 30)));
		}

		// ---- Apply LUT to every pixel ----
		const imageData = ctx.getImageData(x, y, w, h);
		const data = imageData.data;
		for (let p = 0; p < data.length; p += 4) {
			data[p]     = rLUT[data[p]];      // R
			data[p + 1] = gLUT[data[p + 1]];  // G
			data[p + 2] = bLUT[data[p + 2]];  // B
			// data[p + 3] = alpha (unchanged)
		}
		ctx.putImageData(imageData, x, y);
	}

	/**
	 * Core rendering method: applies transform, opacity, blend mode, CSS filters,
	 * animation overrides, fade overlay, and vignette overlay.
	 */
	protected renderVisual({
		renderer,
		source,
		sourceWidth,
		sourceHeight,
	}: {
		renderer: CanvasRenderer;
		source: CanvasImageSource;
		sourceWidth: number;
		sourceHeight: number;
	}): void {
		renderer.context.save();

		const { transform, opacity, filters, blendMode, animationIn, animationOut } = this.params;

		// ---- Compute layout geometry ----
		const containScale = Math.min(
			renderer.width / sourceWidth,
			renderer.height / sourceHeight,
		);
		const scaledWidth = sourceWidth * containScale * transform.scale;
		const scaledHeight = sourceHeight * containScale * transform.scale;
		const x = renderer.width / 2 + transform.position.x - scaledWidth / 2;
		const y = renderer.height / 2 + transform.position.y - scaledHeight / 2;
		const centerX = x + scaledWidth / 2;
		const centerY = y + scaledHeight / 2;

		// ---- Get animation override for current time ----
		// We need the local time to sample animations; read it from the element's
		// stored timeOffset. The caller (video/image node render) has already
		// confirmed we're in range, so we pass the current renderer state via params.
		// We store currentTime on the context as a workaround — see render() in subclasses.
		const anim = (animationIn || animationOut)
			? this.getAnimOverride(this._currentLocalTime)
			: ANIM_NEUTRAL;

		// ---- Apply blend mode ----
		renderer.context.globalCompositeOperation = blendMode ?? "source-over";

		// ---- Apply CSS filters (brightness, contrast, saturation, blur) ----
		let cssFilter = "none";
		if (filters) {
			cssFilter = this.buildCssFilter(filters);
		}
		// Add blur from animation if present
		if (anim.blurAmount > 0) {
			const blurPart = `blur(${anim.blurAmount}px)`;
			cssFilter = cssFilter === "none" ? blurPart : `${cssFilter} ${blurPart}`;
		}
		if (cssFilter !== "none") {
			renderer.context.filter = cssFilter;
		}

		// ---- Apply global opacity (element opacity × animation opacity) ----
		renderer.context.globalAlpha = (opacity ?? 1) * anim.opacityMultiplier;

		// ---- Apply rotation (element rotation + animation rotation) ----
		const totalRotate = (transform.rotate ?? 0) + anim.rotateExtra;
		if (totalRotate !== 0) {
			renderer.context.translate(centerX, centerY);
			renderer.context.rotate((totalRotate * Math.PI) / 180);
			renderer.context.translate(-centerX, -centerY);
		}

		// ---- Apply animation translate + scale offsets ----
		const animTranslateX = anim.translateX;
		const animTranslateY = anim.translateY;
		const animScale = anim.scaleMultiplier;

		const finalX = x + animTranslateX + centerX * (1 - animScale);
		const finalY = y + animTranslateY + centerY * (1 - animScale);
		const finalW = scaledWidth * animScale;
		const finalH = scaledHeight * animScale;

		// ---- Draw the media ----
		renderer.context.drawImage(source, finalX, finalY, finalW, finalH);

		// ---- Reset filter after drawing (before overlays) ----
		renderer.context.filter = "none";

		// ---- Apply pixel-level filters (temperature, tint, tone curve, sharpen, clarity) ----
		const needsPixelFilters = (
			(filters?.temperature ?? 0) !== 0 ||
			(filters?.tint ?? 0) !== 0 ||
			(filters?.highlights ?? 0) !== 0 ||
			(filters?.shadows ?? 0) !== 0 ||
			(filters?.whites ?? 0) !== 0 ||
			(filters?.blacks ?? 0) !== 0 ||
			(filters?.sharpen ?? 0) !== 0 ||
			(filters?.clarity ?? 0) !== 0
		);
		if (needsPixelFilters && filters) {
			this.applyPixelFilters(
				renderer.context,
				Math.round(finalX),
				Math.round(finalY),
				Math.round(finalW),
				Math.round(finalH),
				filters,
			);
		}

		// ---- Fade overlay: semi-transparent white rect ----
		if (filters && filters.fade > 0) {
			renderer.context.globalCompositeOperation = "source-over";
			renderer.context.globalAlpha = (filters.fade / 100) * anim.opacityMultiplier;
			renderer.context.fillStyle = "white";
			renderer.context.fillRect(finalX, finalY, finalW, finalH);
		}

		// ---- Vignette overlay: radial gradient darkening the edges ----
		if (filters && filters.vignette > 0) {
			renderer.context.globalCompositeOperation = "source-over";
			renderer.context.globalAlpha = anim.opacityMultiplier;
			const vigCx = finalX + finalW / 2;
			const vigCy = finalY + finalH / 2;
			const innerRadius = Math.min(finalW, finalH) * 0.3;
			const outerRadius = Math.max(finalW, finalH) * 0.7;
			const grad = renderer.context.createRadialGradient(
				vigCx, vigCy, innerRadius,
				vigCx, vigCy, outerRadius,
			);
			grad.addColorStop(0, "rgba(0,0,0,0)");
			grad.addColorStop(1, `rgba(0,0,0,${filters.vignette / 100})`);
			renderer.context.fillStyle = grad;
			renderer.context.fillRect(finalX, finalY, finalW, finalH);
		}

		// ---- Restore state ----
		renderer.context.restore();
	}

	/**
	 * Local time at the last render call — used by renderVisual to sample animations.
	 * Subclasses must set this before calling renderVisual.
	 */
	protected _currentLocalTime = 0;
}
