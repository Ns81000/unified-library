import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

type Item = {
  id: string;
  title: string;
  type: string;
  coverImage: string | null;
  synopsis: string;
  keywords: string[];
  notes: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET() {
  try {
    // Fetch all items
    const items = await prisma.item.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 1. LIBRARY OVERVIEW
    const totalItems = items.length;

    // Count by type
    const typeCounts = items.reduce((acc: Record<string, number>, item: Item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 2. QUALITY METRICS
    const withCovers = items.filter((item: Item) => item.coverImage !== null).length;
    const withKeywords = items.filter((item: Item) => item.keywords.length > 0).length;
    const withNotes = items.filter((item: Item) => item.notes !== null && item.notes.trim() !== "").length;
    const withMetadata = items.filter((item: Item) => item.metadata && Object.keys(item.metadata as object).length > 0).length;

    // Calculate average keywords per item
    const totalKeywords = items.reduce((sum: number, item: Item) => sum + item.keywords.length, 0);
    const avgKeywordsPerItem = totalItems > 0 ? (totalKeywords / totalItems).toFixed(2) : "0";

    // Calculate average synopsis length
    const totalSynopsisLength = items.reduce((sum: number, item: Item) => sum + (item.synopsis?.length || 0), 0);
    const avgSynopsisLength = totalItems > 0 ? Math.round(totalSynopsisLength / totalItems) : 0;

    // Quality score (percentage of items with complete data)
    const qualityScore = totalItems > 0
      ? Math.round(((withCovers + withKeywords + withNotes + withMetadata) / (totalItems * 4)) * 100)
      : 0;

    // 3. KEYWORD ANALYTICS
    const allKeywords = items.flatMap((item: Item) => item.keywords);
    const keywordFrequency = allKeywords.reduce((acc: Record<string, number>, keyword: string) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topKeywords = Object.entries(keywordFrequency)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 30)
      .map(([keyword, count]) => ({ keyword, count }));

    const uniqueKeywords = Object.keys(keywordFrequency).length;
    const orphanKeywords = Object.values(keywordFrequency).filter((count) => count === 1).length;

    // 4. TIME-BASED ANALYTICS
    // Group by month for timeline
    const monthlyData = items.reduce((acc: Record<string, number>, item: Item) => {
      const date = new Date(item.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const timeline = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // Group by year
    const yearlyData = items.reduce((acc: Record<number, number>, item: Item) => {
      const year = new Date(item.createdAt).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const yearlyBreakdown = Object.entries(yearlyData)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, count]) => ({ year: Number(year), count }));

    // Recent additions (last 20)
    const recentAdditions = items.slice(0, 20).map((item: Item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      coverImage: item.coverImage,
      createdAt: item.createdAt,
    }));

    // Oldest items (first 10)
    const oldestItems = items
      .slice()
      .sort((a: Item, b: Item) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 10)
      .map((item: Item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        coverImage: item.coverImage,
        createdAt: item.createdAt,
      }));

    // 5. METADATA DEEP DIVE (Type-Specific)
    const metadataAnalysis = await analyzeMetadata(items);

    // 6. STORAGE INFO
    const storageInfo = await calculateStorageSize();

    // 7. DATA HEALTH
    const missingCovers = items.filter((item: Item) => !item.coverImage).map((item: Item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
    }));

    const missingKeywords = items.filter((item: Item) => item.keywords.length === 0).map((item: Item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
    }));

    const missingMetadata = items.filter((item: Item) => !item.metadata || Object.keys(item.metadata as object).length === 0).map((item: Item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
    }));

    // 8. COMPARATIVE ANALYTICS
    const typeBalance = calculateTypeBalance(typeCounts);
    const largestType = Object.entries(typeCounts).sort(([, a], [, b]) => (b as number) - (a as number))[0];
    const smallestType = Object.entries(typeCounts).sort(([, a], [, b]) => (a as number) - (b as number))[0];

    // 9. BULK IMPORT DETECTION
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemsAddedToday = items.filter((item: Item) => {
      const itemDate = new Date(item.createdAt);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === today.getTime();
    }).length;

    // Check if newest item is old (restored from backup)
    const newestItemDate = items.length > 0 ? new Date(items[0].createdAt) : null;
    const daysSinceNewest = newestItemDate
      ? Math.floor((Date.now() - newestItemDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // 10. DECADE DISTRIBUTION
    const decadeDistribution = calculateDecadeDistribution(items);

    // 11. GENRE DIVERSITY SCORE
    const genreDiversity = calculateGenreDiversity(items);

    // 12. PERSON CONNECTIONS
    const personConnections = calculatePersonConnections(items);

    // 13. SYNOPSIS RICHNESS
    const synopsisRichness = calculateSynopsisRichness(items);

    // 14. ORPHAN ITEMS (Hidden Gems)
    const orphanItems = findOrphanItems(items);

    // 15. UNEXPLORED TERRITORY
    const unexploredTerritory = findUnexploredTerritory(items);

    // 16. TEXT LENGTH DISTRIBUTION
    const textLengthDistribution = calculateTextLengthDistribution(items);

    // 17. KEYWORD CO-OCCURRENCE (Network Data)
    const keywordNetwork = calculateKeywordCooccurrence(items);

    // 18. TYPE-SPECIFIC ADVANCED ANALYTICS
    const advancedAnalytics = calculateAdvancedAnalytics(items);

    return NextResponse.json({
      overview: {
        totalItems,
        typeCounts,
        qualityScore,
      },
      quality: {
        withCovers,
        withoutCovers: totalItems - withCovers,
        withKeywords,
        withoutKeywords: totalItems - withKeywords,
        withNotes,
        withoutNotes: totalItems - withNotes,
        withMetadata,
        withoutMetadata: totalItems - withMetadata,
        avgKeywordsPerItem: Number(avgKeywordsPerItem),
        avgSynopsisLength,
      },
      keywords: {
        topKeywords,
        uniqueKeywords,
        totalKeywords: allKeywords.length,
        orphanKeywords,
      },
      timeline: {
        monthly: timeline,
        yearly: yearlyBreakdown,
        recentAdditions,
        oldestItems,
      },
      metadata: metadataAnalysis,
      storage: storageInfo,
      dataHealth: {
        missingCovers: missingCovers.slice(0, 50), // Limit to 50
        missingKeywords: missingKeywords.slice(0, 50),
        missingMetadata: missingMetadata.slice(0, 50),
        totalMissingCovers: missingCovers.length,
        totalMissingKeywords: missingKeywords.length,
        totalMissingMetadata: missingMetadata.length,
      },
      comparative: {
        typeBalance,
        largestType: largestType ? { type: largestType[0], count: largestType[1] } : null,
        smallestType: smallestType ? { type: smallestType[0], count: smallestType[1] } : null,
      },
      alerts: {
        bulkImportToday: itemsAddedToday > 50 ? itemsAddedToday : null,
        oldDataWarning: daysSinceNewest > 7 ? daysSinceNewest : null,
      },
      decadeDistribution,
      genreDiversity,
      personConnections,
      synopsisRichness,
      orphanItems,
      unexploredTerritory,
      textLengthDistribution,
      keywordNetwork,
      advancedAnalytics,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating stats:", error);
    return NextResponse.json(
      { error: "Failed to generate statistics" },
      { status: 500 }
    );
  }
}

// Helper: Analyze metadata for each type
async function analyzeMetadata(items: Item[]) {
  const analysis: any = {};

  // MOVIES
  const movies = items.filter((item) => item.type === "MOVIE");
  if (movies.length > 0) {
    analysis.MOVIE = {
      count: movies.length,
      genres: extractAndCount(movies, "genre"), // Handles both "genre" and "genres"
      releaseYears: extractAndCount(movies, "releaseYear"),
      directors: extractAndCount(movies, "director"),
      studios: extractAndCount(movies, "studio"),
      actors: extractAndCount(movies, "mainActor"), // Handles "mainActor" and "mainActors"
    };
  }

  // SERIES
  const series = items.filter((item) => item.type === "SERIES");
  if (series.length > 0) {
    analysis.SERIES = {
      count: series.length,
      genres: extractAndCount(series, "genre"),
      releaseYears: extractAndCount(series, "releaseYear"),
      directors: extractAndCount(series, "director"),
      studios: extractAndCount(series, "studio"),
    };
  }

  // ANIME
  const anime = items.filter((item) => item.type === "ANIME");
  if (anime.length > 0) {
    analysis.ANIME = {
      count: anime.length,
      genres: extractAndCount(anime, "genre"),
      studios: extractAndCount(anime, "studio"),
      releaseYears: extractAndCount(anime, "releaseYear"),
    };
  }

  // BOOKS
  const books = items.filter((item) => item.type === "BOOK");
  if (books.length > 0) {
    analysis.BOOK = {
      count: books.length,
      genres: extractAndCount(books, "genre"),
      authors: extractAndCount(books, "author"),
      publicationYears: extractAndCount(books, "publicationYear"),
    };
  }

  // GAMES
  const games = items.filter((item) => item.type === "GAME");
  if (games.length > 0) {
    analysis.GAME = {
      count: games.length,
      platforms: extractAndCount(games, "platform"), // Handles "platform" and "platforms"
      genres: extractAndCount(games, "genre"),
      developers: extractAndCount(games, "developer"),
      publishers: extractAndCount(games, "publisher"),
      releaseYears: extractAndCount(games, "releaseYear"),
    };
  }

  // COMICS
  const comics = items.filter((item) => item.type === "COMIC");
  if (comics.length > 0) {
    analysis.COMIC = {
      count: comics.length,
      authors: extractAndCount(comics, "author"),
      genres: extractAndCount(comics, "genre"),
      publicationYears: extractAndCount(comics, "publicationYear"),
    };
  }

  // MANGA
  const manga = items.filter((item) => item.type === "MANGA");
  if (manga.length > 0) {
    analysis.MANGA = {
      count: manga.length,
      authors: extractAndCount(manga, "author"),
      genres: extractAndCount(manga, "genre"),
      publicationYears: extractAndCount(manga, "publicationYear"),
    };
  }

  // PERSONS
  const persons = items.filter((item) => item.type === "PERSON");
  if (persons.length > 0) {
    analysis.PERSON = {
      count: persons.length,
      professions: extractAndCount(persons, "knownFor"),
      birthYears: extractAndCount(persons, "birthYear"),
    };
  }

  // FRANCHISES
  const franchises = items.filter((item) => item.type === "FRANCHISE");
  if (franchises.length > 0) {
    analysis.FRANCHISE = {
      count: franchises.length,
      creators: extractAndCount(franchises, "creator"),
      mediaTypes: extractArrayAndCount(franchises, "mediaTypes"),
    };
  }

  // PORNSTARS
  const pornstars = items.filter((item) => item.type === "PORNSTAR");
  if (pornstars.length > 0) {
    analysis.PORNSTAR = {
      count: pornstars.length,
      nationalities: extractAndCount(pornstars, "nationality"),
      ethnicities: extractAndCount(pornstars, "ethnicity"),
      statuses: extractAndCount(pornstars, "status"),
      studios: extractArrayAndCount(pornstars, "studios"),
      genres: extractArrayAndCount(pornstars, "genres"),
    };
  }

  // MANHWA
  const manhwa = items.filter((item) => item.type === "MANHWA");
  if (manhwa.length > 0) {
    analysis.MANHWA = {
      count: manhwa.length,
      authors: extractAndCount(manhwa, "author"),
      artists: extractAndCount(manhwa, "artist"),
      publishers: extractAndCount(manhwa, "publisher"),
      genres: extractAndCount(manhwa, "genre"),
      publicationYears: extractAndCount(manhwa, "publicationYear"),
    };
  }

  // MANHUA
  const manhua = items.filter((item) => item.type === "MANHUA");
  if (manhua.length > 0) {
    analysis.MANHUA = {
      count: manhua.length,
      authors: extractAndCount(manhua, "author"),
      artists: extractAndCount(manhua, "artist"),
      publishers: extractAndCount(manhua, "publisher"),
      genres: extractAndCount(manhua, "genre"),
      publicationYears: extractAndCount(manhua, "publicationYear"),
    };
  }

  // WEBTOON
  const webtoon = items.filter((item) => item.type === "WEBTOON");
  if (webtoon.length > 0) {
    analysis.WEBTOON = {
      count: webtoon.length,
      authors: extractAndCount(webtoon, "author"),
      artists: extractAndCount(webtoon, "artist"),
      publishers: extractAndCount(webtoon, "publisher"),
      genres: extractAndCount(webtoon, "genre"),
      publicationYears: extractAndCount(webtoon, "publicationYear"),
    };
  }

  // DONGHUA
  const donghua = items.filter((item) => item.type === "DONGHUA");
  if (donghua.length > 0) {
    analysis.DONGHUA = {
      count: donghua.length,
      genres: extractAndCount(donghua, "genre"),
      studios: extractAndCount(donghua, "studio"),
      directors: extractAndCount(donghua, "director"),
      releaseYears: extractAndCount(donghua, "releaseYear"),
    };
  }

  // AENI
  const aeni = items.filter((item) => item.type === "AENI");
  if (aeni.length > 0) {
    analysis.AENI = {
      count: aeni.length,
      genres: extractAndCount(aeni, "genre"),
      studios: extractAndCount(aeni, "studio"),
      directors: extractAndCount(aeni, "director"),
      releaseYears: extractAndCount(aeni, "releaseYear"),
    };
  }

  // ANIMATION
  const animation = items.filter((item) => item.type === "ANIMATION");
  if (animation.length > 0) {
    analysis.ANIMATION = {
      count: animation.length,
      genres: extractAndCount(animation, "genre"),
      studios: extractAndCount(animation, "studio"),
      directors: extractAndCount(animation, "director"),
      releaseYears: extractAndCount(animation, "releaseYear"),
    };
  }

  // HENTAI
  const hentai = items.filter((item) => item.type === "HENTAI");
  if (hentai.length > 0) {
    analysis.HENTAI = {
      count: hentai.length,
      genres: extractAndCount(hentai, "genre"),
      studios: extractAndCount(hentai, "studio"),
      directors: extractAndCount(hentai, "director"),
      releaseYears: extractAndCount(hentai, "releaseYear"),
    };
  }

  return analysis;
}

// Helper: Extract and count metadata field values
// Handles both singular and plural fields (e.g., "genre" and "genres")
// Also handles both string values and array values
function extractAndCount(items: Item[], field: string) {
  const allValues: string[] = [];
  
  items.forEach((item) => {
    const metadata = item.metadata;
    if (!metadata) return;
    
    // Try singular field first
    let value = metadata[field];
    
    // If not found, try plural version (add 's')
    if (value === null || value === undefined) {
      value = metadata[field + 's'];
    }
    
    // Handle the value
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        // If it's an array, add all elements
        allValues.push(...value.map(String).filter(Boolean));
      } else {
        // If it's a string or number, add it
        allValues.push(String(value));
      }
    }
  });

  // Count frequency
  const frequency = allValues.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(frequency)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([value, count]) => ({ value, count }));
}

// Helper: Extract and count array field values
function extractArrayAndCount(items: Item[], field: string) {
  const allValues = items.flatMap((item) => item.metadata?.[field] || []);

  const frequency = allValues.reduce((acc, value) => {
    const key = String(value);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(frequency)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([value, count]) => ({ value, count }));
}

// Helper: Calculate storage size
async function calculateStorageSize() {
  try {
    const mediaDir = path.join(process.cwd(), "media-storage", "covers");
    
    if (!fs.existsSync(mediaDir)) {
      return { totalSize: 0, totalFiles: 0, formattedSize: "0 MB" };
    }

    const files = fs.readdirSync(mediaDir);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(mediaDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    }

    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
    const formattedSize = totalSize > 1024 * 1024 * 1024
      ? `${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`
      : `${sizeInMB} MB`;

    return {
      totalSize,
      totalFiles: files.length,
      formattedSize,
    };
  } catch (error) {
    console.error("Error calculating storage size:", error);
    return { totalSize: 0, totalFiles: 0, formattedSize: "0 MB" };
  }
}

// Helper: Calculate type balance score
function calculateTypeBalance(typeCounts: Record<string, number>) {
  const counts = Object.values(typeCounts);
  if (counts.length === 0) return 0;

  const total = counts.reduce((sum, count) => sum + count, 0);
  const avg = total / counts.length;
  
  // Calculate standard deviation
  const variance = counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / counts.length;
  const stdDev = Math.sqrt(variance);
  
  // Balance score: lower stdDev = more balanced (normalized to 0-100)
  const maxStdDev = avg; // Maximum possible deviation
  const balanceScore = maxStdDev > 0 ? Math.round((1 - stdDev / maxStdDev) * 100) : 100;
  
  return Math.max(0, Math.min(100, balanceScore));
}

// Helper: Calculate decade distribution
function calculateDecadeDistribution(items: Item[]) {
  const decades: Record<string, number> = {};
  
  items.forEach((item) => {
    const metadata = item.metadata;
    if (!metadata) return;
    
    const year = metadata.releaseYear || metadata.publicationYear || metadata.birthYear;
    
    if (year && typeof year === 'number') {
      const decade = Math.floor(year / 10) * 10;
      const decadeLabel = `${decade}s`;
      decades[decadeLabel] = (decades[decadeLabel] || 0) + 1;
    }
  });
  
  const distribution = Object.entries(decades)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([decade, count]) => ({ decade, count }));
    
  return {
    distribution,
    totalWithYears: distribution.reduce((sum, d) => sum + d.count, 0),
    oldestDecade: distribution[0]?.decade || null,
    newestDecade: distribution[distribution.length - 1]?.decade || null,
  };
}

// Helper: Calculate genre diversity score
function calculateGenreDiversity(items: Item[]) {
  const allGenres: string[] = [];
  
  items.forEach((item) => {
    const metadata = item.metadata;
    if (!metadata) return;
    
    let genres = metadata.genres || metadata.genre;
    
    if (genres) {
      if (Array.isArray(genres)) {
        allGenres.push(...genres);
      } else {
        allGenres.push(String(genres));
      }
    }
  });
  
  const uniqueGenres = new Set(allGenres);
  const genreFrequency: Record<string, number> = {};
  
  allGenres.forEach((genre) => {
    genreFrequency[genre] = (genreFrequency[genre] || 0) + 1;
  });
  
  const totalGenres = allGenres.length;
  let shannonIndex = 0;
  
  if (totalGenres > 0) {
    Object.values(genreFrequency).forEach((count) => {
      const proportion = count / totalGenres;
      shannonIndex -= proportion * Math.log(proportion);
    });
  }
  
  const maxShannon = uniqueGenres.size > 0 ? Math.log(uniqueGenres.size) : 1;
  const diversityScore = maxShannon > 0 ? Math.round((shannonIndex / maxShannon) * 100) : 0;
  
  const topGenres = Object.entries(genreFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([genre, count]) => ({ genre, count }));
  
  return {
    diversityScore,
    uniqueGenres: uniqueGenres.size,
    totalGenreTags: totalGenres,
    topGenres,
  };
}

// Helper: Calculate person connections
function calculatePersonConnections(items: Item[]) {
  const personFrequency: Record<string, number> = {};
  
  items.forEach((item) => {
    const metadata = item.metadata;
    if (!metadata) return;
    
    const directors = metadata.director || metadata.directors;
    if (directors) {
      const directorList = Array.isArray(directors) ? directors : [directors];
      directorList.forEach((director: any) => {
        const name = String(director);
        personFrequency[name] = (personFrequency[name] || 0) + 1;
      });
    }
    
    const actors = metadata.mainActors || metadata.mainActor || metadata.actor || metadata.actors;
    if (actors) {
      const actorList = Array.isArray(actors) ? actors : [actors];
      actorList.forEach((actor: any) => {
        const name = String(actor);
        personFrequency[name] = (personFrequency[name] || 0) + 1;
      });
    }
    
    const authors = metadata.author || metadata.authors;
    if (authors) {
      const authorList = Array.isArray(authors) ? authors : [authors];
      authorList.forEach((author: any) => {
        const name = String(author);
        personFrequency[name] = (personFrequency[name] || 0) + 1;
      });
    }
    
    // NEW: Add artist field for MANHWA, MANHUA, WEBTOON
    const artists = metadata.artist || metadata.artists;
    if (artists) {
      const artistList = Array.isArray(artists) ? artists : [artists];
      artistList.forEach((artist: any) => {
        const name = String(artist);
        personFrequency[name] = (personFrequency[name] || 0) + 1;
      });
    }
  });
  
  const topPeople = Object.entries(personFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));
  
  return {
    topPeople,
    totalUniquePeople: Object.keys(personFrequency).length,
  };
}

