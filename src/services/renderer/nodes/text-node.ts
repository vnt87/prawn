import type { CanvasRenderer } from "../canvas-renderer";
import { BaseNode } from "./base-node";
import type { TextElement, TextEffect, TextEffectType, TextShadow } from "@/types/timeline";
import { FONT_SIZE_SCALE_REFERENCE } from "@/constants/text-constants";

/**
 * Scale font size based on canvas height.
 */
function scaleFontSize({
	fontSize,
	canvasHeight,
}: {
	fontSize: number;
	canvasHeight: number;
}): number {
	return fontSize * (canvasHeight / FONT_SIZE_SCALE_REFERENCE);
}

/**
 * Split text into characters for character-level effects.
 */
function splitIntoChars(text: string): string[] {
	return text.split("");
}

/**
 * Split text into words for word-level effects.
 */
function splitIntoWords(text: string): string[] {
	return text.split(" ").map((word, i, arr) =>
		i < arr.length - 1 ? word + " " : word
	);
}

/**
 * Easing functions for animations.
 */
const easings = {
	linear: (t: number) => t,
	easeIn: (t: number) => t * t,
	easeOut: (t: number) => t * (2 - t),
	easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
	elastic: (t: number) => {
		const c4 = (2 * Math.PI) / 3;
		return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
	},
	bounce: (t: number) => {
		const n1 = 7.5625;
		const d1 = 2.75;
		if (t < 1 / d1) return n1 * t * t;
		if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
		if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
		return n1 * (t -= 2.625 / d1) * t + 0.984375;
	},
};

/**
 * Compute typewriter effect - reveals characters one by one.
 */
function computeTypewriterEffect(
	text: string,
	progress: number,
	delay: number
): { visibleChars: number } {
	const chars = splitIntoChars(text);
	const totalChars = chars.length;
	const effectiveDuration = (totalChars * delay) / 1000;
	const charProgress = progress * totalChars;
	return { visibleChars: Math.min(Math.floor(charProgress), totalChars) };
}

/**
 * Compute stream-word effect - reveals words one by one.
 */
function computeStreamWordEffect(
	text: string,
	progress: number,
	delay: number
): { visibleWords: number } {
	const words = splitIntoWords(text);
	const totalWords = words.length;
	const wordProgress = progress * totalWords;
	return { visibleWords: Math.min(Math.floor(wordProgress), totalWords) };
}

/**
 * Compute fade-character effect - fades in characters sequentially.
 */
function computeFadeCharEffect(
	text: string,
	progress: number,
	delay: number
): { charOpacities: number[] } {
	const chars = splitIntoChars(text);
	const totalChars = chars.length;
	const charOpacities: number[] = [];

	for (let i = 0; i < totalChars; i++) {
		const charStart = i / totalChars;
		const charEnd = (i + 1) / totalChars;
		const charProgress = Math.max(0, Math.min(1, (progress - charStart) / (charEnd - charStart)));
		charOpacities.push(charProgress);
	}

	return { charOpacities };
}

/**
 * Compute fade-word effect - fades in words sequentially.
 */
function computeFadeWordEffect(
	text: string,
	progress: number,
	delay: number
): { wordOpacities: number[] } {
	const words = splitIntoWords(text);
	const totalWords = words.length;
	const wordOpacities: number[] = [];

	for (let i = 0; i < totalWords; i++) {
		const wordStart = i / totalWords;
		const wordEnd = (i + 1) / totalWords;
		const wordProgress = Math.max(0, Math.min(1, (progress - wordStart) / (wordEnd - wordStart)));
		wordOpacities.push(wordProgress);
	}

	return { wordOpacities };
}

/**
 * Compute elastic effect - bouncy scale animation.
 */
function computeElasticEffect(progress: number, intensity: number): { scale: number } {
	const elasticProgress = easings.elastic(progress);
	const scale = 1 + (elasticProgress - 1) * (intensity / 100);
	return { scale };
}

/**
 * Compute bounce effect - drop and bounce animation.
 */
