import { usePreviewInteraction } from "@/hooks/use-preview-interaction";
import { TransformControls } from "./transform-controls";
import { cn } from "@/utils/ui";

export function PreviewInteractionOverlay({
	canvasRef,
	zoom = 1,
}: {
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
	zoom?: number;
}) {
	const { onPointerDown, onPointerMove, onPointerUp } =
		usePreviewInteraction({ canvasRef });

	return (
		<>
			{/* Drag overlay for position */}
			<div
				className={cn("absolute inset-0 pointer-events-auto")}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
			/>
			{/* Transform controls (only visible when paused) */}
			<TransformControls canvasRef={canvasRef} zoom={zoom} />
		</>
	);
}
