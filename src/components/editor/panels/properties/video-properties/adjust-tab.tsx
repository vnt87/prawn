import type { ImageElement, VideoElement } from "@/types/timeline";
import { cn } from "@/utils/ui";
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

            <PropertyGroup title="Color" defaultExpanded={true} hasBorderTop>
                <div className="space-y-6">
                    <AdjustSlider label="Temp" defaultValue={0} min={-100} max={100} trackGradient="linear-gradient(to right, #3b82f6, #f3f4f6, #eab308)" />
                    <AdjustSlider label="Tint" defaultValue={0} min={-100} max={100} trackGradient="linear-gradient(to right, #22c55e, #f3f4f6, #d946ef)" />
                    <AdjustSlider label="Saturation" defaultValue={0} min={-100} max={100} trackGradient="linear-gradient(to right, #6b7280, #ef4444)" />
                </div>
            </PropertyGroup>

            <PropertyGroup title="Lightness" defaultExpanded={true} hasBorderTop>
                <div className="space-y-6">
                    <AdjustSlider label="Exposure" defaultValue={0} min={-100} max={100} />
                    <AdjustSlider label="Contrast" defaultValue={0} min={-100} max={100} />
                    <AdjustSlider label="Highlight" defaultValue={0} min={-100} max={100} />
                    <AdjustSlider label="Shadow" defaultValue={0} min={-100} max={100} />
                    <AdjustSlider label="Whites" defaultValue={0} min={-100} max={100} />
                    <AdjustSlider label="Blacks" defaultValue={0} min={-100} max={100} />
                    <AdjustSlider label="Brilliance" defaultValue={0} min={-100} max={100} />
                </div>
            </PropertyGroup>

            <PropertyGroup title="Effects" defaultExpanded={true} hasBorderTop>
                <div className="space-y-6">
                    <AdjustSlider label="Sharpen" defaultValue={0} min={0} max={100} />
                    <AdjustSlider label="Clarity" defaultValue={0} min={0} max={100} />
                    <AdjustSlider label="Particles" defaultValue={0} min={0} max={100} />
                    <AdjustSlider label="Fade" defaultValue={0} min={0} max={100} />
                    <AdjustSlider label="Vignette" defaultValue={0} min={0} max={100} />
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

function AdjustSlider({
    label,
    defaultValue,
    min,
    max,
    trackGradient,
}: {
    label: string;
    defaultValue: number;
    min: number;
    max: number;
    trackGradient?: string;
}) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{label}</span>
                <div className="bg-secondary/50 rounded px-2 py-0.5 text-[10px] w-12 text-center">
                    {defaultValue}
                </div>
            </div>
            <div className="relative flex items-center h-4">
                {trackGradient && (
                    <div
                        className="absolute h-1 w-full rounded-full opacity-50"
                        style={{ background: trackGradient }}
                    />
                )}
                <Slider
                    defaultValue={[defaultValue]}
                    min={min}
                    max={max}
                    step={1}
                    className={cn("w-full", trackGradient && "z-10")}
                />
            </div>
        </div>
    );
}
