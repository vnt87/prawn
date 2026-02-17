import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { SOCIAL_LINKS } from "@/constants/site-constants";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import ShrimpIcon from "@/components/shrimp-icon";

interface AboutDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ isOpen, onOpenChange }: AboutDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>About NVAI Video Editor</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="bg-primary/10 flex size-20 items-center justify-center rounded-2xl">
                            <ShrimpIcon className="text-primary size-10" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-semibold">NVAI Video Editor Project</h3>
                            <p className="text-muted-foreground text-sm font-medium">Codenamed PRAWN</p>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            A powerful, open-source video editor running entirely in your browser.
                        </p>
                    </div>

                    <Separator />

                    <div className="space-y-4 text-sm">
                        <div className="grid gap-2">
                            <h4 className="font-semibold">Author</h4>
                            <Link
                                href="https://namvu.net"
                                target="_blank"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                                Nam Vu <ExternalLink size={12} />
                            </Link>
                        </div>

                        <div className="grid gap-2">
                            <h4 className="font-semibold">Project Links</h4>
                            <div className="flex flex-col gap-1">
                                <Link
                                    href="https://github.com/vnt87/prawn"
                                    target="_blank"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                    GitHub Repository <ExternalLink size={12} />
                                </Link>
                                <Link
                                    href="https://github.com/vnt87/shrimp"
                                    target="_blank"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                    SHRIMP Image Editor (Ecosystem) <ExternalLink size={12} />
                                </Link>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <h4 className="font-semibold">Credits</h4>
                            <p className="text-muted-foreground">
                                This project is a fork of{" "}
                                <Link
                                    href="https://github.com/OpenCut-app/OpenCut"
                                    target="_blank"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                    OpenCut <ExternalLink size={12} />
                                </Link>
                                .
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <h4 className="font-semibold">Stack</h4>
                            <p className="text-muted-foreground text-xs">
                                Next.js • Bun • Tailwind CSS • Appwrite • Supabase • FFmpeg (WASM)
                            </p>
                        </div>
                    </div>

                    <div className="text-muted-foreground text-center text-xs">
                        v{process.env.npm_package_version || "0.1.0"}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
