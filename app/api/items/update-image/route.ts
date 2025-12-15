import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";

// Force dynamic rendering - prevents Next.js from trying to execute this during build
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { itemId, imageUrl } = await request.json();

    if (!itemId || !imageUrl) {
      return NextResponse.json(
        { error: "Item ID and image URL are required" },
        { status: 400 }
      );
    }

    // SECURITY FIX: Validate URL format and protocol
    let parsedUrl;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Only HTTP and HTTPS URLs are allowed" },
        { status: 400 }
      );
    }

    // Block localhost and private IPs to prevent SSRF attacks
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname === '::1'
    ) {
      return NextResponse.json(
        { error: "Cannot download images from local or private network addresses" },
        { status: 400 }
      );
    }

    // Download image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
      throw new Error("URL does not point to an image");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // SECURITY FIX: Validate downloaded file size
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Downloaded image is too large. Maximum size is 10MB." },
        { status: 413 }
      );
    }

    // Create covers directory if it doesn't exist
    const coversDir = path.join(process.cwd(), "media-storage", "covers");
    if (!existsSync(coversDir)) {
      await mkdir(coversDir, { recursive: true });
    }

    // Get current item to delete old image if exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { coverImage: true },
    });

    // Delete old image file if exists
    if (item?.coverImage && item.coverImage !== "/media/placeholder.svg") {
      try {
        const oldFilepath = path.join(process.cwd(), "media-storage", item.coverImage.replace(/^\/media-storage\//, ""));
        if (existsSync(oldFilepath)) {
          await unlink(oldFilepath);
        }
      } catch (error) {
        console.error("Error deleting old image:", error);
        // Continue even if deletion fails
      }
    }

    // Optimize and save new image
    const timestamp = Date.now();
    const filename = `${itemId}-${timestamp}.webp`;
    const filepath = path.join(coversDir, filename);

    const optimizedBuffer = await sharp(buffer)
      .resize(800, 1200, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    await writeFile(filepath, optimizedBuffer);

    // Update database
    const localPath = `/media-storage/covers/${filename}`;
    await prisma.item.update({
      where: { id: itemId },
      data: { coverImage: localPath },
    });

    return NextResponse.json({
      success: true,
      coverImage: localPath,
    });
  } catch (error: any) {
    console.error("Error updating image from URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update image" },
      { status: 500 }
    );
  }
}
