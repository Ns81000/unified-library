"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Shuffle, Database, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

import ItemCard from "@/components/ItemCard";
import ItemModal from "@/components/ItemModal";
import AddItemModal from "@/components/AddItemModal";
import RandomPickerModal from "@/components/RandomPickerModal";

export default function Home() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRandomPickerOpen, setIsRandomPickerOpen] = useState(false);

  // IMPROVEMENT: Smart debounce - longer delay for short queries to reduce noise
  useEffect(() => {
    const getDelay = () => {
      if (searchQuery.length === 0) return 0;      // Clear immediately
      if (searchQuery.length < 3) return 600;      // Wait longer for 1-2 chars (likely still typing)
      if (searchQuery.length < 5) return 400;      // Medium wait for 3-4 chars
      return 200;                                   // Quick search for 5+ chars
    };
    
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, getDelay());

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch items with server-side filtering
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query params for server-side filtering
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (sortBy) params.append("sortBy", sortBy);

      const response = await fetch(`/api/items?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      
      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description: "Failed to load items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, typeFilter, sortBy, toast]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle query enhancement
  const handleEnhanceQuery = async () => {
    if (!aiSearchQuery.trim()) {
      toast({
        title: "Enter a search query",
        description: "Please enter a query to enhance.",
      });
      return;
    }

    try {
      setIsEnhancing(true);
      const response = await fetch("/api/enhance-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiSearchQuery }),
      });

      if (!response.ok) throw new Error("Failed to enhance query");

      const data = await response.json();
      
      // Update the search query with enhanced version
      setAiSearchQuery(data.enhanced);
      
      toast({
        title: "Query Enhanced! ✨",
        description: "AI has optimized your search query. You can now search or edit it further.",
      });
    } catch (error) {
      console.error("Error enhancing query:", error);
      toast({
        title: "Enhancement failed",
        description: "Could not enhance query. Please try searching directly.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Handle AI search
  const handleAiSearch = async () => {
    if (!aiSearchQuery.trim()) {
      toast({
        title: "Enter a search query",
        description: "Please enter a description of what you're looking for.",
      });
      return;
    }

    try {
      setIsAiSearching(true);
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiSearchQuery }),
      });

      if (!response.ok) throw new Error("AI search failed");

      const results = await response.json();
      
      if (results.length === 0) {
        toast({
          title: "No matches found",
          description: "Try a different search query.",
        });
      } else {
        setFilteredItems(results);
        toast({
          title: "Search complete",
          description: `Found ${results.length} matching item(s).`,
        });
      }
    } catch (error) {
      console.error("Error during AI search:", error);
      toast({
        title: "Search failed",
        description: "An error occurred during the search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAiSearching(false);
    }
  };

  // Handle reset filters
  const handleReset = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setAiSearchQuery("");
    setTypeFilter("ALL");
    setSortBy("createdAt");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Unified Media Library</h1>
            <div className="flex gap-2">
              <Button onClick={() => setIsRandomPickerOpen(true)} variant="outline">
                <Shuffle className="mr-2 h-4 w-4" />
                What&apos;s Next?
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Item
              </Button>
              <Link href="/stats">
                <Button variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Statistics
                </Button>
              </Link>
              <Link href="/backup">
                <Button variant="outline">
                  <Database className="mr-2 h-4 w-4" />
                  Backup & Restore
                </Button>
              </Link>
              <Link href="/bulk-import">
                <Button variant="outline">
                  Bulk Import
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-4">
          <div className="space-y-4">
            {/* Quick Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Quick search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* AI Search */}
            <div className="flex gap-2">
              <Input
                placeholder="AI search (e.g., 'a sci-fi movie with time travel')..."
                value={aiSearchQuery}
                onChange={(e) => setAiSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
                className="flex-1"
              />
              <Button
                onClick={handleEnhanceQuery}
                disabled={isEnhancing || isAiSearching}
                variant="outline"
                className="min-w-[110px]"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isEnhancing ? "Enhancing..." : "Enhance"}
              </Button>
              <Button
                onClick={handleAiSearch}
                disabled={isAiSearching || isEnhancing}
                className="min-w-[100px]"
              >
                {isAiSearching ? "Searching..." : "AI Search"}
              </Button>
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
            </div>

            {/* Filter and Sort */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="MOVIE">Movies</SelectItem>
                    <SelectItem value="SERIES">Series</SelectItem>
                    <SelectItem value="ANIME">Anime</SelectItem>
                    <SelectItem value="BOOK">Books</SelectItem>
                    <SelectItem value="COMIC">Comics</SelectItem>
                    <SelectItem value="MANGA">Manga</SelectItem>
                    <SelectItem value="GAME">Games</SelectItem>
                    <SelectItem value="PERSON">Persons</SelectItem>
                    <SelectItem value="FRANCHISE">Franchises</SelectItem>
                    <SelectItem value="PORNSTAR">Pornstars</SelectItem>
                    <SelectItem value="DONGHUA">Donghua</SelectItem>
                    <SelectItem value="MANHWA">Manhwa</SelectItem>
                    <SelectItem value="MANHUA">Manhua</SelectItem>
                    <SelectItem value="HENTAI">Hentai</SelectItem>
                    <SelectItem value="AENI">Aeni</SelectItem>
                    <SelectItem value="ANIMATION">Animation</SelectItem>
                    <SelectItem value="WEBTOON">Webtoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date Added</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="releaseYear">Release Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Item Grid */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your library...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery || aiSearchQuery ? "No items match your search." : "Your library is empty. Add your first item!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={fetchItems}
        />
      )}

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchItems}
      />

      <RandomPickerModal
        isOpen={isRandomPickerOpen}
        onClose={() => setIsRandomPickerOpen(false)}
        onSelectItem={(item) => {
          setSelectedItem(item);
          setIsRandomPickerOpen(false);
        }}
      />
    </div>
  );
}
