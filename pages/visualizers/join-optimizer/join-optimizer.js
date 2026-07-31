// Join Optimizer Visualizer — pages/visualizers/join-optimizer
// All logic is client-side: a small regex-based SQL parser for the AST view,
// a cost-based optimizer using simplified textbook I/O formulas, and three
// animated simulators (Nested Loop, Hash Join, Sort-Merge) built on capped
// sample data so the animation stays readable regardless of table size.

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------
const queryInput = document.getElementById("queryInput");
const parseBtn = document.getElementById("parseBtn");
const parseError = document.getElementById("parseError");
const astTree = document.getElementById("astTree");

const analyzeBtn = document.getElementById("analyzeBtn");
const dashboardPanel = document.getElementById("dashboardPanel");
const savingsBanner = document.getElementById("savingsBanner");
const costCards = document.getElementById("costCards");

const animationPanel = document.getElementById("animationPanel");
const algoTabs = document.getElementById("algoTabs");
const playBtn = document.getElementById("playBtn");
const resetBtn = document.getElementById("resetBtn");

const stageLabelA = document.getElementById("stageLabelA");
const stageLabelB = document.getElementById("stageLabelB");
const chipStripA = document.getElementById("chipStripA");
const chipStripB = document.getElementById("chipStripB");
const bucketArea = document.getElementById("bucketArea");
const stageStatus = document.getElementById("stageStatus");
const comparisonCounter = document.getElementById("comparisonCounter");

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fmt(n) {
  return Math.round(n).toLocaleString();
}

// ---------------------------------------------------------------------------
// 1. SQL -> AST parser (basic SELECT ... JOIN ... ON ... [WHERE ...])
// ---------------------------------------------------------------------------
const QUERY_RE = /^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?\s+(?:INNER\s+)?JOIN\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?\s+ON\s+([\w.]+)\s*=\s*([\w.]+)(?:\s+WHERE\s+(.+))?$/i;

function parseQuery(sql) {
  const trimmed = sql.trim().replace(/;$/, "");
  const match = trimmed.match(QUERY_RE);
  if (!match) {
    throw new Error(
      "Could not parse this query. Expected shape: SELECT cols FROM t1 [alias] JOIN t2 [alias] ON t1.col = t2.col [WHERE ...]"
    );
  }
  const [, selectList, fromTable, fromAlias, joinTable, joinAlias, onLeft, onRight, whereClause] = match;
  return {
    select: selectList.split(",").map((s) => s.trim()),
    from: { table: fromTable, alias: fromAlias || fromTable },
    join: { table: joinTable, alias: joinAlias || joinTable },
    on: { left: onLeft, right: onRight },
    where: whereClause ? whereClause.trim() : null
  };
}

function buildAstTree(ast) {
  const joinNode = {
    label: `⋈ JOIN ON ${ast.on.left} = ${ast.on.right}`,
    type: "op",
    children: [
      { label: `SCAN ${ast.from.table} (${ast.from.alias})`, type: "scan" },
      { label: `SCAN ${ast.join.table} (${ast.join.alias})`, type: "scan" }
    ]
  };

  const filterNode = ast.where
    ? { label: `σ FILTER (${ast.where})`, type: "op", children: [joinNode] }
    : joinNode;

  return {
    label: `π PROJECT (${ast.select.join(", ")})`,
    type: "op",
    children: [filterNode]
  };
}

function renderAstNode(node) {
  const wrap = document.createElement("div");
  wrap.className = "ast-node-wrap";

  const el = document.createElement("div");
  el.className = `ast-node ${node.type}`;
  el.textContent = node.label;
  wrap.appendChild(el);

  if (node.children && node.children.length) {
    const childrenWrap = document.createElement("div");
    childrenWrap.className = "ast-children";
    node.children.forEach((child) => childrenWrap.appendChild(renderAstNode(child)));
    wrap.appendChild(childrenWrap);
  }

  return wrap;
}

