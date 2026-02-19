import { create } from "zustand";
import type { MediaAsset } from "@/types/assets";

interface ClipRegion {
	inPoint: number; // Start time in seconds
	outPoint: number; // End time in seconds
}

interface AssetPreviewState {
	// The asset currently being previewed
	asset: MediaAsset | null;
	
	// Whether the preview dialog is open
	isOpen: boolean;
	
	// Clip marking state (for video/audio)
	clipRegion: ClipRegion | null;
	
	// Actions
	openPreview: (asset: MediaAsset) => void;
	closePreview: () => void;
	
	// Clip marking actions
	setInPoint: (time: number) => void;
	setOutPoint: (time: number) => void;
	clearClipRegion: () => void;
	
	// Convenience method to set full clip region
	setClipRegion: (region: ClipRegion) => void;
}

export const useAssetPreviewStore = create<AssetPreviewState>((set) => ({
	asset: null,
	isOpen: false,
	clipRegion: null,
	
	openPreview: (asset) => set({ 
		asset, 
		isOpen: true,
		// Initialize clip region to full duration
		clipRegion: asset.duration ? {
			inPoint: 0,
			outPoint: asset.duration,
		} : null,
	}),
	
	closePreview: () => set({ 
		asset: null, 
		isOpen: false,
		clipRegion: null,
	}),
	
	setInPoint: (time) => set((state) => {
		if (!state.clipRegion || !state.asset) return state;
		const clampedTime = Math.max(0, Math.min(time, state.clipRegion.outPoint - 0.1));
		return {
			clipRegion: {
				...state.clipRegion,
				inPoint: clampedTime,
			},
		};
	}),
	
	setOutPoint: (time) => set((state) => {
		if (!state.clipRegion || !state.asset) return state;
		const maxDuration = state.asset.duration || time;
		const clampedTime = Math.max(state.clipRegion.inPoint + 0.1, Math.min(time, maxDuration));
		return {
			clipRegion: {
				...state.clipRegion,
				outPoint: clampedTime,
			},
		};
	}),
	
	clearClipRegion: () => set((state) => {
		if (!state.asset?.duration) return { clipRegion: null };
		return {
			clipRegion: {
				inPoint: 0,
				outPoint: state.asset.duration,
			},
		};
	}),
	
	setClipRegion: (region) => set({ clipRegion: region }),
}));