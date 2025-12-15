import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearAllEmbeddings, addEmbedding } from "@/lib/chromadb";
import { generateEmbedding } from "@/lib/gemini";

// Force dynamic rendering - prevents Next.js from trying to execute this during build
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const items = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Request body must be an array of items" },
        { status: 400 }
      );
    }

    // WIPE: Delete all existing items from PostgreSQL
    await prisma.item.deleteMany({});

    // WIPE: Delete all embeddings from ChromaDB
    await clearAllEmbeddings();

    // LOOP & INSERT: Insert all items from backup
    let insertedCount = 0;

    for (const itemData of items) {
      try {
        // Insert item with original ID
        const item = await prisma.item.create({
          data: {
            id: itemData.id,
            title: itemData.title,
            type: itemData.type,
            coverImage: itemData.coverImage,
            synopsis: itemData.synopsis,
            keywords: itemData.keywords || [],
            metadata: itemData.metadata || {},
            notes: itemData.notes,
            createdAt: new Date(itemData.createdAt),
            updatedAt: new Date(itemData.updatedAt),
          },
        });

        // Regenerate and insert embedding
        try {
          const textForEmbedding = generateTextForEmbedding(item);
          const embedding = await generateEmbedding(textForEmbedding);
          await addEmbedding(item.id, embedding, { type: item.type }, textForEmbedding);
        } catch (embeddingError) {
          console.error(`Error creating embedding for item ${item.id}:`, embeddingError);
        }

        insertedCount++;
      } catch (itemError: any) {
        console.error(`Error restoring item:`, itemError);
        // Continue with next item
      }
    }

    return NextResponse.json({
      success: true,
      count: insertedCount,
      message: `Successfully restored ${insertedCount} items`,
    });
  } catch (error: any) {
    console.error("Error during restore:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restore backup" },
      { status: 500 }
    );
  }
}

// Helper function to generate text for embedding
function generateTextForEmbedding(item: any): string {
  const parts = [
    `Title: ${item.title}`,
    `Type: ${item.type}`,
    `Synopsis: ${item.synopsis}`,
  ];

  if (item.keywords && item.keywords.length > 0) {
    parts.push(`Keywords: ${item.keywords.join(", ")}`);
  }

  if (item.metadata) {
    // Special handling for PORNSTAR type to include relevant fields
    if (item.type === "PORNSTAR") {
      const pornstarParts = [];
      if (item.metadata.stageName) pornstarParts.push(`Stage Name: ${item.metadata.stageName}`);
      if (item.metadata.realName) pornstarParts.push(`Real Name: ${item.metadata.realName}`);
      if (item.metadata.nationality) pornstarParts.push(`Nationality: ${item.metadata.nationality}`);
      if (item.metadata.ethnicity) pornstarParts.push(`Ethnicity: ${item.metadata.ethnicity}`);
      if (item.metadata.studios && item.metadata.studios.length > 0) {
        pornstarParts.push(`Studios: ${item.metadata.studios.join(", ")}`);
      }
      if (item.metadata.genres && item.metadata.genres.length > 0) {
        pornstarParts.push(`Genres: ${item.metadata.genres.join(", ")}`);
      }
      if (item.metadata.awards && item.metadata.awards.length > 0) {
        pornstarParts.push(`Awards: ${item.metadata.awards.join(", ")}`);
      }
      if (pornstarParts.length > 0) {
        parts.push(pornstarParts.join(", "));
      }
    } else if (item.type === "MANHWA" || item.type === "MANHUA" || item.type === "WEBTOON") {
      // Special handling for MANHWA/MANHUA/WEBTOON types
      const manhwaParts = [];
      if (item.metadata.author) manhwaParts.push(`Author: ${item.metadata.author}`);
      if (item.metadata.artist) manhwaParts.push(`Artist: ${item.metadata.artist}`);
      if (item.metadata.publisher) manhwaParts.push(`Publisher: ${item.metadata.publisher}`);
      if (item.metadata.genres && item.metadata.genres.length > 0) {
        manhwaParts.push(`Genres: ${item.metadata.genres.join(", ")}`);
      }
      if (manhwaParts.length > 0) {
        parts.push(manhwaParts.join(", "));
      }
    } else if (item.type === "DONGHUA" || item.type === "AENI" || item.type === "ANIMATION" || item.type === "HENTAI") {
      // Special handling for DONGHUA/AENI/ANIMATION/HENTAI types (similar to ANIME)
      const animeParts = [];
      if (item.metadata.studio) animeParts.push(`Studio: ${item.metadata.studio}`);
      if (item.metadata.director) animeParts.push(`Director: ${item.metadata.director}`);
      if (item.metadata.genres && item.metadata.genres.length > 0) {
        animeParts.push(`Genres: ${item.metadata.genres.join(", ")}`);
      }
      if (animeParts.length > 0) {
        parts.push(animeParts.join(", "));
      }
    } else {
      // Default handling for other types
      const metadataStr = Object.entries(item.metadata)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
        .join(", ");
      parts.push(`Metadata: ${metadataStr}`);
    }
  }

  return parts.join("\n");
}