function handleParse() {
  parseError.hidden = true;
  astTree.innerHTML = "";
  try {
    const ast = parseQuery(queryInput.value);
    const tree = buildAstTree(ast);
    astTree.appendChild(renderAstNode(tree));
  } catch (err) {
    parseError.textContent = err.message;
    parseError.hidden = false;
  }
}

parseBtn.addEventListener("click", handleParse);

// ---------------------------------------------------------------------------
// 2. Cost-based optimizer
//    Formulas are simplified textbook I/O-cost models:
//    - Nested Loop (unindexed, block form): P_outer + (P_outer * P_inner)
//    - Nested Loop (inner indexed):         P_outer + (rows_outer * indexLookupCost)
//    - Hash Join (build fits in memory):    P_build + P_probe
//    - Hash Join (build spills, ~Grace):    3 * (P_build + P_probe)
//    - Sort-Merge: sortCost(A) + sortCost(B) + (P_A + P_B), sortCost = 0 if
//      that side already has an index (assumed sorted) on the join column.
// ---------------------------------------------------------------------------
function sortCost(pages, indexed, memoryPages) {
  if (indexed) return 0;
  if (pages <= memoryPages) return 2 * pages;
  const passes = Math.ceil(Math.log(pages / memoryPages) / Math.log(memoryPages - 1)) + 1;
  return 2 * pages * passes;
}

function computeCosts(tableA, tableB, env) {
  const pagesA = Math.ceil(tableA.rows / env.rowsPerPage);
  const pagesB = Math.ceil(tableB.rows / env.rowsPerPage);

  // --- Nested Loop: pick the smaller table as the outer (driving) table ---
  const outerIsA = pagesA <= pagesB;
  const outer = outerIsA ? { ...tableA, pages: pagesA } : { ...tableB, pages: pagesB };
  const inner = outerIsA ? { ...tableB, pages: pagesB } : { ...tableA, pages: pagesA };

  let nestedLoop;
  if (inner.indexed) {
    const lookupCost = Math.max(1, Math.ceil(Math.log2(inner.pages)) + 1);
    const cost = outer.pages + outer.rows * lookupCost;
    nestedLoop = {
      key: "nestedLoop",
      title: "Nested Loop Join",
      icon: "fa-arrows-rotate",
      total: cost,
      breakdown: [
        `Outer table: ${outer.name} (${fmt(outer.pages)} pages, ${fmt(outer.rows)} rows)`,
        `Inner table: ${inner.name} — indexed on join column`,
        `Index lookup ≈ ${lookupCost} page reads/row (B-tree depth)`,
        `Cost = ${fmt(outer.pages)} + (${fmt(outer.rows)} × ${lookupCost}) = ${fmt(cost)}`
      ]
    };
  } else {
    const cost = outer.pages + outer.pages * inner.pages;
    nestedLoop = {
      key: "nestedLoop",
      title: "Nested Loop Join",
      icon: "fa-arrows-rotate",
      total: cost,
      breakdown: [
        `Outer table: ${outer.name} (${fmt(outer.pages)} pages)`,
        `Inner table: ${inner.name} (${fmt(inner.pages)} pages) — full scan per outer page`,
        `Cost = P_outer + (P_outer × P_inner)`,
        `Cost = ${fmt(outer.pages)} + (${fmt(outer.pages)} × ${fmt(inner.pages)}) = ${fmt(cost)}`
      ]
    };
  }

  // --- Hash Join: build the smaller side, probe with the larger side ---
  const buildIsA = pagesA <= pagesB;
  const build = buildIsA ? { ...tableA, pages: pagesA } : { ...tableB, pages: pagesB };
  const probe = buildIsA ? { ...tableB, pages: pagesB } : { ...tableA, pages: pagesA };
  const fitsInMemory = build.pages <= env.memoryPages;

  const hashCost = fitsInMemory
    ? build.pages + probe.pages
    : 3 * (build.pages + probe.pages);

  const hashJoin = {
    key: "hashJoin",
    title: "Hash Join",
    icon: "fa-hashtag",
    total: hashCost,
    breakdown: [
      `Build side: ${build.name} (${fmt(build.pages)} pages)`,
      `Probe side: ${probe.name} (${fmt(probe.pages)} pages)`,
      fitsInMemory
        ? `Build side fits in ${fmt(env.memoryPages)} memory pages — single pass`
        : `Build side exceeds ${fmt(env.memoryPages)} memory pages — Grace partitioning (~3×)`,
      fitsInMemory
        ? `Cost = ${fmt(build.pages)} + ${fmt(probe.pages)} = ${fmt(hashCost)}`
        : `Cost = 3 × (${fmt(build.pages)} + ${fmt(probe.pages)}) = ${fmt(hashCost)}`
    ]
  };

  // --- Sort-Merge: sort both sides (skip if already indexed/sorted), then merge ---
  const sortA = sortCost(pagesA, tableA.indexed, env.memoryPages);
  const sortB = sortCost(pagesB, tableB.indexed, env.memoryPages);
  const mergeCost = pagesA + pagesB;
  const smCost = sortA + sortB + mergeCost;

  const sortMerge = {
    key: "sortMerge",
    title: "Sort-Merge Join",
    icon: "fa-arrow-down-wide-short",
    total: smCost,
    breakdown: [
      `${tableA.name}: ${tableA.indexed ? "already sorted (indexed)" : `sort cost = ${fmt(sortA)}`}`,
      `${tableB.name}: ${tableB.indexed ? "already sorted (indexed)" : `sort cost = ${fmt(sortB)}`}`,
      `Merge pass: P_A + P_B = ${fmt(pagesA)} + ${fmt(pagesB)} = ${fmt(mergeCost)}`,
      `Cost = ${fmt(sortA)} + ${fmt(sortB)} + ${fmt(mergeCost)} = ${fmt(smCost)}`
    ]
  };

  return { nestedLoop, hashJoin, sortMerge, pagesA, pagesB, outer, inner, build, probe };
}

