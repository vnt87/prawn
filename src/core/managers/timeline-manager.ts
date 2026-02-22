import type { EditorCore } from "@/core";
import type {
	TrackType,
	TimelineTrack,
	TimelineElement,
	ClipboardItem,
} from "@/types/timeline";
import { calculateTotalDuration } from "@/lib/timeline";
import {
	AddTrackCommand,
	RemoveTrackCommand,
	ToggleTrackMuteCommand,
	ToggleTrackVisibilityCommand,
	InsertElementCommand,
	UpdateElementTrimCommand,
	UpdateElementDurationCommand,
	DeleteElementsCommand,
	RippleDeleteCommand,
	DuplicateElementsCommand,
	ToggleElementsVisibilityCommand,
	ToggleElementsMutedCommand,
	UpdateElementCommand,
	SplitElementsCommand,
	PasteCommand,
	UpdateElementStartTimeCommand,
	MoveElementCommand,
	CloneElementCommand,
	FreezeFrameCommand,
	SeparateAudioCommand,
} from "@/lib/commands/timeline";
import { BatchCommand } from "@/lib/commands";
import type { InsertElementParams } from "@/lib/commands/timeline/element/insert-element";

export class TimelineManager {
	private listeners = new Set<() => void>();

	constructor(private editor: EditorCore) {}

	addTrack({ type, index }: { type: TrackType; index?: number }): string {
		const command = new AddTrackCommand(type, index);
		this.editor.command.execute({ command });
		return command.getTrackId();
	}

	removeTrack({ trackId }: { trackId: string }): void {
		const command = new RemoveTrackCommand(trackId);
		this.editor.command.execute({ command });
	}

	insertElement({ element, placement }: InsertElementParams): void {
		const command = new InsertElementCommand({ element, placement });
		this.editor.command.execute({ command });
	}

	updateElementTrim({
		elementId,
		trimStart,
		trimEnd,
		pushHistory = true,
	}: {
		elementId: string;
		trimStart: number;
		trimEnd: number;
		pushHistory?: boolean;
	}): void {
		const command = new UpdateElementTrimCommand(elementId, trimStart, trimEnd);
		if (pushHistory) {
			this.editor.command.execute({ command });
		} else {
			command.execute();
		}
	}

	updateElementDuration({
		trackId,
		elementId,
		duration,
		pushHistory = true,
	}: {
		trackId: string;
		elementId: string;
		duration: number;
		pushHistory?: boolean;
	}): void {
		const command = new UpdateElementDurationCommand(
			trackId,
			elementId,
			duration,
		);
		if (pushHistory) {
			this.editor.command.execute({ command });
		} else {
			command.execute();
		}
	}

	updateElementStartTime({
		elements,
		startTime,
	}: {
		elements: { trackId: string; elementId: string }[];
		startTime: number;
	}): void {
		const command = new UpdateElementStartTimeCommand(elements, startTime);
		this.editor.command.execute({ command });
	}

	moveElement({
		sourceTrackId,
		targetTrackId,
		elementId,
		newStartTime,
		createTrack,
	}: {
		sourceTrackId: string;
		targetTrackId: string;
		elementId: string;
		newStartTime: number;
		createTrack?: { type: TrackType; index: number };
	}): void {
		const command = new MoveElementCommand(
			sourceTrackId,
			targetTrackId,
			elementId,
			newStartTime,
			createTrack,
		);
		this.editor.command.execute({ command });
	}

	/**
	 * Clone an element to a target track (for Alt+drag operations).
	 * Creates a copy of the element at the specified position.
	 */
	cloneElement({
		sourceTrackId,
		targetTrackId,
		elementId,
		newStartTime,
		createTrack,
	}: {
		sourceTrackId: string;
		targetTrackId: string;
		elementId: string;
		newStartTime: number;
		createTrack?: { type: TrackType; index: number };
	}): string | null {
		const command = new CloneElementCommand(
			sourceTrackId,
			targetTrackId,
			elementId,
			newStartTime,
			createTrack,
		);
		this.editor.command.execute({ command });
		return command.getClonedElementId();
	}

	toggleTrackMute({ trackId }: { trackId: string }): void {
		const command = new ToggleTrackMuteCommand(trackId);
		this.editor.command.execute({ command });
	}

	toggleTrackVisibility({ trackId }: { trackId: string }): void {
		const command = new ToggleTrackVisibilityCommand(trackId);
		this.editor.command.execute({ command });
	}

	splitElements({
		elements,
		splitTime,
		retainSide = "both",
	}: {
		elements: { trackId: string; elementId: string }[];
		splitTime: number;
		retainSide?: "both" | "left" | "right";
	}): { trackId: string; elementId: string }[] {
		const command = new SplitElementsCommand(elements, splitTime, retainSide);
		this.editor.command.execute({ command });
		return command.getRightSideElements();
	}

	getTotalDuration(): number {
		return calculateTotalDuration({ tracks: this.getTracks() });
	}

	getTrackById({ trackId }: { trackId: string }): TimelineTrack | null {
		return this.getTracks().find((track) => track.id === trackId) ?? null;
	}

	getElementsWithTracks({
		elements,
	}: {
		elements: { trackId: string; elementId: string }[];
	}): Array<{ track: TimelineTrack; element: TimelineElement }> {
		const result: Array<{ track: TimelineTrack; element: TimelineElement }> =
			[];

		for (const { trackId, elementId } of elements) {
			const track = this.getTrackById({ trackId });
			const element = track?.elements.find(
				(trackElement) => trackElement.id === elementId,
			);

			if (track && element) {
				result.push({ track, element });
			}
		}

		return result;
	}

