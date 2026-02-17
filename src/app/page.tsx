"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { EditorCore } from "@/core";

export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            const editor = EditorCore.getInstance();

            // Load all projects from storage
            await editor.project.loadAllProjects();
            const projects = editor.project.getSavedProjects();

            if (projects.length > 0) {
                // Redirect to the most recently updated project
                router.replace(`/editor/${projects[0].id}`);
            } else {
                // Create a new project if none exist
                const newProjectId = await editor.project.createNewProject({
                    name: "Untitled Project",
                });
                router.replace(`/editor/${newProjectId}`);
            }
        };

        init();
    }, [router]);

    return (
        <div className="bg-background flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="text-muted-foreground size-8 animate-spin" />
                <p className="text-muted-foreground text-sm">Loading Video Audio Editor...</p>
            </div>
        </div>
    );
}
