import { Command } from "@/lib/commands";
import type { TimelineTrack, ImageElement, VideoElement } from "@/types/timeline";
import type { MediaAsset } from "@/types/assets";
import { generateUUID } from "@/utils/id";
import { videoCache } from "@/services/video-cache/service";

/**
 * FreezeFrameCommand captures a frame from a video at the playhead position,
 * creates an image asset from that frame, and inserts it into the timeline.
 * 
 * The workflow:
 * 1. Find the video element at the playhead time
 * 2. Capture the current frame from videoCache
 * 3. Convert the canvas to a blob and create an image asset
 * 4. Split the video at the freeze point
 * 5. Insert the frozen frame image between the split sections
 */
export class FreezeFrameCommand extends Command {
	private trackId: string | null = null;
	private videoElement: VideoElement | null = null;
	private freezeTime: number;
	private freezeDuration: number;
	private createdImageAssetId: string | null = null;
	private createdImageElementId: string | null = null;
	private originalTracks: TimelineTrack[] = [];
	private newTracks: TimelineTrack[] = [];
	private imageBlobUrl: string | null = null;

	constructor(
		private getTracks: () => TimelineTrack[],
		private updateTracks: (tracks: TimelineTrack[]) => void,
		private addMediaAsset: (asset: Omit<MediaAsset, "id">) => Promise<string>,
		params: {
			time: number;
			freezeDuration?: number;
		},
	) {
		super();
		this.freezeTime = params.time;
		this.freezeDuration = params.freezeDuration ?? 2; // Default 2 seconds freeze
	}

	async execute(): Promise<void> {
		this.originalTracks = this.getTracks();

		// Find video element at freeze time
		const { trackId, element } = this.findVideoAtTime(this.freezeTime);
		if (!trackId || !element) {
			console.warn("No video element found at freeze time");
			return;
		}

		this.trackId = trackId;
		this.videoElement = element;

		// Get the media asset for the video
		const mediaAssets = await this.getMediaAssets?.() ?? [];
		const mediaAsset = mediaAssets.find((a) => a.id === element.mediaId);
		if (!mediaAsset?.file) {
			console.warn("No media asset or file found for video element");
			return;
		}

		// Calculate the local time within the video (accounting for trim)
		const localTime = this.freezeTime - element.startTime + element.trimStart;

		// Capture the frame
		const frame = await videoCache.getFrameAt({
			mediaId: element.mediaId,
			file: mediaAsset.file,
			time: localTime,
		});

		if (!frame) {
			console.warn("Failed to capture frame from video");
			return;
		}

		// Convert canvas to blob
		const blob = await this.canvasToBlob(frame.canvas);
		if (!blob) {
			console.warn("Failed to convert canvas to blob");
			return;
		}

		// Create blob URL for the image
		this.imageBlobUrl = URL.createObjectURL(blob);

		// Create image asset
		const assetId = await this.addMediaAsset({
			type: "image",
			name: `Freeze Frame - ${element.name}`,
			url: this.imageBlobUrl,
			thumbnailUrl: this.imageBlobUrl,
			width: frame.canvas.width,
			height: frame.canvas.height,
			duration: 0, // Images have no duration
			file: new File([blob], `freeze-frame-${Date.now()}.png`, { type: "image/png" }),
		});

		this.createdImageAssetId = assetId;

		// Create image element
		const imageElement: ImageElement = {
			id: generateUUID(),
			type: "image",
			name: `Freeze Frame`,
			mediaId: assetId,
			startTime: this.freezeTime,
			duration: this.freezeDuration,
			trimStart: 0,
			trimEnd: 0,
			transform: { ...element.transform },
			opacity: element.opacity,
		};
		this.createdImageElementId = imageElement.id;

		// Modify tracks: split video and insert image
		const newTracks = this.originalTracks.map((track) => {
			if (track.id !== trackId) return track;

			const elementIndex = track.elements.findIndex((e) => e.id === element.id);
			if (elementIndex === -1) return track;

			const elementsBefore = track.elements.slice(0, elementIndex);
			const elementsAfter = track.elements.slice(elementIndex + 1);

			// Calculate the relative position within the video
			const relativeTime = this.freezeTime - element.startTime;

			// Create left part of video (before freeze)
			const leftVideo: VideoElement = {
				...element,
				duration: relativeTime,
				trimEnd: element.trimStart + relativeTime,
			};

			// Create right part of video (after freeze)
			const rightVideo: VideoElement = {
				...element,
				id: generateUUID(),
				startTime: this.freezeTime + this.freezeDuration,
				duration: element.duration - relativeTime,
				trimStart: element.trimStart + relativeTime,
			};

			// Insert elements in order: left video, freeze image, right video
			// Type assertion needed because VideoTrack can have VideoElement | ImageElement
			const newElements = [
				...elementsBefore,
				leftVideo,
				imageElement,
				rightVideo,
				...elementsAfter,
			] as typeof track.elements;

			return {
				...track,
				elements: newElements,
			};
		}) as TimelineTrack[];

		this.newTracks = newTracks;
		this.updateTracks(newTracks);
	}

	async undo(): Promise<void> {
		// Restore original tracks
		this.updateTracks(this.originalTracks);

		// Clean up the created image asset from memory + IndexedDB
		if (this.createdImageAssetId) {
			try {
				const { EditorCore } = await import("@/core");
				const editor = EditorCore.getInstance();
				const projectId = editor.project.getActive()?.metadata.id;
				if (projectId) {
					await editor.media.removeMediaAsset({
						projectId,
						id: this.createdImageAssetId,
					});
				}
			} catch (error) {
				console.warn("[FreezeFrame] Failed to clean up image asset on undo:", error);
			}
			this.createdImageAssetId = null;
		}

		// Clean up the created blob URL
		if (this.imageBlobUrl) {
			URL.revokeObjectURL(this.imageBlobUrl);
			this.imageBlobUrl = null;
		}
	}

	async redo(): Promise<void> {
		this.updateTracks(this.newTracks);
	}

	private findVideoAtTime(time: number): { trackId: string | null; element: VideoElement | null } {
		for (const track of this.originalTracks) {
			for (const element of track.elements) {
				if (element.type !== "video") continue;

				const elementEnd = element.startTime + element.duration;
				if (time >= element.startTime && time < elementEnd) {
					return { trackId: track.id, element };
				}
			}
		}
		return { trackId: null, element: null };
	}

	private async canvasToBlob(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob | null> {
		return new Promise((resolve) => {
			if (canvas instanceof HTMLCanvasElement) {
				canvas.toBlob((blob) => resolve(blob), "image/png");
			} else {
				// OffscreenCanvas
				canvas.convertToBlob({ type: "image/png" }).then(resolve).catch(() => resolve(null));
			}
		});
	}

	// This will be set by the TimelineManager
	private getMediaAssets?: () => Promise<MediaAsset[]>;

	setGetMediaAssets(fn: () => Promise<MediaAsset[]>) {
		this.getMediaAssets = fn;
	}

	getCreatedImageAssetId(): string | null {
		return this.createdImageAssetId;
	}

	getCreatedImageElementId(): string | null {
		return this.createdImageElementId;
	}
}