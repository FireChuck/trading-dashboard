// mock-data.js — Trading Analytics Mock Data (Clean)
// ═══════════════════════════════════════════════════════════════════════════
//
// PUBLIC API:
//
//   getMockData(botId, timeframe)
//     Returns { bot, timeframe, data, kpis, botIds, timeframes, ... }
//     botId:    'alpha-trader' | 'scalp-master' | 'trend-rider'
//     timeframe:'daily' | 'weekly' | 'monthly'
//
//   getMockData.botIds      → ['alpha-trader', 'scalp-master', 'trend-rider']
//   getMockData.timeframes  → ['daily', 'weekly', 'monthly']
//   getMockData.allBotIds   → alias for botIds
//
// DATA STRUCTURE per bot × timeframe:
//   {
//     totalTrades, winRate, totalPnl, profitFactor, sharpe, maxDrawdown,
//     avgWin, avgLoss, winCount, lossCount, maxWinStreak, maxLossStreak,
//     bestTrade, worstTrade, streaks, monthlyPnl, equity, drawdownCurve,
//     sharpeTrend, riskRadar,
//     trades:       Array<Trade>,
//     pairPnl:      Array<PairPnl>,
//     equityCurve:  Array<{date, equity}>,
//   }
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_DATA = (() => {
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = arr => arr[randInt(0, arr.length - 1)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  let seed = 42;
  const seededRand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };
  const sRand = (min, max) => seededRand() * (max - min) + min;
  const sRandInt = (min, max) => Math.floor(sRand(min, max + 1));

  function generateDailyTrades(config, days) {
    const trades = [];
    let equity = 10000;
    for (let d = 0; d < days; d++) {
      const numTrades = sRandInt(config.minTradesPerDay, config.maxTradesPerDay);
      for (let t = 0; t < numTrades; t++) {
        const isWin = seededRand() < config.winRate;
        const pnl = isWin
          ? sRand(config.avgWinMin, config.avgWinMax)
          : -sRand(config.avgLossMin, config.avgLossMax);
        equity += pnl;
        trades.push({
          date: new Date(2026, 3, 1 + d),
          pair: pick(config.pairs),
          session: pick(config.sessions),
          pnl: Math.round(pnl * 100) / 100,
          rr: Math.round(Math.abs(pnl / sRand(config.avgLossMin, config.avgLossMax)) * 100) / 100,
          isWin,
          equity: Math.round(equity * 100) / 100,
          entry: Math.round(sRand(5000, 6000) * 100) / 100,
          exit: Math.round(sRand(5000, 6000) * 100) / 100,
          points: Math.round((isWin ? sRand(2, 25) : -sRand(2, 18)) * 100) / 100,
          risk: Math.round(sRand(config.avgLossMin, config.avgLossMax) * 100) / 100,
          volume: sRandInt(1, 8),
          id: trades.length + 1,
          direction: isWin ? pick(['Long', 'Short']) : pick(['Long', 'Short']),
        });
      }
    }
    return trades;
  }

  function computeKPIs(trades) {
    if (!trades.length) return {};
    const wins = trades.filter(t => t.isWin);
    const losses = trades.filter(t => !t.isWin);
    const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
    const winRate = wins.length / trades.length;
    const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
    const pnls = trades.map(t => t.pnl);
    const mean = pnls.reduce((s, v) => s + v, 0) / pnls.length;
    const std = Math.sqrt(pnls.reduce((s, v) => s + (v - mean) ** 2, 0) / pnls.length);
    const sharpe = std > 0 ? (mean / std) * Math.sqrt(252) : 0;
    let peak = -Infinity, maxDD = 0, equity = 10000;
    trades.forEach(t => {
      equity += t.pnl;
      if (equity > peak) peak = equity;
      const dd = (peak - equity) / peak;
      if (dd > maxDD) maxDD = dd;
    });
    const bestTrade = trades.reduce((b, t) => t.pnl > (b?.pnl ?? -Infinity) ? t : b, null);
    const worstTrade = trades.reduce((w, t) => t.pnl < (w?.pnl ?? Infinity) ? t : w, null);
    let mws = 0, mls = 0, cw = 0, cl = 0;
    const streaks = [];
    for (const t of trades) {
      if (t.pnl > 0) { cw++; cl = 0; streaks.push({ id: t.id, type: 'win' }); }
      else if (t.pnl < 0) { cl++; cw = 0; streaks.push({ id: t.id, type: 'loss' }); }
      else { cw = 0; cl = 0; }
      if (cw > mws) mws = cw;
      if (cl > mls) mls = cl;
    }
    const monthlyPnl = {};
    for (const t of trades) {
      const m = t.date.toISOString().slice(0, 7);
      monthlyPnl[m] = (monthlyPnl[m] || 0) + t.pnl;
    }
    let cum = 0, peak2 = 0;
    const equityArr = [0];
    const drawdownCurve = [];
    for (const t of trades) {
      cum += t.pnl;
      if (cum > peak2) peak2 = cum;
      equityArr.push(Math.round(cum * 100) / 100);
      drawdownCurve.push({ date: t.date.toISOString().slice(0, 10), dd: Math.round((peak2 - cum) * 100) / 100 });
    }
    return {
      totalTrades: trades.length,
      winRate: Math.round(winRate * 1000) / 10,
      totalPnl: Math.round(totalPnl * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      sharpe: Math.round(sharpe * 100) / 100,
      maxDrawdown: Math.round(maxDD * 1000) / 10,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      winCount: wins.length,
      lossCount: losses.length,
      maxWinStreak: mws,
      maxLossStreak: mls,
      bestTrade, worstTrade, streaks, monthlyPnl, equity: equityArr, drawdownCurve,
    };
  }

  function computePairPnl(trades) {
    const pairs = {};
    trades.forEach(t => {
      if (!pairs[t.pair]) pairs[t.pair] = { winPnl: 0, lossPnl: 0, totalPnl: 0, winCount: 0, lossCount: 0 };
      pairs[t.pair].totalPnl += t.pnl;
      if (t.isWin) { pairs[t.pair].winPnl += t.pnl; pairs[t.pair].winCount++; }
      else { pairs[t.pair].lossPnl += t.pnl; pairs[t.pair].lossCount++; }
    });
    return Object.entries(pairs).map(([pair, v]) => ({
      pair,
      winPnl: Math.round(v.winPnl * 100) / 100,
      lossPnl: Math.round(v.lossPnl * 100) / 100,
      totalPnl: Math.round(v.totalPnl * 100) / 100,
      winCount: v.winCount,
      lossCount: v.lossCount,
    }));
  }

  function computeSharpeTrend(trades) {
    const windowSize = 10;
    const trends = [];
    for (let i = windowSize; i <= trades.length; i += Math.floor(trades.length / 6)) {
      const slice = trades.slice(Math.max(0, i - windowSize), i);
      const pnls = slice.map(t => t.pnl);
      const m = pnls.reduce((a, b) => a + b, 0) / pnls.length;
      const s = Math.sqrt(pnls.reduce((a, v) => a + (v - m) ** 2, 0) / pnls.length);
      trends.push(s > 0 ? Math.round((m / s) * Math.sqrt(252) * 100) / 100 : 0);
    }
    while (trends.length < 6) trends.push(trends[trends.length - 1] || 1.0);
    return trends.slice(0, 6);
  }

  function computeRiskRadar(trades, kpis) {
    if (!trades?.length) return null;
    const pnls = trades.map(t => t.pnl);
    const mean = pnls.reduce((s, v) => s + v, 0) / pnls.length;
    const std = Math.sqrt(pnls.reduce((s, v) => s + (v - mean) ** 2, 0) / pnls.length);
    const avgTrade = Math.abs(mean);
    const volatility = clamp((std / (avgTrade || 1)) * 20, 10, 100);
    const maxDD = clamp((kpis.maxDrawdown || 0) * 5, 10, 100);
    const avgLossSeverity = clamp(Math.abs(kpis.avgLoss || 50) / 2, 10, 90);
    const windowSize = 20;
    const rollingWR = [];
    for (let i = windowSize; i < trades.length; i++) {
      const slice = trades.slice(i - windowSize, i);
      rollingWR.push(slice.filter(t => t.isWin).length / windowSize);
    }
    const wrMean = rollingWR.reduce((a, b) => a + b, 0) / (rollingWR.length || 1);
    const wrStd = rollingWR.length ? Math.sqrt(rollingWR.reduce((s, v) => s + (v - wrMean) ** 2, 0) / rollingWR.length) : 0;
    const winRateStability = clamp(100 - wrStd * 500, 10, 95);
    const corrRisk = clamp(sRand(15, 55), 10, 80);
    const pairCounts = {};
    trades.forEach(t => { pairCounts[t.pair] = (pairCounts[t.pair] || 0) + 1; });
    const total = trades.length;
    const hhi = Object.values(pairCounts).reduce((s, c) => s + (c / total) ** 2, 0);
    const concentrationRisk = clamp(hhi * 200, 10, 90);
    return {
      labels: ['Volatility', 'Max Drawdown', 'Avg Loss', 'WR Stability', 'Correlation', 'Concentration'],
      values: [Math.round(volatility), Math.round(maxDD), Math.round(avgLossSeverity), Math.round(winRateStability), Math.round(corrRisk), Math.round(concentrationRisk)],
    };
  }

  // ── Bot Configs ──
  const botConfigs = {
    'alpha-trader': {
      name: 'AlphaTrader Pro',
      tagline: 'Conservative · High Win Rate · Moderate Profit',
      winRate: 0.66,
      pairs: ['NQ', 'ES', 'YM'],
      sessions: ['European', 'US'],
      minTradesPerDay: 2, maxTradesPerDay: 5,
      avgWinMin: 40, avgWinMax: 150,
      avgLossMin: 25, avgLossMax: 90,
    },
    'scalp-master': {
      name: 'ScalpMaster X',
      tagline: 'Aggressive · High Frequency · Volatile P&L',
      winRate: 0.54,
      pairs: ['NQ', 'MNQ', 'ES', 'MES'],
      sessions: ['European', 'US'],
      minTradesPerDay: 10, maxTradesPerDay: 22,
      avgWinMin: 8, avgWinMax: 35,
      avgLossMin: 6, avgLossMax: 30,
    },
    'trend-rider': {
      name: 'TrendRider AI',
      tagline: 'Trend Following · Long Holds · Steady Growth',
      winRate: 0.60,
      pairs: ['NQ', 'ES', 'GC', 'CL'],
      sessions: ['Asian', 'European', 'US'],
      minTradesPerDay: 1, maxTradesPerDay: 3,
      avgWinMin: 80, avgWinMax: 300,
      avgLossMin: 40, avgLossMax: 150,
    },
  };

  // ── Generate data ──
  const bots = {};

  Object.entries(botConfigs).forEach(([id, config]) => {
    seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 137;
    const dailyTrades = generateDailyTrades(config, 60);

    const weeklyTrades = (() => {
      seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 251;
      return generateDailyTrades({ ...config, minTradesPerDay: Math.max(1, config.minTradesPerDay - 1), maxTradesPerDay: config.maxTradesPerDay, avgWinMin: config.avgWinMin * 1.3, avgWinMax: config.avgWinMax * 1.5, avgLossMin: config.avgLossMin * 1.2, avgLossMax: config.avgLossMax * 1.4 }, 90);
    })();

    const monthlyTrades = (() => {
      seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 397;
      return generateDailyTrades({ ...config, minTradesPerDay: Math.max(1, config.minTradesPerDay - 1), maxTradesPerDay: Math.ceil(config.maxTradesPerDay / 2), avgWinMin: config.avgWinMin * 1.8, avgWinMax: config.avgWinMax * 2.0, avgLossMin: config.avgLossMin * 1.5, avgLossMax: config.avgLossMax * 1.8 }, 120);
    })();

    const buildTfData = (trades) => {
      const kpis = computeKPIs(trades);
      return {
        ...kpis,
        trades,
        pairPnl: computePairPnl(trades),
        equityCurve: trades.map(t => ({ date: t.date, equity: t.equity })),
        sharpeTrend: computeSharpeTrend(trades),
        riskRadar: computeRiskRadar(trades, kpis),
      };
    };

    const daily = buildTfData(dailyTrades);
    const weekly = buildTfData(weeklyTrades);
    const monthly = buildTfData(monthlyTrades);

    bots[id] = { id, name: config.name, tagline: config.tagline, pairs: config.pairs, daily, weekly, monthly };
  });

  return {
    botIds: Object.keys(botConfigs),
    bots,
  };
})();

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API: getMockData(botId, timeframe)
// ═══════════════════════════════════════════════════════════════════════════
window.getMockData = function(botId, timeframe) {
  const ids = MOCK_DATA.botIds;
  const tfs = ['daily', 'weekly', 'monthly'];
  if (!botId || !ids.includes(botId)) {
    console.warn(`getMockData: unknown botId "${botId}". Available:`, ids);
    botId = ids[0];
  }
  if (!timeframe || !tfs.includes(timeframe)) {
    console.warn(`getMockData: unknown timeframe "${timeframe}". Available:`, tfs);
    timeframe = 'daily';
  }
  const bot = MOCK_DATA.bots[botId];
  const tf = bot[timeframe];
  return {
    ...tf,
    bot,
    botId,
    timeframe,
    data: tf,
    kpis: tf,
    botIds: ids,
    timeframes: tfs,
    allBotIds: ids,
  };
};

window.getMockData.botIds = MOCK_DATA.botIds;
window.getMockData.timeframes = ['daily', 'weekly', 'monthly'];
window.getMockData.allBotIds = MOCK_DATA.botIds;
