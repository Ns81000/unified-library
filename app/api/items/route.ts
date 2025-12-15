import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering - prevents Next.js from trying to execute this during build
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("search");
    const typeFilter = searchParams.get("type");
    const sortBy = searchParams.get("sortBy") || "createdAt";

    // Build where clause
    const where: any = {};

    // Add search filter
    if (searchQuery) {
      where.title = {
        contains: searchQuery,
        mode: "insensitive",
      };
    }

    // Add type filter
    if (typeFilter && typeFilter !== "ALL") {
      where.type = typeFilter;
    }

    // Build orderBy clause - only support top-level fields (Prisma limitation with JSON)
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "title") {
      orderBy = { title: "asc" };
    } else if (sortBy === "releaseYear" || sortBy === "publicationYear") {
      // Note: Metadata fields are JSON and cannot be sorted in Prisma directly
      // Sort by createdAt as fallback - users can search/filter by these fields instead
      orderBy = { createdAt: "desc" };
    }

    const items = await prisma.item.findMany({
      where,
      orderBy,
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, synopsis, keywords, metadata, notes, coverImageUrl } = body;

    // Validate required fields
    if (!title || !type || !synopsis) {
      return NextResponse.json(
        { error: "Missing required fields: title, type, synopsis" },
        { status: 400 }
      );
    }

    // Create item in database (coverImage starts as null)
    const item = await prisma.item.create({
      data: {
        title,
        type,
        synopsis,
        keywords: keywords || [],
        metadata: metadata || {},
        notes: notes || null,
        coverImage: null, // Will be updated after download
      },
    });

    // Download image asynchronously
    if (coverImageUrl) {
      downloadAndSaveImage(item.id, coverImageUrl).catch((error) => {
        console.error(`Failed to download image for item ${item.id}:`, error);
      });
    }

    // Generate embedding and save to ChromaDB
    try {
      const { generateEmbedding } = await import("@/lib/gemini");
      const { addEmbedding } = await import("@/lib/chromadb");

      const textForEmbedding = generateTextForEmbedding(item);
      const embedding = await generateEmbedding(textForEmbedding);

      await addEmbedding(item.id, embedding, { type: item.type }, textForEmbedding);
    } catch (embeddingError) {
      console.error("Error creating embedding:", embeddingError);
      // Don't fail the request if embedding fails
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
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
