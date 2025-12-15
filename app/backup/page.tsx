"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Download, Upload, Loader2, AlertTriangle } from "lucide-react";

export default function BackupPage() {
  const { toast } = useToast();
  const [restoreData, setRestoreData] = useState("");
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const response = await fetch("/api/backup");

      if (!response.ok) throw new Error("Failed to create backup");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `library_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Backup created",
        description: "Your library backup has been downloaded.",
      });
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "Backup failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreData.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste your backup JSON.",
      });
      return;
    }

    if (
      !confirm(
        "⚠️ WARNING: This will DELETE ALL existing data and replace it with the backup. This action cannot be undone. Are you sure?"
      )
    ) {
      return;
    }

    try {
      setIsRestoring(true);

      // Validate JSON
      JSON.parse(restoreData);

      const response = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: restoreData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Restore failed");
      }

      toast({
        title: "Restore successful!",
        description: `Successfully restored ${result.count} items.`,
      });

      setRestoreData("");
      
      // Redirect to home after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error: any) {
      console.error("Error during restore:", error);
      toast({
        title: "Restore failed",
        description: error.message || "Please check your backup file and try again.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
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
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Backup & Restore</h1>
            <p className="text-muted-foreground">
              Export your library to a JSON file or restore from a previous backup.
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Important: Media Files Not Included
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This backup only includes database metadata (titles, keywords, notes, image paths, etc.). 
                  It does NOT include the actual cover images. You must manually backup your persistent 
                  media volume (e.g., the <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">
                    ./media-storage
                  </code> directory) separately.
                </p>
              </div>
            </div>
          </div>

          {/* Create Backup */}
          <Card>
            <CardHeader>
              <CardTitle>Create Backup (Export)</CardTitle>
              <CardDescription>
                Download a complete backup of your library metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                size="lg"
                className="w-full"
              >
                {isCreatingBackup ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Create Backup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Restore from Backup */}
          <Card>
            <CardHeader>
              <CardTitle>Restore from Backup (Import)</CardTitle>
              <CardDescription>
                ⚠️ This will DELETE all existing data and replace it with the backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={restoreData}
                onChange={(e) => setRestoreData(e.target.value)}
                placeholder="Paste your backup JSON here..."
                rows={12}
                className="font-mono text-sm"
                disabled={isRestoring}
              />

              <Button
                onClick={handleRestore}
                disabled={isRestoring || !restoreData.trim()}
                variant="destructive"
                size="lg"
                className="w-full"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Run Restore
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
