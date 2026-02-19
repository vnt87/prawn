import { Command } from "@/lib/commands/base-command";
import type { TimelineTrack } from "@/types/timeline";
import { EditorCore } from "@/core";
import { isMainTrack } from "@/lib/timeline";

/**
 * RippleDeleteCommand deletes elements and shifts all subsequent elements
 * earlier to close the gap, mimicking professional NLE behavior.
 */
export class RippleDeleteCommand extends Command {
	private savedState: TimelineTrack[] | null = null;

	constructor(private elements: { trackId: string; elementId: string }[]) {
		super();
	}

	execute(): void {
		const editor = EditorCore.getInstance();
		this.savedState = editor.timeline.getTracks();

		// Group elements by track for processing
		const elementsByTrack = new Map<string, string[]>();
		for (const el of this.elements) {
			const existing = elementsByTrack.get(el.trackId) ?? [];
			existing.push(el.elementId);
			elementsByTrack.set(el.trackId, existing);
		}

		// Calculate deleted duration per track (earliest deleted element's gap)
		const trackGapDurations = new Map<string, number>();

		const updatedTracks = this.savedState.map((track) => {
			const elementsToDelete = elementsByTrack.get(track.id);
			if (!elementsToDelete || elementsToDelete.length === 0) {
				return track;
			}

			// Find the elements to delete and their time ranges
			const elementsWithTimes = track.elements
				.filter((el) => elementsToDelete.includes(el.id))
				.map((el) => ({
					id: el.id,
					startTime: el.startTime,
					endTime: el.startTime + el.duration,
				}))
				.sort((a, b) => a.startTime - b.startTime);

			if (elementsWithTimes.length === 0) {
				return track;
			}

			// Calculate the gap to close (total duration of deleted region)
			// For ripple, we delete and shift everything after the earliest deleted element
			const earliestStart = Math.min(...elementsWithTimes.map((e) => e.startTime));
			const latestEnd = Math.max(...elementsWithTimes.map((e) => e.endTime));
			const gapDuration = latestEnd - earliestStart;

			trackGapDurations.set(track.id, gapDuration);

			// Remove deleted elements and shift subsequent ones
			const remainingElements = track.elements
				.filter((el) => !elementsToDelete.includes(el.id))
				.map((el) => {
					// Shift elements that start after the deletion point
					if (el.startTime >= earliestStart) {
						return {
							...el,
							startTime: Math.max(0, el.startTime - gapDuration),
						};
					}
					// Elements that overlap the deletion region need special handling
					if (el.startTime < earliestStart && el.startTime + el.duration > earliestStart) {
						// Trim the element to end at the deletion point (no shift needed)
						const newDuration = earliestStart - el.startTime;
						return {
							...el,
							duration: newDuration,
							trimEnd: el.trimEnd + (el.duration - newDuration),
						};
					}
					return el;
				});

			return {
				...track,
				elements: remainingElements,
			} as typeof track;
		});

		// Filter out empty non-main tracks
		const filteredTracks = updatedTracks.filter(
			(track) => track.elements.length > 0 || isMainTrack(track),
		);

		editor.timeline.updateTracks(filteredTracks);
	}

	undo(): void {
		if (this.savedState) {
			const editor = EditorCore.getInstance();
			editor.timeline.updateTracks(this.savedState);
		}
	}
}