"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Check, Copy, ExternalLink } from "lucide-react";

export default function BulkImportPromptsPage() {
  const { toast } = useToast();
  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);

  const copyToClipboard = async (text: string, promptNumber: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(promptNumber);
      toast({
        title: "Copied!",
        description: `Prompt ${promptNumber} copied to clipboard`,
      });
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const prompt1 = `Analyze the following raw content. Your goal is to extract every single media item you can identify (e.g., movie, series, anime, book, comic, manga, game, person, pornstar, franchise, donghua, manhwa, manhua, webtoon, hentai, aeni, animation).

For each item, extract its **primary title** and **any other useful context** you can find (like a URL, year, director, folder name, or any descriptive text next to it).

This context is critical for ensuring accurate research in the next step.

Format each item clearly, with the title first and its context beside it.

RAW CONTENT:
[PASTE YOUR CONTENT HERE]`;

  const prompt2 = `You are a professional media database researcher. Your task is to research every item in the provided document and output PERFECT, VALID JSON for each one.

**WORKFLOW FOR EACH ITEM:**

1. **Research**: Use web search to find the exact media item using the title and context provided
2. **Identify Type**: Determine if it's MOVIE, SERIES, ANIME, BOOK, GAME, COMIC, MANGA, PERSON, FRANCHISE, PORNSTAR, DONGHUA, MANHWA, MANHUA, HENTAI, AENI, ANIMATION, or WEBTOON
3. **Gather Data**: Collect ALL required fields (see schemas below)
4. **Generate Keywords**: Create 10-15 specific, searchable keywords
5. **Validate**: Check your JSON has ALL required fields before outputting

**NOTE ON COVER IMAGES**: Don't waste tokens finding image URLs - just use any random placeholder URL like \`https://via.placeholder.com/300x450.jpg\` for \`coverImageUrl\`

---

## 🎯 CRITICAL REQUIREMENTS

### Image URLs - MANDATORY RULES:
- ⚠️ **IMPORTANT**: Do NOT waste tokens trying to find valid image URLs! AI models often generate broken/invalid URLs no matter how hard they try.
- ✅ **SIMPLE SOLUTION**: Just paste ANY random direct image URL (e.g., \`https://example.com/random.jpg\`) for \`coverImageUrl\`
- ✅ **MUST BE DIRECT**: URL should end in \`.jpg\`, \`.png\`, or \`.webp\`
- 💡 **TIP**: Use a placeholder like \`https://via.placeholder.com/300x450.jpg\` or any working image URL you know
- 🎯 **FOCUS YOUR EFFORT**: Spend tokens on accurate metadata, synopsis, and keywords instead of URLs

### Keywords - MANDATORY RULES:
- ✅ **ALWAYS INCLUDE**: Minimum 10 keywords, maximum 15
- ✅ **BE SPECIFIC**: Include actor names, director, themes, plot elements, genres, mood
- ✅ **CONTENT WARNINGS**: Add keywords like "nudity", "violence", "gore" if applicable
- ✅ **SEARCHABLE**: Use terms someone would search for to find this item
- ❌ **NEVER SKIP**: Even if data is limited, infer keywords from title/synopsis/genres

### Synopsis - MANDATORY RULES:
- ✅ **LENGTH**: 3-5 sentences (50-150 words)
- ✅ **CONTENT**: Plot summary, not just description
- ✅ **NO SPOILERS**: Avoid major plot twists

---

## 📋 JSON SCHEMAS BY TYPE

### FOR "MOVIE", "SERIES", "ANIME", "DONGHUA", "AENI", "ANIMATION", or "HENTAI":
\`\`\`json
{
  "title": "Official Title (Year)",
  "type": "MOVIE",
  "coverImageUrl": "https://m.media-amazon.com/images/M/[...].jpg",
  "synopsis": "A detailed 3-5 sentence plot summary that describes the story, main characters, and central conflict without spoilers.",
  "keywords": ["actor name", "director name", "genre", "theme", "plot element", "mood", "setting", "time period", "content warning", "franchise name"],
  "metadata": {
    "releaseYear": 2023,
    "director": "Director Full Name",
    "mainActors": ["Lead Actor 1", "Lead Actor 2", "Lead Actor 3"],
    "genres": ["Primary Genre", "Secondary Genre"],
    "studio": "Production Studio Name"
  }
}
\`\`\`

### FOR "BOOK", "COMIC", "MANGA", "MANHWA", "MANHUA", or "WEBTOON":
\`\`\`json
{
  "title": "Official Title",
  "type": "BOOK",
  "coverImageUrl": "https://upload.wikimedia.org/[...].jpg",
  "synopsis": "A detailed 3-5 sentence summary of the book's plot, themes, and main characters.",
  "keywords": ["author name", "artist name", "genre", "theme", "setting", "protagonist", "literary style", "content warning", "series name", "award", "adaptation"],
  "metadata": {
    "author": "Author Full Name",
    "artist": "Artist Full Name",
    "publicationYear": 2021,
    "pages": 350,
    "genres": ["Primary Genre", "Secondary Genre"],
    "publisher": "Publisher Name"
  }
}
\`\`\`

### FOR "GAME":
\`\`\`json
{
  "title": "Official Game Title",
  "type": "GAME",
  "coverImageUrl": "https://image.tmdb.org/[...].jpg",
  "synopsis": "A detailed 3-5 sentence description of the game's gameplay, story, and unique features.",
  "keywords": ["developer", "genre", "gameplay mechanic", "setting", "protagonist", "franchise", "platform", "multiplayer", "content warning", "game engine"],
  "metadata": {
    "developer": "Developer Studio Name",
    "publisher": "Publisher Name",
    "platforms": ["PC", "PlayStation 5", "Xbox Series X"],
    "releaseYear": 2024,
    "genres": ["Primary Genre", "Secondary Genre"]
  }
}
\`\`\`

### FOR "PERSON":
\`\`\`json
{
  "title": "Person's Full Name",
  "type": "PERSON",
  "coverImageUrl": "https://upload.wikimedia.org/[...].jpg",
  "synopsis": "A 3-5 sentence biography covering their career, notable achievements, and impact on their field.",
  "keywords": ["profession", "nationality", "notable work 1", "notable work 2", "award", "genre specialty", "collaborator", "era", "style", "legacy"],
  "metadata": {
    "knownFor": "Primary Profession (e.g., Acting, Directing, Writing)",
    "birthYear": 1980,
    "notableWorks": ["Famous Work 1", "Famous Work 2", "Famous Work 3"]
  }
}
\`\`\`

### FOR "FRANCHISE":
\`\`\`json
{
  "title": "Franchise Name",
  "type": "FRANCHISE",
  "coverImageUrl": "https://upload.wikimedia.org/[...].jpg",
  "synopsis": "A 3-5 sentence overview of the franchise's history, scope, and cultural impact.",
  "keywords": ["creator name", "media type", "genre", "theme", "iconic character", "setting", "era", "cultural impact", "fanbase", "spin-off"],
  "metadata": {
    "creator": "Creator Full Name",
    "mediaTypes": ["Movie", "Book", "Game", "Anime", "TV Series"]
  }
}
\`\`\`

### FOR "PORNSTAR":
\`\`\`json
{
  "title": "Stage Name (also use for metadata.stageName)",
  "type": "PORNSTAR",
  "coverImageUrl": "https://upload.wikimedia.org/[...].jpg",
  "synopsis": "A 3-5 sentence biography covering their career, notable achievements, performance style, and industry impact. This field is their biography/description.",
  "keywords": ["stage name", "real name", "nationality", "genre/niche", "studio name", "award", "physical attribute", "debut year", "status", "ethnicity"],
  "metadata": {
    "stageName": "Stage Name (same as title)",
    "realName": "Real Name (if publicly known, otherwise null)",
    "birthYear": 1995,
    "nationality": "Country",
    "ethnicity": "Ethnicity",
    "debutYear": 2018,
    "status": "Active",
    "studios": ["Studio A", "Studio B"],
    "genres": ["Niche 1", "Niche 2"],
    "awards": ["Award Name 1 (Year)", "Award Name 2 (Year)"],
    "physicalAttributes": {
      "hairColor": "Blonde",
      "eyeColor": "Blue",
      "height": "5'7\\" (170cm)",
      "measurements": "34C-24-36",
      "tattoos": "Description or true/false",
      "piercings": "Description or true/false"
    }
  }
}
\`\`\`

---

## 🛡️ ERROR HANDLING

If you CANNOT find accurate information for an item:
\`\`\`json
{
  "title": "Original Title from Input",
  "status": "failed_to_find",
  "reason": "Brief explanation (e.g., 'Too obscure', 'Ambiguous title', 'No reliable sources')"
}
\`\`\`
Then immediately move to the next item. DO NOT stop the entire process.

---

## ✅ PRE-OUTPUT VALIDATION CHECKLIST

Before adding each JSON to your report, verify:
- [ ] \`title\` is the official title (include year for movies, use stage name for pornstars)
- [ ] \`type\` is one of the 10 valid types: MOVIE, SERIES, ANIME, BOOK, COMIC, MANGA, GAME, PERSON, FRANCHISE, PORNSTAR (all caps)
- [ ] \`coverImageUrl\` is a direct image URL from IMDb/TMDB/Wikipedia
- [ ] \`synopsis\` is 3-5 sentences (50-150 words)
- [ ] \`keywords\` array has 10-15 specific, searchable terms
- [ ] \`metadata\` object has ALL required fields for this type
- [ ] No fields are empty strings or undefined
- [ ] Numeric fields (year, pages) are numbers, not strings

---

## 📊 FINAL OUTPUT FORMAT

Present your research as a structured report:

\`\`\`
MEDIA RESEARCH REPORT
Generated: [Date]
Total Items Processed: [Number]

---

ITEM 1: [Title]
Status: ✅ Success
Research Summary: [1-2 sentences about what you found]

JSON:
{...your validated JSON...}

---

ITEM 2: [Title]
Status: ✅ Success
Research Summary: [1-2 sentences]

JSON:
{...your validated JSON...}

---

[Continue for all items]

---

SUMMARY:
- Successfully researched: [X] items
- Failed to find: [Y] items
- Total JSON objects: [X]
\`\`\`

---

## 🎯 EXAMPLE OUTPUT (for reference)

**ITEM: The Matrix (1999, Keanu Reeves)**

Research Summary: Found comprehensive information from IMDb and TMDB. This is the original 1999 sci-fi film directed by the Wachowskis.

JSON:
\`\`\`json
{
  "title": "The Matrix (1999)",
  "type": "MOVIE",
  "coverImageUrl": "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
  "synopsis": "Thomas Anderson is a computer programmer living a double life as a hacker named Neo. When mysterious rebels contact him, he discovers that reality as he knows it is actually a simulated world called the Matrix created by sentient machines. Neo joins the resistance to fight the machines and free humanity from their digital prison.",
  "keywords": ["Keanu Reeves", "Wachowski", "sci-fi", "cyberpunk", "virtual reality", "action", "philosophy", "simulation", "artificial intelligence", "dystopia", "martial arts", "bullet time", "chosen one", "resistance"],
  "metadata": {
    "releaseYear": 1999,
    "director": "Lana Wachowski, Lilly Wachowski",
    "mainActors": ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"],
    "genres": ["Action", "Sci-Fi"],
    "studio": "Warner Bros."
  }
}
\`\`\`

---

**NOW PROCESS ALL ITEMS IN THE PROVIDED DOCUMENT USING THIS EXACT FORMAT.**`;

  const prompt3 = `You are a JSON validator and cleaner. Your task is to extract valid JSON objects from a research report and output them as a single, perfectly formatted JSON array.

---

## 🎯 YOUR TASK:

1. **Find JSON Objects**: Locate every JSON object in the report that represents a media item
2. **Clean & Fix**: Repair common formatting issues (see rules below)
3. **Validate**: Ensure each object is valid JSON with all required fields
4. **Output**: Return ONLY the JSON array, nothing else

---

## 🔧 MANDATORY FIXES:

### Fix 1: Escape ONLY Double Quotes in Strings
- ❌ \`"synopsis": "...their infamous "No Más" fight."\`
- ✅ \`"synopsis": "...their infamous \\"No Más\\" fight."\`
- **Action**: ONLY escape double quotes \`"\` → \`\\"\` inside string values
- **CRITICAL**: DO NOT escape anything else:
  - ❌ NEVER escape underscores: \`\\_\` is INVALID in JSON
  - ❌ NEVER escape asterisks: \`\\*\` is INVALID in JSON
  - ❌ NEVER escape hyphens, periods, or other URL characters
  - ✅ Keep URLs exactly as-is (except for removing markdown)
- **Examples**:
  - \`He said "hello"\` → \`He said \\"hello\\"\` ✅
  - \`Oates's novel\` → KEEP AS IS ✅
  - \`file_name.jpg\` → KEEP AS IS (underscore doesn't need escaping) ✅

### Fix 2: Remove ALL Markdown Formatting & Extract Direct URLs
- ❌ \`"coverImageUrl": "[https://example.com/image.jpg](https://www.google.com/url?q=https://example.com/image.jpg)"\`
- ✅ \`"coverImageUrl": "https://example.com/image.jpg"\`
- **Action**: 
  1. Strip ALL markdown link syntax \`[text](url)\` 
  2. If URL contains \`google.com/url?\` or \`google.com/search?\`, extract the actual URL from the \`q=\` parameter
  3. Remove any \`*\` (asterisks) that appear in URLs (these are markdown formatting artifacts)
  4. Keep ONLY the direct image URL
- **Examples**:
  - \`[url](url)\` → Extract the URL from inside parentheses
  - \`https://google.com/url?sa=E&q=https://example.com\` → \`https://example.com\`
  - \`image_V1\\_FMjpg\\_UX1000_.jpg\` → \`image_V1_FMjpg_UX1000_.jpg\` (remove \`\\\` before underscores)
  - \`@.*V1*_FMjpg\` → \`@._V1_FMjpg\` (remove asterisks)

### Fix 3: Remove Newlines from String Values
- ❌ Multi-line strings with literal line breaks
- ✅ Single-line strings with spaces instead
- **Action**: Replace ALL newline characters (\`\\n\`) inside string values with a single space

### Fix 4: Fix Metadata Object Structure
- ❌ Fields OUTSIDE the metadata object:
  \`\`\`json
  "metadata": {},
  "releaseYear": 2020,
  "director": "Name"
  \`\`\`
- ✅ ALL fields INSIDE metadata:
  \`\`\`json
  "metadata": {
    "releaseYear": 2020,
    "director": "Name",
    "mainActors": [...],
    "genres": [...],
    "studio": "..."
  }
  \`\`\`

### Fix 5: Ensure Proper Field Names
- ❌ \`"release Year"\` (space in key name)
- ✅ \`"releaseYear"\` (camelCase, no spaces)

### Fix 6: Clean and Validate URLs
- **Remove markdown artifacts**:
  - Strip \`[\` and \`]\` brackets completely
  - Remove \`*\` asterisks that appear in URLs
  - Remove \`\\\` backslashes before underscores (e.g., \`\\_\` → \`_\`)
- **Extract from Google redirects**:
  - If URL starts with \`https://www.google.com/url?\` or \`https://www.google.com/search?\`
  - Extract the actual URL from the \`q=\` parameter
  - Example: \`google.com/url?sa=E&q=https://m.media-amazon.com/image.jpg\` → \`https://m.media-amazon.com/image.jpg\`
- **Simple validation**:
  - Must start with \`http://\` or \`https://\`
  - Should end with \`.jpg\`, \`.png\`, or \`.webp\`
  - ⚠️ **NOTE**: Since AI-generated URLs are often broken anyway, don't stress about perfect validation - any properly formatted URL is acceptable

---

## ✅ VALIDATION CHECKLIST:

Before adding each object to the final array, verify:
- [ ] \`title\` exists and is a non-empty string
- [ ] \`type\` is one of: MOVIE, SERIES, ANIME, BOOK, GAME, COMIC, MANGA, PERSON, FRANCHISE, PORNSTAR, DONGHUA, MANHWA, MANHUA, HENTAI, AENI, ANIMATION, WEBTOON
- [ ] \`coverImageUrl\` is a clean, direct URL with NO markdown, NO asterisks, NO escaped underscores
- [ ] \`coverImageUrl\` does NOT contain \`google.com/url?\` or \`google.com/search?\`
- [ ] \`synopsis\` is a single-line string with no literal newlines and ALL double quotes are escaped with \`\\"\`
- [ ] \`keywords\` is an array with at least 10 strings
- [ ] \`metadata\` is an object containing ALL type-specific fields
- [ ] No string values contain literal newline characters
- [ ] All field names are valid (no spaces, proper camelCase)
- [ ] ONLY double quotes \`"\` are escaped with \`\\"\`—NO other characters are escaped
- [ ] NO \`\\_\`, \`\\*\`, or other invalid escape sequences exist anywhere
- [ ] Test: The JSON can be parsed by \`JSON.parse()\` without errors

---

## 🚫 WHAT TO IGNORE:

- Conversational text ("Here's the research...", "I found...", etc.)
- Section headers ("ITEM 1:", "Research Summary:", etc.)
- Error messages outside of JSON
- Any JSON with \`"status": "failed_to_find"\` (skip these entirely)

---

## 📤 OUTPUT FORMAT:

Your ENTIRE response must be ONLY the JSON array. Follow these rules EXACTLY:

1. ✅ Start with \`[\`
2. ✅ End with \`]\`
3. ❌ NO markdown code blocks (no \`\`\`json)
4. ❌ NO explanatory text before or after
5. ❌ NO comments inside the JSON
6. ✅ Proper JSON formatting with correct commas
7. ✅ All strings properly escaped
8. ✅ All objects complete and valid

---

## 🔥 CRITICAL REMINDER:

- Your output must be **VALID JSON** that can be parsed by \`JSON.parse()\`
- Test your output by mentally parsing it - if there's ANY doubt, fix it
- **ONLY ESCAPE DOUBLE QUOTES**: \`"\` → \`\\"\` (nothing else!)
- **NEVER ESCAPE**: Underscores \`_\`, asterisks \`*\`, hyphens \`-\`, periods \`.\`, or any URL characters
- **REMOVE INVALID ESCAPES**: If you see \`\\_\` or \`\\*\` in URLs, remove the backslash
- NO newlines inside string values
- NO markdown formatting anywhere (no \`[\`, \`]\`, \`*\`)
- NO Google redirect URLs—extract the direct URL from \`?q=\` parameter
- ALL metadata fields must be INSIDE the \`metadata\` object
- Single quotes and apostrophes (\`'\`, \`'\`) do NOT need escaping
- **JSON only allows these escapes**: \`\\"\`, \`\\\\\`, \`\\/\`, \`\\b\`, \`\\f\`, \`\\n\`, \`\\r\`, \`\\t\`, \`\\uXXXX\`

---

**NOW PROCESS THE REPORT BELOW:**

REPORT:
[PASTE YOUR REPORT FROM PROMPT 2 HERE]`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/bulk-import">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bulk Import
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bulk Import Prompts</h1>
            <p className="text-muted-foreground">
              Copy these prompts and use them with Google Gemini to process your media library
            </p>
          </div>

          {/* Workflow Overview */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                Quick Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-[2rem]">Step 1:</span>
                  <span>Copy <strong>Prompt 1</strong> → Open <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Gemini <ExternalLink className="h-3 w-3" /></a> → Paste prompt + your raw data</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-[2rem]">Step 2:</span>
                  <span>Copy output from Step 1 → Copy <strong>Prompt 2</strong> → Open <span className="font-semibold">Gemini Advanced Notebook</span> → Upload file + paste prompt</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-[2rem]">Step 3:</span>
                  <span>Copy report from Step 2 → Copy <strong>Prompt 3</strong> → Open Google Gemini → Paste prompt + report</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary min-w-[2rem]">Step 4:</span>
                  <span>Copy JSON array from Step 3 → <Link href="/bulk-import" className="text-primary hover:underline font-semibold">Go to Bulk Import page</Link> → Paste & import!</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Prompt 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Prompt 1: Context-Aware Data Extraction</span>
                <Button
                  variant={copiedPrompt === 1 ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => copyToClipboard(prompt1, 1)}
                >
                  {copiedPrompt === 1 ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Prompt
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Use with: <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Gemini <ExternalLink className="h-3 w-3" /></a> (web interface)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                {prompt1}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                <strong>What it does:</strong> Extracts media titles and context from raw data (IMDb exports, bookmarks, etc.)
              </p>
            </CardContent>
          </Card>

          {/* Prompt 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Prompt 2: Deep Research & Reporting</span>
                <Button
                  variant={copiedPrompt === 2 ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => copyToClipboard(prompt2, 2)}
                >
                  {copiedPrompt === 2 ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Prompt
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Use with: <span className="font-semibold">Google Gemini Advanced Notebook</span> (Deep Research feature)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                {prompt2}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                <strong>What it does:</strong> Performs comprehensive web research and generates structured JSON for all items
              </p>
            </CardContent>
          </Card>

          {/* Prompt 3 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Prompt 3: JSON Array Parsing & Validation</span>
                <Button
                  variant={copiedPrompt === 3 ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => copyToClipboard(prompt3, 3)}
                >
                  {copiedPrompt === 3 ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Prompt
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Use with: <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Gemini <ExternalLink className="h-3 w-3" /></a> (web interface)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                {prompt3}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                <strong>What it does:</strong> Extracts clean, validated JSON array from the research report
              </p>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-yellow-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Prompt 2 takes time</strong> (5-15 minutes for 50+ items) – be patient!</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Test with small batches first</strong> (5-10 items) to verify the workflow</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>For large imports</strong> (500+ items), split into batches of 100-200</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Check the final JSON</strong> before importing – it should start with <code className="bg-muted px-1 rounded">[</code> and end with <code className="bg-muted px-1 rounded">]</code></span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Next Step */}
          <div className="flex justify-center pt-4">
            <Link href="/bulk-import">
              <Button size="lg" className="gap-2">
                Ready to Import
                <ArrowLeft className="h-5 w-5 rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
