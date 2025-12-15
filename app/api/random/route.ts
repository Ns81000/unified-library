import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEmbedding, getFlashLiteModel } from "@/lib/gemini";
import { queryEmbeddings } from "@/lib/chromadb";

// Force dynamic rendering - prevents Next.js from trying to execute this during build
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    let selectedItem;

    if (prompt && typeof prompt === "string" && prompt.trim()) {
      // AI-powered semantic search
      const queryEmbedding = await generateEmbedding(prompt);
      const { ids } = await queryEmbeddings(queryEmbedding, 1);

      if (ids.length === 0) {
        return NextResponse.json(
          { error: "No items found in your library" },
          { status: 404 }
        );
      }

      selectedItem = await prisma.item.findUnique({
        where: { id: ids[0] },
      });
    } else {
      // Truly random selection
      const count = await prisma.item.count();

      if (count === 0) {
        return NextResponse.json(
          { error: "Your library is empty" },
          { status: 404 }
        );
      }

      const randomIndex = Math.floor(Math.random() * count);

      selectedItem = await prisma.item.findMany({
        skip: randomIndex,
        take: 1,
      }).then((items) => items[0]);
    }

    if (!selectedItem) {
      return NextResponse.json(
        { error: "No item found" },
        { status: 404 }
      );
    }

    // Generate AI explanation for why this item was recommended
    let reason = "This is a random pick from your library!";

    try {
      const reasonPrompt = prompt
        ? `A user is looking for: "${prompt}"

We selected this item:
Title: ${selectedItem.title}
Type: ${selectedItem.type}
Synopsis: ${selectedItem.synopsis}
Keywords: ${selectedItem.keywords.join(", ")}
Metadata: ${JSON.stringify(selectedItem.metadata)}

In 2-3 sentences, explain why this is a great choice for them right now. Be enthusiastic and specific about what makes this item special.`
        : `This item was randomly selected:
Title: ${selectedItem.title}
Type: ${selectedItem.type}
Synopsis: ${selectedItem.synopsis}
Keywords: ${selectedItem.keywords.join(", ")}
Metadata: ${JSON.stringify(selectedItem.metadata)}

In 2-3 sentences, create an enthusiastic pitch for why the user should check this out. Highlight what makes it interesting and worth their time.`;

      const result = await getFlashLiteModel().generateContent(reasonPrompt);
      reason = result.response.text();
    } catch (error) {
      console.error("Error generating recommendation reason:", error);
    }

    return NextResponse.json({
      item: selectedItem,
      reason,
    });
  } catch (error) {
    console.error("Error getting random recommendation:", error);
    return NextResponse.json(
      { error: "Failed to get recommendation" },
      { status: 500 }
    );
  }
}
