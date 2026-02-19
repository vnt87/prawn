"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAssetPreviewStore } from "@/stores/asset-preview-store";
import {
	ZoomIn,
	ZoomOut,
	Maximize2,
	RotateCcw,
} from "lucide-react";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
const ZOOM_STEP = 0.5;

export function ImageLightbox() {
	const { asset, closePreview } = useAssetPreviewStore();
	const [zoom, setZoom] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const containerRef = useRef<HTMLDivElement>(null);

	// Reset zoom and position when asset changes
	useEffect(() => {
		setZoom(1);
		setPosition({ x: 0, y: 0 });
	}, [asset?.id]);

	// Reset to fit in view
	const resetView = useCallback(() => {
		setZoom(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	// Zoom controls
	const zoomIn = useCallback(() => {
		setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
	}, []);

	const zoomOut = useCallback(() => {
		setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
	}, []);

	// Fit to container
	const fitToContainer = useCallback(() => {
		setZoom(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	// Mouse wheel zoom
	const handleWheel = useCallback((e: React.WheelEvent) => {
		e.preventDefault();
		const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
		setZoom((prev) => {
			const newZoom = Math.max(MIN_ZOOM, Math.min(prev + delta, MAX_ZOOM));
			return newZoom;
		});
	}, []);

	// Pan handlers
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		if (zoom > 1) {
			setIsDragging(true);
			setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
		}
	}, [zoom, position]);

	const handleMouseMove = useCallback((e: React.MouseEvent) => {
		if (isDragging && zoom > 1) {
			setPosition({
				x: e.clientX - dragStart.x,
				y: e.clientY - dragStart.y,
			});
		}
	}, [isDragging, dragStart, zoom]);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!asset || asset.type !== "image") return;
			
			switch (e.key) {
				case "+":
				case "=":
					zoomIn();
					break;
				case "-":
					zoomOut();
					break;
				case "0":
					resetView();
					break;
				case "Escape":
					closePreview();
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [asset, zoomIn, zoomOut, resetView, closePreview]);

	if (!asset || asset.type !== "image") return null;

	return (
		<div className="relative flex h-full w-full flex-col">
			{/* Toolbar */}
			<div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-lg bg-black/50 p-1 backdrop-blur-sm">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 text-white hover:bg-white/20"
							onClick={zoomOut}
							disabled={zoom <= MIN_ZOOM}
						>
							<ZoomOut className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">Zoom Out (-)</TooltipContent>
				</Tooltip>

				<span className="min-w-[4rem] px-2 text-center text-sm text-white">
					{Math.round(zoom * 100)}%
				</span>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 text-white hover:bg-white/20"
							onClick={zoomIn}
							disabled={zoom >= MAX_ZOOM}
						>
							<ZoomIn className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">Zoom In (+)</TooltipContent>
				</Tooltip>

				<div className="mx-1 h-4 w-px bg-white/30" />

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 text-white hover:bg-white/20"
							onClick={fitToContainer}
						>
							<Maximize2 className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">Fit to View (0)</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 text-white hover:bg-white/20"
							onClick={resetView}
						>
							<RotateCcw className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">Reset View</TooltipContent>
				</Tooltip>
			</div>

			{/* Image container */}
			<div
				ref={containerRef}
				className="flex h-full w-full cursor-grab items-center justify-center overflow-hidden bg-black/90"
				onWheel={handleWheel}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
			>
				{asset.url && (
					<div
						className="relative"
						style={{
							transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
							transition: isDragging ? "none" : "transform 0.1s ease-out",
						}}
					>
						<Image
							src={asset.url}
							alt={asset.name}
							width={asset.width || 1920}
							height={asset.height || 1080}
							className="max-h-[85vh] max-w-[85vw] object-contain"
							priority
							unoptimized
							draggable={false}
						/>
					</div>
				)}
			</div>

			{/* Info bar */}
			<div className="absolute bottom-4 left-4 rounded-lg bg-black/50 px-3 py-1.5 backdrop-blur-sm">
				<span className="text-sm text-white">{asset.name}</span>
				{asset.width && asset.height && (
					<span className="text-muted-foreground ml-2 text-xs">
						({asset.width} × {asset.height})
					</span>
				)}
			</div>
		</div>
	);
}