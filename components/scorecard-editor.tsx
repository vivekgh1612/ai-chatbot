"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScorecardSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

type KPI = {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  weight: number;
};

type Perspective = {
  id: string;
  name: string;
  kpis: KPI[];
};

type ScorecardData = {
  employeeName: string;
  period: string;
  perspectives: Perspective[];
};

const PERSPECTIVE_COLORS = {
  financial: "bg-blue-500/10 border-blue-500/30",
  customer: "bg-green-500/10 border-green-500/30",
  internal: "bg-purple-500/10 border-purple-500/30",
  learning: "bg-orange-500/10 border-orange-500/30",
};

const getStatusColor = (current: number, target: number) => {
  const percentage = (current / target) * 100;
  if (percentage >= 90) return "bg-green-500";
  if (percentage >= 70) return "bg-yellow-500";
  return "bg-red-500";
};

const calculatePerspectiveScore = (kpis: KPI[]) => {
  if (kpis.length === 0) return 0;
  const totalWeight = kpis.reduce((sum, kpi) => sum + kpi.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedScore = kpis.reduce((sum, kpi) => {
    const achievement = Math.min((kpi.current / kpi.target) * 100, 100);
    return sum + (achievement * kpi.weight);
  }, 0);

  return weightedScore / totalWeight;
};

const calculateOverallScore = (perspectives: Perspective[]) => {
  const scores = perspectives.map(p => calculatePerspectiveScore(p.kpis));
  return scores.reduce((sum, score) => sum + score, 0) / perspectives.length;
};

export function ScorecardEditor({
  content,
  onSaveContent,
  status,
  isInline = false,
  suggestions = [],
}: {
  content: string;
  onSaveContent: (content: string, debounce: boolean) => void;
  status: "streaming" | "idle";
  isInline?: boolean;
  suggestions?: ScorecardSuggestion[];
}) {
  const [localData, setLocalData] = useState<ScorecardData>({
    employeeName: "",
    period: "",
    perspectives: [],
  });
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [resolvedSuggestions, setResolvedSuggestions] = useState<Set<string>>(new Set());
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (content && !isSavingRef.current) {
      try {
        const parsed = JSON.parse(content);
        setLocalData(parsed);
        if (parsed.perspectives.length > 0) {
          setHasLoadedOnce(true);
        }
      } catch {
        // Keep existing data if parsing fails
      }
    }
    isSavingRef.current = false;
  }, [content]);

  const handleEditKPI = useCallback(
    (perspectiveId: string, kpiId: string, field: keyof KPI, value: string | number) => {
      setLocalData((currentData) => {
        const newData = JSON.parse(JSON.stringify(currentData));
        const perspective = newData.perspectives.find((p: Perspective) => p.id === perspectiveId);
        if (!perspective) return currentData;

        const kpi = perspective.kpis.find((k: KPI) => k.id === kpiId);
        if (!kpi) return currentData;

        kpi[field] = value;
        isSavingRef.current = true;

        // Defer the save to avoid updating parent during render
        setTimeout(() => {
          const jsonString = JSON.stringify(newData, null, 2);
          onSaveContent(jsonString, true);
        }, 0);

        return newData;
      });
    },
    [onSaveContent]
  );

  const handleAcceptSuggestion = useCallback(
    (suggestion: ScorecardSuggestion) => {
      setLocalData((currentData) => {
        const newData = JSON.parse(JSON.stringify(currentData));

        if (suggestion.type === "add-kpi" && suggestion.change.perspectiveId && suggestion.change.newKpi) {
          const perspective = newData.perspectives.find(
            (p: Perspective) => p.id === suggestion.change.perspectiveId
          );
          if (perspective && suggestion.change.newKpi) {
            const newKpi = {
              id: `kpi-${Date.now()}`,
              ...suggestion.change.newKpi,
            };
            perspective.kpis.push(newKpi);
          }
        } else if (
          (suggestion.type === "adjust-target" || suggestion.type === "adjust-weight") &&
          suggestion.change.perspectiveId &&
          suggestion.change.kpiId &&
          suggestion.change.field &&
          suggestion.change.value !== undefined
        ) {
          const perspective = newData.perspectives.find(
            (p: Perspective) => p.id === suggestion.change.perspectiveId
          );
          if (perspective) {
            const kpi = perspective.kpis.find((k: KPI) => k.id === suggestion.change.kpiId);
            if (kpi && suggestion.change.field) {
              (kpi as Record<string, unknown>)[suggestion.change.field] = suggestion.change.value;
            }
          }
        }

        isSavingRef.current = true;

        // Defer the save to avoid updating parent during render
        setTimeout(() => {
          const jsonString = JSON.stringify(newData, null, 2);
          onSaveContent(jsonString, true);
        }, 0);

        return newData;
      });

      setResolvedSuggestions((prev) => new Set(prev).add(suggestion.id));
    },
    [onSaveContent]
  );

  const handleRejectSuggestion = useCallback((suggestionId: string) => {
    setResolvedSuggestions((prev) => new Set(prev).add(suggestionId));
  }, []);

  if (!hasLoadedOnce && status === "streaming" && localData.perspectives.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", isInline ? "h-auto" : "h-full")}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-muted-foreground" />
          <div className="text-muted-foreground">Creating your scorecard...</div>
        </div>
      </div>
    );
  }

  const overallScore = calculateOverallScore(localData.perspectives);

  if (isInline) {
    return (
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="font-semibold">{localData.employeeName}</div>
            <div className="text-xs text-muted-foreground">{localData.period}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{overallScore.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Overall Score</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {localData.perspectives.map((perspective) => {
            const score = calculatePerspectiveScore(perspective.kpis);
            return (
              <div key={perspective.id} className="rounded-lg border bg-muted/30 p-2">
                <div className="text-xs font-semibold mb-1">{perspective.name}</div>
                <div className="text-lg font-bold">{score.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">{perspective.kpis.length} KPIs</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const activeSuggestions = suggestions.filter((s) => !resolvedSuggestions.has(s.id));

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{localData.employeeName}</h1>
            <p className="text-muted-foreground">{localData.period}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{overallScore.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Overall Score</div>
          </div>
        </div>

      {/* Perspectives */}
      <div className="space-y-6">
        {localData.perspectives.map((perspective, pIndex) => {
          const perspectiveScore = calculatePerspectiveScore(perspective.kpis);
          const colorClass = Object.values(PERSPECTIVE_COLORS)[pIndex % 4];

          return (
            <div key={perspective.id} className={cn("rounded-lg border-2 p-4", colorClass)}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{perspective.name}</h2>
                <div className="text-xl font-bold">{perspectiveScore.toFixed(1)}%</div>
              </div>

              <div className="space-y-3">
                {perspective.kpis.map((kpi) => {
                  const achievement = (kpi.current / kpi.target) * 100;
                  const statusColor = getStatusColor(kpi.current, kpi.target);

                  return (
                    <div key={kpi.id} className="rounded-md border bg-background p-3">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={kpi.name}
                            onChange={(e) =>
                              handleEditKPI(perspective.id, kpi.id, "name", e.target.value)
                            }
                            className="w-full font-medium bg-transparent border-none outline-none"
                            placeholder="KPI name"
                          />
                        </div>
                        <div className="ml-2 flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", statusColor)} />
                          <span className="text-sm font-semibold">
                            {achievement.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div>
                          <label className="text-xs text-muted-foreground">Current</label>
                          <input
                            type="number"
                            value={kpi.current}
                            onChange={(e) =>
                              handleEditKPI(
                                perspective.id,
                                kpi.id,
                                "current",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full rounded border bg-background px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Target</label>
                          <input
                            type="number"
                            value={kpi.target}
                            onChange={(e) =>
                              handleEditKPI(
                                perspective.id,
                                kpi.id,
                                "target",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full rounded border bg-background px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Unit</label>
                          <input
                            type="text"
                            value={kpi.unit}
                            onChange={(e) =>
                              handleEditKPI(perspective.id, kpi.id, "unit", e.target.value)
                            }
                            className="w-full rounded border bg-background px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Weight %</label>
                          <input
                            type="number"
                            value={kpi.weight}
                            onChange={(e) =>
                              handleEditKPI(
                                perspective.id,
                                kpi.id,
                                "weight",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full rounded border bg-background px-2 py-1"
                          />
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 h-2 w-full rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-all", statusColor)}
                          style={{ width: `${Math.min(achievement, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Total Weight: {perspective.kpis.reduce((sum, kpi) => sum + kpi.weight, 0)}%
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Suggestions Panel */}
      {activeSuggestions.length > 0 && (
        <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
          <h3 className="mb-4 font-semibold">Suggestions ({activeSuggestions.length})</h3>
          <div className="space-y-3">
            {activeSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded-lg border bg-background p-3 shadow-sm"
              >
                <div className="mb-2 font-medium text-sm">{suggestion.description}</div>
                <div className="mb-3 text-xs text-muted-foreground">
                  {suggestion.rationale}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptSuggestion(suggestion)}
                    className="flex-1"
                    disabled={suggestion.type === "general" || suggestion.type === "rebalance-weights"}
                  >
                    <CheckIcon className="mr-1 h-3 w-3" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectSuggestion(suggestion.id)}
                    className="flex-1"
                  >
                    <XIcon className="mr-1 h-3 w-3" />
                    Reject
                  </Button>
                </div>
                {(suggestion.type === "general" || suggestion.type === "rebalance-weights") && (
                  <div className="mt-2 text-xs text-muted-foreground italic">
                    Manual implementation required
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
