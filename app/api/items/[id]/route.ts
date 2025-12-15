import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteEmbedding, updateEmbedding } from "@/lib/chromadb";
import { generateEmbedding } from "@/lib/gemini";

// Force dynamic rendering - prevents Next.js from trying to execute this during build
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();

    const item = await prisma.item.update({
      where: { id: params.id },
      data: body,
    });

    // If title, synopsis, keywords, or metadata changed, update embedding
    if (body.title || body.synopsis || body.keywords || body.metadata) {
      try {
        const textForEmbedding = generateTextForEmbedding(item);
        const embedding = await generateEmbedding(textForEmbedding);
        await updateEmbedding(item.id, embedding, { type: item.type }, textForEmbedding);
      } catch (embeddingError) {
        console.error("Error updating embedding:", embeddingError);
      }
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Get item to find cover image path
    const item = await prisma.item.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Delete from database
    await prisma.item.delete({
      where: { id: params.id },
    });

    // Delete from ChromaDB
    try {
      await deleteEmbedding(params.id);
    } catch (embeddingError) {
      console.error("Error deleting embedding:", embeddingError);
    }

    // Delete cover image file
    if (item.coverImage && item.coverImage !== "/media/placeholder.svg") {
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        // Correct path: images are stored in media-storage, not public
        const imagePath = item.coverImage.replace(/^\/media-storage\//, "");
        const filepath = path.join(process.cwd(), "media-storage", imagePath);
        await fs.unlink(filepath);
      } catch (fileError) {
        console.error("Error deleting cover image file:", fileError);
        // Don't fail the deletion if file doesn't exist
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
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
