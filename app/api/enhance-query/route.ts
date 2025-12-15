import { NextResponse } from "next/server";
import { getFlashLiteModel } from "@/lib/gemini";

// Force dynamic rendering - prevents Next.js from trying to execute this during build
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Prompt to enhance/optimize the search query
    const enhancePrompt = `You are a search query optimizer for a media library that contains movies, series, anime, books, comics, manga, manhwa, manhua, webtoons, donghua, aeni, animation, hentai, games, persons, and franchises.

Your task is to take a natural language search query and extract the most important keywords and concepts for semantic vector search.

User's Original Query: "${query}"

Instructions:
1. Extract key themes, genres, plot elements, character types, and descriptors
2. Include ALL content types - both SFW and NSFW content are acceptable
3. Remove filler words like "I want", "looking for", "can you find", "show me"
4. Keep specific names (actors, directors, titles, authors)
5. Include mature content descriptors if relevant (e.g., "nudity", "explicit", "sex scenes", "violence", "gore", "mature themes")
6. Keep the query concise but comprehensive (aim for 5-15 keywords/phrases)
7. Return ONLY the enhanced query string as plain text, nothing else - no explanations, no markdown, no quotes

Enhanced Query:`;

    const result = await getFlashLiteModel().generateContent(enhancePrompt);
    const enhancedQuery = result.response.text().trim();

    return NextResponse.json({
      original: query,
      enhanced: enhancedQuery,
    });
  } catch (error: any) {
    console.error("Error enhancing query:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enhance query" },
      { status: 500 }
    );
  }
}
