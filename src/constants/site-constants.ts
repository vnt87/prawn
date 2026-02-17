import { OcDataBuddyIcon, } from "@nvai/ui/icons";

export const SITE_URL = "http://localhost:3000";

export const SITE_INFO = {
	title: "Video Audio Editor - Powered by NVAI",
	description:
		"A simple but powerful video editor that gets the job done. In your browser.",
	url: SITE_URL,
	openGraphImage: "/open-graph/default.jpg",
	twitterImage: "/open-graph/default.jpg",
	favicon: "/favicon.ico",
};

export type ExternalTool = {
	name: string;
	description: string;
	url: string;
	icon: React.ElementType;
};

export const EXTERNAL_TOOLS: ExternalTool[] = [
	{
		name: "Databuddy",
		description: "GDPR compliant analytics and user insights for NVAI",
		url: "https://databuddy.cc?utm_source=nvai",
		icon: OcDataBuddyIcon,
	},
];

export const DEFAULT_LOGO_URL = "/logos/nvai/svg/logo.svg";

export const SOCIAL_LINKS = {
	x: "https://x.com/nvai_app",
	github: "https://github.com/vnt87/prawn",
	discord: "https://discord.com/invite/Mu3acKZvCp",
};

export type Sponsor = {
	name: string;
	url: string;
	logo: string;
	description: string;
};

export const SPONSORS: Sponsor[] = [];
