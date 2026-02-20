/**
 * Type definitions for on-screen transform controls
 * Used for interactive resize/rotation of elements on the preview canvas
 */

/** Types of transform handles */
export type HandleType =
	| 'nw'   // top-left corner
	| 'n'    // top edge
	| 'ne'   // top-right corner
	| 'e'    // right edge
	| 'se'   // bottom-right corner
	| 's'    // bottom edge
	| 'sw'   // bottom-left corner
	| 'w'    // left edge
	| 'rotate'; // rotation handle (above bounding box)

/** Position of a handle in screen coordinates */
export interface HandlePosition {
	/** Handle type identifier */
	type: HandleType;
	/** X position in screen pixels */
	x: number;
	/** Y position in screen pixels */
	y: number;
	/** Cursor style to display when hovering */
	cursor: string;
}

/** Bounding box of selected elements in canvas coordinates */
export interface BoundingBox {
	/** X position of the center in canvas pixels */
	x: number;
	/** Y position of the center in canvas pixels */
	y: number;
	/** Width in canvas pixels */
	width: number;
	/** Height in canvas pixels */
	height: number;
	/** Rotation angle in degrees */
	rotation: number;
}

/** State of a transform drag operation */
export interface TransformDragState {
	/** Type of handle being dragged */
	handleType: HandleType;
	/** Starting mouse X position */
	startX: number;
	/** Starting mouse Y position */
	startY: number;
	/** Initial bounding box at drag start */
	initialBounds: BoundingBox;
	/** Initial transform values for all selected elements */
	initialTransforms: Array<{
		trackId: string;
		elementId: string;
		transform: {
			scale: number;
			position: { x: number; y: number };
			rotate: number;
		};
	}>;
}

/** Cursor styles for each handle type */
export const HANDLE_CURSORS: Record<HandleType, string> = {
	nw: 'nwse-resize',
	n: 'ns-resize',
	ne: 'nesw-resize',
	e: 'ew-resize',
	se: 'nwse-resize',
	s: 'ns-resize',
	sw: 'nesw-resize',
	w: 'ew-resize',
	rotate: 'grab',
};

/** Size of transform handles in pixels */
export const HANDLE_SIZE = 8;

/** Distance of rotation handle from bounding box in pixels */
export const ROTATION_HANDLE_OFFSET = 20;

/**
 * Get handle positions for a bounding box.
 * Returns screen coordinates for all 9 handles.
 */
export function getHandlePositions(bounds: BoundingBox, scale: number): HandlePosition[] {
	const { x, y, width, height, rotation } = bounds;
	
	// Calculate half dimensions
	const halfW = (width * scale) / 2;
	const halfH = (height * scale) / 2;
	
	// Corner positions (relative to center)
	const corners: Array<{ type: HandleType; relX: number; relY: number }> = [
		{ type: 'nw', relX: -halfW, relY: -halfH },
		{ type: 'ne', relX: halfW, relY: -halfH },
		{ type: 'se', relX: halfW, relY: halfH },
		{ type: 'sw', relX: -halfW, relY: halfH },
	];
	
	// Edge positions (relative to center)
	const edges: Array<{ type: HandleType; relX: number; relY: number }> = [
		{ type: 'n', relX: 0, relY: -halfH },
		{ type: 'e', relX: halfW, relY: 0 },
		{ type: 's', relX: 0, relY: halfH },
		{ type: 'w', relX: -halfW, relY: 0 },
	];
	
	const handles: HandlePosition[] = [];
	
	// Apply rotation to all positions
	const rad = (rotation * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	
	// Add corner handles
	for (const corner of corners) {
		const rotatedX = corner.relX * cos - corner.relY * sin;
		const rotatedY = corner.relX * sin + corner.relY * cos;
		handles.push({
			type: corner.type,
			x: x * scale + rotatedX,
			y: y * scale + rotatedY,
			cursor: HANDLE_CURSORS[corner.type],
		});
	}
	
	// Add edge handles
	for (const edge of edges) {
		const rotatedX = edge.relX * cos - edge.relY * sin;
		const rotatedY = edge.relX * sin + edge.relY * cos;
		handles.push({
			type: edge.type,
			x: x * scale + rotatedX,
			y: y * scale + rotatedY,
			cursor: HANDLE_CURSORS[edge.type],
		});
	}
	
	// Add rotation handle (above center, rotated)
	const rotateRelY = -halfH - ROTATION_HANDLE_OFFSET;
	const rotatedX = 0 * cos - rotateRelY * sin;
	const rotatedY = 0 * sin + rotateRelY * cos;
	handles.push({
		type: 'rotate',
		x: x * scale + rotatedX,
		y: y * scale + rotatedY,
		cursor: HANDLE_CURSORS['rotate'],
	});
	
	return handles;
}