// ---------------------------------------------------------------------------
// 3. Dashboard rendering
// ---------------------------------------------------------------------------
function renderDashboard(costs) {
  const plans = [costs.nestedLoop, costs.hashJoin, costs.sortMerge];
  const sorted = [...plans].sort((a, b) => a.total - b.total);
  const winner = sorted[0];
  const worst = sorted[sorted.length - 1];
  const saved = worst.total - winner.total;
  const savedPct = worst.total > 0 ? Math.round((saved / worst.total) * 100) : 0;

  savingsBanner.innerHTML =
    `Optimizer selects <strong>${winner.title}</strong> at an estimated <strong>${fmt(winner.total)} page reads</strong> — ` +
    `saving <strong>${fmt(saved)} page reads (${savedPct}%)</strong> versus the worst plan (${worst.title}, ${fmt(worst.total)} pages).`;

  costCards.innerHTML = "";
  plans.forEach((plan) => {
    const card = document.createElement("div");
    card.className = "cost-card" + (plan.key === winner.key ? " optimal" : "");

    const title = document.createElement("div");
    title.className = "cost-card-title";
    title.innerHTML = `<h4><i class="fa-solid ${plan.icon}"></i> ${plan.title}</h4>` +
      (plan.key === winner.key ? `<span class="optimal-badge">OPTIMAL</span>` : "");
    card.appendChild(title);

    const list = document.createElement("ul");
    list.className = "cost-breakdown";
    plan.breakdown.forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      list.appendChild(li);
    });
    card.appendChild(list);

    const total = document.createElement("div");
    total.className = "cost-total";
    total.innerHTML = `${fmt(plan.total)} <span>page reads</span>`;
    card.appendChild(total);

    costCards.appendChild(card);
  });

  dashboardPanel.hidden = false;
  return winner.key;
}

// ---------------------------------------------------------------------------
// 4. Animation engine
// ---------------------------------------------------------------------------
const STAGE_SIZE = 8; // number of chips rendered per table, regardless of real row count
const ANIMATION_SPEED = 420; // ms per animation step

// Fixed demo values chosen so nested loop / hash / sort-merge all produce a
// readable number of matches on the sample data.
const DEMO_VALUES_A = [4, 7, 1, 9, 3, 12, 5, 8];
const DEMO_VALUES_B = [3, 10, 7, 11, 1, 13, 5, 14];

