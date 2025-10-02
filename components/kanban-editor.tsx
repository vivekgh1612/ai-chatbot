"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type KanbanTask = {
  id: string;
  title: string;
  description?: string;
};

type KanbanColumn = {
  id: string;
  title: string;
  tasks: KanbanTask[];
};

type KanbanData = {
  columns: KanbanColumn[];
};

export function KanbanEditor({
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
  const [draggedTask, setDraggedTask] = useState<{
    task: KanbanTask;
    columnId: string;
  } | null>(null);

  const [localData, setLocalData] = useState<KanbanData>({ columns: [] });
  const isSavingRef = useRef(false);

  // Parse and sync content to local state only when it changes externally
  useEffect(() => {
    if (content && !isSavingRef.current) {
      try {
        const parsed = JSON.parse(content);
        setLocalData(parsed);
      } catch {
        // If parsing fails (e.g., during streaming), use empty structure
        setLocalData({ columns: [] });
      }
    }
    isSavingRef.current = false;
  }, [content]);

  const handleDragStart = useCallback(
    (task: KanbanTask, columnId: string) => {
      setDraggedTask({ task, columnId });
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (targetColumnId: string) => {
      if (!draggedTask) return;

      setLocalData((currentData) => {
        const newData = JSON.parse(JSON.stringify(currentData));
        const sourceColumn = newData.columns.find(
          (col: KanbanColumn) => col.id === draggedTask.columnId
        );
        const targetColumn = newData.columns.find(
          (col: KanbanColumn) => col.id === targetColumnId
        );

        if (!sourceColumn || !targetColumn) return currentData;

        // Remove from source
        sourceColumn.tasks = sourceColumn.tasks.filter(
          (t: KanbanTask) => t.id !== draggedTask.task.id
        );

        // Add to target
        targetColumn.tasks.push(draggedTask.task);

        isSavingRef.current = true;
        const jsonString = JSON.stringify(newData, null, 2);
        onSaveContent(jsonString, false);
        return newData;
      });

      setDraggedTask(null);
    },
    [draggedTask, onSaveContent]
  );

  const handleAddTask = useCallback(
    (columnId: string) => {
      setLocalData((currentData) => {
        const newData = JSON.parse(JSON.stringify(currentData));
        const column = newData.columns.find((col: KanbanColumn) => col.id === columnId);
        if (!column) return currentData;

        const newTask: KanbanTask = {
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title: "New Task",
          description: "",
        };

        column.tasks.push(newTask);
        isSavingRef.current = true;
        const jsonString = JSON.stringify(newData, null, 2);
        onSaveContent(jsonString, false);
        return newData;
      });
    },
    [onSaveContent]
  );

  const handleEditTask = useCallback(
    (columnId: string, taskId: string, field: "title" | "description", value: string) => {
      setLocalData((currentData) => {
        const newData = JSON.parse(JSON.stringify(currentData));
        const column = newData.columns.find((col: KanbanColumn) => col.id === columnId);
        if (!column) return currentData;

        const task = column.tasks.find((t: KanbanTask) => t.id === taskId);
        if (!task) return currentData;

        task[field] = value;
        isSavingRef.current = true;
        const jsonString = JSON.stringify(newData, null, 2);
        onSaveContent(jsonString, true);
        return newData;
      });
    },
    [onSaveContent]
  );

  const handleDeleteTask = useCallback(
    (columnId: string, taskId: string) => {
      setLocalData((currentData) => {
        const newData = JSON.parse(JSON.stringify(currentData));
        const column = newData.columns.find((col: KanbanColumn) => col.id === columnId);
        if (!column) return currentData;

        column.tasks = column.tasks.filter((t: KanbanTask) => t.id !== taskId);
        isSavingRef.current = true;
        const jsonString = JSON.stringify(newData, null, 2);
        onSaveContent(jsonString, false);
        return newData;
      });
    },
    [onSaveContent]
  );

  if (status === "streaming" && localData.columns.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", isInline ? "h-auto" : "h-full")}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-muted-foreground" />
          <div className="text-muted-foreground">Creating your kanban board...</div>
        </div>
      </div>
    );
  }

  if (isInline) {
    return (
      <div className="overflow-x-auto">
        <div className="flex gap-3 p-1">
          {localData.columns.map((column) => (
            <div
              key={column.id}
              className="w-48 shrink-0 rounded-lg border bg-muted/30 p-2"
            >
              <h3 className="font-semibold mb-2 text-sm truncate">{column.title}</h3>
              <div className="space-y-1.5">
                {column.tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-md border bg-background p-2 text-xs"
                  >
                    <div className="font-medium truncate">{task.title}</div>
                    {task.description && (
                      <div className="text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </div>
                    )}
                  </div>
                ))}
                {column.tasks.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    +{column.tasks.length - 3} more
                  </div>
                )}
                {column.tasks.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-2 italic">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-auto p-6">
      <div className="flex gap-4">
        {localData.columns.map((column, index) => (
          <div
            key={column.id}
            className={cn(
              "w-80 shrink-0 rounded-lg border bg-muted/50 p-4",
              index === localData.columns.length - 1 && "mr-6"
            )}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <h3 className="font-semibold mb-4 text-lg">{column.title}</h3>
            <div className="space-y-2">
              {column.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task, column.id)}
                  className={cn(
                    "rounded-md border bg-background p-3 shadow-sm cursor-move transition-all hover:shadow-md",
                    draggedTask?.task.id === task.id && "opacity-50"
                  )}
                >
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) =>
                      handleEditTask(column.id, task.id, "title", e.target.value)
                    }
                    className="w-full font-medium bg-transparent border-none outline-none mb-1"
                    placeholder="Task title"
                  />
                  <textarea
                    value={task.description || ""}
                    onChange={(e) =>
                      handleEditTask(column.id, task.id, "description", e.target.value)
                    }
                    className="w-full text-sm text-muted-foreground bg-transparent border-none outline-none resize-none"
                    placeholder="Description..."
                    rows={2}
                  />
                  <button
                    onClick={() => handleDeleteTask(column.id, task.id)}
                    className="text-xs text-destructive hover:underline mt-2"
                  >
                    Delete
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddTask(column.id)}
                className="w-full rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:border-solid hover:bg-muted/50 transition-colors"
              >
                + Add task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