// Helper: Calculate synopsis richness
function calculateSynopsisRichness(items: Item[]) {
  const byType: Record<string, { totalWords: number; count: number }> = {};
  
  items.forEach((item) => {
    if (!item.synopsis) return;
    
    const wordCount = item.synopsis.split(/\s+/).filter(Boolean).length;
    
    if (!byType[item.type]) {
      byType[item.type] = { totalWords: 0, count: 0 };
    }
    
    byType[item.type].totalWords += wordCount;
    byType[item.type].count += 1;
  });
  
  const averageByType = Object.entries(byType).map(([type, data]) => ({
    type,
    avgWords: Math.round(data.totalWords / data.count),
    count: data.count,
  })).sort((a, b) => b.avgWords - a.avgWords);
  
  const totalWords = Object.values(byType).reduce((sum, data) => sum + data.totalWords, 0);
  const totalItems = Object.values(byType).reduce((sum, data) => sum + data.count, 0);
  const overallAvg = totalItems > 0 ? Math.round(totalWords / totalItems) : 0;
  
  return {
    averageByType,
    overallAverage: overallAvg,
    richnessScore: Math.min(100, Math.round((overallAvg / 200) * 100)),
  };
}

// Helper: Find orphan items
function findOrphanItems(items: Item[]) {
  const keywordFrequency: Record<string, number> = {};
  
  items.forEach((item) => {
    item.keywords.forEach((keyword) => {
      keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
    });
  });
  
  const orphans = items.filter((item) => {
    if (item.keywords.length === 0) return false;
    return item.keywords.every((keyword) => keywordFrequency[keyword] === 1);
  }).map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    coverImage: item.coverImage,
    keywords: item.keywords,
  }));
  
  return {
    items: orphans.slice(0, 20),
    totalOrphans: orphans.length,
  };
}

