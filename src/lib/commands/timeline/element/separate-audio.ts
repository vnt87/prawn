import { Command } from "@/lib/commands";
import type { TimelineTrack, VideoElement, AudioElement, AudioTrack } from "@/types/timeline";
import type { MediaAsset } from "@/types/assets";
import { generateUUID } from "@/utils/id";
import { Input, ALL_FORMATS, BlobSource, AudioBufferSink } from "mediabunny";
import {
	buildEmptyTrack,
	getDefaultInsertIndexForTrack,
} from "@/lib/timeline/track-utils";

const SAMPLE_RATE = 44100;
const NUM_CHANNELS = 2;

/**
 * SeparateAudioCommand extracts the audio track from a video element,
 * creates a new audio asset, and inserts it on an audio track.
 * The original video's audio is muted.
 */
export class SeparateAudioCommand extends Command {
	private videoElement: VideoElement | null = null;
	private createdAudioAssetId: string | null = null;
	private createdAudioElementId: string | null = null;
	private createdAudioTrackId: string | null = null;
	private originalTracks: TimelineTrack[] = [];
	private newTracks: TimelineTrack[] = [];
	private audioBlobUrl: string | null = null;

	constructor(
		private getTracks: () => TimelineTrack[],
		private updateTracks: (tracks: TimelineTrack[]) => void,
		private addMediaAsset: (asset: Omit<MediaAsset, "id">) => Promise<string>,
		params: {
			element: { trackId: string; elementId: string };
		},
	) {
		super();
		this.elementTarget = params.element;
	}

	private elementTarget: { trackId: string; elementId: string };

	/**
	 * Extracts audio from the video element and returns it as a WAV blob.
	 */
	private async extractAudioFromVideo({
		element,
		mediaFile,
	}: {
		element: VideoElement;
		mediaFile: File;
	}): Promise<Blob | null> {
		try {
			console.log(`[SeparateAudio] Extracting audio from ${element.name}`, {
				trimStart: element.trimStart,
				duration: element.duration,
				speed: element.speed,
			});

			const input = new Input({
				source: new BlobSource(mediaFile),
				formats: ALL_FORMATS,
			});

			const audioTrack = await input.getPrimaryAudioTrack();
			if (!audioTrack) {
				console.warn("[SeparateAudio] No audio track found in video");
				input.dispose();
				return null;
			}

			const sink = new AudioBufferSink(audioTrack);

			// CORRECT CALCULATION: trimEnd in file time is NOT duration.
			// duration = (trimEnd - trimStart) / speed
			// => trimEnd = trimStart + duration * speed
			const speed = element.speed ?? 1;
			const trimEnd = element.trimStart + element.duration * speed;

			console.log(`[SeparateAudio] Sink range:`, {
				start: element.trimStart,
				end: trimEnd,
			});

			const buffers: Array<{ buffer: AudioBuffer; timestamp: number }> = [];
			for await (const buffer of sink.buffers(element.trimStart, trimEnd)) {
				buffers.push(buffer);
			}

			input.dispose();

			if (buffers.length === 0) {
				console.warn("[SeparateAudio] No audio buffers extracted");
				return null;
			}

			console.log(`[SeparateAudio] Extracted ${buffers.length} buffers`);

			// Combine all buffers into a single samples array
			const totalSamples = buffers.reduce(
				(sum, { buffer }) => sum + buffer.length,
				0,
			);
			const sampleRate = buffers[0].buffer.sampleRate;
			const numChannels = buffers[0].buffer.numberOfChannels;

			const interleavedSamples = new Float32Array(totalSamples * 2);
			let currentOffset = 0;

			for (const { buffer } of buffers) {
				const leftChannel = buffer.getChannelData(0);
				const rightChannel =
					numChannels > 1 ? buffer.getChannelData(1) : leftChannel;

				for (let i = 0; i < buffer.length; i++) {
					interleavedSamples[currentOffset * 2] = leftChannel[i];
					interleavedSamples[currentOffset * 2 + 1] = rightChannel[i];
					currentOffset++;
				}
			}

			return this.createWavBlob({
				samples: interleavedSamples,
			});
		} catch (error) {
			console.error("[SeparateAudio] Error extracting audio:", error);
			return null;
		}
	}

