// Time Complexity Tycoon - lightweight simulation engine (client-side)

const COMPLEXITY_MODELS = {
  // Each model returns a normalized “cost” multiplier for a given input size.
  // We keep it simple + monotonic so learners can intuit cause/effect.
  'O(1)': { kind: 'const', label: 'O(1)', base: 1 },
  'O(log n)': { kind: 'log', label: 'O(log n)', base: 3 },
  'O(n)': { kind: 'linear', label: 'O(n)', base: 8 },
  'O(n log n)': { kind: 'nlogn', label: 'O(n log n)', base: 18 },
  'O(n²)': { kind: 'quadratic', label: 'O(n²)', base: 45 },
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function safeLog2(x) {
  return Math.log2(Math.max(2, x));
}

function complexityCost(complexityLabel, n) {
  const model = COMPLEXITY_MODELS[complexityLabel] || COMPLEXITY_MODELS['O(n)'];
  switch (model.kind) {
    case 'const':
      return model.base;
    case 'log':
      return model.base * safeLog2(n);
    case 'linear':
      return model.base * n;
    case 'nlogn':
      return model.base * n * safeLog2(n);
    case 'quadratic':
      return model.base * n * n;
    default:
      return model.base * n;
  }
}

function optionToComplexity(option) {
  // option = { complexityLabel, memoryFactor, techniqueName }
  return option;
}

function simulateStep({ n, requestRate, cacheHitRate, currentServerLoad, option }) {
  const opt = optionToComplexity(option);

  // Cache reduces effective work for some tasks.
  // We assume cache helps more for retrieval/search than for sorting.
  const cacheBenefit = cacheHitRate * 0.65; // 0..0.65
  const effectiveN = Math.max(10, Math.floor(n * (1 - cacheBenefit)));

  const cpuCost = complexityCost(opt.complexityLabel, effectiveN);

  // Normalize costs into a 0..100 CPU percent range.
  // The constants make the UX stable across levels.
  const cpuPercent = clamp(((cpuCost * requestRate) / (n * 16)) * 100, 0, 100);

  const memoryMB = clamp(
    80 + (opt.memoryFactor || 0) * effectiveN + effectiveN * 0.02 + requestRate * 0.3,
    0,
    2048
  );

  // Response time increases with CPU + memory pressure.
  const memoryPressure = clamp(memoryMB / 1024, 0, 2);
  const responseTimeMs = clamp(
    35 + cpuPercent * 2.3 + memoryPressure * 120 + (currentServerLoad / 100) * 80,
    20,
    5000
  );

  // Server health drops when load is high, recovers slowly.
  const loadIncrease = clamp(cpuPercent * 0.55 + memoryPressure * 15 + requestRate * 0.8, 0, 100);
  const nextServerLoad = clamp(
    currentServerLoad + loadIncrease - 18, // recovery term
    0,
    100
  );

  const serverHealth = clamp(100 - nextServerLoad, 0, 100);

  // Score delta: reward better complexity.
  // “bad” complexities scale brutally as n grows.
  const baselineCost = complexityCost('O(n)', effectiveN);
  const selectedCost = complexityCost(opt.complexityLabel, effectiveN);
  const costRatio = selectedCost / Math.max(1e-9, baselineCost);

  // Best decisions yield positive, inefficient decisions penalize.
  let scoreDelta = Math.round(120 / costRatio);
  if (cacheHitRate < 0.2) {
    // If cache isn't helping, cache-aware choices matter less.
    scoreDelta = Math.round(scoreDelta * 0.95);
  }

  // Convert response time penalty.
  if (responseTimeMs > 900) scoreDelta -= 35;
  if (responseTimeMs > 1600) scoreDelta -= 70;
  scoreDelta = clamp(scoreDelta, -200, 200);

  const educational = {
    timeComplexity: opt.complexityLabel,
    techniqueName: opt.techniqueName,
    explanation:
      `Your choice uses ${opt.complexityLabel}, so as workload size grows the amount of work grows at that rate. ` +
      `Higher growth rates increase CPU and queueing, which then raises response time and server load.`,
  };

  // Add additional tailored hint for learner.
  if (opt.complexityLabel === 'O(n²)') {
    educational.mistake =
      'O(n²) approaches are costly for large workloads. Try a more scalable technique like sorting optimizations or indexing.';
  } else if (opt.complexityLabel === 'O(n log n)') {
    educational.mistake =
      'O(n log n) is usually fine, but for very large or high-throughput systems you may still need caching/indexing.';
  } else {
    educational.correct =
      'Scalable choice: your work grows slowly with n, keeping CPU and response time under control.';
  }

  return {
    effectiveN,
    cpuPercent,
    memoryMB,
    responseTimeMs,
    nextServerLoad,
    serverHealth,
    scoreDelta,
    educational,
  };
}

export { COMPLEXITY_MODELS, complexityCost, simulateStep };
