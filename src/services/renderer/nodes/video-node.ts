import type { CanvasRenderer } from "../canvas-renderer";
import { VisualNode, type VisualNodeParams } from "./visual-node";
import { videoCache } from "@/services/video-cache/service";

export interface VideoNodeParams extends VisualNodeParams {
	url: string;
	file: File;
	mediaId: string;
	/** Play video in reverse. Default false. */
	reversed?: boolean;
}

export class VideoNode extends VisualNode<VideoNodeParams> {
	/**
	 * Override getLocalTime to handle reverse playback.
	 * When reversed is true, we play the video backwards from trimEnd to trimStart.
	 */
	protected getLocalTime(time: number): number {
		const speed = this.params.speed ?? 1;
		const { trimStart, trimEnd, timeOffset, duration, reversed } = this.params;

		// Calculate the trim duration in source media
		const trimDuration = trimEnd - trimStart;

		if (reversed) {
			// For reversed playback:
			// 1. Calculate progress through the clip on timeline (0 to 1)
			// 2. Account for speed - faster speed means we traverse the clip faster
			const clipProgress = ((time - timeOffset) * speed) / duration;
			// Clamp progress to [0, 1] to handle edge cases
			const clampedProgress = Math.max(0, Math.min(1, clipProgress));
			// Reverse the progress: play from end to start
			// At progress 0, we should be at trimEnd
			// At progress 1, we should be at trimStart
			return trimEnd - clampedProgress * trimDuration;
		}

		// Normal (forward) playback
		return (time - timeOffset) * speed + trimStart;
	}

	async render({ renderer, time }: { renderer: CanvasRenderer; time: number }) {
		await super.render({ renderer, time });

		if (!this.isInRange(time)) {
			return;
		}

		// Compute the local media time (accounting for speed and reverse) and store it
		// so renderVisual can sample animation overrides at the correct position.
		const videoTime = this.getLocalTime(time);
		this._currentLocalTime = videoTime;

		const frame = await videoCache.getFrameAt({
			mediaId: this.params.mediaId,
			file: this.params.file,
			time: videoTime,
		});

		if (frame) {
			this.renderVisual({
				renderer,
				source: frame.canvas,
				sourceWidth: frame.canvas.width,
				sourceHeight: frame.canvas.height,
			});
		}
	}
}