	async execute(): Promise<void> {
		this.originalTracks = this.getTracks();

		// Find the element
		const { element } = this.findElement(this.elementTarget);
		if (!element || element.type !== "video") {
			console.warn("[SeparateAudio] Target video element not found");
			return;
		}

		this.videoElement = element;

		// Get the media asset
		const mediaAssets = (await this.getMediaAssets?.()) ?? [];
		const mediaAsset = mediaAssets.find((a) => a.id === element.mediaId);
		if (!mediaAsset?.file) {
			console.warn("[SeparateAudio] Media file not found");
			return;
		}

		// Extract audio - this is async and can take time
		const audioBlob = await this.extractAudioFromVideo({
			element,
			mediaFile: mediaAsset.file,
		});

		if (!audioBlob) {
			console.warn("[SeparateAudio] Failed to extract audio");
			return;
		}

		// Create audio asset
		const audioAssetId = await this.addMediaAsset({
			type: "audio",
			name: `Audio - ${element.name}`,
			url: URL.createObjectURL(audioBlob),
			thumbnailUrl: "",
			width: 0,
			height: 0,
			duration: element.duration,
			file: new File([audioBlob], `audio-${Date.now()}.wav`, {
				type: "audio/wav",
			}),
		});

		this.createdAudioAssetId = audioAssetId;
		this.audioBlobUrl = URL.createObjectURL(audioBlob); // Store for cleanup (actually addMediaAsset generates URL too, but this is safe)

		// Create audio element
		const audioElement: AudioElement = {
			id: generateUUID(),
			type: "audio",
			name: `Audio - ${element.name}`,
			mediaId: audioAssetId,
			startTime: element.startTime,
			duration: element.duration,
			trimStart: 0, // New asset = already trimmed, starts at 0
			trimEnd: 0, // trimEnd = amount trimmed from end; 0 = no trimming
			volume: element.volume ?? 1,
			speed: element.speed ?? 1, // Preserve speed
			sourceType: "upload",
		};
		this.createdAudioElementId = audioElement.id;

		// Refresh tracks to prevent corruption from stale state
		this.originalTracks = this.getTracks();

		// Find the elements again in the fresh track state
		const freshState = this.findElement(this.elementTarget);
		if (!freshState.element) {
			console.warn("[SeparateAudio] Element disappeared during extraction");
			return;
		}

		// Start with a copy of original tracks
		let newTracks = [...this.originalTracks];

		// Mute the original video element
		newTracks = newTracks.map((t) => {
			if (t.id === this.elementTarget.trackId && t.type === "video") {
				return {
					...t,
					elements: (t.elements as any[]).map((el) => {
						if (el.id === this.elementTarget.elementId) {
							return { ...el, muted: true };
						}
						return el;
					}),
				};
			}
			return t;
		}) as TimelineTrack[];

		// Find an existing audio track or create one
		let audioTrack = newTracks.find(
			(t) => t.type === "audio" && !("muted" in t && t.muted)
		);

		if (!audioTrack) {
			// Create a new audio track
			const newTrackId = generateUUID();
			const newAudioTrack: TimelineTrack = buildEmptyTrack({
				id: newTrackId,
				type: "audio",
			});

			// Insert at the appropriate index
			const insertIndex = getDefaultInsertIndexForTrack({
				tracks: newTracks,
				trackType: "audio",
			});

			newTracks.splice(insertIndex, 0, newAudioTrack);
			this.createdAudioTrackId = newTrackId;
			audioTrack = newAudioTrack;
		}

		// Add audio element to the audio track
		newTracks = newTracks.map((t) => {
			if (t.id === audioTrack!.id && t.type === "audio") {
				return {
					...t,
					elements: [...t.elements, audioElement],
				};
			}
			return t;
		}) as TimelineTrack[];

		this.newTracks = newTracks;
		this.updateTracks(newTracks);
	}

