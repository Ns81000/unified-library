import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";

// Force dynamic rendering - prevents Next.js from trying to execute this during build
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const itemId = formData.get("itemId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!itemId) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and WEBP are allowed." },
        { status: 400 }
      );
    }

    // Create covers directory if it doesn't exist
    const coversDir = path.join(process.cwd(), "media-storage", "covers");
    if (!existsSync(coversDir)) {
      await mkdir(coversDir, { recursive: true });
    }

    // Delete old image file if it exists
    try {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { coverImage: true },
      });

      if (item?.coverImage && item.coverImage !== "/media/placeholder.svg") {
        const oldImagePath = item.coverImage.replace(/^\/media-storage\//, "");
        const oldFilepath = path.join(coversDir, oldImagePath);
        if (existsSync(oldFilepath)) {
          const { unlink } = await import("fs/promises");
          await unlink(oldFilepath);
        }
      }
    } catch (cleanupError) {
      console.error("Error deleting old image:", cleanupError);
      // Continue anyway, don't block the upload
    }

    // Generate filename
    const timestamp = Date.now();
    const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const filename = `${itemId}-${timestamp}.${ext}`;
    const filepath = path.join(coversDir, filename);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // SECURITY FIX: Validate file size on server (client validation can be bypassed)
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 413 }
      );
    }

    // Optimize image using sharp (resize if too large, compress)
    const optimizedBuffer = await sharp(buffer)
      .resize(800, 1200, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Save optimized image
    const optimizedFilename = `${itemId}-${timestamp}.webp`;
    const optimizedFilepath = path.join(coversDir, optimizedFilename);
    await writeFile(optimizedFilepath, optimizedBuffer);

    // Update database
    const localPath = `/media-storage/covers/${optimizedFilename}`;
    await prisma.item.update({
      where: { id: itemId },
      data: { coverImage: localPath },
    });

    return NextResponse.json({
      success: true,
      coverImage: localPath,
    });
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
