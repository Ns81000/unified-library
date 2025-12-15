import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEmbedding, getFlashLiteModel } from "@/lib/gemini";
import { queryEmbeddings } from "@/lib/chromadb";

// Force dynamic rendering - prevents Next.js from trying to execute this during build
export const dynamic = 'force-dynamic';

// Relevance threshold: lower distance = more similar
// Typical ranges: 0.0 (identical) to 1.5+ (very different)
const RELEVANCE_THRESHOLD = 0.7;  // Only return top 2-3 most relevant items
const MAX_RESULTS = 3;  // Maximum number of items to return (to avoid excessive API calls)

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    console.log("=== AI SEARCH DEBUG ===");
    console.log("Query:", query);

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    console.log("Query embedding generated, length:", queryEmbedding.length);

    // Search ChromaDB for similar items
    const { ids, distances } = await queryEmbeddings(queryEmbedding, 10);
    console.log("ChromaDB results:");
    console.log("- Found IDs:", ids);
    console.log("- Distances:", distances);

    if (ids.length === 0) {
      console.log("No results found in ChromaDB");
      return NextResponse.json([]);
    }

    // Filter by relevance threshold - only keep highly relevant items
    const relevantIndices = distances
      .map((distance, index) => ({ distance, index }))
      .filter(({ distance }) => distance <= RELEVANCE_THRESHOLD)
      .slice(0, MAX_RESULTS)  // Limit to top N results
      .map(({ index }) => index);

    console.log(`Filtering: ${ids.length} results → ${relevantIndices.length} relevant items (threshold: ${RELEVANCE_THRESHOLD}, max: ${MAX_RESULTS})`);

    if (relevantIndices.length === 0) {
      console.log("No items passed relevance threshold");
      return NextResponse.json([]);
    }

    // Get only relevant IDs and distances
    const relevantIds = relevantIndices.map(i => ids[i]);
    const relevantDistances = relevantIndices.map(i => distances[i]);

    // Fetch full item data from PostgreSQL (only for relevant items)
    const items = await prisma.item.findMany({
      where: {
        id: {
          in: relevantIds,
        },
      },
    });

    console.log("Found items in database:", items.length);

    // Sort items to match the order from ChromaDB (only relevant items)
    const sortedItems = relevantIds
      .map((id) => items.find((item: any) => item.id === id))
      .filter((item): item is NonNullable<typeof item> => item !== undefined);

    console.log("Sorted items:", sortedItems.length);
    console.log("Items with distances:");
    sortedItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title} - Distance: ${relevantDistances[index]?.toFixed(4)}`);
    });

    // OPTIMIZATION: Generate explanations for ALL items in ONE batch API call (50% API reduction!)
    let itemsWithExplanations;
    
    try {
      // Build batch prompt with all items
      const batchPrompt = `A user searched for: "${query}"

These ${sortedItems.length} items were found in their library. For EACH item below, provide a brief 1-2 sentence explanation of why it matches the search query. Be specific and mention relevant themes, genres, or elements.

${sortedItems.map((item, index) => `
ITEM ${index + 1}:
Title: ${item.title}
Type: ${item.type}
Synopsis: ${item.synopsis}
Keywords: ${item.keywords.join(", ")}
Metadata: ${JSON.stringify(item.metadata)}
`).join("\n")}

Return your response as a JSON array with this exact format (no markdown formatting, no code blocks):
[
  {"explanation": "Your explanation for Item 1"},
  {"explanation": "Your explanation for Item 2"}${sortedItems.length > 2 ? ',\n  {"explanation": "Your explanation for Item 3"}' : ''}
]`;

      console.log("Generating batch explanations for", sortedItems.length, "items in ONE API call");
      
      const result = await getFlashLiteModel().generateContent(batchPrompt);
      const responseText = result.response.text();
      
      console.log("Raw AI response:", responseText.substring(0, 200) + "...");
      
      // Extract JSON from response (in case it's wrapped in markdown)
      let explanations;
      try {
        // Try to find JSON array in response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          explanations = JSON.parse(jsonMatch[0]);
        } else {
          explanations = JSON.parse(responseText);
        }
        
        console.log("Successfully parsed", explanations.length, "explanations from batch response");
      } catch (parseError) {
        console.error("Failed to parse batch explanations:", parseError);
        console.error("Response text:", responseText);
        // Fallback: generic explanations
        explanations = sortedItems.map(() => ({ 
          explanation: "This item matches your search query based on its content and themes." 
        }));
      }
      
      // Map explanations back to items
      itemsWithExplanations = sortedItems.map((item, index) => ({
        ...item,
        explanation: explanations[index]?.explanation || "This item matches your search.",
        relevanceScore: relevantDistances[index],
      }));

      console.log("Generated batch explanations successfully");
      
    } catch (error) {
      console.error("Error generating batch explanations:", error);
      
      // Fallback: return items with generic explanations
      itemsWithExplanations = sortedItems.map((item, index) => ({
        ...item,
        explanation: "This item matches your search query.",
        relevanceScore: relevantDistances[index],
      }));
      
      console.log("Using fallback generic explanations due to error");
    }

    console.log("Total explanations:", itemsWithExplanations.length);
    console.log("=== AI SEARCH COMPLETE ===")

    return NextResponse.json(itemsWithExplanations);
  } catch (error) {
    console.error("Error during AI search:", error);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 }
    );
  }
}
