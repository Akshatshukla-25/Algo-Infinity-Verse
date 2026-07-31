// Refactoring Dojo — lightweight static metrics (no third-party deps)
// NOTE: These are approximations meant for educational feedback, not formal proof.

function countBranchTokens(code) {
  const src = code
    .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, '');

  // Basic branching keywords
  const keywords = ['if', 'else', 'for', 'while', 'catch', 'case', 'switch'];

  let count = 0;
  for (const k of keywords) {
    const re = new RegExp(`\\b${k}\\b`, 'g');
    count += (src.match(re) || []).length;
  }

  // Ternary
  count += (src.match(/\?/g) || []).length;

  // Logical conditions
  count += (src.match(/&&/g) || []).length;
  count += (src.match(/\|\|/g) || []).length;

  return count;
}

function computeNestingDepth(code) {
  // Approximate: track block nesting by braces, with extra weight when entering
  // a control-flow statement.
  const src = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');

  let maxDepth = 0;
  let depth = 0;

  // We consider "control" when we see one of these before a "{".
  const controlBeforeBrace = /\b(if|else\s+if|for|while|switch|case|catch)\b[^{]*\{/g;
  const controlIndices = [];
  let m;
  while ((m = controlBeforeBrace.exec(src))) {
    controlIndices.push(m.index);
  }

  // Simple brace-walk; update depth on { and }
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') {
      depth += 1;
      // If this brace is likely tied to control flow, bump depth by +0.5 for ranking
      const isControlBrace = controlIndices.some((idx) => Math.abs(idx - i) < 12);
      const effective = isControlBrace ? depth + 0.5 : depth;
      maxDepth = Math.max(maxDepth, effective);
    } else if (ch === '}') {
      depth = Math.max(0, depth - 1);
    }
  }

  return Math.round(maxDepth * 10) / 10;
}

