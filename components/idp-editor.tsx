"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Action = {
  id: string;
  activity: string;
  type: string;
  timeline: string;
  status: "not-started" | "in-progress" | "completed";
  linkedKPI?: string;
};

type DevelopmentGoal = {
  id: string;
  goal: string;
  rationale: string;
  actions: Action[];
};

type IDPData = {
  employeeName: string;
  period: string;
  goals: DevelopmentGoal[];
};

const ACTION_TYPE_COLORS: Record<string, string> = {
  Training: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Coaching: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Project: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Reading: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Mentoring: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
};

const STATUS_COLORS = {
  "not-started": "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  "in-progress": "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200",
  "completed": "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200",
};

export function IDPEditor({
  content,
  onSaveContent,
  status,
  isInline = false,
}: {
  content: string;
  onSaveContent: (content: string, debounce: boolean) => void;
  status: "streaming" | "idle";
  isInline?: boolean;
}) {
  const [localData, setLocalData] = useState<IDPData>({
    employeeName: "",
    period: "",
    goals: [],
  });
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (content && !isSavingRef.current) {
      try {
        const parsed = JSON.parse(content);
        setLocalData(parsed);
        if (parsed.goals.length > 0) {
          setHasLoadedOnce(true);
        }
      } catch {
        // Keep existing data if parsing fails
      }
    }
    isSavingRef.current = false;
  }, [content]);

  const handleEditAction = useCallback(
    (goalId: string, actionId: string, field: keyof Action, value: string) => {
      setLocalData((currentData) => {
        const newData = JSON.parse(JSON.stringify(currentData));
        const goal = newData.goals.find((g: DevelopmentGoal) => g.id === goalId);
        if (!goal) return currentData;

        const action = goal.actions.find((a: Action) => a.id === actionId);
        if (!action) return currentData;

        action[field] = value;
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

  const handleToggleStatus = useCallback(
    (goalId: string, actionId: string) => {
      setLocalData((currentData) => {
        const newData = JSON.parse(JSON.stringify(currentData));
        const goal = newData.goals.find((g: DevelopmentGoal) => g.id === goalId);
        if (!goal) return currentData;

        const action = goal.actions.find((a: Action) => a.id === actionId);
        if (!action) return currentData;

        const statusFlow: Record<string, Action["status"]> = {
          "not-started": "in-progress",
          "in-progress": "completed",
          "completed": "not-started",
        };
        action.status = statusFlow[action.status];

        isSavingRef.current = true;

        // Defer the save to avoid updating parent during render
        setTimeout(() => {
          const jsonString = JSON.stringify(newData, null, 2);
          onSaveContent(jsonString, false);
        }, 0);

        return newData;
      });
    },
    [onSaveContent]
  );

  if (!hasLoadedOnce && status === "streaming" && localData.goals.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", isInline ? "h-auto" : "h-full")}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-muted-foreground" />
          <div className="text-muted-foreground">Creating development plan...</div>
        </div>
      </div>
    );
  }

  const totalActions = localData.goals.reduce((sum, goal) => sum + goal.actions.length, 0);
  const completedActions = localData.goals.reduce(
    (sum, goal) => sum + goal.actions.filter((a) => a.status === "completed").length,
    0
  );
  const progressPercentage = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  if (isInline) {
    return (
      <div className="p-4">
        <div className="mb-3">
          <div className="font-semibold">{localData.employeeName}</div>
          <div className="text-xs text-muted-foreground">{localData.period}</div>
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span className="font-semibold">
              {completedActions}/{totalActions} actions
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        <div className="space-y-2">
          {localData.goals.map((goal) => (
            <div key={goal.id} className="rounded-lg border bg-muted/30 p-2">
              <div className="text-sm font-semibold mb-1">{goal.goal}</div>
              <div className="text-xs text-muted-foreground">
                {goal.actions.length} action{goal.actions.length !== 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Individual Development Plan</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="font-medium">{localData.employeeName}</span>
          <span>•</span>
          <span>{localData.period}</span>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span className="font-semibold">
              {completedActions}/{totalActions} actions completed ({progressPercentage.toFixed(0)}%)
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Development Goals */}
      <div className="space-y-6">
        {localData.goals.map((goal, index) => {
          const goalCompleted = goal.actions.filter((a) => a.status === "completed").length;
          const goalTotal = goal.actions.length;
          const goalProgress = goalTotal > 0 ? (goalCompleted / goalTotal) * 100 : 0;

          return (
            <div key={goal.id} className="rounded-lg border-2 border-primary/20 bg-card p-4">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-primary">
                        Goal {index + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold">{goal.goal}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{goal.rationale}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold">
                      {goalCompleted}/{goalTotal}
                    </div>
                    <div className="text-xs text-muted-foreground">completed</div>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted mt-2">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${goalProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {goal.actions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-md border bg-background p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleStatus(goal.id, action.id)}
                        className={cn(
                          "mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                          action.status === "completed"
                            ? "bg-green-500 border-green-500"
                            : "border-muted-foreground/30 hover:border-primary"
                        )}
                      >
                        {action.status === "completed" && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={action.activity}
                          onChange={(e) =>
                            handleEditAction(goal.id, action.id, "activity", e.target.value)
                          }
                          className={cn(
                            "w-full font-medium bg-transparent border-none outline-none mb-1",
                            action.status === "completed" && "line-through text-muted-foreground"
                          )}
                          placeholder="Action description"
                        />
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full font-medium",
                              ACTION_TYPE_COLORS[action.type] || ACTION_TYPE_COLORS.Training
                            )}
                          >
                            {action.type}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <input
                            type="text"
                            value={action.timeline}
                            onChange={(e) =>
                              handleEditAction(goal.id, action.id, "timeline", e.target.value)
                            }
                            className="bg-transparent border-none outline-none text-muted-foreground w-24"
                            placeholder="Timeline"
                          />
                          {action.linkedKPI && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                Addresses: {action.linkedKPI}
                              </span>
                            </>
                          )}
                          <span className="text-muted-foreground">•</span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full font-medium",
                              STATUS_COLORS[action.status]
                            )}
                          >
                            {action.status === "not-started"
                              ? "Not Started"
                              : action.status === "in-progress"
                                ? "In Progress"
                                : "Completed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
