import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/gemini";
import { addEmbedding } from "@/lib/chromadb";

// Force dynamic rendering - prevents Next.js from trying to execute this during build
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items must be an array" },
        { status: 400 }
      );
    }

    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ index: number; title: string; error: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const itemData = items[i];

      try {
        // Validate required fields
        if (!itemData.title || !itemData.type || !itemData.synopsis) {
          throw new Error("Missing required fields: title, type, synopsis");
        }

        // Create item in database
        const item = await prisma.item.create({
          data: {
            title: itemData.title,
            type: itemData.type,
            synopsis: itemData.synopsis,
            keywords: itemData.keywords || [],
            metadata: itemData.metadata || {},
            notes: itemData.notes || null,
            coverImage: null, // Will be updated after download
          },
        });

        // Download image asynchronously
        if (itemData.coverImageUrl) {
          downloadAndSaveImage(item.id, itemData.coverImageUrl).catch((error) => {
            console.error(`Failed to download image for item ${item.id}:`, error);
          });
        }

        // Generate embedding and save to ChromaDB
        try {
          const textForEmbedding = generateTextForEmbedding(item);
          const embedding = await generateEmbedding(textForEmbedding);
          await addEmbedding(item.id, embedding, { type: item.type }, textForEmbedding);
        } catch (embeddingError) {
          console.error(`Error creating embedding for item ${item.id}:`, embeddingError);
        }

        successCount++;
      } catch (error: any) {
        console.error(`Error importing item at index ${i}:`, error);
        failureCount++;
        errors.push({
          index: i,
          title: itemData.title || "Unknown",
          error: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      successCount,
      failureCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error during bulk import:", error);
    return NextResponse.json(
      { error: error.message || "Bulk import failed" },
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

// Helper function to download and save image
async function downloadAndSaveImage(itemId: string, imageUrl: string): Promise<void> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;

    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    // Process with sharp
    const processedImage = await sharp(Buffer.from(buffer))
      .webp({ quality: 85 })
      .toBuffer();

    // Save to disk
    const mediaDir = path.join(process.cwd(), "media-storage", "covers");
    await fs.mkdir(mediaDir, { recursive: true });

    const filename = `${itemId}.webp`;
    const filepath = path.join(mediaDir, filename);
    await fs.writeFile(filepath, processedImage);

    // Update database with local path
    const localPath = `/media-storage/covers/${filename}`;
    await prisma.item.update({
      where: { id: itemId },
      data: { coverImage: localPath },
    });

    console.log(`Successfully saved image for item ${itemId}`);
  } catch (error) {
    console.error(`Error downloading/saving image for item ${itemId}:`, error);
    // Don't throw - let the item be created without an image
  }
}
