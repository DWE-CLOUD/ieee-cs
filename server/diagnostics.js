import os from 'node:os';

const MAX_LOGS = 300;
const startedAt = new Date();
const requestLogs = [];
const errorLogs = [];

const pushBounded = (list, entry) => {
  list.unshift(entry);
  if (list.length > MAX_LOGS) {
    list.length = MAX_LOGS;
  }
};

export const recordRequestLog = (entry) => {
  pushBounded(requestLogs, {
    at: new Date().toISOString(),
    ...entry,
  });
};

export const recordErrorLog = (error, context = {}) => {
  const message = error instanceof Error ? error.message : String(error || 'Unknown error');
  const stack = error instanceof Error ? error.stack : null;

  pushBounded(errorLogs, {
    at: new Date().toISOString(),
    message,
    stack,
    ...context,
  });
};

const formatBytes = (value) => Number(value || 0);

export const getDiagnosticsSnapshot = () => {
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();

  return {
    started_at: startedAt.toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    process: {
      pid: process.pid,
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV || 'development',
      working_directory: process.cwd(),
    },
    host: {
      hostname: os.hostname(),
      type: os.type(),
      release: os.release(),
      uptime_seconds: Math.round(os.uptime()),
      cpus: os.cpus().length,
      load_average: os.loadavg(),
      total_memory_bytes: formatBytes(os.totalmem()),
      free_memory_bytes: formatBytes(os.freemem()),
    },
    runtime: {
      memory_bytes: {
        rss: formatBytes(memory.rss),
        heap_total: formatBytes(memory.heapTotal),
        heap_used: formatBytes(memory.heapUsed),
        external: formatBytes(memory.external),
        array_buffers: formatBytes(memory.arrayBuffers),
      },
      cpu_microseconds: {
        user: cpu.user,
        system: cpu.system,
      },
    },
    requests: requestLogs.slice(0, 120),
    errors: errorLogs.slice(0, 80),
  };
};
