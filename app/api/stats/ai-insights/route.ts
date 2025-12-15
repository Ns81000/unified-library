import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFlashLiteModel } from "@/lib/gemini";

// Force dynamic rendering - prevents Next.js from trying to execute this during build
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Fetch all items
    const items = await prisma.item.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        metadata: true,
        keywords: true,
        coverImage: true,
      },
    });

    // Create compressed stats summary for Gemini
    const typeCounts = items.reduce((acc: Record<string, number>, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    // Extract top people (directors, actors, authors, artists)
    const peopleFrequency: Record<string, number> = {};
    items.forEach((item) => {
      const metadata = item.metadata as any;
      if (!metadata) return;

      ['director', 'directors', 'mainActor', 'mainActors', 'author', 'authors', 'artist', 'artists'].forEach((field) => {
        const value = metadata[field];
        if (value) {
          const people = Array.isArray(value) ? value : [value];
          people.forEach((person: string) => {
            peopleFrequency[person] = (peopleFrequency[person] || 0) + 1;
          });
        }
      });
    });

    const topPeople = Object.entries(peopleFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Extract top genres
    const genreFrequency: Record<string, number> = {};
    items.forEach((item) => {
      const metadata = item.metadata as any;
      if (!metadata) return;

      const genres = metadata.genres || metadata.genre;
      if (genres) {
        const genreList = Array.isArray(genres) ? genres : [genres];
        genreList.forEach((genre: string) => {
          genreFrequency[genre] = (genreFrequency[genre] || 0) + 1;
        });
      }
    });

    const topGenres = Object.entries(genreFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Quality metrics
    const withCovers = items.filter(item => item.coverImage).length;
    const withKeywords = items.filter(item => item.keywords.length > 0).length;
    const totalItems = items.length;
    const qualityScore = totalItems > 0
      ? Math.round(((withCovers + withKeywords) / (totalItems * 2)) * 100)
      : 0;

    // Extract all titles for missing gem detection (for backend filtering, not sent to AI)
    const allTitles = items.map(item => item.title.toLowerCase());

    // Prepare compressed data for Gemini
    const statsData = {
      totalItems,
      typeCounts,
      topPeople: topPeople.slice(0, 5),
      topGenres: topGenres.slice(0, 5),
      qualityScore,
      missingCovers: totalItems - withCovers,
      missingKeywords: totalItems - withKeywords,
      uniqueGenres: Object.keys(genreFrequency).length,
    };

    // Call Gemini for insights
    const model = getFlashLiteModel();

    const prompt = `You are an AI assistant analyzing a personal media library. Generate exactly 5 short, insightful, and actionable bullet points about this collection. Be specific, use emojis, and make it personal and engaging.

Library Stats:
- Total Items: ${statsData.totalItems}
- Type Distribution: ${Object.entries(statsData.typeCounts).map(([type, count]) => `${type}: ${count}`).join(', ')}
- Top 5 Genres: ${statsData.topGenres.map(g => `${g.name} (${g.count})`).join(', ')}
- Top 5 People (directors/actors/authors): ${statsData.topPeople.map(p => `${p.name} (${p.count})`).join(', ')}
- Quality Score: ${statsData.qualityScore}%
- Missing Covers: ${statsData.missingCovers}
- Missing Keywords: ${statsData.missingKeywords}
- Unique Genres: ${statsData.uniqueGenres}

Generate exactly 5 bullet points following these guidelines:
1. Collection personality/focus (e.g., "You're a cinema buff..." or "Your collection screams anime lover...")
2. Creator/talent loyalty or pattern observation
3. Actionable quality improvement suggestion
4. Genre diversity or exploration recommendation
5. Unique insight or hidden gem observation

Format: Each line should start with a bullet point (•) and be max 100 characters. Be enthusiastic and personal!`;

    const result = await model.generateContent(prompt);
    const insights = result.response.text();

    // Call Gemini for missing gems (specific recommendations)
    // Note: We ask for 10 suggestions and filter duplicates on backend to save tokens
    const gemPrompt = `Based on this media library, suggest 10 specific missing items that would fit perfectly. Be very specific with titles and years.

Library Data:
- Collection Focus: ${Object.entries(statsData.typeCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0][0]}
- Top Creators: ${statsData.topPeople.map(p => p.name).join(', ')}
- Top Genres: ${statsData.topGenres.map(g => g.name).join(', ')}

Rules:
1. Suggest items that match the user's taste based on their top creators and genres
2. Be VERY specific: include exact title and year
3. Format: "Title (Year) - Brief reason why"
4. Vary the suggestions - don't just suggest from the same director/series

Generate exactly 10 suggestions, one per line.`;

    const gemResult = await model.generateContent(gemPrompt);
    const gemText = gemResult.response.text();
    
    // Filter out duplicates from AI suggestions (backend filtering to save tokens)
    const suggestions = gemText.split('\n').filter((line: string) => line.trim());
    const uniqueSuggestions: string[] = [];
    
    for (const suggestion of suggestions) {
      // Extract title from format "Title (Year) - reason"
      const titleMatch = suggestion.match(/^[•\-\*\d\.]*\s*(.+?)\s*\((\d{4})\)/);
      if (titleMatch) {
        const title = titleMatch[1].trim().toLowerCase();
        // Check if this title already exists in library
        const isDuplicate = allTitles.some(existingTitle => 
          existingTitle.includes(title) || title.includes(existingTitle)
        );
        if (!isDuplicate && uniqueSuggestions.length < 3) {
          uniqueSuggestions.push(suggestion);
        }
      }
    }
    
    // If we don't have 3 unique suggestions, add remaining ones anyway
    if (uniqueSuggestions.length < 3) {
      suggestions.slice(0, 3 - uniqueSuggestions.length).forEach((s: string) => {
        if (!uniqueSuggestions.includes(s)) {
          uniqueSuggestions.push(s);
        }
      });
    }
    
    const missingGems = uniqueSuggestions.slice(0, 3).join('\n');

    return NextResponse.json({
      insights: insights.trim(),
      missingGems: missingGems.trim(),
      stats: statsData,
    });

  } catch (error) {
    console.error("Error generating AI insights:", error);
    return NextResponse.json(
      { error: "Failed to generate AI insights" },
      { status: 500 }
    );
  }
}
