import { toast } from "sonner";
import type { MediaAsset } from "@/types/assets";
import { getMediaTypeFromFile } from "@/lib/media/media-utils";
import { getVideoInfo } from "./mediabunny";
import { Input, ALL_FORMATS, BlobSource, VideoSampleSink } from "mediabunny";
import { createAudioContext } from "@/lib/media/audio";

export interface ProcessedMediaAsset extends Omit<MediaAsset, "id"> { }

const THUMBNAIL_MAX_WIDTH = 1280;
const THUMBNAIL_MAX_HEIGHT = 720;

const getThumbnailSize = ({
	width,
	height,
}: {
	width: number;
	height: number;
}): { width: number; height: number } => {
	const aspectRatio = width / height;
	let targetWidth = width;
	let targetHeight = height;

	if (targetWidth > THUMBNAIL_MAX_WIDTH) {
		targetWidth = THUMBNAIL_MAX_WIDTH;
		targetHeight = Math.round(targetWidth / aspectRatio);
	}
	if (targetHeight > THUMBNAIL_MAX_HEIGHT) {
		targetHeight = THUMBNAIL_MAX_HEIGHT;
		targetWidth = Math.round(targetHeight * aspectRatio);
	}

	return { width: targetWidth, height: targetHeight };
};

const renderToThumbnailDataUrl = ({
	width,
	height,
	draw,
}: {
	width: number;
	height: number;
	draw: ({
		context,
		width,
		height,
	}: {
		context: CanvasRenderingContext2D;
		width: number;
		height: number;
	}) => void;
}): string => {
	const size = getThumbnailSize({ width, height });
	const canvas = document.createElement("canvas");
	canvas.width = size.width;
	canvas.height = size.height;
	const context = canvas.getContext("2d");

	if (!context) {
		throw new Error("Could not get canvas context");
	}

	draw({ context, width: size.width, height: size.height });
	return canvas.toDataURL("image/jpeg", 0.8);
};

export async function generateThumbnail({
	videoFile,
	timeInSeconds,
}: {
	videoFile: File;
	timeInSeconds: number;
}): Promise<string> {
	const input = new Input({
		source: new BlobSource(videoFile),
		formats: ALL_FORMATS,
	});

	const videoTrack = await input.getPrimaryVideoTrack();
	if (!videoTrack) {
		throw new Error("No video track found in the file");
	}

	const canDecode = await videoTrack.canDecode();
	if (!canDecode) {
		throw new Error("Video codec not supported for decoding");
	}

	const sink = new VideoSampleSink(videoTrack);

	const frame = await sink.getSample(timeInSeconds);

	if (!frame) {
		throw new Error("Could not get frame at specified time");
	}

	try {
		return renderToThumbnailDataUrl({
			width: videoTrack.displayWidth,
			height: videoTrack.displayHeight,
			draw: ({ context, width, height }) => {
				frame.draw(context, 0, 0, width, height);
			},
		});
	} finally {
		frame.close();
	}
}

export async function generateFilmstripThumbnails({
	videoFile,
	duration,
	interval = 1,
	height = 100,
}: {
	videoFile: File;
	duration: number;
	interval?: number;
	height?: number;
}): Promise<string[]> {
	const input = new Input({
		source: new BlobSource(videoFile),
		formats: ALL_FORMATS,
	});

	const videoTrack = await input.getPrimaryVideoTrack();
	if (!videoTrack) {
		throw new Error("No video track found in the file");
	}

	const canDecode = await videoTrack.canDecode();
	if (!canDecode) {
		throw new Error("Video codec not supported for decoding");
	}

	const sink = new VideoSampleSink(videoTrack);
	const thumbnails: string[] = [];
	const numberOfThumbnails = Math.ceil(duration / interval);

	try {
		for (let i = 0; i < numberOfThumbnails; i++) {
			const time = i * interval;
			// Ensure we don't go beyond duration
			const sampleTime = Math.min(time, duration - 0.1);

			try {
				const frame = await sink.getSample(sampleTime);
				if (frame) {
					const url = renderToThumbnailDataUrl({
						width: (videoTrack.displayWidth / videoTrack.displayHeight) * height,
						height: height,
						draw: ({ context, width: drawWidth, height: drawHeight }) => {
							frame.draw(context, 0, 0, drawWidth, drawHeight);
						},
					});
					thumbnails.push(url);
					frame.close();
				}
			} catch (e) {
				console.warn(`Failed to generate thumbnail at ${sampleTime}s`, e);
			}
		}
	} finally {
		// sink.close() if available? Types don't show it, but good to check. 
		// input.close()?
	}

	return thumbnails;
}

