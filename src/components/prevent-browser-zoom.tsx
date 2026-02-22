"use client";

import { useEffect } from "react";

/**
 * Prevents browser zoom (Ctrl/Cmd + scroll) across the entire application.
 * This ensures the web app behaves more like a native desktop application
 * where zoom controls are explicit rather than accidental.
 */
export function PreventBrowserZoom() {
	useEffect(() => {
		const preventZoom = (event: WheelEvent) => {
			// Only prevent zoom gestures (Ctrl or Cmd + wheel)
			if (event.ctrlKey || event.metaKey) {
				event.preventDefault();
			}
		};

		// Add listener with passive: false to allow preventDefault
		document.addEventListener("wheel", preventZoom, {
			passive: false,
			capture: true,
		});

		return () => {
			document.removeEventListener("wheel", preventZoom, {
				capture: true,
			});
		};
	}, []);

	return null;
}