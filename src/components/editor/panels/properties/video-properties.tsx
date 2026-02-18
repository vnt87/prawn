import type { ImageElement, VideoElement } from "@/types/timeline";
import { useEditor } from "@/hooks/use-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTab } from "./video-properties/info-tab";
import { VideoTab } from "./video-properties/video-tab";
import { AudioTab } from "./video-properties/audio-tab";
import { SpeedTab } from "./video-properties/speed-tab";
import { AnimationTab } from "./video-properties/animation-tab";
import { AdjustTab } from "./video-properties/adjust-tab";

export function VideoProperties({
	_element: element,
	trackId,
}: {
	_element: VideoElement | ImageElement;
	/** Track id needed to call editor.timeline.updateElements */
	trackId: string;
}) {
	const editor = useEditor();
	const asset = editor.media.getAssets().find((a) => a.id === element.mediaId);

	if (!asset) {
		return <div className="p-4 text-muted-foreground text-sm">Asset not found</div>;
	}

	return (
		<div className="flex flex-col h-full">
			<Tabs defaultValue="video" className="w-full flex flex-col h-full">
				<div className="px-2 pt-2 border-b">
					<TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-4">
						<TabsTrigger
							value="video"
							className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground rounded-none px-0 pb-2 bg-transparent h-auto"
						>
							Video
						</TabsTrigger>
						<TabsTrigger
							value="audio"
							className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground rounded-none px-0 pb-2 bg-transparent h-auto"
						>
							Audio
						</TabsTrigger>
						<TabsTrigger
							value="speed"
							className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground rounded-none px-0 pb-2 bg-transparent h-auto"
						>
							Speed
						</TabsTrigger>
						<TabsTrigger
							value="animation"
							className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground rounded-none px-0 pb-2 bg-transparent h-auto"
						>
							Animation
						</TabsTrigger>
						<TabsTrigger
							value="adjust"
							className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground rounded-none px-0 pb-2 bg-transparent h-auto"
						>
							Adjust
						</TabsTrigger>
						<TabsTrigger
							value="info"
							className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground rounded-none px-0 pb-2 bg-transparent h-auto"
						>
							Info
						</TabsTrigger>
					</TabsList>
				</div>

				<div className="flex-1 overflow-y-auto">
					<TabsContent value="video" className="m-0 h-full">
						{/* trackId threaded to all sub-tabs for updateElements calls */}
						<VideoTab element={element} trackId={trackId} />
					</TabsContent>
					<TabsContent value="audio" className="m-0 h-full">
						<AudioTab element={element} trackId={trackId} />
					</TabsContent>
					<TabsContent value="speed" className="m-0 h-full">
						<SpeedTab element={element} trackId={trackId} />
					</TabsContent>
					<TabsContent value="animation" className="m-0 h-full">
						<AnimationTab element={element} trackId={trackId} />
					</TabsContent>
					<TabsContent value="adjust" className="m-0 h-full">
						<AdjustTab element={element} trackId={trackId} />
					</TabsContent>
					<TabsContent value="info" className="m-0 h-full">
						<InfoTab element={element} />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
