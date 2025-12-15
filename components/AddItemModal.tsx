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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ITEM_TYPES = [
  "MOVIE",
  "SERIES",
  "ANIME",
  "BOOK",
  "COMIC",
  "MANGA",
  "GAME",
  "PERSON",
  "FRANCHISE",
  "PORNSTAR",
  "DONGHUA",
  "MANHWA",
  "MANHUA",
  "HENTAI",
  "AENI",
  "ANIMATION",
  "WEBTOON",
];

export default function AddItemModal({
  isOpen,
  onClose,
  onSuccess,
}: AddItemModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFilledData, setAutoFilledData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAutoFill = async () => {
    if (!title || !type) {
      toast({
        title: "Missing information",
        description: "Please enter both title and type.",
      });
      return;
    }

    try {
      setIsAutoFilling(true);
      const response = await fetch("/api/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Auto-fill failed");
      }

      const data = await response.json();
      setAutoFilledData(data);
      toast({
        title: "Success",
        description: "Item data auto-filled successfully!",
      });
    } catch (error: any) {
      console.error("Error during auto-fill:", error);
      toast({
        title: "Auto-fill failed",
        description: error.message || "Please try again or add details manually.",
        variant: "destructive",
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSave = async () => {
    if (!autoFilledData) {
      toast({
        title: "No data to save",
        description: "Please use auto-fill first.",
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(autoFilledData),
      });

      if (!response.ok) throw new Error("Failed to save item");

      toast({
        title: "Success",
        description: "Item added to your library!",
      });
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        title: "Error",
        description: "Failed to save item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // BUG FIX: Reset ALL state to prevent stale data
    setTitle("");
    setType("");
    setAutoFilledData(null);
    setIsAutoFilling(false);
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter the title..."
              disabled={!!autoFilledData}
            />
          </div>

          <div>
            <Label htmlFor="type">Type *</Label>
            <Select
              value={type}
              onValueChange={setType}
              disabled={!!autoFilledData}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={5} className="max-h-[300px]">
                {ITEM_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!autoFilledData && (
            <Button
              onClick={handleAutoFill}
              disabled={isAutoFilling}
              className="w-full"
            >
              {isAutoFilling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAutoFilling ? "Auto-filling..." : "Auto-fill with AI"}
            </Button>
          )}

          {autoFilledData && (
            <>
              <div className="border-t pt-4 space-y-4">
                <div>
                  <Label>Synopsis</Label>
                  <Textarea
                    value={autoFilledData.synopsis || ""}
                    onChange={(e) =>
                      setAutoFilledData({
                        ...autoFilledData,
                        synopsis: e.target.value,
                      })
                    }
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Keywords (AI-generated)</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                    {autoFilledData.keywords?.map((keyword: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-background border rounded-md text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {autoFilledData.coverImageUrl && (
                  <div>
                    <Label>Cover Image URL</Label>
                    <Input
                      value={autoFilledData.coverImageUrl}
                      onChange={(e) =>
                        setAutoFilledData({
                          ...autoFilledData,
                          coverImageUrl: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <div>
                  <Label>Personal Notes (Optional)</Label>
                  <Textarea
                    value={autoFilledData.notes || ""}
                    onChange={(e) =>
                      setAutoFilledData({
                        ...autoFilledData,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Add your personal notes..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? "Saving..." : "Save to Library"}
                </Button>
                <Button onClick={handleClose} variant="outline">
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
