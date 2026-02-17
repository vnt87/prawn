import type { ImageElement, VideoElement } from "@/types/timeline";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
    PropertyGroup,
    PropertyItem,
    PropertyItemLabel,
} from "../property-item";

export function AudioTab({ element }: { element: VideoElement | ImageElement }) {
    return (
        <div className="flex flex-col pb-20">
            {/* Basic Audio Section */}
            <PropertyGroup title="Basic" defaultExpanded={true}>
                <div className="space-y-6">
                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <div className="flex justify-between">
                            <PropertyItemLabel>Volume</PropertyItemLabel>
                            <span className="text-xs">0.0dB</span>
                        </div>
                        <Slider defaultValue={[0]} min={-50} max={20} step={0.1} />
                    </PropertyItem>

                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <div className="flex justify-between">
                            <PropertyItemLabel>Fade in</PropertyItemLabel>
                            <span className="text-xs">0.0s</span>
                        </div>
                        <Slider defaultValue={[0]} max={5} step={0.1} />
                    </PropertyItem>

                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <div className="flex justify-between">
                            <PropertyItemLabel>Fade out</PropertyItemLabel>
                            <span className="text-xs">0.0s</span>
                        </div>
                        <Slider defaultValue={[0]} max={5} step={0.1} />
                    </PropertyItem>
                </div>
            </PropertyGroup>

            {/* Enhancements */}
            <PropertyGroup title="Enhancements" defaultExpanded={true} hasBorderTop collapsible={false}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm">Normalize loudness</span>
                            <span className="text-[10px] text-muted-foreground w-48">
                                Normalize the loudness of the selected clip or clips to a target level.
                            </span>
                        </div>
                        <Switch />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <span className="text-sm">Enhance voice</span>
                        <Switch />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <span className="text-sm">Video translator</span>
                        <Switch />
                    </div>
                </div>
            </PropertyGroup>
        </div>
    );
}
