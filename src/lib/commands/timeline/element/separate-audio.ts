import { Command } from "@/lib/commands";
import type { TimelineTrack, VideoElement, AudioElement } from "@/types/timeline";
import type { MediaAsset } from "@/types/assets";
import { generateUUID } from "@/utils/id";
import { Input, ALL_FORMATS, BlobSource, AudioBufferSink } from "mediabunny";
import { EditorCore } from "@/core";
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
	private trackId: string;
	private elementId: string;
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
		this.trackId = params.element.trackId;
		this.elementId = params.element.elementId;
	}

	async execute(): Promise<void> {
		this.originalTracks = this.getTracks();

		// Find the video element
		const { track, element } = this.findVideoElement();
		if (!track || !element) {
			console.warn("No video element found for audio separation");
			return;
		}

		this.videoElement = element as VideoElement;

		// Get the media asset for the video
		const mediaAssets = await this.getMediaAssets?.() ?? [];
		const mediaAsset = mediaAssets.find((a) => a.id === this.videoElement!.mediaId);
		if (!mediaAsset?.file) {
			console.warn("No media asset or file found for video element");
			return;
		}

		// Calculate trim values - trimEnd is the end position in source media
		// If not set, it should be trimStart + duration
		const trimStart = this.videoElement.trimStart;
		const trimEnd = this.videoElement.trimEnd ?? (trimStart + this.videoElement.duration);
		const duration = this.videoElement.duration;

		// Extract audio from video
		const audioBlob = await this.extractAudioFromVideo({
			file: mediaAsset.file,
			trimStart,
			trimEnd,
			duration,
		});

		if (!audioBlob) {
			console.warn("Failed to extract audio from video");
			return;
		}

		// Create blob URL for the audio
		this.audioBlobUrl = URL.createObjectURL(audioBlob);

		// Create audio asset
		const assetId = await this.addMediaAsset({
			type: "audio",
			name: `Audio - ${this.videoElement.name}`,
			url: this.audioBlobUrl,
			thumbnailUrl: undefined,
			width: 0,
			height: 0,
			duration: this.videoElement.duration,
			file: new File([audioBlob], `separated-audio-${Date.now()}.wav`, { type: "audio/wav" }),
		});

		this.createdAudioAssetId = assetId;

		// Create audio element
		const audioElement: AudioElement = {
			id: generateUUID(),
			type: "audio",
			name: `Audio - ${this.videoElement.name}`,
			mediaId: assetId,
			sourceType: "upload",
			startTime: this.videoElement.startTime,
			duration: this.videoElement.duration,
			trimStart: this.videoElement.trimStart,
			trimEnd: this.videoElement.trimEnd ?? this.videoElement.duration,
			volume: this.videoElement.volume ?? 1,
			muted: false,
		};
		this.createdAudioElementId = audioElement.id;

		// Start with a copy of original tracks
		let newTracks = [...this.originalTracks];

		// Find an existing audio track or create one
		let audioTrack = newTracks.find(
			(t) => t.type === "audio" && !t.muted
		);

		if (!audioTrack) {
			// Create a new audio track manually
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
		});

		// Mute the original video element
		newTracks = newTracks.map((t) => {
			if (t.id === this.trackId && t.type === "video") {
				return {
					...t,
					elements: t.elements.map((el) => {
						if (el.id === this.videoElement!.id) {
							return { ...el, muted: true };
						}
						return el;
					}),
				};
			}
			return t;
		});

		this.newTracks = newTracks;
		this.updateTracks(newTracks);
	}

	undo(): void {
		// Restore original tracks
		this.updateTracks(this.originalTracks);

		// Clean up the created blob URL
		if (this.audioBlobUrl) {
			URL.revokeObjectURL(this.audioBlobUrl);
			this.audioBlobUrl = null;
		}
	}

	redo(): void {
		this.updateTracks(this.newTracks);
	}

	private findVideoElement(): { track: TimelineTrack | null; element: VideoElement | null } {
		for (const track of this.originalTracks) {
			if (track.type !== "video") continue;
			if (track.id !== this.trackId) continue;
			
			for (const element of track.elements) {
				if (element.type === "video" && element.id === this.elementId) {
					return { track, element };
				}
			}
		}
		return { track: null, element: null };
	}

	private async extractAudioFromVideo({
		file,
		trimStart,
		trimEnd,
		duration,
	}: {
		file: File;
		trimStart: number;
		trimEnd: number;
		duration: number;
	}): Promise<Blob | null> {
		try {
			const input = new Input({
				source: new BlobSource(file),
				formats: ALL_FORMATS,
			});

			const audioTrack = await input.getPrimaryAudioTrack();
			if (!audioTrack) {
				console.warn("No audio track found in video");
				return null;
			}

			const sink = new AudioBufferSink(audioTrack);
			const totalSamples = Math.ceil(duration * SAMPLE_RATE);
			const mixBuffers = [
				new Float32Array(totalSamples),
				new Float32Array(totalSamples),
			];

			// Iterate through audio buffers within the trim range
			for await (const { buffer, timestamp } of sink.buffers(trimStart, trimEnd)) {
				// Calculate the output position based on timestamp relative to trimStart
				const relativeTime = timestamp - trimStart;
				const outputStartSample = Math.floor(relativeTime * SAMPLE_RATE);

				// Resample if needed
				const resampleRatio = SAMPLE_RATE / buffer.sampleRate;

				for (let ch = 0; ch < NUM_CHANNELS; ch++) {
					const sourceChannel = Math.min(ch, buffer.numberOfChannels - 1);
					const channelData = buffer.getChannelData(sourceChannel);
					const outputChannel = mixBuffers[ch];

					const resampledLength = Math.floor(channelData.length * resampleRatio);
					for (let i = 0; i < resampledLength; i++) {
						const outputIdx = outputStartSample + i;
						if (outputIdx < 0 || outputIdx >= totalSamples) continue;

						const sourceIdx = Math.floor(i / resampleRatio);
						if (sourceIdx < channelData.length) {
							outputChannel[outputIdx] += channelData[sourceIdx];
						}
					}
				}
			}

			// Clamp to prevent clipping
			for (const channel of mixBuffers) {
				for (let i = 0; i < channel.length; i++) {
					channel[i] = Math.max(-1, Math.min(1, channel[i]));
				}
			}

			// Interleave channels for WAV output
			const interleavedSamples = new Float32Array(totalSamples * NUM_CHANNELS);
			for (let i = 0; i < totalSamples; i++) {
				interleavedSamples[i * 2] = mixBuffers[0][i];
				interleavedSamples[i * 2 + 1] = mixBuffers[1][i];
			}

			return this.createWavBlob({ samples: interleavedSamples });
		} catch (error) {
			console.error("Failed to extract audio from video:", error);
			return null;
		}
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