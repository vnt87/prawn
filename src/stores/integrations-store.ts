import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IntegrationsState {
    // Database
    upstashRedisUrl: string;
    upstashRedisToken: string;
    marbleWorkspaceKey: string;

    // Assets
    freesoundClientId: string;
    freesoundApiKey: string;

    // Storage
    cloudflareAccountId: string;
    r2AccessKeyId: string;
    r2SecretAccessKey: string;
    r2BucketName: string;

    // AI
    modalTranscriptionUrl: string;

    // Actions
    setIntegration: (key: keyof Omit<IntegrationsState, "setIntegration">, value: string) => void;
}

export const useIntegrationsStore = create<IntegrationsState>()(
    persist(
        (set) => ({
            upstashRedisUrl: "",
            upstashRedisToken: "",
            marbleWorkspaceKey: "",
            freesoundClientId: "",
            freesoundApiKey: "",
            cloudflareAccountId: "",
            r2AccessKeyId: "",
            r2SecretAccessKey: "",
            r2BucketName: "",
            modalTranscriptionUrl: "",

            setIntegration: (key, value) => {
                set((state) => ({
                    ...state,
                    [key]: value,
                }));
            },
        }),
        {
            name: "prawn-integrations",
        },
    ),
);
