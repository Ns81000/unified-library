"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  ArrowLeft, 
  RefreshCw, 
  TrendingUp, 
  Database, 
  Tag, 
  Image as ImageIcon,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  BarChart3,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"
];

const TYPE_COLORS: Record<string, string> = {
  MOVIE: "#3b82f6",
  SERIES: "#ef4444",
  ANIME: "#10b981",
  BOOK: "#f59e0b",
  GAME: "#8b5cf6",
  COMIC: "#ec4899",
  MANGA: "#14b8a6",
  PERSON: "#f97316",
  FRANCHISE: "#6366f1",
  PORNSTAR: "#84cc16",
  DONGHUA: "#06b6d4",
  MANHWA: "#ff7f0e",
  MANHUA: "#e11d48",
  HENTAI: "#a855f7",
  AENI: "#22d3ee",
  ANIMATION: "#fb923c",
  WEBTOON: "#f43f5e",
};

export default function StatsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Error",
        description: "Failed to load statistics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Function to generate AI insights
  const generateAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const response = await fetch("/api/stats/ai-insights", {
        method: "POST",
      });
      
      if (!response.ok) throw new Error("Failed to generate insights");
      
      const data = await response.json();
      setAiInsights(data);
      
      toast({
        title: "✨ AI Insights Generated!",
        description: "Your personalized collection analysis is ready.",
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No statistics available</p>
      </div>
    );
  }

  // Prepare chart data
  const typeChartData = Object.entries(stats.overview.typeCounts).map(([type, count]) => ({
    name: type,
    value: count,
    fill: TYPE_COLORS[type] || "#94a3b8",
  }));

  const qualityChartData = [
    { name: "With Covers", value: stats.quality.withCovers, fill: "#10b981" },
    { name: "Without Covers", value: stats.quality.withoutCovers, fill: "#ef4444" },
  ];

  const keywordsChartData = [
    { name: "With Keywords", value: stats.quality.withKeywords, fill: "#3b82f6" },
    { name: "Without Keywords", value: stats.quality.withoutKeywords, fill: "#f59e0b" },
  ];

  // New: Decade distribution chart data
  const decadeChartData = stats.decadeDistribution?.distribution || [];

  // New: Text length distribution chart data
  const textLengthChartData = stats.textLengthDistribution?.distribution || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Library
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6" />
                <div>
                  <h1 className="text-2xl font-bold">Library Statistics</h1>
                  {lastUpdated && (
                    <p className="text-xs text-muted-foreground">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
                Auto-refresh: {autoRefresh ? "ON" : "OFF"}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchStats}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Now
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Alerts */}
        {(stats.alerts.bulkImportToday || stats.alerts.oldDataWarning) && (
          <div className="space-y-2">
            {stats.alerts.bulkImportToday && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                        Bulk Import Detected
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        You&apos;ve added {stats.alerts.bulkImportToday} items today! Stats may be updating in real-time.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {stats.alerts.oldDataWarning && (
              <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                        Old Data Detected
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Your most recent item is from {stats.alerts.oldDataWarning} days ago. Did you restore from an old backup?
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* AI Insights Section */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <CardTitle>AI-Powered Insights</CardTitle>
              </div>
              <Button
                onClick={generateAIInsights}
                disabled={loadingInsights}
                variant="outline"
                size="sm"
                className="border-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900"
              >
                {loadingInsights ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Insights
                  </>
                )}
              </Button>
            </div>
            <CardDescription>
              Get personalized analysis and recommendations powered by Gemini AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!aiInsights && !loadingInsights && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  Click &quot;Generate Insights&quot; to get AI-powered analysis of your collection
                </p>
              </div>
            )}

            {loadingInsights && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin text-purple-600" />
                <p className="text-sm text-muted-foreground">
                  AI is analyzing your collection...
                </p>
              </div>
            )}

            {aiInsights && !loadingInsights && (
              <div className="space-y-6">
                {/* Smart One-Liner Insights */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Collection Insights
                  </h3>
                  <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-lg border border-purple-100 dark:border-purple-900">
                    {aiInsights.insights.split('\n').filter((line: string) => line.trim()).map((insight: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <p className="text-sm flex-1">{insight.replace(/^[•\-\*]\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Gems */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    Missing Gems - Perfect Additions for Your Collection
                  </h3>
                  <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-lg border border-amber-100 dark:border-amber-900">
                    {aiInsights.missingGems.split('\n').filter((line: string) => line.trim()).map((gem: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">💎</span>
                        <p className="text-sm flex-1">{gem.replace(/^[•\-\*\d\.]\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overview Cards */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Library Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.overview.totalItems}</div>
              </CardContent>
            </Card>

            {/* Show all types sorted by count */}
            {Object.entries(stats.overview.typeCounts)
              .sort(([, a]: any, [, b]: any) => (b as number) - (a as number))
              .map(([type, count]) => (
                <Card key={type}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {type === 'PERSON' ? 'PERSONS' : type + 'S'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" style={{ color: TYPE_COLORS[type] }}>
                      {count as number}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Quality Score & Storage */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Quality Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.overview.qualityScore}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Overall data completeness
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Storage Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.storage.formattedSize}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.storage.totalFiles} cover images
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Unique Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.keywords.uniqueKeywords}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.keywords.totalKeywords} total uses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Type Distribution</CardTitle>
              <CardDescription>Breakdown by media type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Addition Timeline</CardTitle>
              <CardDescription>Items added over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.timeline.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <CardTitle>Top 30 Keywords</CardTitle>
            <CardDescription>Most frequently used tags</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats.keywords.topKeywords} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="keyword" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quality Breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cover Image Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={qualityChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {qualityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keyword Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={keywordsChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {keywordsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Type-Specific Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Type-Specific Analytics</CardTitle>
            <CardDescription>Detailed breakdown by media type</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={Object.keys(stats.metadata)[0] || "MOVIE"}>
              <TabsList className="flex-wrap h-auto">
                {Object.keys(stats.metadata).map((type) => (
                  <TabsTrigger key={type} value={type}>
                    {type}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(stats.metadata).map(([type, data]: [string, any]) => (
                <TabsContent key={type} value={type} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {Object.entries(data)
                      .filter(([key]) => key !== "count")
                      .map(([key, values]: [string, any]) => (
                        <Card key={key}>
                          <CardHeader>
                            <CardTitle className="text-sm capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {values && values.length > 0 ? (
                              <div className="space-y-2">
                                {values.slice(0, 5).map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <span className="text-sm truncate flex-1">{item.value}</span>
                                    <Badge variant="secondary">{item.count}</Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No data available</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Data Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Data Health Warnings
            </CardTitle>
            <CardDescription>Items that need attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Missing Covers ({stats.dataHealth.totalMissingCovers})
                </h3>
                {stats.dataHealth.totalMissingCovers > 0 ? (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {stats.dataHealth.missingCovers.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="truncate">• {item.title}</div>
                    ))}
                    {stats.dataHealth.totalMissingCovers > 5 && (
                      <div className="italic">+{stats.dataHealth.totalMissingCovers - 5} more</div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-green-600">All items have covers! 🎉</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Missing Keywords ({stats.dataHealth.totalMissingKeywords})
                </h3>
                {stats.dataHealth.totalMissingKeywords > 0 ? (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {stats.dataHealth.missingKeywords.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="truncate">• {item.title}</div>
                    ))}
                    {stats.dataHealth.totalMissingKeywords > 5 && (
                      <div className="italic">+{stats.dataHealth.totalMissingKeywords - 5} more</div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-green-600">All items have keywords! 🎉</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Missing Metadata ({stats.dataHealth.totalMissingMetadata})
                </h3>
                {stats.dataHealth.totalMissingMetadata > 0 ? (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {stats.dataHealth.missingMetadata.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="truncate">• {item.title}</div>
                    ))}
                    {stats.dataHealth.totalMissingMetadata > 5 && (
                      <div className="italic">+{stats.dataHealth.totalMissingMetadata - 5} more</div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-green-600">All items have metadata! 🎉</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Additions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Additions</CardTitle>
            <CardDescription>Last 20 items added to your library</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-4">
              {stats.timeline.recentAdditions.map((item: any) => (
                <div key={item.id} className="space-y-1">
                  <div className="aspect-[2/3] relative bg-muted rounded overflow-hidden">
                    {item.coverImage ? (
                      <Image
                        src={item.coverImage}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="100px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <p className="text-xs truncate">{item.title}</p>
                  <Badge variant="outline" className="text-xs">
                    {item.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* NEW: Decade Distribution */}
        {stats.decadeDistribution && stats.decadeDistribution.distribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Decade Distribution</CardTitle>
              <CardDescription>
                Content from {stats.decadeDistribution.oldestDecade} to {stats.decadeDistribution.newestDecade}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={decadeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* NEW: Comprehensive Analytics Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          {stats.genreDiversity && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Genre Diversity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {stats.genreDiversity.diversityScore}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.genreDiversity.uniqueGenres} unique genres
                </p>
              </CardContent>
            </Card>
          )}

          {stats.synopsisRichness && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Synopsis Richness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.synopsisRichness.overallAverage}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average words per synopsis
                </p>
              </CardContent>
            </Card>
          )}

          {stats.personConnections && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">People Tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {stats.personConnections.totalUniquePeople}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Unique actors, directors, authors
                </p>
              </CardContent>
            </Card>
          )}

          {stats.orphanItems && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Hidden Gems</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-pink-600">
                  {stats.orphanItems.totalOrphans}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Items with unique keywords
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* NEW: Person Connections */}
        {stats.personConnections && stats.personConnections.topPeople.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top 20 Most Featured People</CardTitle>
              <CardDescription>Actors, directors, authors across your collection</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.personConnections.topPeople} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* NEW: Synopsis Richness by Type */}
        {stats.synopsisRichness && stats.synopsisRichness.averageByType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Synopsis Richness by Type</CardTitle>
              <CardDescription>Average words per synopsis for each media type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.synopsisRichness.averageByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgWords" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* NEW: Text Length Distribution */}
        {stats.textLengthDistribution && (
          <Card>
            <CardHeader>
              <CardTitle>Synopsis Length Distribution</CardTitle>
              <CardDescription>Word count ranges across all items</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={textLengthChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* NEW: Keyword Network (Top Pairs) */}
        {stats.keywordNetwork && stats.keywordNetwork.topPairs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Keyword Co-occurrence Network</CardTitle>
              <CardDescription>Keywords that frequently appear together (Top 20 pairs)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.keywordNetwork.topPairs.slice(0, 20).map((pair: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">
                      <Badge variant="outline">{pair.keyword1}</Badge>
                      {" + "}
                      <Badge variant="outline">{pair.keyword2}</Badge>
                    </span>
                    <Badge>{pair.count} items</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* NEW: Orphan Items (Hidden Gems) */}
        {stats.orphanItems && stats.orphanItems.items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>🎯 Hidden Gems</CardTitle>
              <CardDescription>
                Items with unique keywords found nowhere else in your collection ({stats.orphanItems.totalOrphans} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {stats.orphanItems.items.map((item: any) => (
                  <div key={item.id} className="space-y-1">
                    <div className="aspect-[2/3] relative bg-muted rounded overflow-hidden">
                      {item.coverImage ? (
                        <Image
                          src={item.coverImage}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="150px"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <p className="text-xs truncate font-medium">{item.title}</p>
                    <Badge variant="outline" className="text-xs">{item.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* NEW: Unexplored Territory */}
        {stats.unexploredTerritory && (
          <Card>
            <CardHeader>
              <CardTitle>🗺️ Unexplored Territory</CardTitle>
              <CardDescription>Types and genres you could expand into</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.unexploredTerritory.missingTypes && stats.unexploredTerritory.missingTypes.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Missing Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.unexploredTerritory.missingTypes.map((type: string) => (
                        <Badge key={type} variant="secondary">{type}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {stats.unexploredTerritory.underrepresentedTypes && stats.unexploredTerritory.underrepresentedTypes.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Underrepresented Types (≤5 items)</h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.unexploredTerritory.underrepresentedTypes.map((item: any) => (
                        <Badge key={item.type} variant="outline">
                          {item.type}: {item.count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* NEW: Advanced Type-Specific Analytics */}
        {stats.advancedAnalytics && Object.keys(stats.advancedAnalytics).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Advanced Type-Specific Insights</CardTitle>
              <CardDescription>Deep analytics for each media type in your collection</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={Object.keys(stats.advancedAnalytics)[0]}>
                <TabsList className="flex-wrap h-auto">
                  {Object.keys(stats.advancedAnalytics).map((type) => (
                    <TabsTrigger key={type} value={type}>
                      {type}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(stats.advancedAnalytics).map(([type, data]: [string, any]) => (
                  <TabsContent key={type} value={type} className="space-y-6 mt-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      {Object.entries(data).map(([key, values]: [string, any]) => {
                        // Special handling for different data types
                        if (key === 'avgSeriesAge' || key === 'avgBookAge') {
                          return (
                            <Card key={key}>
                              <CardHeader>
                                <CardTitle className="text-sm capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold">
                                  {typeof values === 'number' ? values : values}
                                  {key.includes('Age') ? ' years' : ''}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }

                        if (key === 'activeVsRetired') {
                          return (
                            <Card key={key}>
                              <CardHeader>
                                <CardTitle className="text-sm">Active vs Retired</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm">Active:</span>
                                    <Badge variant="secondary">{values.active}</Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm">Retired:</span>
                                    <Badge variant="outline">{values.retired}</Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-2">
                                    {values.activePercentage}% active
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }

                        if (Array.isArray(values) && values.length > 0) {
                          return (
                            <Card key={key}>
                              <CardHeader>
                                <CardTitle className="text-sm capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {values.slice(0, 5).map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center">
                                      <span className="text-sm truncate flex-1">
                                        {item.value || item.decade || item.topGenre || 'Unknown'}
                                      </span>
                                      <Badge variant="secondary">{item.count}</Badge>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }

                        return null;
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Comparative Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Type Balance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.comparative.typeBalance}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Collection distribution balance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Largest Type</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.comparative.largestType && (
                <>
                  <div className="text-2xl font-bold">{stats.comparative.largestType.type}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.comparative.largestType.count} items
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Smallest Type</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.comparative.smallestType && (
                <>
                  <div className="text-2xl font-bold">{stats.comparative.smallestType.type}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.comparative.smallestType.count} items
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
