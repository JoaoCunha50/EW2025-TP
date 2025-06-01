function processLogs(logs) {
  const stats = {
    total: logs.length,
    byMethod: {},
    byStatus: {},
    byEndpoint: {},
    timeline: {},
  };

  logs.forEach((log) => {
    const { method, status, url, timestamp } = log;

    stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    stats.byEndpoint[url] = (stats.byEndpoint[url] || 0) + 1;

    console.log(
      `Processing log: ${timestamp} - ${method} ${url} - Status: ${status}`
    );
    const minute = timestamp.slice(0, 16);
    stats.timeline[minute] = (stats.timeline[minute] || 0) + 1;
  });

  renderStats(stats);
  renderTable(logs);
}

function renderTable(logs) {
  const tbody = document.querySelector("#logsTable tbody");
  logs.forEach((log) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${log.timestamp}</td><td>${log.method}</td><td>${log.status}</td><td>${log.url}</td>`;
    tbody.appendChild(row);
  });
}

function countLogins(logs) {
  let loginCount = 0;

  for (let i = 0; i < logs.length - 1; i++) {
    const currentLog = logs[i];
    const nextLog = logs[i + 1];

    // Verificar padrão de login normal
    if (currentLog.url === "/login" && nextLog.url === "/diario") {
      loginCount++;
    }

    // Verificar padrão de login via Google/Facebook
    if (
      currentLog.url === "/login" &&
      logs[i + 1]?.url.startsWith("/auth/") &&
      logs[i + 2]?.url.startsWith("/auth/") &&
      logs[i + 2]?.url.includes("/callback")
    ) {
      loginCount++;
    }
  }

  return loginCount;
}

// Função principal que processa todos os logs
function processLogsStatistics(logs) {
  return {
    summary: generateSummaryStats(logs),
    statusCodes: generateStatusData(logs),
    hourlyData: generateHourlyData(logs),
    topUrls: generateTopUrlsData(logs),
    topPosts: generateTopPostsData(logs),
    topDownloads: generateTopDownloads(logs),
    logins: countLogins(logs),
  };
}

function generateSummaryStats(logs) {
  const responseTimes = [];
  let successCount = 0;

  logs.forEach((log) => {
    const status = parseInt(log.status);
    if (status >= 200 && status < 300) {
      successCount++;
    }

    if (log.responseTime) {
      responseTimes.push(log.responseTime);
    }
  });

  const avgResponseTime =
    responseTimes.length > 0
      ? Math.round(
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        )
      : 0;

  const successRate =
    logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(1) : "0.0";

  return {
    totalRequests: logs.length,
    avgResponseTime: avgResponseTime,
    successRate: parseFloat(successRate),
  };
}

function generateStatusData(logs) {
  const statusGroups = {
    "2xx": { count: 0, color: "#28a745" },
    "3xx": { count: 0, color: "#ffc107" },
    "4xx": { count: 0, color: "#ff5a60" },
    "5xx": { count: 0, color: "#dc3545" },
  };

  logs.forEach((log) => {
    const status = parseInt(log.status);
    if (status >= 200 && status < 300) statusGroups["2xx"].count++;
    else if (status >= 300 && status < 400) statusGroups["3xx"].count++;
    else if (status >= 400 && status < 500) statusGroups["4xx"].count++;
    else if (status >= 500 && status < 600) statusGroups["5xx"].count++;
  });

  return Object.entries(statusGroups)
    .map(([status, data]) => ({
      status,
      count: data.count,
      color: data.color,
    }))
    .filter((item) => item.count > 0);
}

function generateHourlyData(logs) {
  const hourlyStats = {};

  for (let i = 0; i < 24; i++) {
    const hour = String(i).padStart(2, "0");
    hourlyStats[hour] = 0;
  }

  logs.forEach((log) => {
    if (log.timestamp) {
      const [dateString, timeString] = log.timestamp.split(", ");
      if (timeString) {
        const hour = timeString.split(":")[0];
        if (hourlyStats.hasOwnProperty(hour)) {
          hourlyStats[hour]++;
        }
      }
    }
  });

  return Object.entries(hourlyStats).map(([hour, requests]) => ({
    hour: hour + ":00",
    requests,
  }));
}

function generateTopUrlsData(logs) {
  const urlStats = {};
  const urlResponseTimes = {};

  logs.forEach((log) => {
    urlStats[log.url] = (urlStats[log.url] || 0) + 1;

    if (log.responseTime) {
      if (!urlResponseTimes[log.url]) {
        urlResponseTimes[log.url] = [];
      }
      urlResponseTimes[log.url].push(log.responseTime);
    }
  });

  return Object.entries(urlStats)
    .map(([url, count]) => {
      const times = urlResponseTimes[url] || [];
      const avgTime =
        times.length > 0
          ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
          : 0;

      return { url, count, avgTime };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function generateTopPostsData(logs) {
  const postStats = {};

  logs.forEach((log) => {
    if (
      log.url.startsWith("/posts/") &&
      !log.url.startsWith("/posts/download/")
    ) {
      postStats[log.url] = (postStats[log.url] || 0) + 1;
    }
  });

  return Object.entries(postStats)
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function generateTopDownloads(logs) {
  const postStats = {};

  logs.forEach((log) => {
    if (log.url.startsWith("/posts/download/")) {
      const id = log.url.split("/posts/download/")[1];
      postStats[id] = (postStats[id] || 0) + 1;
    }
  });

  return Object.entries(postStats)
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// Função para usar no router - retorna dados formatados para a view
function getStatisticsForView(logs) {
  const stats = processLogsStatistics(logs);

  return {
    summary: stats.summary,
    charts: {
      requestsOverTime: stats.requestsOverTime,
      statusCodes: stats.statusCodes,
      methods: stats.methods,
      hourlyData: stats.hourlyData,
    },
    topUrls: stats.topUrls,
    topPosts: stats.topPosts,
    topDownloads: stats.topDownloads,
    totalLogs: logs.length,
    logins: stats.logins,
  };
}

module.exports = {
  processLogs,
  getStatisticsForView,
  generateSummaryStats,
  generateStatusData,
  generateHourlyData,
  generateTopUrlsData,
};
