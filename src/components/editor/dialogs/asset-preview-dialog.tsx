"use client";

import { useAssetPreviewStore } from "@/stores/asset-preview-store";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { ImageLightbox } from "./image-lightbox";
import { VideoPlayerDialog } from "./video-player-dialog";
import { AudioPlayerDialog } from "./audio-player-dialog";

/**
 * Main asset preview dialog that renders the appropriate viewer
 * based on the asset type (image, video, or audio).
 * 
 * Features:
 * - Image: Lightbox with zoom/pan
 * - Video: Player with clip marking (in/out points)
 * - Audio: Waveform player with clip marking
 */
export function AssetPreviewDialog() {
	const { asset, isOpen, closePreview } = useAssetPreviewStore();
	const { t } = useTranslation();

	// Determine which viewer to show based on asset type
	const renderContent = () => {
		if (!asset) return null;

		switch (asset.type) {
			case "image":
				return <ImageLightbox />;
			case "video":
				return <VideoPlayerDialog />;
			case "audio":
				return <AudioPlayerDialog />;
			default:
				return null;
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && closePreview()}>
			<DialogContent
				className="h-[70vh] max-w-[80vw] p-0 overflow-hidden border-0 bg-transparent shadow-none"
				onCloseAutoFocus={(e) => {
					e.preventDefault();
					e.stopPropagation();
				}}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>{asset?.name || t("common.preview")}</DialogTitle>
				</DialogHeader>
				{renderContent()}
			</DialogContent>
		</Dialog>
	);
}