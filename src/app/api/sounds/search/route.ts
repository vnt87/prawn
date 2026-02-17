import { type NextRequest, NextResponse } from "next/server";

const FREESOUND_API_URL = "https://freesound.org/apiv2";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const apiKey = request.headers.get("X-Freesound-ApiKey") || process.env.FREESOUND_API_KEY;
    const clientId = request.headers.get("X-Freesound-ClientId") || process.env.FREESOUND_CLIENT_ID;

    if (!apiKey) {
        return NextResponse.json({ error: "Freesound API Key missing" }, { status: 401 });
    }

    try {
        // Construct the Freesound API URL
        const url = new URL(`${FREESOUND_API_URL}/search/text/`);

        // Map our incoming search params to Freesound's params
        url.searchParams.set("token", apiKey);

        const q = searchParams.get("q") || "";
        url.searchParams.set("query", q);

        const page = searchParams.get("page") || "1";
        url.searchParams.set("page", page);

        const pageSize = searchParams.get("page_size") || "20";
        url.searchParams.set("page_size", pageSize);

        const sort = searchParams.get("sort") || "score";
        url.searchParams.set("sort", sort);

        // Important: fields we need for our SoundEffect type
        url.searchParams.set("fields", "id,name,description,url,previews,duration,filesize,type,channels,bitrate,bitdepth,samplerate,username,tags,license,created,num_downloads,rating,num_ratings");

        const commercialOnly = searchParams.get("commercial_only") === "true";
        if (commercialOnly) {
            url.searchParams.set("filter", "license:\"Creative Commons 0\" OR license:\"Attribution\"");
        }

        const response = await fetch(url.toString());
        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        // Transform Freesound response to our internal SoundEffect type
        const transformedResults = data.results.map((result: any) => ({
            id: result.id,
            name: result.name,
            description: result.description,
            url: result.url,
            previewUrl: result.previews?.["preview-hq-mp3"] || result.previews?.["preview-lq-mp3"],
            downloadUrl: result.url, // Freesound doesn't give a direct download link without OAuth
            duration: result.duration,
            filesize: result.filesize,
            type: result.type,
            channels: result.channels,
            bitrate: result.bitrate,
            bitdepth: result.bitdepth,
            samplerate: result.samplerate,
            username: result.username,
            tags: result.tags,
            license: result.license,
            created: result.created,
            downloads: result.num_downloads,
            rating: result.rating,
            ratingCount: result.num_ratings,
        }));

        return NextResponse.json({
            ...data,
            results: transformedResults,
        });
    } catch (error) {
        console.error("Freesound proxy error:", error);
        return NextResponse.json({ error: "Failed to fetch from Freesound" }, { status: 500 });
    }
}