// Helper: Find unexplored territory
function findUnexploredTerritory(items: Item[]) {
  const allTypes = ['MOVIE', 'SERIES', 'ANIME', 'BOOK', 'GAME', 'COMIC', 'MANGA', 'PERSON', 'FRANCHISE', 'PORNSTAR', 'DONGHUA', 'MANHWA', 'MANHUA', 'HENTAI', 'AENI', 'ANIMATION', 'WEBTOON'];
  const typeCounts: Record<string, number> = {};
  
  items.forEach((item) => {
    typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
  });
  
  const missingTypes = allTypes.filter((type) => !typeCounts[type]);
  const underrepresentedTypes = Object.entries(typeCounts)
    .filter(([, count]) => count <= 5)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => a.count - b.count);
  
  const genreByType: Record<string, Set<string>> = {};
  
  items.forEach((item) => {
    const metadata = item.metadata;
    if (!metadata) return;
    
    const genres = metadata.genres || metadata.genre;
    if (!genres) return;
    
    if (!genreByType[item.type]) {
      genreByType[item.type] = new Set();
    }
    
    const genreList = Array.isArray(genres) ? genres : [genres];
    genreList.forEach((genre) => genreByType[item.type].add(String(genre)));
  });
  
  const genreGaps = Object.entries(genreByType)
    .map(([type, genres]) => ({
      type,
      genreCount: genres.size,
      genres: Array.from(genres),
    }))
    .sort((a, b) => a.genreCount - b.genreCount);
  
  return {
    missingTypes,
    underrepresentedTypes,
    genreGaps,
  };
}

