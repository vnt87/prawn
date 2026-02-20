import { create } from "zustand";

type DialogType = "delete" | "shortcuts" | "integrations" | "about" | "command-palette" | "project-settings" | "faceswap" | null;
type IntegrationsTab = "database" | "assets" | "storage" | "ai" | null;

interface DialogState {
    openDialog: DialogType;
    setOpenDialog: (dialog: DialogType) => void;

    // For integrations dialog - which tab to open
    integrationsTab: IntegrationsTab;
    setIntegrationsTab: (tab: IntegrationsTab) => void;

    // Convenience method to open integrations with a specific tab
    openIntegrationsDialog: (tab?: IntegrationsTab) => void;
}

export const useDialogStore = create<DialogState>((set) => ({
    openDialog: null,
    setOpenDialog: (dialog) => set({ openDialog: dialog }),

    integrationsTab: null,
    setIntegrationsTab: (tab) => set({ integrationsTab: tab }),

    openIntegrationsDialog: (tab = null) => set({
        openDialog: "integrations",
        integrationsTab: tab
    }),
}));
