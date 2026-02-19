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
	 * Get the local media time for the given timeline time.
	 * Accounts for trim settings and playback speed.
	 */
	protected getLocalTime(time: number): number {
		const speed = this.params.speed ?? 1;
		const { trimStart, timeOffset } = this.params;
		return (time - timeOffset) * speed + trimStart;
	}

	async render({ renderer, time }: { renderer: CanvasRenderer; time: number }) {
		await super.render({ renderer, time });

		if (!this.isInRange(time)) {
			return;
		}

		// Compute the local media time (accounting for speed) and store it
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