// Helper: Calculate text length distribution
function calculateTextLengthDistribution(items: Item[]) {
  const buckets = {
    '0-50': 0,
    '51-100': 0,
    '101-200': 0,
    '201-500': 0,
    '501+': 0,
  };
  
  items.forEach((item) => {
    if (!item.synopsis) return;
    
    const wordCount = item.synopsis.split(/\s+/).filter(Boolean).length;
    
    if (wordCount <= 50) buckets['0-50']++;
    else if (wordCount <= 100) buckets['51-100']++;
    else if (wordCount <= 200) buckets['101-200']++;
    else if (wordCount <= 500) buckets['201-500']++;
    else buckets['501+']++;
  });
  
  return {
    distribution: Object.entries(buckets).map(([range, count]) => ({ range, count })),
  };
}

// Helper: Calculate keyword co-occurrence
function calculateKeywordCooccurrence(items: Item[]) {
  const cooccurrence: Record<string, Record<string, number>> = {};
  
  items.forEach((item) => {
    const keywords = item.keywords;
    
    for (let i = 0; i < keywords.length; i++) {
      for (let j = i + 1; j < keywords.length; j++) {
        const kw1 = keywords[i];
        const kw2 = keywords[j];
        
        const [first, second] = kw1 < kw2 ? [kw1, kw2] : [kw2, kw1];
        
        if (!cooccurrence[first]) cooccurrence[first] = {};
        cooccurrence[first][second] = (cooccurrence[first][second] || 0) + 1;
      }
    }
  });
  
  const pairs: Array<{ keyword1: string; keyword2: string; count: number }> = [];
  
  Object.entries(cooccurrence).forEach(([kw1, connections]) => {
    Object.entries(connections).forEach(([kw2, count]) => {
      pairs.push({ keyword1: kw1, keyword2: kw2, count });
    });
  });
  
  pairs.sort((a, b) => b.count - a.count);
  
  return {
    topPairs: pairs.slice(0, 50),
    totalPairs: pairs.length,
  };
}

