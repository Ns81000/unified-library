import { NextResponse } from "next/server";
import { getFlashModel } from "@/lib/gemini";

// Force dynamic rendering - prevents Next.js from trying to execute this during build
export const dynamic = 'force-dynamic';

const AI_ENRICHMENT_PROMPT = `You are an expert media research analyst with access to real-time web search. Your task is to search the web and gather the most accurate, up-to-date information for the following item.

**CRITICAL INSTRUCTIONS:**
1. **MUST SEARCH THE WEB:** Use your web search capabilities to find current, accurate information about this item. Do not rely solely on training data.
2. **VERIFY INFORMATION:** Cross-reference multiple sources to ensure accuracy.
3. **FIND COVER IMAGE:** Search for and provide a direct, high-quality image URL (.jpg or .png) for the coverImageUrl field.
4. **COMPREHENSIVE KEYWORDS:** Generate 10-15 diverse, specific keywords including: themes, genres, plot elements, cast/creators, content warnings (e.g., 'nudity', 'violence', 'mature content').
5. **JSON ONLY:** Your entire response MUST be a single, valid JSON object. No markdown, no explanations, just the JSON starting with { and ending with }.

**Item to Research:**
- Title: "{{TITLE}}"
- Type: "{{TYPE}}"

**Required JSON Structure:**
{
  "title": "The official title",
  "type": "The item type you were given (e.g., MOVIE, ANIME, BOOK, PERSON, PORNSTAR, MANHWA, DONGHUA, WEBTOON)",
  "coverImageUrl": "A direct URL to a high-quality cover image found via web search.",
  "synopsis": "A detailed summary of the plot or content (3-5 sentences), verified by web search. For PORNSTAR type, this is the biography/description.",
  "keywords": ["Generate 10-15 diverse keywords. Examples: 'cyberpunk', 'artificial intelligence', 'dystopian future', 'Keanu Reeves', 'plot twist', 'mature content', 'violence', 'drug use'."],
  "metadata": {
    // This object should ONLY contain fields relevant to the item's type. Fill with null if unknown.
    // Movie/Series/Anime/Donghua/Aeni/Animation/Hentai: "releaseYear": YYYY, "director": "Director Name", "mainActors": ["Actor 1"], "genres": ["Genre 1"], "studio": "Studio Name", "episodes": Number (for series/anime)
    // Book/Comic/Manga/Manhwa/Manhua/Webtoon: "author": "Author Name", "artist": "Artist Name", "publicationYear": YYYY, "pages": Number, "genres": ["Genre 1"], "publisher": "Publisher Name"
    // Game: "developer": "Studio", "publisher": "Publisher Name", "platforms": ["PC"], "releaseYear": YYYY, "genres": ["Genre 1"]
    // Person: "knownFor": "Acting/Directing/Writing", "birthYear": YYYY, "notableWorks": ["Work 1", "Work 2"]
    // Franchise: "creator": "Creator Name", "mediaTypes": ["Movie", "Book", "Game"]
    // Pornstar: "stageName": "Stage Name" (same as title), "realName": "Real Name or null", "birthYear": YYYY or null, "nationality": "Country", "ethnicity": "Ethnicity", "debutYear": YYYY or null, "status": "Active/Retired/Deceased", "studios": ["Studio A"], "genres": ["Niche 1"], "awards": ["Award 1"], "physicalAttributes": {"hairColor": "Color", "eyeColor": "Color", "height": "5'7\" (170cm)", "measurements": "34C-24-36", "tattoos": "Description", "piercings": "Description"}
  }
}`;

export async function POST(request: Request) {
  try {
    const { title, type } = await request.json();

    if (!title || !type) {
      return NextResponse.json(
        { error: "Missing required fields: title and type" },
        { status: 400 }
      );
    }

    // Replace placeholders in prompt
    const prompt = AI_ENRICHMENT_PROMPT
      .replace("{{TITLE}}", title)
      .replace("{{TYPE}}", type);

    // Call Gemini API
    // Note: Gemini 2.0 Flash has built-in web search capabilities that activate
    // when the prompt explicitly requests web search and current information
    const result = await getFlashModel().generateContent(prompt);

    const response = result.response;

    // Check for safety blocking
    if (response.promptFeedback?.blockReason) {
      return NextResponse.json(
        {
          error: `AI processing failed due to content policy: ${response.promptFeedback.blockReason}. Please add details manually.`,
        },
        { status: 422 }
      );
    }

    // Check if finish reason is SAFETY
    if (response.candidates?.[0]?.finishReason === "SAFETY") {
      return NextResponse.json(
        {
          error: "AI processing failed due to content policy. Please add details manually.",
        },
        { status: 422 }
      );
    }

    const text = response.text();

    // Parse JSON from response
    let data;
    try {
      // Try to extract JSON if it's wrapped in markdown
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        data = JSON.parse(text);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", text);
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!data.title || !data.type || !data.synopsis) {
      return NextResponse.json(
        { error: "Invalid AI response structure" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in auto-fill:", error);

    // Check for specific error types
    if (error.message?.includes("SAFETY")) {
      return NextResponse.json(
        {
          error: "AI processing failed due to content policy. Please add details manually.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to auto-fill data" },
      { status: 500 }
    );
  }
}
