// One row per problem, counted the desk's way: causes.ts places every report by tenant and channel
// (its CauseTable view). A report whose date moved by one day (desk-notes.json) is a problem of its
// own, `shift`; the desk still files it under its cause, so it is counted there too.
import { groupByCause, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type ProblemRow = {
  problem: string;
  reports: Report[];
  // The cause this row's reports are filed under, when it is not the row itself.
  filedUnder: string | null;
  tenants: string[];
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

function row(problem: string, reports: Report[], filedUnder: string | null): ProblemRow {
  const days = reports.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports,
    filedUnder,
    tenants: [...new Set(reports.map((r) => r.tenant))].sort(),
    channels: reports.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export function problemRows(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemRow[] {
  const groups = groupByCause(uniqueById(reports), tenantOf);
  const rows = groups.map((g) => row(g.cause, g.reports, null));
  for (const g of groups) {
    const moved = g.reports.filter((r) => oneDayMove.includes(r.id));
    if (moved.length) rows.push(row('shift', moved, g.cause));
  }
  return rows;
}
