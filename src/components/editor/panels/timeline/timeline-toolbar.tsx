import { useEditor } from "@/hooks/use-editor";
import {
	TooltipProvider,
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

import {
	SplitButton,
	SplitButtonLeft,
	SplitButtonRight,
	SplitButtonSeparator,
} from "@/components/ui/split-button";
import { Slider } from "@/components/ui/slider";
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";
import { sliderToZoom, zoomToSlider } from "@/lib/timeline/zoom-utils";
import { ScenesView } from "../../scenes-view";
import { type TAction, invokeAction } from "@/lib/actions";
import { cn } from "@/utils/ui";
import { useTimelineStore } from "@/stores/timeline-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	SquareSplitHorizontal,
	AlignLeft,
	AlignRight,
	Copy,
	Trash2,
	Bookmark,
	Magnet,
	Link as LinkIcon,
	ZoomIn,
	ZoomOut,
	Layers,
	Mic,
	Snowflake,
	AudioLines,
} from "lucide-react";
import { useState } from "react";
import { RecordingDialog } from "@/components/editor/dialogs/recording-dialog";
import { useSoundsStore } from "@/stores/sounds-store";
import { useTranslation } from "react-i18next";

export function TimelineToolbar({
	zoomLevel,
	minZoom,
	setZoomLevel,
}: {
	zoomLevel: number;
	minZoom: number;
	setZoomLevel: ({ zoom }: { zoom: number }) => void;
}) {
	const handleZoom = ({ direction }: { direction: "in" | "out" }) => {
		const newZoomLevel =
			direction === "in"
				? Math.min(
					TIMELINE_CONSTANTS.ZOOM_MAX,
					zoomLevel * TIMELINE_CONSTANTS.ZOOM_BUTTON_FACTOR,
				)
				: Math.max(minZoom, zoomLevel / TIMELINE_CONSTANTS.ZOOM_BUTTON_FACTOR);
		setZoomLevel({ zoom: newZoomLevel });
	};

	return (
		<ScrollArea className="scrollbar-hidden bg-background">
			<div className="flex h-10 items-center justify-between border-b px-2 py-1">
				<ToolbarLeftSection />

				<SceneSelector />

				<ToolbarRightSection
					zoomLevel={zoomLevel}
					minZoom={minZoom}
					onZoomChange={(zoom) => setZoomLevel({ zoom })}
					onZoom={handleZoom}
				/>
			</div>
		</ScrollArea>
	);
}

function ToolbarLeftSection() {
	const { t } = useTranslation();
	const editor = useEditor();
	const currentTime = editor.playback.getCurrentTime();
	const currentBookmarked = editor.scenes.isBookmarked({ time: currentTime });

	const handleAction = ({
		action,
		event,
	}: {
		action: TAction;
		event: React.MouseEvent;
	}) => {
		event.stopPropagation();
		invokeAction(action);
	};

	return (
		<div className="flex items-center gap-1">
			<TooltipProvider delayDuration={500}>
				<ToolbarButton
					icon={<SquareSplitHorizontal size={18} />}
					tooltip={t("timeline.toolbar.split")}
					onClick={({ event }) => handleAction({ action: "split", event })}
				/>

				<ToolbarButton
					icon={<AlignLeft size={18} />}
					tooltip={t("timeline.toolbar.splitLeft")}
					onClick={({ event }) => handleAction({ action: "split-left", event })}
				/>

				<ToolbarButton
					icon={<AlignRight size={18} />}
					tooltip={t("timeline.toolbar.splitRight")}
					onClick={({ event }) =>
						handleAction({ action: "split-right", event })
					}
				/>

				<ToolbarButton
					icon={<AudioLines size={18} />}
					tooltip={t("timeline.toolbar.separateAudio")}
					onClick={({ event }) => handleAction({ action: "separate-audio", event })}
				/>

				<ToolbarButton
					icon={<Copy size={18} />}
					tooltip={t("timeline.toolbar.duplicate")}
					onClick={({ event }) =>
						handleAction({ action: "duplicate-selected", event })
					}
				/>

				<ToolbarButton
					icon={<Snowflake size={18} />}
					tooltip={t("timeline.toolbar.freezeFrame")}
					onClick={({ event }) => handleAction({ action: "freeze-frame", event })}
				/>

				<ToolbarButton
					icon={<Trash2 size={18} />}
					tooltip={t("timeline.toolbar.delete")}
					onClick={({ event }) =>
						handleAction({ action: "delete-selected", event })
					}
				/>

				<div className="bg-border mx-1 h-6 w-px" />

				<Tooltip>
					<ToolbarButton
						icon={<Bookmark size={18} />}
						isActive={currentBookmarked}
						tooltip={currentBookmarked ? t("timeline.toolbar.removeBookmark") : t("timeline.toolbar.addBookmark")}
						onClick={({ event }) =>
							handleAction({ action: "toggle-bookmark", event })
						}
					/>
				</Tooltip>

				<RecordingTrigger />
			</TooltipProvider>
		</div>
	);
}

