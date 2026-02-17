import type { ImageElement, VideoElement } from "@/types/timeline";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
    Palette,
    Eraser,
    RefreshCcw,
    ChevronDown,
    Wand2,
} from "lucide-react";
import {
    PropertyGroup,
    PropertyItem,
    PropertyItemLabel,
} from "../property-item";
import { useState } from "react";
import { cn } from "@/utils/ui";

export function RemoveBgTab({ element }: { element: VideoElement | ImageElement }) {
    const [removalType, setRemovalType] = useState<"auto" | "custom" | "chroma" | null>("auto");
    const [customTool, setCustomTool] = useState<"brush_plus" | "eraser_plus" | "brush" | "eraser">("brush_plus");

    return (
        <div className="flex flex-col pb-20">
            {/* Auto Removal */}
            <div className="px-4 py-3 flex items-center gap-2">
                <Switch id="auto-removal" />
                <label htmlFor="auto-removal" className="text-xs font-medium flex items-center gap-1 cursor-pointer">
                    Auto removal
                </label>
            </div>

            <div className="h-px bg-border mx-4" />

            {/* Custom Removal */}
            <PropertyGroup title="Custom removal" defaultExpanded={true} collapsible={true}
                extraHeaderContent={
                    <RefreshCcw className="size-3.5 text-muted-foreground ml-auto" />
                }
            >
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <ToolButton
                            icon={Wand2}
                            active={customTool === "brush_plus"}
                            onClick={() => setCustomTool("brush_plus")}
                        />
                        <ToolButton
                            icon={Eraser}
                            active={customTool === "eraser_plus"}
                            onClick={() => setCustomTool("eraser_plus")}
                        />
                        <div className="w-px h-8 bg-border mx-1" />
                        <ToolButton
                            icon={Palette}
                            active={customTool === "brush"}
                            onClick={() => setCustomTool("brush")}
                        />
                        <ToolButton
                            icon={Eraser}
                            active={customTool === "eraser"}
                            onClick={() => setCustomTool("eraser")}
                        />
                    </div>

                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <div className="flex justify-between">
                            <PropertyItemLabel>Size</PropertyItemLabel>
                            <div className="flex items-center gap-2">
                                <div className="bg-secondary px-2 py-0.5 rounded text-[10px] min-w-[30px] text-center">20</div>
                                <div className="flex flex-col -gap-1">
                                    <ChevronDown className="size-2 text-muted-foreground rotate-180" />
                                    <ChevronDown className="size-2 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                        <Slider defaultValue={[20]} max={100} step={1} />
                        <div className="flex justify-end mt-2">
                            <Button size="sm" variant="secondary" className="h-7 text-xs" disabled>Apply</Button>
                        </div>
                    </PropertyItem>
                </div>
            </PropertyGroup>

            <div className="h-px bg-border mx-4" />

            {/* Chroma Key */}
            <PropertyGroup title="Chroma key" defaultExpanded={false} collapsible={true}>
                {/* Content would go here if expanded */}
                <div className="h-4" />
            </PropertyGroup>
        </div>
    );
}

function ToolButton({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) {
    return (
        <button
            className={cn(
                "size-8 rounded flex items-center justify-center transition-colors relative",
                active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
            onClick={onClick}
        >
            <Icon className="size-4" />
        </button>
    )
}
