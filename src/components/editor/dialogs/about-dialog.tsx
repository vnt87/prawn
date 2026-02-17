import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import ShrimpIcon from "@/components/shrimp-icon";

interface AboutDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ isOpen, onOpenChange }: AboutDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4">
                    <DialogTitle>About NVAI Video Editor</DialogTitle>
                </DialogHeader>

                <DialogBody className="p-0 gap-0">
                    <div className="flex flex-col items-center pt-8 pb-6 px-6 text-center">
                        <div className="bg-[#4a90e2] flex size-24 items-center justify-center rounded-[24px] mb-6 shadow-lg">
                            <ShrimpIcon className="text-white size-14" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-bold tracking-tight">PRAWN</h3>
                            <p className="text-muted-foreground/60 text-sm font-mono tracking-widest uppercase">
                                Version {process.env.npm_package_version || "0.1.0"}
                            </p>
                        </div>
                        <div className="mt-4 space-y-1 text-muted-foreground/80 text-sm font-medium leading-relaxed">
                            <p>Powerful Multi-Track Video & Audio Editor</p>
                            <p>A web-based creative tool powered by NVAI</p>
                        </div>
                    </div>

                    <div className="px-8 pb-8">
                        <Separator className="mb-6 opacity-50" />

                        <div className="space-y-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground font-medium">Author</span>
                                <Link
                                    href="https://namvu.net"
                                    target="_blank"
                                    className="text-primary hover:underline inline-flex items-center gap-1.5 font-medium"
                                >
                                    Nam Vu <ExternalLink size={14} />
                                </Link>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground font-medium">Powered by</span>
                                <Link
                                    href="https://ffmpeg.org"
                                    target="_blank"
                                    className="text-primary hover:underline inline-flex items-center gap-1.5 font-medium"
                                >
                                    FFmpeg (WASM) <ExternalLink size={14} />
                                </Link>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground font-medium">GitHub</span>
                                <Link
                                    href="https://github.com/vnt87/prawn"
                                    target="_blank"
                                    className="text-primary hover:underline inline-flex items-center gap-1.5 font-medium"
                                >
                                    <Github size={14} className="mr-0.5" /> vnt87/prawn <ExternalLink size={14} />
                                </Link>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground font-medium">Upstream</span>
                                <Link
                                    href="https://github.com/OpenCut-app/OpenCut"
                                    target="_blank"
                                    className="text-primary hover:underline inline-flex items-center gap-1.5 font-medium"
                                >
                                    OpenCut <ExternalLink size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </DialogBody>

                <DialogFooter className="bg-muted/30 px-6 py-4">
                    <DialogClose asChild>
                        <Button className="min-w-[100px] bg-[#4a90e2] hover:bg-[#4a90e2]/90 text-white font-semibold">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
