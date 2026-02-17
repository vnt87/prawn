import { Button } from "./ui/button";
import Link from "next/link";
import { SOCIAL_LINKS } from "@/constants/site-constants";
import { Github, Bug } from "lucide-react";

export function GitHubContributeSection({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 text-center">
				<h3 className="text-2xl font-semibold">{title}</h3>
				<p className="text-muted-foreground">{description}</p>
			</div>
			<div className="flex flex-col justify-center gap-4 sm:flex-row">
				<Link
					href={`${SOCIAL_LINKS.github}/blob/main/.github/CONTRIBUTING.md`}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Button className="w-full" size="lg">
						<Github className="mr-2" />
						Start contributing
					</Button>
				</Link>
				<Link
					href={`${SOCIAL_LINKS.github}/issues`}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Button variant="outline" className="w-full" size="lg">
						<Bug className="mr-2" />
						Report issues
					</Button>
				</Link>
			</div>
		</div>
	);
}