function RecordingTrigger() {
	const { t } = useTranslation();
	const [isRecordingOpen, setIsRecordingOpen] = useState(false);
	const { addSoundToTimeline } = useSoundsStore();

	const handleSaveRecording = async (file: File) => {
		// Create a temporary URL for the file to be used in addSoundToTimeline
		// In a real app we might upload this to storage first, but addSoundToTimeline
		// handles URL fetching.
		// We need to modify addSoundToTimeline or create a new action to handle File directly.
		// For now, we can create an object URL.
		const url = URL.createObjectURL(file);

		// Mocking a SoundEffect object for the store action
		const soundEffect = {
			id: Date.now(),
			name: file.name,
			description: "Voiceover recording",
			url: url,
			previewUrl: url,
			downloadUrl: url,
			duration: 0, // This might be an issue if duration is needed upfront
			filesize: file.size,
			type: "audio" as const,
			channels: 1,
			bitrate: 0,
			bitdepth: 0,
			samplerate: 0,
			username: "Me",
			tags: ["voiceover"],
			license: "CC0",
			created: new Date().toISOString(),
			downloads: 0,
			rating: 0,
			ratingCount: 0,
		};

		await addSoundToTimeline({ sound: soundEffect });
	};

	return (
		<>
			<ToolbarButton
				icon={<Mic size={18} />}
				tooltip={t("timeline.toolbar.recordVoiceover")}
				onClick={({ event }) => {
					event.stopPropagation();
					setIsRecordingOpen(true);
				}}
			/>
			<RecordingDialog
				isOpen={isRecordingOpen}
				onClose={() => setIsRecordingOpen(false)}
				mode="audio"
				onSave={handleSaveRecording}
			/>
		</>
	)
}

function SceneSelector() {
	const { t } = useTranslation();
	const editor = useEditor();
	const currentScene = editor.scenes.getActiveScene();

	return (
		<div>
			<SplitButton className="border-foreground/10 border">
				<SplitButtonLeft>{currentScene?.name || t("timeline.toolbar.noScene")}</SplitButtonLeft>
				<SplitButtonSeparator />
				<ScenesView>
					<SplitButtonRight onClick={() => { }} type="button">
						<Layers className="size-4" />
					</SplitButtonRight>
				</ScenesView>
			</SplitButton>
		</div>
	);
}

function ToolbarRightSection({
	zoomLevel,
	minZoom,
	onZoomChange,
	onZoom,
}: {
	zoomLevel: number;
	minZoom: number;
	onZoomChange: (zoom: number) => void;
	onZoom: (options: { direction: "in" | "out" }) => void;
}) {
	const { t } = useTranslation();
	const {
		snappingEnabled,
		rippleEditingEnabled,
		toggleSnapping,
		toggleRippleEditing,
	} = useTimelineStore();

	return (
		<div className="flex items-center gap-1">
			<TooltipProvider delayDuration={500}>
				<ToolbarButton
					icon={<Magnet size={18} />}
					isActive={snappingEnabled}
					tooltip={t("timeline.toolbar.snapping")}
					onClick={() => toggleSnapping()}
				/>

				<ToolbarButton
					icon={<LinkIcon className="scale-110" size={18} />}
					isActive={rippleEditingEnabled}
					tooltip={t("timeline.toolbar.ripple")}
					onClick={() => toggleRippleEditing()}
				/>
			</TooltipProvider>

			<div className="bg-border mx-1 h-6 w-px" />

			<div className="flex items-center gap-1">
				<Button
					variant="text"
					size="icon"
					type="button"
					onClick={() => onZoom({ direction: "out" })}
				>
					<ZoomOut size={16} />
				</Button>
				<Slider
					className="w-28"
					value={[zoomToSlider({ zoomLevel, minZoom })]}
					onValueChange={(values) =>
						onZoomChange(sliderToZoom({ sliderPosition: values[0], minZoom }))
					}
					min={0}
					max={1}
					step={0.005}
				/>
				<Button
					variant="text"
					size="icon"
					type="button"
					onClick={() => onZoom({ direction: "in" })}
				>
					<ZoomIn size={16} />
				</Button>
			</div>
		</div>
	);
}

function ToolbarButton({
	icon,
	tooltip,
	onClick,
	disabled,
	isActive,
}: {
	icon: React.ReactNode;
	tooltip: string;
	onClick: ({ event }: { event: React.MouseEvent }) => void;
	disabled?: boolean;
	isActive?: boolean;
}) {
	return (
		<Tooltip delayDuration={200}>
			<TooltipTrigger asChild>
				<Button
					variant={isActive ? "secondary" : "text"}
					size="icon"
					type="button"
					onClick={(event) => onClick({ event })}
					className={cn(
						"rounded-sm",
						disabled ? "cursor-not-allowed opacity-50" : "",
					)}
				>
					{icon}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	);
}