function extractFunctionBlocks(code) {
  // Approximation: find "function" or arrow functions and then count braces until end.
  const blocks = [];

  const src = code;

  // Match function declarations/expressions and arrow function assignments.
  const fnRegex =
    /\bfunction\b[^({;]*\(([^)]*)\)\s*\{|=\s*\([^)]*\)\s*=>\s*\{|=\s*\w+\s*=>\s*\{|\b\w+\s*=\s*\([^)]*\)\s*=>\s*\{/g;
  let match;

  while ((match = fnRegex.exec(src))) {
    const startBraceIdx = src.indexOf('{', match.index);
    if (startBraceIdx === -1) continue;

    let braceDepth = 0;
    let endIdx = -1;
    for (let i = startBraceIdx; i < src.length; i++) {
      if (src[i] === '{') braceDepth++;
      if (src[i] === '}') braceDepth--;
      if (braceDepth === 0) {
        endIdx = i;
        break;
      }
    }
    if (endIdx === -1) continue;

    const fnText = src.slice(match.index, endIdx + 1);
    const loc = fnText.split(/\r?\n/).length;
    blocks.push({ text: fnText, loc });

    // Prevent infinite loops
    fnRegex.lastIndex = endIdx + 1;
  }

  return blocks;
}

function computeFunctionLengthStats(code) {
  const fns = extractFunctionBlocks(code);
  if (fns.length === 0) {
    // Fallback: total lines
    return { functionCount: 0, maxFunctionLOC: code.split(/\r?\n/).length };
  }
  const maxFunctionLOC = Math.max(...fns.map((b) => b.loc));
  return { functionCount: fns.length, maxFunctionLOC };
}

function computeDuplicatePatterns(code) {
  // Lightweight: line-based duplicates (exact repeated non-empty lines)
  const lines = code
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const freq = new Map();
  for (const line of lines) {
    if (line.length < 10) continue;
    freq.set(line, (freq.get(line) || 0) + 1);
  }

  let dupLines = 0;
  let topDup = null;
  let topDupCount = 1;

  for (const [line, c] of freq.entries()) {
    if (c >= 2) {
      dupLines += c - 1;
      if (c > topDupCount) {
        topDupCount = c;
        topDup = line;
      }
    }
  }

  return {
    duplicateLineCount: dupLines,
    topDuplicateLine: topDup,
    topDuplicateFrequency: topDupCount,
  };
}

function analyzeCode(code) {
  const loc = code.split(/\r?\n/).length;
  const cyclomaticLike = countBranchTokens(code);
  const maxNestingDepth = computeNestingDepth(code);
  const fnLen = computeFunctionLengthStats(code);
  const dup = computeDuplicatePatterns(code);

  // Score heuristics (educational)
  // Normalize to roughly comparable scales.
  const complexityPenalty = Math.min(80, cyclomaticLike * 2);
  const nestingPenalty = Math.min(50, Math.max(0, maxNestingDepth - 1) * 5);
  const lengthPenalty = Math.min(50, Math.max(0, fnLen.maxFunctionLOC - 40) * 0.6);
  const dupPenalty = Math.min(30, dup.duplicateLineCount * 1.5);

  const qualityScore = Math.max(
    0,
    100 - (complexityPenalty + nestingPenalty + lengthPenalty + dupPenalty) / 2
  );

  return {
    loc,
    cyclomaticComplexity: cyclomaticLike,
    maxNestingDepth,
    functionCount: fnLen.functionCount,
    maxFunctionLOC: fnLen.maxFunctionLOC,
    duplicateLineCount: dup.duplicateLineCount,
    duplicateTopLine: dup.topDuplicateLine,
    duplicateTopFrequency: dup.topDuplicateFrequency,
    qualityScore: Math.round(qualityScore),
  };
}

function suggestImprovements(originalMetrics, refactoredMetrics) {
  const suggestions = [];

  const delta = {
    cyclomatic: originalMetrics.cyclomaticComplexity - refactoredMetrics.cyclomaticComplexity,
    nesting: originalMetrics.maxNestingDepth - refactoredMetrics.maxNestingDepth,
    length: originalMetrics.maxFunctionLOC - refactoredMetrics.maxFunctionLOC,
    duplicates: originalMetrics.duplicateLineCount - refactoredMetrics.duplicateLineCount,
  };

  if (delta.cyclomatic > 0) {
    suggestions.push(
      'Cyclomatic complexity decreased. Consider keeping using guard clauses and decomposing branching logic into helpers.'
    );
  } else {
    suggestions.push(
      'Cyclomatic complexity did not improve. Reduce branching by extracting functions, using early returns, or replacing nested if-else chains with lookup tables.'
    );
  }

  if (delta.nesting > 0) {
    suggestions.push(
      'Nesting depth decreased. Good use of early exits and splitting responsibilities into smaller functions.'
    );
  } else {
    suggestions.push(
      'Nesting depth is still high. Apply guard clauses, flatten conditionals, and move work into dedicated helper functions.'
    );
  }

  if (delta.length > 0) {
    suggestions.push(
      'Maximum function length decreased. That usually improves readability and testability. Keep extracting long blocks.'
    );
  } else {
    suggestions.push(
      'Long functions remain. Extract cohesive chunks into smaller functions to improve maintainability.'
    );
  }

  if (delta.duplicates > 0) {
    suggestions.push(
      'Duplicate patterns reduced. Deduplicate repeated logic into shared utilities to prevent future inconsistencies.'
    );
  } else {
    suggestions.push(
      'Possible duplication still exists. Look for repeated conditions/blocks and refactor them into reusable helpers.'
    );
  }

  // Extra educational message if LOC is wildly higher
  if (refactoredMetrics.loc > originalMetrics.loc * 1.25 && delta.cyclomatic <= 0) {
    suggestions.push(
      'Refactoring increased LOC substantially without reducing complexity. Prefer structural changes (extract/guard/dispatch) over adding comments or extra wrappers.'
    );
  }

  // Provide at least one suggestion always
  if (suggestions.length === 0) {
    suggestions.push(
      'Focus on reducing branching and nesting. Extract helpers and remove repeated code.'
    );
  }

  return suggestions.slice(0, 6);
}

export { analyzeCode, suggestImprovements };