// Helper functions for advanced analytics
function calculateAvgAge(items: Item[]) {
  const currentYear = new Date().getFullYear();
  let totalAge = 0;
  let count = 0;
  
  items.forEach((item) => {
    const year = item.metadata?.releaseYear || item.metadata?.publicationYear;
    if (year && typeof year === 'number') {
      totalAge += currentYear - year;
      count++;
    }
  });
  
  return count > 0 ? Math.round(totalAge / count) : 0;
}

function calculateItemDecades(items: Item[], yearField: string = 'releaseYear') {
  const decades: Record<string, number> = {};
  
  items.forEach((item) => {
    const year = item.metadata?.[yearField] || item.metadata?.publicationYear || item.metadata?.releaseYear;
    if (year && typeof year === 'number') {
      const decade = Math.floor(year / 10) * 10;
      const decadeLabel = `${decade}s`;
      decades[decadeLabel] = (decades[decadeLabel] || 0) + 1;
    }
  });
  
  return Object.entries(decades)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([decade, count]) => ({ value: decade, count }))
    .slice(0, 10);
}

function calculateGenreEvolution(items: Item[]) {
  const genreByDecade: Record<string, Record<string, number>> = {};
  
  items.forEach((item) => {
    const year = item.metadata?.releaseYear;
    const genres = item.metadata?.genres || item.metadata?.genre;
    
    if (!year || !genres) return;
    
    const decade = Math.floor(Number(year) / 10) * 10;
    const decadeLabel = `${decade}s`;
    
    if (!genreByDecade[decadeLabel]) {
      genreByDecade[decadeLabel] = {};
    }
    
    const genreList = Array.isArray(genres) ? genres : [genres];
    genreList.forEach((genre) => {
      const genreStr = String(genre);
      genreByDecade[decadeLabel][genreStr] = (genreByDecade[decadeLabel][genreStr] || 0) + 1;
    });
  });
  
  const evolution = Object.entries(genreByDecade)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([decade, genres]) => {
      const topGenre = Object.entries(genres)
        .sort(([, a], [, b]) => b - a)[0];
      return {
        decade,
        topGenre: topGenre ? topGenre[0] : 'Unknown',
        count: topGenre ? topGenre[1] : 0,
      };
    });
  
  return evolution.slice(0, 10);
}

