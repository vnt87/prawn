import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IntegrationsState {
    // Database
    upstashRedisUrl: string;
    upstashRedisToken: string;

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
    sttServiceUrl: string;

    // Actions
    setIntegration: (key: keyof Omit<IntegrationsState, "setIntegration">, value: string) => void;
}

export const useIntegrationsStore = create<IntegrationsState>()(
    persist(
        (set) => ({
            upstashRedisUrl: "",
            upstashRedisToken: "",
            freesoundClientId: "",
            freesoundApiKey: "",
            cloudflareAccountId: "",
            r2AccessKeyId: "",
            r2SecretAccessKey: "",
            r2BucketName: "",
            modalTranscriptionUrl: "",
            sttServiceUrl: "",

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
