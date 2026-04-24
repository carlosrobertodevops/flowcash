import { describe, expect, test } from "bun:test";
import {
  DASHBOARD_WIDGET_IDS,
  normalizeDashboardLayout,
  reorderDashboardLayout,
  serializeDashboardLayout,
} from "./dashboard-layout";

describe("dashboard layout", () => {
  test("keeps a saved widget order and appends missing widgets", () => {
    expect(normalizeDashboardLayout(["table", "metrics"])).toEqual([
      "table",
      "metrics",
      "notifications",
      "import",
      "accounts",
      "chart",
    ]);
  });

  test("removes unknown and duplicated widget ids", () => {
    expect(normalizeDashboardLayout(["chart", "ghost", "chart", "accounts"])).toEqual([
      "chart",
      "accounts",
      "notifications",
      "import",
      "metrics",
      "table",
    ]);
  });

  test("serializes only valid dashboard widgets", () => {
    expect(serializeDashboardLayout(["import", "bad", "metrics"])).toBe(
      JSON.stringify(["import", "metrics"]),
    );
  });

  test("falls back to default order when saved value is invalid", () => {
    expect(normalizeDashboardLayout(null)).toEqual(DASHBOARD_WIDGET_IDS);
  });

  test("moves a dragged widget before the drop target", () => {
    expect(reorderDashboardLayout(DASHBOARD_WIDGET_IDS, "table", "metrics", "before")).toEqual([
      "notifications",
      "import",
      "table",
      "metrics",
      "accounts",
      "chart",
    ]);
  });

  test("moves a dragged widget after the drop target", () => {
    expect(reorderDashboardLayout(DASHBOARD_WIDGET_IDS, "notifications", "chart", "after")).toEqual([
      "import",
      "metrics",
      "accounts",
      "chart",
      "notifications",
      "table",
    ]);
  });
});