function calculateDiversityIndex(items: Array<{ value: string; count: number }>) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return 0;
  
  let shannonIndex = 0;
  items.forEach((item) => {
    const proportion = item.count / total;
    if (proportion > 0) {
      shannonIndex -= proportion * Math.log(proportion);
    }
  });
  
  const maxShannon = items.length > 0 ? Math.log(items.length) : 1;
  return maxShannon > 0 ? Math.round((shannonIndex / maxShannon) * 100) : 0;
}

// Helper: Calculate advanced analytics by type
function calculateAdvancedAnalytics(items: Item[]) {
  const analytics: any = {};
  
  const movies = items.filter((item) => item.type === "MOVIE");
  if (movies.length > 0) {
    analytics.MOVIE = {
      directorFilmography: extractAndCount(movies, "director"),
      studioDominance: extractAndCount(movies, "studio"),
      decadePreferences: calculateItemDecades(movies),
      genreEvolution: calculateGenreEvolution(movies),
    };
  }
  
  const series = items.filter((item) => item.type === "SERIES");
  if (series.length > 0) {
    analytics.SERIES = {
      directorFrequency: extractAndCount(series, "director"),
      studioDistribution: extractAndCount(series, "studio"),
      genrePreferences: extractAndCount(series, "genre"),
      avgSeriesAge: calculateAvgAge(series),
    };
  }
  
  const anime = items.filter((item) => item.type === "ANIME");
  if (anime.length > 0) {
    analytics.ANIME = {
      studioPreferences: extractAndCount(anime, "studio"),
      genresMix: extractAndCount(anime, "genre"),
    };
  }
  
  const books = items.filter((item) => item.type === "BOOK");
  if (books.length > 0) {
    analytics.BOOK = {
      authorCollections: extractAndCount(books, "author"),
      genreDistribution: extractAndCount(books, "genre"),
      avgBookAge: calculateAvgAge(books),
    };
  }
  
  const games = items.filter((item) => item.type === "GAME");
  if (games.length > 0) {
    analytics.GAME = {
      platformDistribution: extractAndCount(games, "platform"),
      developerLoyalty: extractAndCount(games, "developer"),
      publisherPower: extractAndCount(games, "publisher"),
    };
  }
  
  const comics = items.filter((item) => item.type === "COMIC");
  if (comics.length > 0) {
    analytics.COMIC = {
      creatorFollowing: extractAndCount(comics, "author"),
      genrePreferences: extractAndCount(comics, "genre"),
      publicationYears: extractAndCount(comics, "publicationYear"),
    };
  }
  
  const manga = items.filter((item) => item.type === "MANGA");
  if (manga.length > 0) {
    analytics.MANGA = {
      mangakaCollections: extractAndCount(manga, "author"),
      demographicSplit: extractAndCount(manga, "genre"),
      publicationYears: extractAndCount(manga, "publicationYear"),
    };
  }

  const franchises = items.filter((item) => item.type === "FRANCHISE");
  if (franchises.length > 0) {
    analytics.FRANCHISE = {
      creatorHighlights: extractAndCount(franchises, "creator"),
      mediaTypesSpread: extractAndCount(franchises, "mediaTypes"),
    };
  }
  
  const persons = items.filter((item) => item.type === "PERSON");
  if (persons.length > 0) {
    analytics.PERSON = {
      professionBreakdown: extractAndCount(persons, "knownFor"),
      generationAnalysis: calculateItemDecades(persons, "birthYear"),
      notableWorksCount: extractAndCount(persons, "notableWorks"),
    };
  }
  
  const pornstars = items.filter((item) => item.type === "PORNSTAR");
  if (pornstars.length > 0) {
    const nationalities = extractAndCount(pornstars, "nationality");
    const ethnicities = extractAndCount(pornstars, "ethnicity");
    const statuses = extractAndCount(pornstars, "status");
    
    const totalPornstars = pornstars.length;
    const activeCount = pornstars.filter((p) => 
      String(p.metadata?.status).toLowerCase() === 'active'
    ).length;
    
    analytics.PORNSTAR = {
      nationalityDiversity: calculateDiversityIndex(nationalities),
      ethnicityRepresentation: ethnicities,
      activeVsRetired: {
        active: activeCount,
        retired: totalPornstars - activeCount,
        activePercentage: totalPornstars > 0 ? Math.round((activeCount / totalPornstars) * 100) : 0,
      },
      studioDistribution: extractArrayAndCount(pornstars, "studios"),
      genreSpecialization: extractArrayAndCount(pornstars, "genres"),
    };
  }
  
  // MANHWA
  const manhwa = items.filter((item) => item.type === "MANHWA");
  if (manhwa.length > 0) {
    analytics.MANHWA = {
      authorCollections: extractAndCount(manhwa, "author"),
      artistStyles: extractAndCount(manhwa, "artist"),
      publisherDominance: extractAndCount(manhwa, "publisher"),
      genrePreferences: extractAndCount(manhwa, "genre"),
      publicationYears: extractAndCount(manhwa, "publicationYear"),
    };
  }
  
  // MANHUA
  const manhua = items.filter((item) => item.type === "MANHUA");
  if (manhua.length > 0) {
    analytics.MANHUA = {
      authorCollections: extractAndCount(manhua, "author"),
      artistStyles: extractAndCount(manhua, "artist"),
      publisherDominance: extractAndCount(manhua, "publisher"),
      genrePreferences: extractAndCount(manhua, "genre"),
      publicationYears: extractAndCount(manhua, "publicationYear"),
    };
  }
  
  // WEBTOON
  const webtoon = items.filter((item) => item.type === "WEBTOON");
  if (webtoon.length > 0) {
    analytics.WEBTOON = {
      authorCollections: extractAndCount(webtoon, "author"),
      artistStyles: extractAndCount(webtoon, "artist"),
      publisherDominance: extractAndCount(webtoon, "publisher"),
      genrePreferences: extractAndCount(webtoon, "genre"),
      publicationYears: extractAndCount(webtoon, "publicationYear"),
    };
  }
  
  // DONGHUA
  const donghua = items.filter((item) => item.type === "DONGHUA");
  if (donghua.length > 0) {
    analytics.DONGHUA = {
      studioPreferences: extractAndCount(donghua, "studio"),
      directorFrequency: extractAndCount(donghua, "director"),
      genresMix: extractAndCount(donghua, "genre"),
      publicationYears: extractAndCount(donghua, "releaseYear"),
    };
  }
  
  // AENI
  const aeni = items.filter((item) => item.type === "AENI");
  if (aeni.length > 0) {
    analytics.AENI = {
      studioPreferences: extractAndCount(aeni, "studio"),
      directorFrequency: extractAndCount(aeni, "director"),
      genresMix: extractAndCount(aeni, "genre"),
      publicationYears: extractAndCount(aeni, "releaseYear"),
    };
  }
  
  // ANIMATION
  const animation = items.filter((item) => item.type === "ANIMATION");
  if (animation.length > 0) {
    analytics.ANIMATION = {
      studioPreferences: extractAndCount(animation, "studio"),
      directorFrequency: extractAndCount(animation, "director"),
      genresMix: extractAndCount(animation, "genre"),
      publicationYears: extractAndCount(animation, "releaseYear"),
    };
  }
  
  // HENTAI
  const hentai = items.filter((item) => item.type === "HENTAI");
  if (hentai.length > 0) {
    analytics.HENTAI = {
      studioPreferences: extractAndCount(hentai, "studio"),
      directorFrequency: extractAndCount(hentai, "director"),
      genreSpecialization: extractAndCount(hentai, "genre"),
      publicationYears: extractAndCount(hentai, "releaseYear"),
    };
  }
  
  return analytics;
}
