"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import "@/lib/i18n";
import i18n from "@/lib/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const language = useEditorStore((state) => state.language);

    useEffect(() => {
        if (i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, [language]);

    return <>{children}</>;
}
