import type { ImageElement, VideoElement } from "@/types/timeline";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
    RefreshCcw,
    Minus,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import {
    PropertyGroup,
    PropertyItem,
    PropertyItemLabel,
} from "../property-item";

export function BasicVideoTab({ element }: { element: VideoElement | ImageElement }) {
    return (
        <div className="flex flex-col pb-20">
            {/* Transform Section */}
            <PropertyGroup title="Transform" defaultExpanded={true}>
                <div className="space-y-4">
                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <div className="flex justify-between items-center">
                            <PropertyItemLabel>Scale</PropertyItemLabel>
                            <div className="flex items-center gap-1">
                                <div className="bg-secondary rounded px-2 py-0.5 text-xs w-16 text-right">
                                    100%
                                </div>
                                <div className="flex flex-col -gap-1">
                                    <ChevronUp
                                        className="size-2 text-muted-foreground cursor-pointer hover:text-foreground"
                                    />
                                    <ChevronDown
                                        className="size-2 text-muted-foreground cursor-pointer hover:text-foreground"
                                    />
                                </div>
                                <RefreshCcw
                                    className="size-3.5 text-muted-foreground cursor-pointer hover:text-foreground ml-1"
                                />
                            </div>
                        </div>
                        <Slider defaultValue={[100]} max={200} step={1} className="w-full" />
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>Uniform scale</PropertyItemLabel>
                        <Switch defaultChecked />
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>Position</PropertyItemLabel>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 bg-secondary rounded px-2 py-1 flex-1">
                                <span className="text-muted-foreground text-xs">X</span>
                                <input
                                    className="bg-transparent border-none outline-none text-xs w-full text-right"
                                    value="0"
                                    readOnly
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-secondary rounded px-2 py-1 flex-1">
                                <span className="text-muted-foreground text-xs">Y</span>
                                <input
                                    className="bg-transparent border-none outline-none text-xs w-full text-right"
                                    value="0"
                                    readOnly
                                />
                            </div>
                        </div>
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>Rotate</PropertyItemLabel>
                        <div className="flex items-center gap-2">
                            <div className="bg-secondary rounded px-2 py-0.5 text-xs w-16 text-right">
                                0.00°
                            </div>
                            <Button size="icon" variant="ghost" className="size-6 rounded-full">
                                <Minus className="size-3" />
                            </Button>
                        </div>
                    </PropertyItem>
                </div>
            </PropertyGroup>

            {/* Blend Section */}
            <PropertyGroup title="Blend" defaultExpanded={true} hasBorderTop>
                <div className="space-y-4">
                    <PropertyItem>
                        <PropertyItemLabel>Opacity</PropertyItemLabel>
                        <div className="flex items-center gap-2">
                            <Slider defaultValue={[100]} max={100} step={1} className="w-24" />
                            <span className="text-xs w-8 text-right">100%</span>
                        </div>
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>Mode</PropertyItemLabel>
                        <div className="bg-secondary rounded px-3 py-1 text-xs min-w-[100px] text-center cursor-pointer">
                            Normal
                        </div>
                    </PropertyItem>
                </div>
            </PropertyGroup>

            {/* Stabilize Section */}
            <PropertyGroup title="Stabilize" defaultExpanded={false} hasBorderTop collapsible={false}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Switch />
                        <span className="text-xs">Stabilize</span>
                    </div>
                </div>
            </PropertyGroup>
        </div>
    );
}
