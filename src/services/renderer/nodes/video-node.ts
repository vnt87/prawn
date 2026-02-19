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
		const { trimStart, trimEnd, timeOffset, duration } = this.params;

		// Calculate the normal local time
		let localTime = (time - timeOffset) * speed + trimStart;

		// If reversed, mirror the time within the clip's trim range
		if (this.params.reversed) {
			const trimDuration = trimEnd - trimStart;
			// Calculate progress through the clip (0 to 1)
			const clipProgress = (time - timeOffset) / duration;
			// Reverse the progress: play from end to start
			localTime = trimStart + (1 - clipProgress) * trimDuration;
		}

		return localTime;
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
