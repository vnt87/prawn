// export async function GET() {
// 	try {
// 		const feed = new Feed({
// 			title: `${SITE_INFO.title}`,
// 			description: SITE_INFO.description,
// 			id: `${SITE_URL}`,
// 			link: `${SITE_URL}`,
// 			language: "en",
// 			image: `${SITE_INFO.openGraphImage}`,
// 			favicon: `${SITE_INFO.favicon}`,
// 			copyright: `All rights reserved ${new Date().getFullYear()}, ${
// 				SITE_INFO.title
// 			}`,
// 		});

// 		return new Response(feed.rss2(), {
// 			headers: {
// 				"Content-Type": "text/xml",
// 				"Cache-Control": "public, max-age=86400, stale-while-revalidate",
// 			},
// 		});
// 	} catch (error) {
// 		console.error("Error generating RSS feed", error);
// 		return new Response("Internal Server Error", { status: 500 });
// 	}
// }

export async function GET() {
	return new Response("RSS feed is currently disabled", { status: 404 });
}
