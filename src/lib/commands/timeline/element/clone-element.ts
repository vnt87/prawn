import { Command } from "@/lib/commands/base-command";
import { EditorCore } from "@/core";
import type {
	TimelineTrack,
	TimelineElement,
	TrackType,
} from "@/types/timeline";
import {
	buildEmptyTrack,
	getHighestInsertIndexForTrack,
	isMainTrack,
	validateElementTrackCompatibility,
	enforceMainTrackStart,
} from "@/lib/timeline/track-utils";
import { generateUUID } from "@/utils/id";

/**
 * CloneElementCommand - Clones a single element to a target track.
 * Used for Alt+drag clone operations.
 */
export class CloneElementCommand extends Command {
	private savedState: TimelineTrack[] | null = null;
	private clonedElementId: string | null = null;

	constructor(
		private sourceTrackId: string,
		private targetTrackId: string,
		private elementId: string,
		private newStartTime: number,
		private createTrack?: { type: TrackType; index: number },
	) {
		super();
	}

	execute(): void {
		const editor = EditorCore.getInstance();
		this.savedState = editor.timeline.getTracks();

		const sourceTrack = this.savedState.find(
			(t) => t.id === this.sourceTrackId,
		);
		const element = sourceTrack?.elements.find(
			(el) => el.id === this.elementId,
		);

		if (!sourceTrack || !element) {
			console.error("Source track or element not found");
			return;
		}

		let targetTrack = this.savedState.find((t) => t.id === this.targetTrackId);
		let tracksToUpdate = [...this.savedState];
		
		if (!targetTrack && this.createTrack) {
			const newTrack = buildEmptyTrack({
				id: this.targetTrackId,
				type: this.createTrack.type,
			});
			tracksToUpdate.splice(this.createTrack.index, 0, newTrack);
			targetTrack = newTrack;
		}
		
		if (!targetTrack) {
			console.error("Target track not found");
			return;
		}

		const validation = validateElementTrackCompatibility({
			element,
			track: targetTrack,
		});

		if (!validation.isValid) {
			console.error(validation.errorMessage);
			return;
		}

		const adjustedStartTime = enforceMainTrackStart({
			tracks: tracksToUpdate,
			targetTrackId: this.targetTrackId,
			requestedStartTime: this.newStartTime,
		});

		// Create the cloned element with a new ID
		this.clonedElementId = generateUUID();
		const clonedElement: TimelineElement = {
			...element,
			id: this.clonedElementId,
			name: `${element.name} (copy)`,
			startTime: adjustedStartTime,
		};

		// Add the cloned element to the target track
		const updatedTracks = tracksToUpdate.map((track) => {
			if (track.id === this.targetTrackId) {
				return {
					...track,
					elements: [...track.elements, clonedElement],
				};
			}
			return track;
		}) as TimelineTrack[];

		editor.timeline.updateTracks(updatedTracks);

		// Select the cloned element
		if (this.clonedElementId) {
			editor.selection.setSelectedElements({
				elements: [{ trackId: this.targetTrackId, elementId: this.clonedElementId }],
			});
		}
	}

	undo(): void {
		if (this.savedState) {
			const editor = EditorCore.getInstance();
			editor.timeline.updateTracks(this.savedState);
		}
	}

	getClonedElementId(): string | null {
		return this.clonedElementId;
	}
}