"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Shuffle, Loader2 } from "lucide-react";

interface RandomPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: any) => void;
}

export default function RandomPickerModal({
  isOpen,
  onClose,
  onSelectItem,
}: RandomPickerModalProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isPicking, setIsPicking] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);

  const handlePick = async () => {
    try {
      setIsPicking(true);
      setRecommendation(null);

      const response = await fetch("/api/random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() || null }),
      });

      if (!response.ok) throw new Error("Failed to get recommendation");

      const data = await response.json();
      setRecommendation(data);
    } catch (error) {
      console.error("Error getting recommendation:", error);
      toast({
        title: "Error",
        description: "Failed to get a recommendation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPicking(false);
    }
  };

  const handleClose = () => {
    setPrompt("");
    setRecommendation(null);
    onClose();
  };

  const handleViewItem = () => {
    if (recommendation) {
      onSelectItem(recommendation.item);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>What&apos;s Next?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="prompt">
              Enter a mood or preference (optional)
            </Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'something uplifting'"
              onKeyDown={(e) => e.key === "Enter" && handlePick()}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank for a truly random pick!
            </p>
          </div>

          <Button onClick={handlePick} disabled={isPicking} className="w-full">
            {isPicking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="mr-2 h-4 w-4" />
            )}
            {isPicking ? "Finding..." : "Pick Something"}
          </Button>

          {recommendation && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
              <div>
                <h3 className="font-semibold text-lg">
                  {recommendation.item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {recommendation.item.type}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Why you should check it out:</p>
                <p className="text-sm text-muted-foreground">
                  {recommendation.reason}
                </p>
              </div>

              <Button onClick={handleViewItem} className="w-full">
                View Details
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