	async undo(): Promise<void> {
		// Restore original timeline tracks first
		this.updateTracks(this.originalTracks);

		// Clean up the created audio asset from memory + IndexedDB
		if (this.createdAudioAssetId) {
			try {
				const { EditorCore } = await import("@/core");
				const editor = EditorCore.getInstance();
				const projectId = editor.project.getActive()?.metadata.id;
				if (projectId) {
					await editor.media.removeMediaAsset({
						projectId,
						id: this.createdAudioAssetId,
					});
				}
			} catch (error) {
				console.warn("[SeparateAudio] Failed to clean up audio asset on undo:", error);
			}
			this.createdAudioAssetId = null;
		}

		// Revoke the blob URL if still held
		if (this.audioBlobUrl) {
			URL.revokeObjectURL(this.audioBlobUrl);
			this.audioBlobUrl = null;
		}
	}

	async redo(): Promise<void> {
		this.updateTracks(this.newTracks);
	}

	private findElement(target: { trackId: string; elementId: string }): { track: TimelineTrack | null; element: VideoElement | null } {
		for (const track of this.originalTracks) {
			if (track.id !== target.trackId) continue;
			for (const element of track.elements) {
				if (element.id === target.elementId) {
					return { track, element: element as VideoElement };
				}
			}
		}
		return { track: null, element: null };
	}

	private createWavBlob({ samples }: { samples: Float32Array }): Blob {
		const numChannels = NUM_CHANNELS;
		const bitsPerSample = 16;
		const bytesPerSample = bitsPerSample / 8;
		const numSamples = samples.length / numChannels;
		const dataSize = numSamples * numChannels * bytesPerSample;
		const buffer = new ArrayBuffer(44 + dataSize);
		const view = new DataView(buffer);

		// RIFF header
		this.writeString({ view, offset: 0, str: "RIFF" });
		view.setUint32(4, 36 + dataSize, true);
		this.writeString({ view, offset: 8, str: "WAVE" });

		// fmt chunk
		this.writeString({ view, offset: 12, str: "fmt " });
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, numChannels, true);
		view.setUint32(24, SAMPLE_RATE, true);
		view.setUint32(28, SAMPLE_RATE * numChannels * bytesPerSample, true);
		view.setUint16(32, numChannels * bytesPerSample, true);
		view.setUint16(34, bitsPerSample, true);

		// data chunk
		this.writeString({ view, offset: 36, str: "data" });
		view.setUint32(40, dataSize, true);

		// Convert float32 to int16 and write
		let offset = 44;
		for (let i = 0; i < samples.length; i++) {
			const sample = Math.max(-1, Math.min(1, samples[i]));
			const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
			view.setInt16(offset, int16, true);
			offset += 2;
		}

		return new Blob([buffer], { type: "audio/wav" });
	}

	private writeString({
		view,
		offset,
		str,
	}: {
		view: DataView;
		offset: number;
		str: string;
	}): void {
		for (let i = 0; i < str.length; i++) {
			view.setUint8(offset + i, str.charCodeAt(i));
		}
	}

	// This will be set by the TimelineManager
	private getMediaAssets?: () => Promise<MediaAsset[]>;

	setGetMediaAssets(fn: () => Promise<MediaAsset[]>) {
		this.getMediaAssets = fn;
	}

	getCreatedAudioAssetId(): string | null {
		return this.createdAudioAssetId;
	}

	getCreatedAudioElementId(): string | null {
		return this.createdAudioElementId;
	}

	getCreatedAudioTrackId(): string | null {
		return this.createdAudioTrackId;
	}
}