function computeBounceEffect(progress: number, intensity: number): { translateY: number; scale: number } {
	if (progress < 0.5) {
		// Drop phase
		const dropProgress = progress * 2;
		const translateY = -100 * (1 - dropProgress) * (intensity / 100);
		return { translateY, scale: 1 + dropProgress * 0.1 };
	} else {
		// Bounce phase
		const bounceProgress = (progress - 0.5) * 2;
		const bounceValue = easings.bounce(bounceProgress);
		const translateY = -30 * (1 - bounceValue) * (intensity / 100);
		return { translateY, scale: 1 - (1 - bounceValue) * 0.1 };
	}
}

/**
 * Compute wave effect - continuous wave motion.
 */
function computeWaveEffect(
	text: string,
	time: number,
	intensity: number,
	loop: boolean
): { charOffsets: number[] } {
	const chars = splitIntoChars(text);
	const charOffsets: number[] = [];
	const waveSpeed = 2;
	const waveAmplitude = (intensity / 100) * 20;

	for (let i = 0; i < chars.length; i++) {
		const phase = i * 0.3;
		const offset = Math.sin(time * waveSpeed + phase) * waveAmplitude;
		charOffsets.push(offset);
	}

	return { charOffsets };
}

/**
 * Compute glitch effect - digital distortion.
 */
function computeGlitchEffect(progress: number, intensity: number): { offsetX: number; glitchActive: boolean } {
	const glitchChance = intensity / 100;
	const glitchActive = Math.random() < glitchChance && progress < 0.8;
	const offsetX = glitchActive ? (Math.random() - 0.5) * 10 * (intensity / 100) : 0;
	return { offsetX, glitchActive };
}

/**
 * Compute neon-glow effect - pulsing glow.
 */
function computeNeonGlowEffect(time: number, intensity: number): { glowIntensity: number } {
	const pulse = (Math.sin(time * 3) + 1) / 2;
	const glowIntensity = 0.5 + pulse * (intensity / 100);
	return { glowIntensity };
}

/**
 * Compute outline-draw effect - drawing the outline.
 */
function computeOutlineDrawEffect(progress: number): { strokeProgress: number } {
	return { strokeProgress: progress };
}

export type TextNodeParams = TextElement & {
	canvasCenter: { x: number; y: number };
	canvasHeight: number;
	textBaseline?: CanvasTextBaseline;
};

export class TextNode extends BaseNode<TextNodeParams> {
	isInRange({ time }: { time: number }) {
		return (
			time >= this.params.startTime &&
			time < this.params.startTime + this.params.duration
		);
	}

	/**
	 * Compute effect progress based on element time and effect duration.
	 */
	private computeEffectProgress(
		time: number,
		effect: TextEffect | undefined,
		isExit: boolean = false
	): number {
		if (!effect) return 1;

		const elementStart = this.params.startTime;
		const elementEnd = elementStart + this.params.duration;
		const effectDuration = effect.duration;

		if (isExit) {
			// Exit effect plays at the end
			const effectStart = elementEnd - effectDuration;
			if (time < effectStart) return 0;
			if (time > elementEnd) return 1;
			return (time - effectStart) / effectDuration;
		} else {
			// Entry effect plays at the start
			if (time < elementStart) return 0;
			if (time > elementStart + effectDuration) return 1;
			return (time - elementStart) / effectDuration;
		}
	}

	/**
	 * Apply text shadow to the context.
	 */
	private applyTextShadow(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, shadow: TextShadow | undefined) {
		if (!shadow) {
			ctx.shadowColor = "transparent";
			ctx.shadowBlur = 0;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			return;
		}

		ctx.shadowColor = shadow.color;
		ctx.shadowBlur = shadow.blur;
		ctx.shadowOffsetX = shadow.offsetX;
		ctx.shadowOffsetY = shadow.offsetY;
	}

