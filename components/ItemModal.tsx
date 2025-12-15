"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2, Save, X, Upload, Link as LinkIcon } from "lucide-react";

interface ItemModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ItemModal({ item, isOpen, onClose, onUpdate }: ItemModalProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editedNotes, setEditedNotes] = useState(item.notes || "");
  const [imageUrl, setImageUrl] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // BUG FIX: Reset notes when item changes to prevent stale data
  useEffect(() => {
    setEditedNotes(item.notes || "");
    setIsEditing(false);
    setIsEditingImage(false);
    setImageUrl("");
    setPreviewImage(null);
  }, [item.id, item.notes]);

  const handleSaveNotes = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editedNotes }),
      });

      if (!response.ok) throw new Error("Failed to save notes");

      toast({ title: "Success", description: "Notes saved successfully." });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save notes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/items/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete item");

      toast({ title: "Success", description: "Item deleted successfully." });
      onClose();
      onUpdate();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WEBP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingImage(true);

      // Create FormData and upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("itemId", item.id);

      const response = await fetch("/api/items/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload image");

      const data = await response.json();
      
      toast({ title: "Success", description: "Image uploaded successfully!" });
      setIsEditingImage(false);
      setPreviewImage(null);
      
      // FIX #3: Add delay to allow database to update before refreshing
      setTimeout(() => {
        onUpdate();
      }, 500);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter an image URL.",
      });
      return;
    }

    try {
      setIsUploadingImage(true);

      const response = await fetch("/api/items/update-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, imageUrl }),
      });

      if (!response.ok) throw new Error("Failed to update image");

      toast({ title: "Success", description: "Image updated successfully!" });
      setIsEditingImage(false);
      setImageUrl("");
      setPreviewImage(null);
      
      // FIX #3: Add delay to allow database to update before refreshing
      setTimeout(() => {
        onUpdate();
      }, 500);
    } catch (error) {
      console.error("Error updating image:", error);
      toast({
        title: "Error",
        description: "Failed to update image. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleTestUrl = () => {
    if (!imageUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter an image URL to test.",
      });
      return;
    }
    setPreviewImage(imageUrl);
  };

  const imageSrc = item.coverImage || "/media/placeholder.svg";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-[300px,1fr] gap-6">
          {/* Cover Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cover Image</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingImage(!isEditingImage)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative aspect-[2/3] bg-muted rounded-lg overflow-hidden">
              {item.coverImage ? (
                <Image
                  src={imageSrc}
                  alt={item.title}
                  fill
                  className="object-contain"
                  sizes="300px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
            </div>

            {/* Image Editing Section */}
            {isEditingImage && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                <div>
                  <Label className="text-xs">Upload File (JPG/PNG/WEBP)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-muted px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Enter Image URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleTestUrl}
                    >
                      Test
                    </Button>
                  </div>
                </div>

                {previewImage && (
                  <div>
                    <Label className="text-xs">Preview</Label>
                    <div className="relative aspect-[2/3] bg-background rounded overflow-hidden mt-1">
                      <Image
                        src={previewImage}
                        alt="Preview"
                        fill
                        className="object-contain"
                        unoptimized
                        onError={() => {
                          toast({
                            title: "Invalid URL",
                            description: "Could not load image from URL.",
                            variant: "destructive",
                          });
                          setPreviewImage(null);
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleUrlSubmit}
                    disabled={isUploadingImage || !imageUrl}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isUploadingImage ? "Saving..." : "Save URL"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingImage(false);
                      setImageUrl("");
                      setPreviewImage(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <Badge>{item.type}</Badge>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Synopsis</h3>
              <p className="text-sm text-muted-foreground">{item.synopsis}</p>
            </div>

            {/* Metadata */}
            {item.metadata && Object.keys(item.metadata).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Details</h3>
                {item.type === "PORNSTAR" ? (
                  // Special rendering for PORNSTAR metadata
                  <div className="space-y-3 text-sm">
                    {item.metadata.stageName && (
                      <div>
                        <span className="font-medium">Stage Name:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.stageName}</span>
                      </div>
                    )}
                    {item.metadata.realName && (
                      <div>
                        <span className="font-medium">Real Name:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.realName}</span>
                      </div>
                    )}
                    {(item.metadata.birthYear || item.metadata.debutYear) && (
                      <div>
                        {item.metadata.birthYear && (
                          <span>
                            <span className="font-medium">Birth Year:</span>{" "}
                            <span className="text-muted-foreground">{item.metadata.birthYear}</span>
                            {item.metadata.debutYear && " • "}
                          </span>
                        )}
                        {item.metadata.debutYear && (
                          <span>
                            <span className="font-medium">Debut:</span>{" "}
                            <span className="text-muted-foreground">{item.metadata.debutYear}</span>
                          </span>
                        )}
                      </div>
                    )}
                    {(item.metadata.nationality || item.metadata.ethnicity) && (
                      <div>
                        {item.metadata.nationality && (
                          <span>
                            <span className="font-medium">Nationality:</span>{" "}
                            <span className="text-muted-foreground">{item.metadata.nationality}</span>
                            {item.metadata.ethnicity && " • "}
                          </span>
                        )}
                        {item.metadata.ethnicity && (
                          <span>
                            <span className="font-medium">Ethnicity:</span>{" "}
                            <span className="text-muted-foreground">{item.metadata.ethnicity}</span>
                          </span>
                        )}
                      </div>
                    )}
                    {item.metadata.status && (
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.status}</span>
                      </div>
                    )}
                    {item.metadata.studios && item.metadata.studios.length > 0 && (
                      <div>
                        <span className="font-medium">Studios:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.studios.join(", ")}</span>
                      </div>
                    )}
                    {item.metadata.genres && item.metadata.genres.length > 0 && (
                      <div>
                        <span className="font-medium">Genres:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.genres.join(", ")}</span>
                      </div>
                    )}
                    {item.metadata.awards && item.metadata.awards.length > 0 && (
                      <div>
                        <span className="font-medium">Awards:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.awards.join(", ")}</span>
                      </div>
                    )}
                    {item.metadata.physicalAttributes && (
                      <div>
                        <span className="font-medium">Physical Attributes:</span>
                        <div className="ml-4 mt-1 space-y-1">
                          {item.metadata.physicalAttributes.hairColor && (
                            <div className="text-muted-foreground">
                              Hair: {item.metadata.physicalAttributes.hairColor}
                            </div>
                          )}
                          {item.metadata.physicalAttributes.eyeColor && (
                            <div className="text-muted-foreground">
                              Eyes: {item.metadata.physicalAttributes.eyeColor}
                            </div>
                          )}
                          {item.metadata.physicalAttributes.height && (
                            <div className="text-muted-foreground">
                              Height: {item.metadata.physicalAttributes.height}
                            </div>
                          )}
                          {item.metadata.physicalAttributes.measurements && (
                            <div className="text-muted-foreground">
                              Measurements: {item.metadata.physicalAttributes.measurements}
                            </div>
                          )}
                          {item.metadata.physicalAttributes.tattoos && (
                            <div className="text-muted-foreground">
                              Tattoos: {typeof item.metadata.physicalAttributes.tattoos === 'boolean' 
                                ? (item.metadata.physicalAttributes.tattoos ? 'Yes' : 'No')
                                : item.metadata.physicalAttributes.tattoos}
                            </div>
                          )}
                          {item.metadata.physicalAttributes.piercings && (
                            <div className="text-muted-foreground">
                              Piercings: {typeof item.metadata.physicalAttributes.piercings === 'boolean' 
                                ? (item.metadata.physicalAttributes.piercings ? 'Yes' : 'No')
                                : item.metadata.physicalAttributes.piercings}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (item.type === "MANHWA" || item.type === "MANHUA" || item.type === "WEBTOON") ? (
                  // Special rendering for MANHWA, MANHUA, WEBTOON metadata
                  <div className="space-y-3 text-sm">
                    {item.metadata.author && (
                      <div>
                        <span className="font-medium">Author:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.author}</span>
                      </div>
                    )}
                    {item.metadata.artist && (
                      <div>
                        <span className="font-medium">Artist:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.artist}</span>
                      </div>
                    )}
                    {item.metadata.publisher && (
                      <div>
                        <span className="font-medium">Publisher:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.publisher}</span>
                      </div>
                    )}
                    {item.metadata.releaseYear && (
                      <div>
                        <span className="font-medium">Release Year:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.releaseYear}</span>
                      </div>
                    )}
                    {item.metadata.genres && item.metadata.genres.length > 0 && (
                      <div>
                        <span className="font-medium">Genres:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.genres.join(", ")}</span>
                      </div>
                    )}
                  </div>
                ) : (item.type === "DONGHUA" || item.type === "AENI" || item.type === "ANIMATION" || item.type === "HENTAI") ? (
                  // Special rendering for DONGHUA, AENI, ANIMATION, HENTAI metadata (similar to ANIME)
                  <div className="space-y-3 text-sm">
                    {item.metadata.director && (
                      <div>
                        <span className="font-medium">Director:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.director}</span>
                      </div>
                    )}
                    {item.metadata.studio && (
                      <div>
                        <span className="font-medium">Studio:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.studio}</span>
                      </div>
                    )}
                    {item.metadata.releaseYear && (
                      <div>
                        <span className="font-medium">Release Year:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.releaseYear}</span>
                      </div>
                    )}
                    {item.metadata.episodes && (
                      <div>
                        <span className="font-medium">Episodes:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.episodes}</span>
                      </div>
                    )}
                    {item.metadata.genres && item.metadata.genres.length > 0 && (
                      <div>
                        <span className="font-medium">Genres:</span>{" "}
                        <span className="text-muted-foreground">{item.metadata.genres.join(", ")}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  // Default rendering for other types
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(item.metadata).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {Array.isArray(value) ? value.join(", ") : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Keywords */}
            {item.keywords && item.keywords.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {item.keywords.map((keyword: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Personal Notes</Label>
                {!isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    rows={4}
                    placeholder="Add your personal notes here..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedNotes(item.notes || "");
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {item.notes || "No notes yet. Click the edit button to add some."}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete Item"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