/**
 * Extract audio waveform peaks from a media file (video or audio).
 * Returns an array of peak values per channel, or null if no audio is present.
 */
export async function extractAudioWaveformPeaks({
	file,
	peakCount = 256,
}: {
	file: File;
	peakCount?: number;
}): Promise<{ peaks: number[][]; hasAudio: boolean }> {
	try {
		const audioContext = createAudioContext();
		const arrayBuffer = await file.arrayBuffer();
		const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

		const channels = audioBuffer.numberOfChannels;
		const peaks: number[][] = [];

		for (let c = 0; c < channels; c++) {
			const data = audioBuffer.getChannelData(c);
			const step = Math.floor(data.length / peakCount);
			const channelPeaks: number[] = [];

			for (let i = 0; i < peakCount; i++) {
				const start = i * step;
				const end = Math.min(start + step, data.length);
				let max = 0;
				for (let j = start; j < end; j++) {
					const abs = Math.abs(data[j]);
					if (abs > max) max = abs;
				}
				channelPeaks.push(max);
			}
			peaks.push(channelPeaks);
		}

		return { peaks, hasAudio: true };
	} catch (error) {
		// File has no audio or audio decoding failed
		return { peaks: [], hasAudio: false };
	}
}

export async function generateImageThumbnail({
	imageFile,
}: {
	imageFile: File;
}): Promise<string> {
	return new Promise((resolve, reject) => {
		const image = new window.Image();
		const objectUrl = URL.createObjectURL(imageFile);

		image.addEventListener("load", () => {
			try {
				const dataUrl = renderToThumbnailDataUrl({
					width: image.naturalWidth,
					height: image.naturalHeight,
					draw: ({ context, width, height }) => {
						context.drawImage(image, 0, 0, width, height);
					},
				});
				resolve(dataUrl);
			} catch (error) {
				reject(
					error instanceof Error ? error : new Error("Could not render image"),
				);
			} finally {
				URL.revokeObjectURL(objectUrl);
				image.remove();
			}
		});

		image.addEventListener("error", () => {
			URL.revokeObjectURL(objectUrl);
			image.remove();
			reject(new Error("Could not load image"));
		});

		image.src = objectUrl;
	});
}

/**
 * Regenerate filmstrip thumbnails for an existing video file.
 * Returns the new thumbnails and interval used.
 */
export async function regenerateFilmstripThumbnails({
	videoFile,
	duration,
	filmstripInterval,
}: {
	videoFile: File;
	duration: number;
	filmstripInterval: 0.5 | 1 | 2;
}): Promise<{
	filmstripThumbnails: string[];
	filmstripInterval: number;
}> {
	const filmstripThumbnails = await generateFilmstripThumbnails({
		videoFile,
		duration,
		interval: filmstripInterval,
	});

	return {
		filmstripThumbnails,
		filmstripInterval,
	};
}

