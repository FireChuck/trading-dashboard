// mock-data.js — Consolidated mock data for 3 bots × 3 timeframes
// Provides: MOCK_DATA (original 7), MockData (mid 8-15), MockDataFinal (final 16-20 + landing)

const MOCK_DATA = (() => {
  // ── Helpers ──
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
        const pair = pick(config.pairs);
        const session = pick(config.sessions);
        const rr = Math.abs(pnl / sRand(config.avgLossMin, config.avgLossMax));
        trades.push({
          date: new Date(2026, 3, 1 + d),
          pair,
          session,
          pnl: Math.round(pnl * 100) / 100,
          rr: Math.round(rr * 100) / 100,
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

  function aggregateWeekly(dailyTrades) {
    const weeks = {};
    dailyTrades.forEach(t => {
      const weekStart = new Date(t.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      if (!weeks[key]) weeks[key] = { date: weekStart, trades: [], pnl: 0, equity: 0 };
      weeks[key].trades.push(t);
      weeks[key].pnl += t.pnl;
      weeks[key].equity = t.equity;
    });
    return Object.values(weeks).map(w => ({
      ...w,
      pnl: Math.round(w.pnl * 100) / 100,
      winCount: w.trades.filter(t => t.isWin).length,
      lossCount: w.trades.filter(t => !t.isWin).length,
    }));
  }

  function aggregateMonthly(weeklyData) {
    const months = {};
    weeklyData.forEach(w => {
      const key = `${w.date.getFullYear()}-${String(w.date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { date: new Date(w.date.getFullYear(), w.date.getMonth(), 1), weeks: [], pnl: 0, equity: 0 };
      months[key].weeks.push(w);
      months[key].pnl += w.pnl;
      months[key].equity = w.equity;
    });
    return Object.values(months).map(m => ({
      ...m,
      pnl: Math.round(m.pnl * 100) / 100,
      weekCount: m.weeks.length,
    }));
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
      const dd = peak2 - cum;
      equityArr.push(Math.round(cum * 100) / 100);
      drawdownCurve.push({ date: t.date.toISOString().slice(0, 10), dd: Math.round(dd * 100) / 100 });
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
      maxDD: Math.round((peak2 - cum + (cum < 0 ? 0 : 0)) * 100) / 100 || Math.round(maxDD * 10000 * 100) / 100,
      bestTrade, worstTrade, streaks, monthlyPnl, equity: equityArr, drawdownCurve,
    };
  }

  function computeSessionStats(trades) {
    const sessions = { Asian: { trades: [], pnl: 0 }, European: { trades: [], pnl: 0 }, US: { trades: [], pnl: 0 } };
    trades.forEach(t => {
      const key = t.session === 'European' ? 'European' : t.session === 'Asian' ? 'Asian' : 'US';
      if (sessions[key]) { sessions[key].trades.push(t); sessions[key].pnl += t.pnl; }
    });
    return Object.entries(sessions).map(([name, s]) => ({
      session: name,
      tradeCount: s.trades.length,
      winRate: s.trades.length ? Math.round((s.trades.filter(t => t.isWin).length / s.trades.length) * 1000) / 10 : 0,
      pnl: Math.round(s.pnl * 100) / 100,
    }));
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

  function computeRRDistribution(trades) {
    const buckets = ['<0.5', '0.5-1', '1-1.5', '1.5-2', '2-2.5', '2.5-3', '3-4', '4+'];
    const dist = buckets.map(b => ({ bucket: b, win: 0, loss: 0 }));
    trades.forEach(t => {
      const rr = t.rr;
      let idx;
      if (rr < 0.5) idx = 0;
      else if (rr < 1) idx = 1;
      else if (rr < 1.5) idx = 2;
      else if (rr < 2) idx = 3;
      else if (rr < 2.5) idx = 4;
      else if (rr < 3) idx = 5;
      else if (rr < 4) idx = 6;
      else idx = 7;
      if (t.isWin) dist[idx].win++; else dist[idx].loss++;
    });
    return dist;
  }

  function generateSignals(trades, config) {
    return trades.slice(0, 15).map(t => ({
      direction: t.direction,
      pair: t.pair,
      entry: t.entry,
      time: `${String(t.date.getHours()).padStart(2, '0')}:${String(t.date.getMinutes()).padStart(2, '0')}`,
      session: t.session === 'European' ? 'London' : t.session === 'US' ? 'New York' : 'Asian',
      pnl: t.pnl,
    }));
  }

  function computeAllocation(pairs) {
    const total = pairs.length;
    const alloc = {};
    pairs.forEach(p => { alloc[p] = alloc[p] || 0; alloc[p]++; });
    const result = {};
    Object.entries(alloc).forEach(([p, c]) => { result[p] = Math.round((c / total) * 100); });
    return result;
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

  // ── Bot Configs ──
  const botConfigs = {
    'momentum-alpha': {
      name: 'Momentum Alpha',
      tagline: 'Trendfolger · High Frequency',
      winRate: 0.58,
      pairs: ['NQ', 'ES', 'YM'],
      sessions: ['European', 'US'],
      minTradesPerDay: 4,
      maxTradesPerDay: 8,
      avgWinMin: 30, avgWinMax: 120,
      avgLossMin: 20, avgLossMax: 80,
    },
    'mean-reverter': {
      name: 'Mean Reverter',
      tagline: 'Statistical Arbitrage · Moderate',
      winRate: 0.65,
      pairs: ['MNQ', 'MES', 'MYM'],
      sessions: ['Asian', 'European', 'US'],
      minTradesPerDay: 1,
      maxTradesPerDay: 3,
      avgWinMin: 50, avgWinMax: 200,
      avgLossMin: 30, avgLossMax: 120,
    },
    'scalp-master': {
      name: 'Scalp Master',
      tagline: 'HFT Scalping · Ultra Frequency',
      winRate: 0.55,
      pairs: ['NQ', 'MNQ', 'ES', 'MES'],
      sessions: ['European', 'US'],
      minTradesPerDay: 8,
      maxTradesPerDay: 18,
      avgWinMin: 10, avgWinMax: 40,
      avgLossMin: 8, avgLossMax: 35,
    },
  };

  const correlationMatrix = {
    'momentum-alpha': { 'momentum-alpha': 1.0, 'mean-reverter': 0.35, 'scalp-master': 0.12 },
    'mean-reverter': { 'momentum-alpha': 0.35, 'mean-reverter': 1.0, 'scalp-master': 0.28 },
    'scalp-master': { 'momentum-alpha': 0.12, 'mean-reverter': 0.28, 'scalp-master': 1.0 },
  };

  // ── Generate data ──
  const bots = {};
  const mockDataBots = {};
  const mockDataFinalBots = {};

  Object.entries(botConfigs).forEach(([id, config]) => {
    seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 137;
    const dailyTrades = generateDailyTrades(config, 60);
    const weeklyData = aggregateWeekly(dailyTrades);
    const monthlyData = aggregateMonthly(weeklyData);
    const kpis = computeKPIs(dailyTrades);
    const allocation = computeAllocation(dailyTrades.map(t => t.pair));

    // Build per-timeframe data for all module types
    const buildTfData = (trades) => {
      const k = computeKPIs(trades);
      return {
        ...k,
        trades,
        sessionStats: computeSessionStats(trades),
        pairPnl: computePairPnl(trades),
        rrDistribution: computeRRDistribution(trades),
        equityCurve: trades.map(t => ({ date: t.date, equity: t.equity })),
        signals: generateSignals(trades, config),
        allocation,
        correlation: correlationMatrix[id],
        sharpeTrend: computeSharpeTrend(trades),
      };
    };

    // Generate distinct trade pools per timeframe (different seeds)
    const weeklyTrades = (() => {
      seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 251;
      return generateDailyTrades({ ...config, minTradesPerDay: Math.max(1, config.minTradesPerDay - 1), maxTradesPerDay: config.maxTradesPerDay, avgWinMin: config.avgWinMin * 1.3, avgWinMax: config.avgWinMax * 1.5, avgLossMin: config.avgLossMin * 1.2, avgLossMax: config.avgLossMax * 1.4 }, 90);
    })();
    const monthlyTrades = (() => {
      seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 397;
      return generateDailyTrades({ ...config, minTradesPerDay: Math.max(1, config.minTradesPerDay - 1), maxTradesPerDay: Math.ceil(config.maxTradesPerDay / 2), avgWinMin: config.avgWinMin * 1.8, avgWinMax: config.avgWinMax * 2.0, avgLossMin: config.avgLossMin * 1.5, avgLossMax: config.avgLossMax * 1.8 }, 120);
    })();

    const dailyTf = buildTfData(dailyTrades);
    const weeklyTf = buildTfData(weeklyTrades);
    const monthlyTf = buildTfData(monthlyTrades);

    // MOCK_DATA structure (for original 7 modules + app.js)
    bots[id] = {
      id,
      name: config.name,
      tagline: config.tagline,
      pairs: config.pairs,
      daily: dailyTf,
      weekly: weeklyTf,
      monthly: monthlyTf,
    };

    // MockData structure (for mid modules A8-B15)
    mockDataBots[id] = {
      name: config.name,
      shortName: config.name.split(' ').map(w => w[0]).join(''),
      color: config.pairs.includes('NQ') ? '#5B8DEF' : config.pairs.includes('MNQ') ? '#F59E0B' : '#10B981',
      pairs: config.pairs,
      daily: {
        winRate: dailyTf.winRate,
        profitFactor: dailyTf.profitFactor,
        sharpe: dailyTf.sharpe,
        maxDrawdown: dailyTf.maxDD || Math.round(dailyTf.maxDrawdown * 100),
        avgWin: dailyTf.avgWin,
        avgLoss: dailyTf.avgLoss,
        totalPnl: dailyTf.totalPnl,
        tradeCount: dailyTf.totalTrades,
        allocation: dailyTf.allocation,
        correlation: dailyTf.correlation,
        signals: dailyTf.signals,
        drawdownCurve: dailyTf.drawdownCurve,
        sharpeTrend: dailyTf.sharpeTrend,
      },
      weekly: {
        winRate: weeklyTf.winRate,
        profitFactor: weeklyTf.profitFactor,
        sharpe: weeklyTf.sharpe,
        maxDrawdown: weeklyTf.maxDD || Math.round(weeklyTf.maxDrawdown * 100),
        avgWin: weeklyTf.avgWin,
        avgLoss: weeklyTf.avgLoss,
        totalPnl: weeklyTf.totalPnl,
        tradeCount: weeklyTf.totalTrades,
        allocation: weeklyTf.allocation,
        correlation: weeklyTf.correlation,
        signals: weeklyTf.signals,
        drawdownCurve: weeklyTf.drawdownCurve,
        sharpeTrend: weeklyTf.sharpeTrend,
      },
      monthly: {
        winRate: monthlyTf.winRate,
        profitFactor: monthlyTf.profitFactor,
        sharpe: monthlyTf.sharpe,
        maxDrawdown: monthlyTf.maxDD || Math.round(monthlyTf.maxDrawdown * 100),
        avgWin: monthlyTf.avgWin,
        avgLoss: monthlyTf.avgLoss,
        totalPnl: monthlyTf.totalPnl,
        tradeCount: monthlyTf.totalTrades,
        allocation: monthlyTf.allocation,
        correlation: monthlyTf.correlation,
        signals: monthlyTf.signals,
        drawdownCurve: monthlyTf.drawdownCurve,
        sharpeTrend: monthlyTf.sharpeTrend,
      },
    };

    // MockDataFinal structure (for final modules B16-B20 + landing)
    mockDataFinalBots[id] = {
      _botId: id,
      daily: dailyTf,
      weekly: weeklyTf,
      monthly: monthlyTf,
    };
  });

  // Risk radar data
  Object.entries(bots).forEach(([id, bot]) => {
    const k = bot.daily;
    const trades = bot.daily.trades;
    const pnls = trades.map(t => t.pnl);
    const mean = pnls.reduce((s, v) => s + v, 0) / pnls.length;
    const std = Math.sqrt(pnls.reduce((s, v) => s + (v - mean) ** 2, 0) / pnls.length);
    const avgTrade = Math.abs(mean);
    const volatility = clamp((std / (avgTrade || 1)) * 20, 10, 100);
    const maxDD = k.maxDrawdown * 5;
    const avgLossSeverity = clamp(Math.abs(k.avgLoss) / 2, 10, 90);
    const windowSize = 20;
    const rollingWR = [];
    for (let i = windowSize; i < trades.length; i++) {
      const slice = trades.slice(i - windowSize, i);
      rollingWR.push(slice.filter(t => t.isWin).length / windowSize);
    }
    const wrMean = rollingWR.reduce((a, b) => a + b, 0) / rollingWR.length;
    const wrStd = rollingWR.length ? Math.sqrt(rollingWR.reduce((s, v) => s + (v - wrMean) ** 2, 0) / rollingWR.length) : 0;
    const winRateStability = clamp(100 - wrStd * 500, 10, 95);
    const corrRisk = clamp(sRand(15, 55), 10, 80);
    const pairCounts = {};
    trades.forEach(t => { pairCounts[t.pair] = (pairCounts[t.pair] || 0) + 1; });
    const total = trades.length;
    const hhi = Object.values(pairCounts).reduce((s, c) => s + (c / total) ** 2, 0);
    const concentrationRisk = clamp(hhi * 200, 10, 90);
    bots[id].riskRadar = {
      labels: ['Volatility', 'Max Drawdown', 'Avg Loss', 'WR Stability', 'Correlation', 'Concentration'],
      values: [Math.round(volatility), Math.round(maxDD), Math.round(avgLossSeverity), Math.round(winRateStability), Math.round(corrRisk), Math.round(concentrationRisk)],
    };
  });

  // ── Expose all three globals ──

  // MockData (mid modules A8-B15)
  window.MockData = {
    getAllBots: () => mockDataBots,
    getBotNames: () => Object.keys(mockDataBots),
    getTimeframes: () => ['daily', 'weekly', 'monthly'],
    getMomentumAlpha: () => mockDataBots['momentum-alpha'],
    getMeanReverter: () => mockDataBots['mean-reverter'],
    getScalpMaster: () => mockDataBots['scalp-master'],
  };

  // MockDataFinal (final modules B16-B20 + landing)
  const botColors = {
    'momentum-alpha': { main: '#5B8DEF', light: '#93C5FD', dark: '#1E40AF', bg: 'rgba(91,141,239,0.08)' },
    'mean-reverter': { main: '#F59E0B', light: '#FCD34D', dark: '#B45309', bg: 'rgba(245,158,11,0.08)' },
    'scalp-master': { main: '#10B981', light: '#6EE7B7', dark: '#065F46', bg: 'rgba(16,185,129,0.08)' },
  };
  const botNames = {
    'momentum-alpha': 'Momentum Alpha',
    'mean-reverter': 'Mean Reverter',
    'scalp-master': 'Scalp Master',
  };

  window.MockDataFinal = {
    getAllBots: () => ({
      momentumAlpha: mockDataFinalBots['momentum-alpha'],
      meanReverter: mockDataFinalBots['mean-reverter'],
      scalpMaster: mockDataFinalBots['scalp-master'],
    }),
    botColors: {
      momentumAlpha: botColors['momentum-alpha'],
      meanReverter: botColors['mean-reverter'],
      scalpMaster: botColors['scalp-master'],
    },
    botNames: {
      momentumAlpha: botNames['momentum-alpha'],
      meanReverter: botNames['mean-reverter'],
      scalpMaster: botNames['scalp-master'],
    },
    getMomentumAlpha: () => mockDataFinalBots['momentum-alpha'],
    getMeanReverter: () => mockDataFinalBots['mean-reverter'],
    getScalpMaster: () => mockDataFinalBots['scalp-master'],
  };

  return {
    botIds: Object.keys(botConfigs),
    bots,
  };
})();
