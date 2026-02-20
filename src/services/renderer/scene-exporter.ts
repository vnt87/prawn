import EventEmitter from "eventemitter3";

import {
	Output,
	Mp4OutputFormat,
	WebMOutputFormat,
	Mp3OutputFormat,
	WavOutputFormat,
	BufferTarget,
	CanvasSource,
	AudioBufferSource,
	QUALITY_LOW,
	QUALITY_MEDIUM,
	QUALITY_HIGH,
	QUALITY_VERY_HIGH,
} from "mediabunny";
import type { RootNode } from "./nodes/root-node";
import { CanvasRenderer } from "./canvas-renderer";
import type { ExportFormat, ExportQuality } from "@/types/export";

type ExportParams = {
	width: number;
	height: number;
	fps: number;
	format: ExportFormat;
	quality: ExportQuality;
	shouldIncludeAudio?: boolean;
	audioBuffer?: AudioBuffer;
};

const qualityMap = {
	low: QUALITY_LOW,
	medium: QUALITY_MEDIUM,
	high: QUALITY_HIGH,
	very_high: QUALITY_VERY_HIGH,
};

export type SceneExporterEvents = {
	progress: [progress: number];
	complete: [buffer: ArrayBuffer];
	error: [error: Error];
	cancelled: [];
};

export class SceneExporter extends EventEmitter<SceneExporterEvents> {
	private renderer: CanvasRenderer;
	private format: ExportFormat;
	private quality: ExportQuality;
	private shouldIncludeAudio: boolean;
	private audioBuffer?: AudioBuffer;

	private isCancelled = false;

	constructor({
		width,
		height,
		fps,
		format,
		quality,
		shouldIncludeAudio,
		audioBuffer,
	}: ExportParams) {
		super();
		this.renderer = new CanvasRenderer({
			width,
			height,
			fps,
		});

		this.format = format;
		this.quality = quality;
		this.shouldIncludeAudio = shouldIncludeAudio ?? false;
		this.audioBuffer = audioBuffer;
	}

	cancel(): void {
		this.isCancelled = true;
	}

	async export({
		rootNode,
	}: {
		rootNode: RootNode;
	}): Promise<ArrayBuffer | null> {
		const { fps } = this.renderer;
		const frameCount = Math.ceil(rootNode.duration * fps);

		let outputFormat;
		switch (this.format) {
			case "webm":
				outputFormat = new WebMOutputFormat();
				break;
			case "mp3":
				outputFormat = new Mp3OutputFormat();
				break;
			case "wav":
				outputFormat = new WavOutputFormat();
				break;
			case "gif":
				// Fallback to mp4 for now for gif
				outputFormat = new Mp4OutputFormat();
				break;
			case "mp4":
			default:
				outputFormat = new Mp4OutputFormat();
				break;
		}

		const output = new Output({
			format: outputFormat,
			target: new BufferTarget(),
		});

		const isAudioOnly = this.format === "mp3" || this.format === "wav";

		let videoSource: CanvasSource | null = null;
		if (!isAudioOnly) {
			videoSource = new CanvasSource(this.renderer.canvas, {
				codec: this.format === "webm" ? "vp9" : "avc",
				bitrate: qualityMap[this.quality],
			});
			output.addVideoTrack(videoSource, { frameRate: fps });
		}

		let audioSource: AudioBufferSource | null = null;
		if ((this.shouldIncludeAudio || isAudioOnly) && this.audioBuffer) {
			audioSource = new AudioBufferSource({
				codec: this.format === "webm" ? "opus" : this.format === "mp3" ? "mp3" : "aac",
				bitrate: qualityMap[this.quality],
			});
			output.addAudioTrack(audioSource);
		}

		await output.start();

		if (audioSource && this.audioBuffer) {
			await audioSource.add(this.audioBuffer);
			audioSource.close();
		}

		if (videoSource) {
			for (let i = 0; i < frameCount; i++) {
				if (this.isCancelled) {
					await output.cancel();
					this.emit("cancelled");
					return null;
				}

				const time = i / fps;
				await this.renderer.render({ node: rootNode, time });
				await videoSource.add(time, 1 / fps);

				this.emit("progress", i / frameCount);
			}
			videoSource.close();
		}

		if (this.isCancelled) {
			await output.cancel();
			this.emit("cancelled");
			return null;
		}

		await output.finalize();

		this.emit("progress", 1);

		const buffer = output.target.buffer;
		if (!buffer) {
			this.emit("error", new Error("Failed to export video"));
			return null;
		}

		this.emit("complete", buffer);
		return buffer;
	}
}