export async function processMediaAssets({
	files,
	onProgress,
	filmstripInterval = 1,
}: {
	files: FileList | File[];
	onProgress?: ({ progress }: { progress: number }) => void;
	/** Interval in seconds between filmstrip thumbnails. Default is 1. */
	filmstripInterval?: 0.5 | 1 | 2;
}): Promise<ProcessedMediaAsset[]> {
	const fileArray = Array.from(files);
	const processedAssets: ProcessedMediaAsset[] = [];

	const total = fileArray.length;
	let completed = 0;

	for (const file of fileArray) {
		const fileType = getMediaTypeFromFile({ file });

		if (!fileType) {
			toast.error(`Unsupported file type: ${file.name}`);
			continue;
		}

		const url = URL.createObjectURL(file);
		let thumbnailUrl: string | undefined;
		let filmstripThumbnails: string[] | undefined;
		let filmstripIntervalUsed: number | undefined;
		let duration: number | undefined;
		let width: number | undefined;
		let height: number | undefined;
		let fps: number | undefined;
		let audioWaveformPeaks: number[][] | undefined;
		let hasAudio: boolean | undefined;

		try {
			if (fileType === "image") {
				const dimensions = await getImageDimensions({ file });
				width = dimensions.width;
				height = dimensions.height;
				thumbnailUrl = await generateImageThumbnail({ imageFile: file });
			} else if (fileType === "video") {
				try {
					const videoInfo = await getVideoInfo({ videoFile: file });
					duration = videoInfo.duration;
					width = videoInfo.width;
					height = videoInfo.height;
					fps = Number.isFinite(videoInfo.fps)
						? Math.round(videoInfo.fps)
						: undefined;

					thumbnailUrl = await generateThumbnail({
						videoFile: file,
						timeInSeconds: 1,
					});

					// Generate filmstrip thumbnails using the configured interval
					if (duration > 0) {
						filmstripIntervalUsed = filmstripInterval;
						filmstripThumbnails = await generateFilmstripThumbnails({
							videoFile: file,
							duration,
							interval: filmstripInterval,
						});
					}

					// Extract audio waveform peaks for docked waveform visualization
					const audioResult = await extractAudioWaveformPeaks({ file });
					if (audioResult.hasAudio) {
						audioWaveformPeaks = audioResult.peaks;
						hasAudio = true;
					} else {
						hasAudio = false;
					}
				} catch (error) {
					console.warn("Video processing failed", error);
				}
			} else if (fileType === "audio") {
				// For audio, we don't set width/height/fps (they'll be undefined)
				duration = await getMediaDuration({ file });
				
				// Extract audio waveform peaks for visualization
				const audioResult = await extractAudioWaveformPeaks({ file });
				if (audioResult.hasAudio) {
					audioWaveformPeaks = audioResult.peaks;
					hasAudio = true;
				}
			}

			processedAssets.push({
				name: file.name,
				type: fileType,
				file,
				url,
				thumbnailUrl,
				filmstripThumbnails,
				filmstripInterval: filmstripIntervalUsed,
				duration,
				width,
				height,
				fps,
				audioWaveformPeaks,
				hasAudio,
			});

			await new Promise((resolve) => setTimeout(resolve, 0));

			completed += 1;
			if (onProgress) {
				const percent = Math.round((completed / total) * 100);
				onProgress({ progress: percent });
			}
		} catch (error) {
			console.error("Error processing file:", file.name, error);
			toast.error(`Failed to process ${file.name}`);
			URL.revokeObjectURL(url); // Clean up on error
		}
	}

	return processedAssets;
}

const getImageDimensions = ({
	file,
}: {
	file: File;
}): Promise<{ width: number; height: number }> => {
	return new Promise((resolve, reject) => {
		const img = new window.Image();
		const objectUrl = URL.createObjectURL(file);

		img.addEventListener("load", () => {
			const width = img.naturalWidth;
			const height = img.naturalHeight;
			resolve({ width, height });
			URL.revokeObjectURL(objectUrl);
			img.remove();
		});

		img.addEventListener("error", () => {
			reject(new Error("Could not load image"));
			URL.revokeObjectURL(objectUrl);
			img.remove();
		});

		img.src = objectUrl;
	});
};

const getMediaDuration = ({ file }: { file: File }): Promise<number> => {
	return new Promise((resolve, reject) => {
		const element = document.createElement(
			file.type.startsWith("video/") ? "video" : "audio",
		) as HTMLVideoElement;
		const objectUrl = URL.createObjectURL(file);

		element.addEventListener("loadedmetadata", () => {
			resolve(element.duration);
			URL.revokeObjectURL(objectUrl);
			element.remove();
		});

		element.addEventListener("error", () => {
			reject(new Error("Could not load media"));
			URL.revokeObjectURL(objectUrl);
			element.remove();
		});

		element.src = objectUrl;
		element.load();
	});
};
