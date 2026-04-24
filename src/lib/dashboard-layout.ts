export const DASHBOARD_WIDGET_IDS = [
  "notifications",
  "import",
  "metrics",
  "accounts",
  "chart",
  "table",
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];
export type DashboardDropPlacement = "before" | "after";

export const DASHBOARD_LAYOUT_STORAGE_KEY = "flowcash.dashboard.layout.v1";

const widgetSet = new Set<string>(DASHBOARD_WIDGET_IDS);

export function normalizeDashboardLayout(value: unknown): DashboardWidgetId[] {
  const saved = Array.isArray(value) ? value : [];
  const uniqueSaved = saved.filter(
    (item, index): item is DashboardWidgetId =>
      typeof item === "string" && widgetSet.has(item) && saved.indexOf(item) === index,
  );
  const missing = DASHBOARD_WIDGET_IDS.filter((item) => !uniqueSaved.includes(item));

  return [...uniqueSaved, ...missing];
}

export function parseDashboardLayout(value: string | null): DashboardWidgetId[] {
  if (!value) {
    return normalizeDashboardLayout(null);
  }

  try {
    return normalizeDashboardLayout(JSON.parse(value));
  } catch {
    return normalizeDashboardLayout(null);
  }
}

export function serializeDashboardLayout(value: unknown): string {
  if (!Array.isArray(value)) {
    return JSON.stringify([]);
  }

  return JSON.stringify(
    value.filter(
      (item, index): item is DashboardWidgetId =>
        typeof item === "string" && widgetSet.has(item) && value.indexOf(item) === index,
    ),
  );
}

export function reorderDashboardLayout(
  value: unknown,
  draggedId: DashboardWidgetId,
  targetId: DashboardWidgetId,
  placement: DashboardDropPlacement = "before",
): DashboardWidgetId[] {
  const current = normalizeDashboardLayout(value);

  if (draggedId === targetId) {
    return current;
  }

  const withoutDragged = current.filter((item) => item !== draggedId);
  const targetIndex = withoutDragged.indexOf(targetId);

  if (targetIndex < 0) {
    return current;
  }

  const insertIndex = placement === "after" ? targetIndex + 1 : targetIndex;

  return [...withoutDragged.slice(0, insertIndex), draggedId, ...withoutDragged.slice(insertIndex)];
}