let currentAlgo = "hashJoin";
let isRunning = false;
let runToken = 0; // incremented on reset to cancel in-flight animations

function renderChipStrip(container, values) {
  container.innerHTML = "";
  values.forEach((v) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = v;
    chip.dataset.value = v;
    container.appendChild(chip);
  });
}

function resetStage() {
  runToken += 1;
  isRunning = false;
  renderChipStrip(chipStripA, DEMO_VALUES_A);
  renderChipStrip(chipStripB, DEMO_VALUES_B);
  bucketArea.hidden = true;
  bucketArea.innerHTML = "";
  comparisonCounter.textContent = "0";
  stageStatus.textContent = "Choose an algorithm and press Play.";
}

function setStatus(text) {
  stageStatus.textContent = text;
}

function bumpCounter(el) {
  el.textContent = String(Number(el.textContent) + 1);
}

function buildAlgoTabs(costs, winnerKey) {
  algoTabs.innerHTML = "";
  const order = [costs.nestedLoop, costs.hashJoin, costs.sortMerge];
  order.forEach((plan) => {
    const tab = document.createElement("button");
    tab.className = "algo-tab" + (plan.key === winnerKey ? " active" : "");
    tab.textContent = plan.title + (plan.key === winnerKey ? " ★" : "");
    tab.dataset.key = plan.key;
    tab.addEventListener("click", () => {
      if (isRunning) return;
      currentAlgo = plan.key;
      [...algoTabs.children].forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      resetStage();
    });
    algoTabs.appendChild(tab);
  });
  currentAlgo = winnerKey;
}

// ---- Nested Loop animation ----
async function animateNestedLoop(token) {
  const chipsA = [...chipStripA.children];
  const chipsB = [...chipStripB.children];
  setStatus("Nested Loop: for every outer row, scan the entire inner table.");

  for (const chipA of chipsA) {
    if (token !== runToken) return;
    chipA.classList.add("active-outer");
    for (const chipB of chipsB) {
      if (token !== runToken) return;
      chipB.classList.add("active-inner");
      bumpCounter(comparisonCounter);
      await sleep(ANIMATION_SPEED / 2);
      if (chipA.dataset.value === chipB.dataset.value) {
        chipA.classList.add("match");
        chipB.classList.add("match");
        await sleep(ANIMATION_SPEED / 2);
      }
      chipB.classList.remove("active-inner");
    }
    chipA.classList.remove("active-outer");
  }
  setStatus("Nested Loop complete — every outer row was compared against every inner row.");
}

// ---- Hash Join animation ----
async function animateHashJoin(token) {
  const BUCKET_COUNT = 4;
  bucketArea.hidden = false;
  bucketArea.innerHTML = "";
  const buckets = [];
  for (let i = 0; i < BUCKET_COUNT; i++) {
    const bucket = document.createElement("div");
    bucket.className = "bucket";
    bucket.innerHTML = `<span class="bucket-label">Bucket ${i}</span>`;
    bucketArea.appendChild(bucket);
    buckets.push({ el: bucket, values: [] });
  }

  const chipsA = [...chipStripA.children];
  const chipsB = [...chipStripB.children];

  setStatus("Build phase: hashing the smaller table's rows into in-memory buckets.");
  for (const chip of chipsA) {
    if (token !== runToken) return;
    const value = Number(chip.dataset.value);
    const bucketIndex = value % BUCKET_COUNT;
    chip.classList.add("active-outer");
    buckets[bucketIndex].values.push(value);
    const marker = document.createElement("span");
    marker.className = "chip";
    marker.style.width = "22px";
    marker.style.height = "22px";
    marker.style.fontSize = "9px";
    marker.textContent = value;
    buckets[bucketIndex].el.appendChild(marker);
    bumpCounter(comparisonCounter);
    await sleep(ANIMATION_SPEED);
  }

  setStatus("Probe phase: streaming the larger table's rows against the hash buckets.");
  for (const chip of chipsB) {
    if (token !== runToken) return;
    const value = Number(chip.dataset.value);
    const bucketIndex = value % BUCKET_COUNT;
    chip.classList.add("active-inner");
    buckets[bucketIndex].el.classList.add("probe-hit");
    bumpCounter(comparisonCounter);
    await sleep(ANIMATION_SPEED / 2);
    const isMatch = buckets[bucketIndex].values.includes(value);
    chip.classList.add(isMatch ? "match" : "no-match");
    await sleep(ANIMATION_SPEED / 2);
    buckets[bucketIndex].el.classList.remove("probe-hit");
  }
  setStatus("Hash Join complete — build once, probe once, no repeated full scans.");
}

