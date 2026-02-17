import type { ImageElement, VideoElement } from "@/types/timeline";
import { useEditor } from "@/hooks/use-editor";
import {
    PropertyGroup,
    PropertyItem,
    PropertyItemLabel,
    PropertyItemValue,
} from "../property-item";

function formatDuration(duration: number) {
    const min = Math.floor(duration / 60);
    const sec = Math.floor(duration % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function InfoTab({ element }: { element: VideoElement | ImageElement }) {
    const editor = useEditor();
    const asset = editor.media.getAssets().find((a) => a.id === element.mediaId);

    if (!asset) {
        return <div className="p-4 text-muted-foreground text-sm">Asset not found</div>;
    }

    return (
        <div className="flex flex-col">
            <PropertyGroup title="Details" defaultExpanded={true} collapsible={false}>
                <div className="space-y-4">
                    <PropertyItem>
                        <PropertyItemLabel>Name</PropertyItemLabel>
                        <PropertyItemValue className="text-right truncate pl-4">
                            {asset.name}
                        </PropertyItemValue>
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>Resolution</PropertyItemLabel>
                        <PropertyItemValue className="text-right">
                            {asset.width && asset.height
                                ? `${asset.width}x${asset.height}`
                                : "Unknown"}
                        </PropertyItemValue>
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>Frame rate</PropertyItemLabel>
                        <PropertyItemValue className="text-right">
                            {asset.fps ? `${asset.fps.toFixed(2)}fps` : "Unknown"}
                        </PropertyItemValue>
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>Duration</PropertyItemLabel>
                        <PropertyItemValue className="text-right">
                            {asset.duration ? formatDuration(asset.duration) : "Unknown"}
                        </PropertyItemValue>
                    </PropertyItem>
                </div>
            </PropertyGroup>
        </div>
    );
}