	pasteAtTime({
		time,
		clipboardItems,
	}: {
		time: number;
		clipboardItems: ClipboardItem[];
	}): { trackId: string; elementId: string }[] {
		const command = new PasteCommand(time, clipboardItems);
		this.editor.command.execute({ command });
		return command.getPastedElements();
	}

	deleteElements({
		elements,
	}: {
		elements: { trackId: string; elementId: string }[];
	}): void {
		const command = new DeleteElementsCommand(elements);
		this.editor.command.execute({ command });
	}

	rippleDeleteElements({
		elements,
	}: {
		elements: { trackId: string; elementId: string }[];
	}): void {
		const command = new RippleDeleteCommand(elements);
		this.editor.command.execute({ command });
	}

	updateElements({
		updates,
		pushHistory = true,
	}: {
		updates: Array<{
			trackId: string;
			elementId: string;
			updates: Partial<Record<string, unknown>>;
		}>;
		pushHistory?: boolean;
	}): void {
		const commands = updates.map(
			({ trackId, elementId, updates: elementUpdates }) =>
				new UpdateElementCommand(trackId, elementId, elementUpdates),
		);
		const command = commands.length === 1 ? commands[0] : new BatchCommand(commands);
		if (pushHistory) {
			this.editor.command.execute({ command });
		} else {
			command.execute();
		}
	}

	duplicateElements({
		elements,
	}: {
		elements: { trackId: string; elementId: string }[];
	}): { trackId: string; elementId: string }[] {
		const command = new DuplicateElementsCommand({ elements });
		this.editor.command.execute({ command });
		return command.getDuplicatedElements();
	}

	toggleElementsVisibility({
		elements,
	}: {
		elements: { trackId: string; elementId: string }[];
	}): void {
		const command = new ToggleElementsVisibilityCommand(elements);
		this.editor.command.execute({ command });
	}

	toggleElementsMuted({
		elements,
	}: {
		elements: { trackId: string; elementId: string }[];
	}): void {
		const command = new ToggleElementsMutedCommand(elements);
		this.editor.command.execute({ command });
	}

	/**
	 * Insert a freeze frame at the specified time.
	 * Captures the current frame from a video and inserts it as a static image.
	 */
	async insertFreezeFrame({
		time,
		freezeDuration,
	}: {
		time: number;
		freezeDuration?: number;
	}): Promise<{ imageAssetId: string | null; imageElementId: string | null }> {
		const activeProject = this.editor.project.getActive();
		const projectId = activeProject?.metadata.id;

		if (!projectId) {
			console.warn("No active project found");
			return { imageAssetId: null, imageElementId: null };
		}

		const command = new FreezeFrameCommand(
			() => this.getTracks(),
			(tracks) => this.updateTracks(tracks),
			async (asset) => {
				const id = await this.addMediaAssetInternal({ projectId, asset });
				return id;
			},
			{ time, freezeDuration },
		);

		// Provide access to media assets
		command.setGetMediaAssets(() => Promise.resolve(this.editor.media.getAssets()));

		await this.editor.command.execute({ command });

		return {
			imageAssetId: command.getCreatedImageAssetId(),
			imageElementId: command.getCreatedImageElementId(),
		};
	}

	/**
	 * Separate audio from a video element.
	 * Extracts the audio track and creates a new audio element on an audio track.
	 */
	async separateAudio({
		element,
	}: {
		element: { trackId: string; elementId: string };
	}): Promise<{ audioAssetId: string | null; audioElementId: string | null }> {
		const activeProject = this.editor.project.getActive();
		const projectId = activeProject?.metadata.id;

		if (!projectId) {
			console.warn("No active project found");
			return { audioAssetId: null, audioElementId: null };
		}

		const command = new SeparateAudioCommand(
			() => this.getTracks(),
			(tracks) => this.updateTracks(tracks),
			async (asset) => {
				const id = await this.addMediaAssetInternal({ projectId, asset });
				return id;
			},
			{ element },
		);

		// Provide access to media assets
		command.setGetMediaAssets(() => Promise.resolve(this.editor.media.getAssets()));

		await this.editor.command.execute({ command });

		return {
			audioAssetId: command.getCreatedAudioAssetId(),
			audioElementId: command.getCreatedAudioElementId(),
		};
	}

	/**
	 * Internal method to add media asset and return the ID.
	 */
	private async addMediaAssetInternal({
		projectId,
		asset,
	}: {
		projectId: string;
		asset: Omit<import("@/types/assets").MediaAsset, "id">;
	}): Promise<string> {
		const generateUUID = (await import("@/utils/id")).generateUUID;
		const newAsset: import("@/types/assets").MediaAsset = {
			...asset,
			id: generateUUID(),
		};

		// Add to media manager
		this.editor.media.setAssets({
			assets: [...this.editor.media.getAssets(), newAsset],
		});

		// Persist to storage
		try {
			const { storageService } = await import("@/services/storage/service");
			await storageService.saveMediaAsset({ projectId, mediaAsset: newAsset });
		} catch (error) {
			console.error("Failed to save freeze frame asset:", error);
		}

		return newAsset.id;
	}

	getTracks(): TimelineTrack[] {
		return this.editor.scenes.getActiveScene()?.tracks ?? [];
	}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notify(): void {
		this.listeners.forEach((fn) => fn());
	}

	updateTracks(newTracks: TimelineTrack[]): void {
		this.editor.scenes.updateSceneTracks({ tracks: newTracks });
		this.notify();
	}
}