	/**
	 * Render text with an entry effect.
	 */
	private renderWithEntryEffect(
		ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
		content: string,
		x: number,
		y: number,
		effect: TextEffect,
		progress: number
	) {
		const delay = effect.delay ?? 50;
		const intensity = effect.intensity ?? 50;

		switch (effect.type) {
			case "typewriter": {
				const { visibleChars } = computeTypewriterEffect(content, progress, delay);
				const visibleText = content.slice(0, visibleChars);
				ctx.fillText(visibleText, x, y);
				break;
			}

			case "stream-word": {
				const { visibleWords } = computeStreamWordEffect(content, progress, delay);
				const words = splitIntoWords(content);
				const visibleText = words.slice(0, visibleWords).join("");
				ctx.fillText(visibleText, x, y);
				break;
			}

			case "fade-char": {
				const { charOpacities } = computeFadeCharEffect(content, progress, delay);
				const chars = splitIntoChars(content);
				this.renderCharactersIndividually(ctx, chars, x, y, charOpacities);
				break;
			}

			case "fade-word": {
				const { wordOpacities } = computeFadeWordEffect(content, progress, delay);
				const words = splitIntoWords(content);
				this.renderWordsIndividually(ctx, words, x, y, wordOpacities);
				break;
			}

			case "elastic": {
				const { scale } = computeElasticEffect(progress, intensity);
				ctx.save();
				ctx.scale(scale, scale);
				ctx.fillText(content, x / scale, y / scale);
				ctx.restore();
				break;
			}

			case "bounce": {
				const { translateY, scale } = computeBounceEffect(progress, intensity);
				ctx.save();
				ctx.translate(0, translateY);
				ctx.scale(scale, scale);
				ctx.fillText(content, x, y);
				ctx.restore();
				break;
			}

			case "glitch": {
				const { offsetX, glitchActive } = computeGlitchEffect(progress, intensity);
				if (glitchActive) {
					// Render glitch layers
					ctx.save();
					ctx.globalAlpha = 0.5;
					ctx.fillStyle = "#ff0000";
					ctx.fillText(content, x + offsetX, y);
					ctx.fillStyle = "#00ffff";
					ctx.fillText(content, x - offsetX, y);
					ctx.restore();
				}
				ctx.fillText(content, x, y);
				break;
			}

			case "neon-glow": {
				const { glowIntensity } = computeNeonGlowEffect(progress, intensity);
				ctx.save();
				ctx.shadowColor = this.params.color;
				ctx.shadowBlur = 20 * glowIntensity;
				ctx.fillText(content, x, y);
				ctx.restore();
				break;
			}

			case "outline-draw": {
				const { strokeProgress } = computeOutlineDrawEffect(progress);
				if (strokeProgress < 1) {
					// Draw partial stroke
					ctx.save();
					ctx.strokeStyle = this.params.color;
					ctx.lineWidth = 2;
					ctx.setLineDash([content.length * 10 * strokeProgress, content.length * 10]);
					ctx.strokeText(content, x, y);
					ctx.restore();
				}
				if (strokeProgress > 0.5) {
					ctx.globalAlpha = (strokeProgress - 0.5) * 2;
					ctx.fillText(content, x, y);
				}
				break;
			}

			case "wave":
			default:
				ctx.fillText(content, x, y);
				break;
		}
	}

	/**
	 * Render characters individually with their own opacities.
	 */
	private renderCharactersIndividually(
		ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
		chars: string[],
		startX: number,
		y: number,
		opacities: number[]
	) {
		let currentX = startX;

		for (let i = 0; i < chars.length; i++) {
			ctx.save();
			ctx.globalAlpha = opacities[i];
			ctx.fillText(chars[i], currentX, y);
			currentX += ctx.measureText(chars[i]).width;
			ctx.restore();
		}
	}

	/**
	 * Render words individually with their own opacities.
	 */
	private renderWordsIndividually(
		ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
		words: string[],
		startX: number,
		y: number,
		opacities: number[]
	) {
		let currentX = startX;

		for (let i = 0; i < words.length; i++) {
			ctx.save();
			ctx.globalAlpha = opacities[i];
			ctx.fillText(words[i], currentX, y);
			currentX += ctx.measureText(words[i]).width;
			ctx.restore();
		}
	}

