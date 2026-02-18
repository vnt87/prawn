import type { ImageElement, VideoElement } from "@/types/timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicVideoTab } from "./basic-video-tab";
import { MaskTab } from "./mask-tab";
import { RemoveBgTab } from "./remove-bg-tab";

export function VideoTab({
	element,
	trackId,
}: {
	element: VideoElement | ImageElement;
	/** Track id passed down so sub-tabs can call editor.timeline.updateElements */
	trackId: string;
}) {
	return (
		<div className="flex flex-col h-full">
			<Tabs defaultValue="basic" className="w-full flex flex-col h-full">
				<div className="px-4 py-2">
					<TabsList className="w-full justify-start h-8 p-1 bg-secondary/50 gap-1 rounded-lg">
						<TabsTrigger
							value="basic"
							className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md text-xs h-6 px-2"
						>
							Basic
						</TabsTrigger>
						<TabsTrigger
							value="remove_bg"
							className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md text-xs h-6 px-2"
						>
							Remove BG
						</TabsTrigger>
						<TabsTrigger
							value="mask"
							className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md text-xs h-6 px-2"
						>
							Mask
						</TabsTrigger>
					</TabsList>
				</div>

				<div className="flex-1 overflow-y-auto">
					{/* Basic: transform, opacity, blend mode — fully wired */}
					<TabsContent value="basic" className="m-0 h-full">
						<BasicVideoTab element={element} trackId={trackId} />
					</TabsContent>
					{/* Remove BG: placeholder (requires AI) */}
					<TabsContent value="remove_bg" className="m-0 h-full">
						<RemoveBgTab element={element} trackId={trackId} />
					</TabsContent>
					{/* Mask: placeholder (P3+) */}
					<TabsContent value="mask" className="m-0 h-full">
						<MaskTab element={element} trackId={trackId} />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
