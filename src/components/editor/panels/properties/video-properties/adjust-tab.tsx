import type { ImageElement, VideoElement } from "@/types/timeline";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
    PropertyGroup,
    PropertyItem,
    PropertyItemLabel,
} from "../property-item";

export function AdjustTab({ element }: { element: VideoElement | ImageElement }) {
    return (
        <div className="flex flex-col pb-20">
            <PropertyGroup title="Basic" defaultExpanded={true}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Auto adjust</span>
                        <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm">Color match</span>
                        <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm">Color correction</span>
                        <Switch />
                    </div>
                </div>
            </PropertyGroup>

            <PropertyGroup title="LUT" defaultExpanded={true} hasBorderTop>
                <div className="space-y-4">
                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <PropertyItemLabel>Name</PropertyItemLabel>
                        <div className="bg-secondary px-3 py-2 rounded text-xs">None</div>
                    </PropertyItem>

                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <div className="flex justify-between">
                            <PropertyItemLabel>Intensity</PropertyItemLabel>
                            <span className="text-xs">100</span>
                        </div>
                        <Slider defaultValue={[100]} max={100} step={1} />
                    </PropertyItem>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm">Protect skin tone</span>
                        </div>
                        <Switch />
                    </div>
                </div>
            </PropertyGroup>
        </div>
    );
}
