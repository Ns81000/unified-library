"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, Upload } from "lucide-react";

export default function BulkImportPage() {
  const { toast } = useToast();
  const [jsonData, setJsonData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string>("");

  const handleImport = async () => {
    if (!jsonData.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste your JSON array.",
      });
      return;
    }

    try {
      setIsImporting(true);
      setImportProgress("Validating JSON...");
      
      // Validate JSON
      const items = JSON.parse(jsonData);
      if (!Array.isArray(items)) {
        throw new Error("JSON must be an array of items");
      }

      setImportProgress(`Importing ${items.length} items...`);

      const response = await fetch("/api/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }

      toast({
        title: "Import successful!",
        description: `Successfully imported ${result.successCount} items. ${result.failureCount} failed.`,
      });

      if (result.errors && result.errors.length > 0) {
        console.error("Import errors:", result.errors);
      }

      setJsonData("");
      setImportProgress("");
    } catch (error: any) {
      console.error("Error during import:", error);
      toast({
        title: "Import failed",
        description: error.message || "Please check your JSON and try again.",
        variant: "destructive",
      });
      setImportProgress("");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Library
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bulk Import</h1>
            <p className="text-muted-foreground">
              Import hundreds of items at once using the 3-step external workflow.
            </p>
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
              <CardDescription>
                Follow these steps to bulk import your media collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Recommended AI Tools:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>
                    <strong>Prompts 1 & 3:</strong> Google Gemini (web interface) - Large context window
                  </li>
                  <li>
                    <strong>Prompt 2:</strong> Google Gemini Advanced Notebook (Deep Research) - Best for bulk data research
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">Step 1: Context-Aware Data Extraction</h4>
                  <p className="text-sm text-muted-foreground">
                    Export your bookmarks/lists to a text file. Paste the raw content into Google Gemini
                    with Prompt 1 (see documentation) to extract item titles and context.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">Step 2: Deep Research & Reporting</h4>
                  <p className="text-sm text-muted-foreground">
                    Take the output from Step 1, upload it to Gemini Advanced Notebook, and use Prompt 2
                    to perform deep research and generate structured data for all items.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">Step 3: JSON Array Parsing</h4>
                  <p className="text-sm text-muted-foreground">
                    Copy the report from Step 2 and paste it into Google Gemini with Prompt 3 to extract
                    a clean JSON array.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">Step 4: Import to Database</h4>
                  <p className="text-sm text-muted-foreground">
                    Paste the final JSON array below and click &quot;Run Import&quot;. The system will process each
                    item, download images, and add everything to your library.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Link href="/bulk-import/prompts">
                  <Button variant="outline" size="lg" className="gap-2">
                    📋 View All Prompts with Copy Buttons
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle>Paste JSON Array</CardTitle>
              <CardDescription>
                Paste the final JSON array from Step 3 below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder='[{"title": "...", "type": "MOVIE", ...}, ...]'
                rows={15}
                className="font-mono text-sm"
                disabled={isImporting}
              />

              {importProgress && (
                <div className="text-sm text-muted-foreground">
                  {importProgress}
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={isImporting || !jsonData.trim()}
                className="w-full"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Run Import
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