	async render({ renderer, time }: { renderer: CanvasRenderer; time: number }) {
		if (!this.isInRange({ time })) {
			return;
		}

		renderer.context.save();

		const x = this.params.transform.position.x + this.params.canvasCenter.x;
		const y = this.params.transform.position.y + this.params.canvasCenter.y;

		renderer.context.translate(x, y);
		if (this.params.transform.rotate) {
			renderer.context.rotate((this.params.transform.rotate * Math.PI) / 180);
		}

		const fontWeight = this.params.fontWeight === "bold" ? "bold" : "normal";
		const fontStyle = this.params.fontStyle === "italic" ? "italic" : "normal";
		const scaledFontSize = scaleFontSize({
			fontSize: this.params.fontSize,
			canvasHeight: this.params.canvasHeight,
		});
		renderer.context.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${this.params.fontFamily}`;
		renderer.context.textAlign = this.params.textAlign;
		renderer.context.textBaseline = this.params.textBaseline || "middle";
		renderer.context.fillStyle = this.params.color;

		const prevAlpha = renderer.context.globalAlpha;
		renderer.context.globalAlpha = this.params.opacity;

		// Apply letter spacing
		if (this.params.letterSpacing) {
			renderer.context.letterSpacing = `${this.params.letterSpacing}px`;
		}

		// Apply text shadow
		this.applyTextShadow(renderer.context, this.params.textShadow);

		// Render background if set
		if (this.params.backgroundColor) {
			const metrics = renderer.context.measureText(this.params.content);
			const ascent = metrics.actualBoundingBoxAscent ?? scaledFontSize * 0.8;
			const descent = metrics.actualBoundingBoxDescent ?? scaledFontSize * 0.2;
			const textW = metrics.width;
			const textH = ascent + descent;
			const padX = 8;
			const padY = 4;

			renderer.context.fillStyle = this.params.backgroundColor;
			let bgLeft = -textW / 2;
			if (renderer.context.textAlign === "left") bgLeft = 0;
			if (renderer.context.textAlign === "right") bgLeft = -textW;

			renderer.context.fillRect(
				bgLeft - padX,
				-textH / 2 - padY,
				textW + padX * 2,
				textH + padY * 2,
			);

			renderer.context.fillStyle = this.params.color;
		}

		// Calculate text position based on alignment
		let textX = 0;
		if (renderer.context.textAlign === "left") textX = 0;
		else if (renderer.context.textAlign === "right") textX = 0;
		else textX = 0; // center

		// Handle continuous wave animation
		if (this.params.textAnimation?.type === "wave") {
			const localTime = time - this.params.startTime;
			const { charOffsets } = computeWaveEffect(
				this.params.content,
				localTime,
				this.params.textAnimation.intensity ?? 30,
				this.params.textAnimation.loop ?? true
			);

			const chars = splitIntoChars(this.params.content);
			this.renderWaveText(renderer.context, chars, textX, 0, charOffsets);
		}
		// Handle entry effect
		else if (this.params.textEffectIn) {
			const progress = this.computeEffectProgress(time, this.params.textEffectIn, false);
			this.renderWithEntryEffect(
				renderer.context,
				this.params.content,
				textX,
				0,
				this.params.textEffectIn,
				progress
			);
		}
		// Default rendering
		else {
			renderer.context.fillText(this.params.content, textX, 0);
		}

		renderer.context.globalAlpha = prevAlpha;
		renderer.context.restore();
	}

	/**
	 * Render text with wave effect (character-level vertical offset).
	 */
	private renderWaveText(
		ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
		chars: string[],
		startX: number,
		y: number,
		offsets: number[]
	) {
		let currentX = startX;
		const textAlign = ctx.textAlign;

		// Calculate total width for centering
		if (textAlign === "center") {
			const totalWidth = chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0);
			currentX = -totalWidth / 2;
		} else if (textAlign === "right") {
			const totalWidth = chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0);
			currentX = -totalWidth;
		}

		for (let i = 0; i < chars.length; i++) {
			ctx.save();
			ctx.fillText(chars[i], currentX, y + offsets[i]);
			currentX += ctx.measureText(chars[i]).width;
			ctx.restore();
		}
	}
}