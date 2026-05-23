import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Cpu,
  Database,
  HardDrive,
  Loader2,
  MonitorCog,
  RefreshCw,
  Server,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';

interface RequestLog {
  at: string;
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  user_id: string | null;
  ip: string | null;
}

interface ErrorLog {
  at: string;
  message: string;
  stack: string | null;
  method?: string;
  path?: string;
  status?: number;
}

interface VisitRow {
  id: string;
  path: string;
  title: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  display_name: string | null;
  email: string | null;
}

interface SystemStats {
  diagnostics: {
    started_at: string;
    uptime_seconds: number;
    process: {
      pid: number;
      node_version: string;
      platform: string;
      arch: string;
      env: string;
      working_directory: string;
    };
    host: {
      hostname: string;
      type: string;
      release: string;
      uptime_seconds: number;
      cpus: number;
      load_average: number[];
      total_memory_bytes: number;
      free_memory_bytes: number;
    };
    runtime: {
      memory_bytes: {
        rss: number;
        heap_total: number;
        heap_used: number;
        external: number;
        array_buffers: number;
      };
      cpu_microseconds: {
        user: number;
        system: number;
      };
    };
    requests: RequestLog[];
    errors: ErrorLog[];
  };
  counts: Record<string, number>;
  database: {
    name: string;
    version: string;
    size_bytes: string | number;
    size_pretty: string;
  };
  visits: {
    summary: {
      total: number;
      last_24h: number;
      last_7d: number;
      authenticated: number;
    };
    top_paths: { path: string; visits: number; last_seen: string }[];
    daily: { date: string; visits: number }[];
    recent: VisitRow[];
  };
}

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDuration = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(minutes, 0)}m`;
};

const timeAgo = (value: string) => {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
};

const statusClass = (status: number) => {
  if (status >= 500) return 'bg-destructive/10 text-destructive';
  if (status >= 400) return 'bg-gold/15 text-gold';
  if (status >= 300) return 'bg-accent/10 text-accent';
  return 'bg-green-500/10 text-green-600';
};

const Metric = ({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
}) => (
  <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      </div>
      <div className="rounded-xl bg-accent/10 p-2 text-accent">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
  </div>
);

const InfoLine = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border/40 py-3 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="min-w-0 truncate text-right text-sm font-medium text-foreground">{value}</span>
  </div>
);

const SystemStatsPanel = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await api.get<SystemStats>('/api/admin/system/stats');
      setStats(data);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load system stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const maxDailyVisits = useMemo(
    () => Math.max(...(stats?.visits.daily.map((day) => day.visits) || [1]), 1),
    [stats]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!stats || error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-destructive">
          {error || 'System statistics are unavailable.'}
        </div>
      </div>
    );
  }

  const heapPercent = Math.round(
    (stats.diagnostics.runtime.memory_bytes.heap_used /
      Math.max(stats.diagnostics.runtime.memory_bytes.heap_total, 1)) *
      100
  );
  const hostMemoryUsed =
    stats.diagnostics.host.total_memory_bytes - stats.diagnostics.host.free_memory_bytes;
  const hostMemoryPercent = Math.round(
    (hostMemoryUsed / Math.max(stats.diagnostics.host.total_memory_bytes, 1)) * 100
  );

  return (
    <div className="p-5 md:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Site Statistics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Server health, database counts, site visits, request logs, and captured errors.
          </p>
        </div>
        <button
          onClick={() => loadStats(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={BarChart3}
          label="Total Visits"
          value={stats.visits.summary.total}
          detail={`${stats.visits.summary.last_24h} visits in the last 24 hours`}
        />
        <Metric
          icon={Users}
          label="Users"
          value={stats.counts.users || 0}
          detail={`${stats.counts.team_members || 0} team members and ${stats.counts.roles || 0} roles`}
        />
        <Metric
          icon={Server}
          label="Server Uptime"
          value={formatDuration(stats.diagnostics.uptime_seconds)}
          detail={`Started ${timeAgo(stats.diagnostics.started_at)}`}
        />
        <Metric
          icon={AlertTriangle}
          label="Captured Errors"
          value={stats.diagnostics.errors.length}
          detail={`${stats.diagnostics.requests.length} recent requests in memory`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-border/50 bg-background/70 p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            <h3 className="font-medium text-foreground">Visits Over 14 Days</h3>
          </div>
          <div className="flex h-52 items-end gap-2 border-b border-border/50 pb-3">
            {stats.visits.daily.map((day) => (
              <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end">
                  <div
                    className="w-full rounded-t-lg bg-accent/75 transition-all"
                    style={{ height: `${Math.max((day.visits / maxDailyVisits) * 100, day.visits ? 8 : 2)}%` }}
                    title={`${day.visits} visits`}
                  />
                </div>
                <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                  {day.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <InfoLine label="Last 7 days" value={stats.visits.summary.last_7d} />
            <InfoLine label="Logged in visits" value={stats.visits.summary.authenticated} />
            <InfoLine label="Top pages tracked" value={stats.visits.top_paths.length} />
          </div>
        </section>

        <section className="rounded-2xl border border-border/50 bg-background/70 p-5">
          <div className="mb-4 flex items-center gap-2">
            <MonitorCog className="h-5 w-5 text-accent" />
            <h3 className="font-medium text-foreground">Server Runtime</h3>
          </div>
          <InfoLine label="Environment" value={stats.diagnostics.process.env} />
          <InfoLine label="Node" value={stats.diagnostics.process.node_version} />
          <InfoLine label="Platform" value={`${stats.diagnostics.process.platform} ${stats.diagnostics.process.arch}`} />
          <InfoLine label="Process ID" value={stats.diagnostics.process.pid} />
          <InfoLine label="Host" value={stats.diagnostics.host.hostname} />
          <InfoLine label="CPU cores" value={stats.diagnostics.host.cpus} />
          <div className="mt-5 space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Heap used</span>
                <span>{heapPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min(heapPercent, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Host memory</span>
                <span>{hostMemoryPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-gold" style={{ width: `${Math.min(hostMemoryPercent, 100)}%` }} />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border/50 bg-background/70 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-accent" />
            <h3 className="font-medium text-foreground">Database</h3>
          </div>
          <InfoLine label="Database" value={stats.database.name} />
          <InfoLine label="Size" value={stats.database.size_pretty} />
          <InfoLine label="Applications" value={stats.counts.applications || 0} />
          <InfoLine label="Events" value={stats.counts.events || 0} />
          <InfoLine label="Gallery items" value={stats.counts.gallery_images || 0} />
          <p className="mt-4 line-clamp-2 text-xs text-muted-foreground">{stats.database.version}</p>
        </section>

        <section className="rounded-2xl border border-border/50 bg-background/70 p-5">
          <div className="mb-4 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-accent" />
            <h3 className="font-medium text-foreground">Memory</h3>
          </div>
          <InfoLine label="RSS" value={formatBytes(stats.diagnostics.runtime.memory_bytes.rss)} />
          <InfoLine label="Heap used" value={formatBytes(stats.diagnostics.runtime.memory_bytes.heap_used)} />
          <InfoLine label="Heap total" value={formatBytes(stats.diagnostics.runtime.memory_bytes.heap_total)} />
          <InfoLine label="External" value={formatBytes(stats.diagnostics.runtime.memory_bytes.external)} />
          <InfoLine label="System free" value={formatBytes(stats.diagnostics.host.free_memory_bytes)} />
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-border/50 bg-background/70 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            <h3 className="font-medium text-foreground">Top Paths</h3>
          </div>
          <div className="space-y-3">
            {stats.visits.top_paths.map((path) => (
              <div key={path.path} className="rounded-xl border border-border/40 bg-card/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">{path.path}</span>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    {path.visits}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Last seen {timeAgo(path.last_seen)}</p>
              </div>
            ))}
            {stats.visits.top_paths.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No site visits recorded yet.</p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/50 bg-background/70">
          <div className="flex items-center gap-2 border-b border-border/50 p-5">
            <Clock className="h-5 w-5 text-accent" />
            <h3 className="font-medium text-foreground">Recent Visits</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Path</th>
                  <th className="px-4 py-3 font-medium">Visitor</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {stats.visits.recent.map((visit) => (
                  <tr key={visit.id} className="hover:bg-muted/30">
                    <td className="max-w-[260px] px-4 py-3">
                      <p className="truncate font-medium text-foreground">{visit.path}</p>
                      <p className="truncate text-xs text-muted-foreground">{visit.title || 'Untitled page'}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {visit.display_name || visit.email || 'Guest'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{visit.ip || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{timeAgo(visit.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border/50 bg-background/70">
        <div className="flex items-center gap-2 border-b border-border/50 p-5">
          <Cpu className="h-5 w-5 text-accent" />
          <h3 className="font-medium text-foreground">Recent Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Path</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {stats.diagnostics.requests.slice(0, 35).map((request, index) => (
                <tr key={`${request.at}-${index}`} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{request.method}</td>
                  <td className="max-w-[360px] truncate px-4 py-3 text-muted-foreground">{request.path}</td>
                  <td className="px-4 py-3 text-muted-foreground">{request.duration_ms}ms</td>
                  <td className="px-4 py-3 text-muted-foreground">{timeAgo(request.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border/50 bg-background/70 p-5">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="font-medium text-foreground">Crash And Error Logs</h3>
        </div>
        {stats.diagnostics.errors.length === 0 ? (
          <p className="rounded-xl bg-green-500/10 p-4 text-sm text-green-700">No server errors captured in memory.</p>
        ) : (
          <div className="space-y-3">
            {stats.diagnostics.errors.map((log, index) => (
              <div key={`${log.at}-${index}`} className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-destructive">{log.message}</p>
                  <span className="text-xs text-muted-foreground">{timeAgo(log.at)}</span>
                </div>
                {log.path && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {log.method || 'REQUEST'} {log.path} {log.status ? `(${log.status})` : ''}
                  </p>
                )}
                {log.stack && <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{log.stack}</pre>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SystemStatsPanel;