// ---- Sort-Merge animation ----
async function animateSortMerge(token) {
  setStatus("Sort phase: ordering both inputs by the join key.");
  const valuesA = [...DEMO_VALUES_A].sort((a, b) => a - b);
  const valuesB = [...DEMO_VALUES_B].sort((a, b) => a - b);

  await sleep(ANIMATION_SPEED);
  if (token !== runToken) return;
  renderChipStrip(chipStripA, valuesA);
  renderChipStrip(chipStripB, valuesB);
  [...chipStripA.children, ...chipStripB.children].forEach((c) => c.classList.add("sorted"));
  await sleep(ANIMATION_SPEED);

  setStatus("Merge phase: two pointers walk down both sorted lists together.");
  const chipsA = [...chipStripA.children];
  const chipsB = [...chipStripB.children];
  let i = 0;
  let j = 0;

  while (i < chipsA.length && j < chipsB.length) {
    if (token !== runToken) return;
    const chipA = chipsA[i];
    const chipB = chipsB[j];
    chipA.classList.add("active-outer");
    chipB.classList.add("active-inner");
    bumpCounter(comparisonCounter);
    await sleep(ANIMATION_SPEED);

    const valA = Number(chipA.dataset.value);
    const valB = Number(chipB.dataset.value);
    if (valA === valB) {
      chipA.classList.add("match");
      chipB.classList.add("match");
      i++;
      j++;
    } else if (valA < valB) {
      chipA.classList.remove("active-outer");
      i++;
    } else {
      chipB.classList.remove("active-inner");
      j++;
    }
    chipA.classList.remove("active-outer");
    chipB.classList.remove("active-inner");
  }
  setStatus("Sort-Merge complete — each pointer only advances forward, no rescans.");
}

async function playAnimation() {
  if (isRunning) return;
  resetStage();
  isRunning = true;
  const token = runToken;

  if (currentAlgo === "nestedLoop") await animateNestedLoop(token);
  else if (currentAlgo === "hashJoin") await animateHashJoin(token);
  else await animateSortMerge(token);

  if (token === runToken) isRunning = false;
}

playBtn.addEventListener("click", playAnimation);
resetBtn.addEventListener("click", resetStage);

// ---------------------------------------------------------------------------
// 5. Wiring: analyze button ties the cost engine + dashboard + animation tabs
// ---------------------------------------------------------------------------
function readEnv() {
  return {
    rowsPerPage: Math.max(1, Number(document.getElementById("rowsPerPage").value) || 100),
    memoryPages: Math.max(1, Number(document.getElementById("memoryPages").value) || 100)
  };
}

function readTable(prefix) {
  return {
    name: document.getElementById(`name${prefix}`).value.trim() || `table_${prefix.toLowerCase()}`,
    rows: Math.max(1, Number(document.getElementById(`rows${prefix}`).value) || 1),
    indexed: document.getElementById(`indexed${prefix}`).checked
  };
}

function handleAnalyze() {
  const tableA = readTable("A");
  const tableB = readTable("B");
  const env = readEnv();

  const costs = computeCosts(tableA, tableB, env);
  const winnerKey = renderDashboard(costs);

  stageLabelA.textContent = tableA.name;
  stageLabelB.textContent = tableB.name;

  buildAlgoTabs(costs, winnerKey);
  animationPanel.hidden = false;
  resetStage();

  dashboardPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

analyzeBtn.addEventListener("click", handleAnalyze);

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

// ---- Init ----
handleParse();
resetStage();
