import type { ImageElement, VideoElement } from "@/types/timeline";
import {
    PropertyGroup,
    PropertyItem,
} from "../property-item";

export function AnimationTab({ element }: { element: VideoElement | ImageElement }) {
    return (
        <div className="flex flex-col pb-20">
            <PropertyGroup title="In" defaultExpanded={true}>
                <div className="p-4 text-center text-muted-foreground text-sm">
                    No animations available
                </div>
            </PropertyGroup>

            <PropertyGroup title="Out" defaultExpanded={false}>
                <div className="p-4 text-center text-muted-foreground text-sm">
                    No animations available
                </div>
            </PropertyGroup>

            <PropertyGroup title="Combo" defaultExpanded={false}>
                <div className="p-4 text-center text-muted-foreground text-sm">
                    No animations available
                </div>
            </PropertyGroup>
        </div>
    );
}
