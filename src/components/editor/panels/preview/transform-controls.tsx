"use client";

import { useRef, useState, useCallback } from "react";
import { useSyncExternalStore } from "react";
import { useEditor } from "@/hooks/use-editor";
import type { Transform, TimelineTrack, TimelineElement } from "@/types/timeline";
import {
	type HandleType,
	type BoundingBox,
	type HandlePosition,
	type TransformDragState,
	HANDLE_SIZE,
} from "@/types/transform-controls";
import { FONT_SIZE_SCALE_REFERENCE } from "@/constants/text-constants";
import { cn } from "@/utils/ui";

interface TransformControlsProps {
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
	zoom: number;
}

/**
 * TransformControls - On-screen transform handles for selected elements
 * 
 * Shows a bounding box with resize/rotate handles when:
 * 1. Element(s) are selected
 * 2. Playback is paused
 */
export function TransformControls({ canvasRef, zoom }: TransformControlsProps) {
	const editor = useEditor();
	const containerRef = useRef<HTMLDivElement>(null);
	const [dragState, setDragState] = useState<TransformDragState | null>(null);
	const [hoveredHandle, setHoveredHandle] = useState<HandleType | null>(null);

	// Subscribe to editor state
	const selectedElements = useSyncExternalStore(
		(listener) => editor.selection.subscribe(listener),
		() => editor.selection.getSelectedElements(),
	);

	const isPlaying = useSyncExternalStore(
		(listener) => editor.playback.subscribe(listener),
		() => editor.playback.getIsPlaying(),
	);

	const tracks = useSyncExternalStore(
		(listener) => editor.timeline.subscribe(listener),
		() => editor.timeline.getTracks(),
	);

	const activeProject = editor.project.getActive();
	const canvasSize = activeProject?.settings.canvasSize ?? { width: 1920, height: 1080 };

	/**
	 * Calculate the visual bounding box for a video/image element.
	 * Matches the rendering logic in visual-node.ts exactly.
	 */
	function getVisualElementBoundingBox(
		element: TimelineElement & { transform: Transform; mediaId: string },
		canvasWidth: number,
		canvasHeight: number
	): BoundingBox | null {
		// Get the media asset to find source dimensions
		const asset = editor.media.getAssets().find((a) => a.id === element.mediaId);
		if (!asset?.width || !asset?.height) return null;

		// Calculate the "fit to canvas" scale (contain scale)
		const containScale = Math.min(
			canvasWidth / asset.width,
			canvasHeight / asset.height
		);

		// Visual dimensions after fit-to-canvas + user scale
		const visualWidth = asset.width * containScale * element.transform.scale;
		const visualHeight = asset.height * containScale * element.transform.scale;

		// Visual center = canvas center + position offset
		// (position is an offset from center, not absolute position)
		const centerX = canvasWidth / 2 + element.transform.position.x;
		const centerY = canvasHeight / 2 + element.transform.position.y;

		return {
			x: centerX,
			y: centerY,
			width: visualWidth,
			height: visualHeight,
			rotation: element.transform.rotate ?? 0,
		};
	}

	/**
	 * Calculate the visual bounding box for a text element.
	 * Uses canvas measureText() for accurate width measurement,
	 * matching the rendering logic in text-node.ts.
	 */
	function getTextElementBoundingBox(
		element: TimelineElement & { type: 'text'; content: string; fontSize: number; fontFamily: string; fontWeight?: string; fontStyle?: string; letterSpacing?: number },
		canvasWidth: number,
		canvasHeight: number
	): BoundingBox {
		// Scale font size based on canvas height (matches text-node.ts)
		const scaledFontSize = element.fontSize * (canvasHeight / FONT_SIZE_SCALE_REFERENCE);

		// Use canvas measureText for accurate width
		const measureCanvas = document.createElement('canvas');
		const ctx = measureCanvas.getContext('2d');
		let textWidth: number;

		if (ctx) {
			const fontWeight = element.fontWeight === 'bold' ? 'bold' : 'normal';
			const fontStyle = element.fontStyle === 'italic' ? 'italic' : 'normal';
			ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${element.fontFamily}`;

			if (element.letterSpacing) {
				(ctx as unknown as { letterSpacing: string }).letterSpacing = `${element.letterSpacing}px`;
			}

			textWidth = ctx.measureText(element.content).width;
		} else {
			// Fallback: rough estimate
			textWidth = element.content.length * scaledFontSize * 0.5;
		}

		// Text height: use font metrics when available
		const textHeight = scaledFontSize * 1.2;

		// Visual center = canvas center + position offset
		const centerX = canvasWidth / 2 + element.transform.position.x;
		const centerY = canvasHeight / 2 + element.transform.position.y;

		return {
			x: centerX,
			y: centerY,
			width: textWidth * element.transform.scale,
			height: textHeight * element.transform.scale,
			rotation: element.transform.rotate ?? 0,
		};
	}

	/**
	 * Get bounding boxes for all selected elements
	 */
	const getBoundingBoxes = useCallback((): BoundingBox[] => {
		const boxes: BoundingBox[] = [];

		for (const selected of selectedElements) {
			const track = tracks.find((t: TimelineTrack) => t.id === selected.trackId);
			if (!track) continue;

			const element = track.elements.find((e) => e.id === selected.elementId);
			if (!element) continue;

			// Only process elements with transforms
			if (!('transform' in element)) continue;

			// Handle video/image elements
			if ('mediaId' in element) {
				const box = getVisualElementBoundingBox(
					element as TimelineElement & { transform: Transform; mediaId: string },
					canvasSize.width,
					canvasSize.height
				);
				if (box) boxes.push(box);
			}
			// Handle text elements
			else if (element.type === 'text') {
				const box = getTextElementBoundingBox(
					element as TimelineElement & { type: 'text'; content: string; fontSize: number; fontFamily: string; fontWeight?: string; fontStyle?: string; letterSpacing?: number },
					canvasSize.width,
					canvasSize.height
				);
				boxes.push(box);
			}
			// Handle sticker elements
			else if (element.type === 'sticker') {
				const stickerSize = canvasSize.height * 0.1 * element.transform.scale;
				const centerX = canvasSize.width / 2 + element.transform.position.x;
				const centerY = canvasSize.height / 2 + element.transform.position.y;
				boxes.push({
					x: centerX,
					y: centerY,
					width: stickerSize,
					height: stickerSize,
					rotation: element.transform.rotate ?? 0,
				});
			}
		}

		return boxes;
	}, [selectedElements, tracks, editor.media, canvasSize]);

	/**
	 * Calculate combined bounding box from all selected elements
	 */
	const calculateBoundingBox = useCallback((): BoundingBox | null => {
		const boxes = getBoundingBoxes();
		if (boxes.length === 0) return null;

		// For single element, return its bounding box directly
		if (boxes.length === 1) {
			return boxes[0];
		}

		// For multiple elements, calculate combined bounding box
		let minX = Infinity, minY = Infinity;
		let maxX = -Infinity, maxY = -Infinity;

		for (const box of boxes) {
			const halfW = box.width / 2;
			const halfH = box.height / 2;

			// For rotated elements, we need to calculate rotated corners
			if (box.rotation !== 0) {
				const rad = (box.rotation * Math.PI) / 180;
				const cos = Math.cos(rad);
				const sin = Math.sin(rad);

				// All four corners
				const corners = [
					{ x: -halfW, y: -halfH },
					{ x: halfW, y: -halfH },
					{ x: halfW, y: halfH },
					{ x: -halfW, y: halfH },
				];

				for (const corner of corners) {
					const rotatedX = corner.x * cos - corner.y * sin + box.x;
					const rotatedY = corner.x * sin + corner.y * cos + box.y;
					minX = Math.min(minX, rotatedX);
					maxX = Math.max(maxX, rotatedX);
					minY = Math.min(minY, rotatedY);
					maxY = Math.max(maxY, rotatedY);
				}
			} else {
				minX = Math.min(minX, box.x - halfW);
				maxX = Math.max(maxX, box.x + halfW);
				minY = Math.min(minY, box.y - halfH);
				maxY = Math.max(maxY, box.y + halfH);
			}
		}

		return {
			x: (minX + maxX) / 2,
			y: (minY + maxY) / 2,
			width: maxX - minX,
			height: maxY - minY,
			rotation: 0, // Multi-selection doesn't rotate
		};
	}, [getBoundingBoxes]);

	/**
	 * Get the display scale factor between canvas logical size and display size.
	 * The canvas has a native resolution (e.g., 1920x1080) but displays at a
	 * different CSS size (e.g., 640x360).
	 */
	const getDisplayScale = useCallback(() => {
		if (!canvasRef.current) return { x: 1, y: 1 };

		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();

		// canvas.width/height = logical resolution
		// rect.width/height = CSS display size
		return {
			x: rect.width / canvas.width,
			y: rect.height / canvas.height,
		};
	}, [canvasRef]);

	/**
	 * Get canvas element's position on the page
	 */
	const getCanvasOffset = useCallback(() => {
		if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 };
		const canvasRect = canvasRef.current.getBoundingClientRect();
		const containerRect = containerRef.current.getBoundingClientRect();
		return {
			x: canvasRect.left - containerRect.left,
			y: canvasRect.top - containerRect.top,
		};
	}, [canvasRef]);

	/**
	 * Convert canvas coordinates to screen coordinates.
	 * Canvas coords are in the logical canvas space (e.g., 0-1920).
	 * Screen coords are in browser viewport pixels.
	 */
	const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
		const scale = getDisplayScale();
		const offset = getCanvasOffset();

		return {
			x: canvasX * scale.x + offset.x,
			y: canvasY * scale.y + offset.y,
		};
	}, [getDisplayScale, getCanvasOffset]);

	// Get selected elements with their transforms for drag operations
	const getSelectedTransforms = useCallback(() => {
		const elements: Array<{
			trackId: string;
			elementId: string;
			transform: Transform;
		}> = [];

		for (const selected of selectedElements) {
			const track = tracks.find((t: TimelineTrack) => t.id === selected.trackId);
			if (!track) continue;

			const element = track.elements.find((e) => e.id === selected.elementId);
			if (!element || !('transform' in element)) continue;

			elements.push({
				trackId: selected.trackId,
				elementId: element.id,
				transform: (element as { transform: Transform }).transform,
			});
		}

		return elements;
	}, [selectedElements, tracks]);

	/**
	 * Get current transforms from elements (after drag modifications)
	 */
	const getCurrentTransforms = useCallback(() => {
		const elements: Array<{
			trackId: string;
			elementId: string;
			transform: Transform;
		}> = [];

		for (const selected of selectedElements) {
			const track = tracks.find((t: TimelineTrack) => t.id === selected.trackId);
			if (!track) continue;

			const element = track.elements.find((e) => e.id === selected.elementId);
			if (!element || !('transform' in element)) continue;

			elements.push({
				trackId: selected.trackId,
				elementId: element.id,
				transform: { ...(element as { transform: Transform }).transform },
			});
		}

		return elements;
	}, [selectedElements, tracks]);

	// Handle pointer down on a handle
	const handlePointerDown = useCallback((e: React.PointerEvent, handleType: HandleType) => {
		e.preventDefault();
		e.stopPropagation();

		const bounds = calculateBoundingBox();
		if (!bounds) return;

		const elements = getSelectedTransforms();

		setDragState({
			handleType,
			startX: e.clientX,
			startY: e.clientY,
			initialBounds: bounds,
			initialTransforms: elements.map((el) => ({
				trackId: el.trackId,
				elementId: el.elementId,
				transform: { ...el.transform },
			})),
		});

		// Capture pointer
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}, [calculateBoundingBox, getSelectedTransforms]);

	// Handle pointer move during drag
	const handlePointerMove = useCallback((e: React.PointerEvent) => {
		if (!dragState) return;

		const deltaX = e.clientX - dragState.startX;
		const deltaY = e.clientY - dragState.startY;

		if (dragState.handleType === 'rotate') {
			// Rotation handling
			const bounds = calculateBoundingBox();
			if (!bounds) return;

			// Get screen position of the bounding box center (relative to container)
			const screenCenter = canvasToScreen(bounds.x, bounds.y);

			// Convert mouse position to container-relative coords
			const containerRect = containerRef.current?.getBoundingClientRect();
			const mouseX = e.clientX - (containerRect?.left ?? 0);
			const mouseY = e.clientY - (containerRect?.top ?? 0);

			// Calculate angle from center to current mouse position
			const angle = Math.atan2(mouseY - screenCenter.y, mouseX - screenCenter.x);
			const degrees = (angle * 180) / Math.PI + 90; // Adjust for "up" being 0 degrees

			// Snap to 15° increments if shift is held
			const finalDegrees = e.shiftKey
				? Math.round(degrees / 15) * 15
				: degrees;

			// Apply rotation to all selected elements
			for (const initial of dragState.initialTransforms) {
				editor.timeline.updateElements({
					updates: [{
						trackId: initial.trackId,
						elementId: initial.elementId,
						updates: {
							transform: {
								...initial.transform,
								rotate: finalDegrees,
							},
						},
					}],
					pushHistory: false,
				});
			}
		} else {
			// Scale handling
			const scale = getDisplayScale();

			// Convert screen delta to canvas delta
			const canvasDeltaX = deltaX / scale.x;
			const canvasDeltaY = deltaY / scale.y;

			// Calculate scale factor
			// For corner handles, use the diagonal distance
			// For edge handles, use just that axis
			let scaleFactor = 1;

			if (e.shiftKey) {
				// Shift = proportional scaling (default behavior)
				scaleFactor = 1 + (canvasDeltaX + canvasDeltaY) / 200;
			} else {
				// Non-proportional: different handling per handle type
				const handle = dragState.handleType;

				if (handle === 'n' || handle === 's') {
					// Vertical only
					scaleFactor = 1 + canvasDeltaY / 100;
				} else if (handle === 'e' || handle === 'w') {
					// Horizontal only
					scaleFactor = 1 + canvasDeltaX / 100;
				} else {
					// Corners: use diagonal
					scaleFactor = 1 + (canvasDeltaX + canvasDeltaY) / 200;
				}
			}

			// Apply scale to all selected elements
			for (const initial of dragState.initialTransforms) {
				const newScale = Math.max(0.01, Math.min(5, initial.transform.scale * scaleFactor));

				editor.timeline.updateElements({
					updates: [{
						trackId: initial.trackId,
						elementId: initial.elementId,
						updates: {
							transform: {
								...initial.transform,
								scale: newScale,
							},
						},
					}],
					pushHistory: false,
				});
			}
		}
	}, [dragState, calculateBoundingBox, canvasToScreen, getDisplayScale, editor.timeline]);

	// Handle pointer up to end drag
	const handlePointerUp = useCallback((e: React.PointerEvent) => {
		if (!dragState) return;

		// Get the CURRENT transforms from the elements (not from initialTransforms!)
		// This is the fix for the reset bug
		const currentTransforms = getCurrentTransforms();

		// Push to history with the current values for undo/redo
		for (const current of currentTransforms) {
			editor.timeline.updateElements({
				updates: [{
					trackId: current.trackId,
					elementId: current.elementId,
					updates: {
						transform: current.transform,
					},
				}],
				pushHistory: true,
			});
		}

		setDragState(null);
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
	}, [dragState, getCurrentTransforms, editor.timeline]);

	// Don't render if playing or no selection
	const bounds = calculateBoundingBox();
	if (isPlaying || !bounds) return null;

	// Convert bounding box to screen coordinates
	const screenCenter = canvasToScreen(bounds.x, bounds.y);
	const scale = getDisplayScale();
	const screenWidth = bounds.width * scale.x;
	const screenHeight = bounds.height * scale.y;

	// Calculate handle positions in screen coordinates
	const handles: HandlePosition[] = [];
	const halfW = screenWidth / 2;
	const halfH = screenHeight / 2;
	const rad = (bounds.rotation * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);

	// Corner handles
	const corners: Array<{ type: HandleType; relX: number; relY: number }> = [
		{ type: 'nw', relX: -halfW, relY: -halfH },
		{ type: 'ne', relX: halfW, relY: -halfH },
		{ type: 'se', relX: halfW, relY: halfH },
		{ type: 'sw', relX: -halfW, relY: halfH },
	];

	// Edge handles
	const edges: Array<{ type: HandleType; relX: number; relY: number }> = [
		{ type: 'n', relX: 0, relY: -halfH },
		{ type: 'e', relX: halfW, relY: 0 },
		{ type: 's', relX: 0, relY: halfH },
		{ type: 'w', relX: -halfW, relY: 0 },
	];

	// Apply rotation and create handle positions
	for (const corner of corners) {
		const rotatedX = corner.relX * cos - corner.relY * sin;
		const rotatedY = corner.relX * sin + corner.relY * cos;
		handles.push({
			type: corner.type,
			x: screenCenter.x + rotatedX,
			y: screenCenter.y + rotatedY,
			cursor: getCursorForRotation(corner.type, bounds.rotation),
		});
	}

	for (const edge of edges) {
		const rotatedX = edge.relX * cos - edge.relY * sin;
		const rotatedY = edge.relX * sin + edge.relY * cos;
		handles.push({
			type: edge.type,
			x: screenCenter.x + rotatedX,
			y: screenCenter.y + rotatedY,
			cursor: getCursorForRotation(edge.type, bounds.rotation),
		});
	}

	// Rotation handle (above the bounding box)
	const rotateOffset = -halfH - 20;
	const rotatedRotateX = 0 * cos - rotateOffset * sin;
	const rotatedRotateY = 0 * sin + rotateOffset * cos;
	handles.push({
		type: 'rotate',
		x: screenCenter.x + rotatedRotateX,
		y: screenCenter.y + rotatedRotateY,
		cursor: 'grab',
	});

	return (
		<div
			ref={containerRef}
			className="absolute inset-0 pointer-events-none"
			style={{ cursor: hoveredHandle ? 'grab' : 'default' }}
		>
			{/* SVG overlay for bounding box and rotation line */}
			<svg
				className="absolute inset-0 w-full h-full pointer-events-none"
				style={{ overflow: 'visible' }}
			>
				{/* Bounding box rectangle */}
				<rect
					x={screenCenter.x - halfW}
					y={screenCenter.y - halfH}
					width={screenWidth}
					height={screenHeight}
					fill="none"
					stroke="rgba(59, 130, 246, 0.8)"
					strokeWidth={2}
					transform={`rotate(${bounds.rotation}, ${screenCenter.x}, ${screenCenter.y})`}
				/>

				{/* Rotation handle line */}
				<line
					x1={screenCenter.x}
					y1={screenCenter.y - halfH}
					x2={handles.find(h => h.type === 'rotate')?.x}
					y2={handles.find(h => h.type === 'rotate')?.y}
					stroke="rgba(59, 130, 246, 0.5)"
					strokeWidth={1}
				/>
			</svg>

			{/* Handle elements */}
			{handles.map((handle) => (
				<div
					key={handle.type}
					className={cn(
						"absolute pointer-events-auto",
						handle.type === 'rotate'
							? "rounded-full bg-blue-500"
							: "bg-white border-2 border-blue-500 rounded-sm",
						"hover:bg-blue-100 hover:border-blue-600",
						dragState?.handleType === handle.type && "bg-blue-200"
					)}
					style={{
						left: handle.x - HANDLE_SIZE / 2,
						top: handle.y - HANDLE_SIZE / 2,
						width: HANDLE_SIZE,
						height: HANDLE_SIZE,
						cursor: dragState?.handleType === handle.type ? 'grabbing' : handle.cursor,
					}}
					onPointerDown={(e) => handlePointerDown(e, handle.type)}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					onMouseEnter={() => setHoveredHandle(handle.type)}
					onMouseLeave={() => setHoveredHandle(null)}
				/>
			))}
		</div>
	);
}

/**
 * Get the appropriate cursor for a handle type, accounting for rotation.
 */
function getCursorForRotation(handleType: HandleType, rotation: number): string {
	if (handleType === 'rotate') return 'grab';

	// Base cursors for each handle type
	const baseCursors: Record<Exclude<HandleType, 'rotate'>, string> = {
		nw: 'nwse-resize',
		n: 'ns-resize',
		ne: 'nesw-resize',
		e: 'ew-resize',
		se: 'nwse-resize',
		s: 'ns-resize',
		sw: 'nesw-resize',
		w: 'ew-resize',
	};

	// Adjust cursor based on rotation (snap to 45° increments)
	const normalizedRotation = ((rotation % 360) + 360) % 360;
	const steps = Math.round(normalizedRotation / 45) % 8;

	const cursorOrder = ['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize'];
	const cursorIndex = cursorOrder.indexOf(baseCursors[handleType as Exclude<HandleType, 'rotate'>]);

	if (cursorIndex === -1) return baseCursors[handleType as Exclude<HandleType, 'rotate'>];

	const adjustedIndex = (cursorIndex + steps) % 4;
	return cursorOrder[adjustedIndex];
}