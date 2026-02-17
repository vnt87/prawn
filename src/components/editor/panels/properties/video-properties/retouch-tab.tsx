import type { ImageElement, VideoElement } from "@/types/timeline";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    RefreshIcon,
    ArrowDown01Icon,
    Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    PropertyGroup,
    PropertyItem,
    PropertyItemLabel,
} from "../property-item";
import { useState } from "react";
import { cn } from "@/utils/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RetouchTab({ element }: { element: VideoElement | ImageElement }) {

    return (
        <div className="flex flex-col pb-20 h-full">
            {/* Top Categories */}
            <div className="px-4 py-2">
                <div className="bg-secondary/50 p-1 rounded-lg flex gap-1">
                    {["Face", "Body", "Hair", "Face presets", "Body presets"].map(cat => (
                        <button key={cat} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap", cat === "Face" ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/50")}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 py-2">
                <div className="bg-secondary/30 rounded px-3 py-1.5 text-xs flex justify-between items-center cursor-pointer">
                    Single face
                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-3 opacity-50" />
                </div>
            </div>

            <ScrollArea className="flex-1">
                {/* Auto Styles */}
                <PropertyGroup title="Auto styles" defaultExpanded={true}
                    extraHeaderContent={
                        <div className="flex items-center gap-2 ml-auto">
                            <HugeiconsIcon icon={RefreshIcon} className="size-3.5 text-muted-foreground" />
                        </div>
                    }
                >
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        <StyleItem label="None" icon={Cancel01Icon} active />
                        <StyleItem label="Dolly Classic" image="/placeholder-face.png" />
                        <StyleItem label="Cherry Snow" image="/placeholder-face.png" />
                        <StyleItem label="Soda blue" image="/placeholder-face.png" />
                    </div>
                </PropertyGroup>

                <div className="h-px bg-border mx-4" />

                {/* Skin */}
                <PropertyGroup title="Skin" defaultExpanded={false}
                    extraHeaderContent={
                        <HugeiconsIcon icon={RefreshIcon} className="size-3.5 text-muted-foreground ml-auto" />
                    }
                >
                    <div className="h-4" />
                </PropertyGroup>
                <div className="h-px bg-border mx-4" />

                {/* Face */}
                <PropertyGroup title="Face" defaultExpanded={false}
                    extraHeaderContent={
                        <HugeiconsIcon icon={RefreshIcon} className="size-3.5 text-muted-foreground ml-auto" />
                    }
                >
                    <div className="h-4" />
                </PropertyGroup>
                <div className="h-px bg-border mx-4" />

                {/* Makeup */}
                <PropertyGroup title="Makeup" defaultExpanded={false}
                    extraHeaderContent={
                        <HugeiconsIcon icon={RefreshIcon} className="size-3.5 text-muted-foreground ml-auto" />
                    }
                >
                    <div className="h-4" />
                </PropertyGroup>
            </ScrollArea>

            <div className="p-4 border-t border-border mt-auto">
                <Button className="w-full" size="sm" variant="secondary" disabled>Save as preset</Button>
            </div>
        </div>
    );
}

function StyleItem({ label, icon, image, active }: { label: string, icon?: any, image?: string, active?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <div
                className={cn(
                    "size-14 rounded-lg border flex items-center justify-center transition-colors overflow-hidden relative",
                    active
                        ? "border-primary"
                        : "border-transparent bg-secondary"
                )}
            >
                {icon ? (
                    <HugeiconsIcon icon={icon} className="size-6 text-muted-foreground" />
                ) : (
                    <div className="w-full h-full bg-muted" /> // Placeholder for image
                )}
            </div>
            <span className={cn("text-[10px] text-center truncate w-full", active ? "text-primary" : "text-muted-foreground")}>
                {label}
            </span>
        </div>
    )
}
