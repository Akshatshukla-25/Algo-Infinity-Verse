import { analyzeCode, suggestImprovements } from '../refactoring-dojo/refactoringAnalyzer.js';
import { runUserCode } from '../jsSandboxRunner.js';

const DEFAULT_TESTS = [
  // These tests assume the user provides a function named solve(input)
  // returning JSON-serializable output.
  { name: 't1', input: [[1, 2, 3]], expectedOutput: [3, 2, 1] },
  { name: 't2', input: [['x', 'y']], expectedOutput: ['y', 'x'] },
  { name: 't3', input: [[0]], expectedOutput: [0] },
];

function getScore({ passedCount, totalTests, originalMetrics, refactoredMetrics }) {
  const passScore = totalTests === 0 ? 0 : Math.round((passedCount / totalTests) * 60);
  const complexityDelta =
    originalMetrics.cyclomaticComplexity - refactoredMetrics.cyclomaticComplexity;
  const nestingDelta = originalMetrics.maxNestingDepth - refactoredMetrics.maxNestingDepth;
  const lengthDelta = originalMetrics.maxFunctionLOC - refactoredMetrics.maxFunctionLOC;
  const dupDelta = originalMetrics.duplicateLineCount - refactoredMetrics.duplicateLineCount;

  const eduScore =
    (totalTests === 0 ? 0 : passedCount / totalTests) *
    (Math.max(0, complexityDelta) * 0.9 +
      Math.max(0, nestingDelta) * 2.5 +
      Math.max(0, lengthDelta) * 0.25 +
      Math.max(0, dupDelta) * 1.2);

  const score = Math.round(Math.max(0, Math.min(100, passScore + eduScore)));
  return score;
}

export async function handleRefactoringDojoSubmit(req, res) {
  // Auth is handled by the outer router wrapper.
  try {
    const payload = req.body || {};
    const { originalCode, refactoredCode, tests } = payload;

    if (typeof originalCode !== 'string' || !originalCode.trim()) {
      return res.status(400).json({ error: 'originalCode must be a non-empty string.' });
    }
    if (typeof refactoredCode !== 'string' || !refactoredCode.trim()) {
      return res.status(400).json({ error: 'refactoredCode must be a non-empty string.' });
    }

    // Run behavior checks on refactoredCode
    const normalizedTests = Array.isArray(tests) && tests.length ? tests : DEFAULT_TESTS;

    const sandbox = await runUserCode({
      language: 'javascript',
      sourceCode: refactoredCode,
      tests: normalizedTests,
      timeoutMs: 2000,
      maxOutputChars: 20000,
      showMySteps: false,
    });

    if (!sandbox?.ok) {
      return res.status(400).json({ error: sandbox?.error || 'Code execution failed.' });
    }

    const passedCount = sandbox.results.filter((t) => t.passed).length;
    const totalTests = sandbox.results.length;

    // Analyze complexity/maintainability metrics
    const originalMetrics = analyzeCode(originalCode);
    const refactoredMetrics = analyzeCode(refactoredCode);

    const suggestions = suggestImprovements(
      originalMetrics,
      refactoredMetrics,
      originalCode,
      refactoredCode
    );

    const score = getScore({
      passedCount,
      totalTests,
      originalMetrics,
      refactoredMetrics,
    });

    const response = {
      success: true,
      score,
      passed: passedCount,
      total: totalTests,
      tests: sandbox.results.map((t) => ({
        name: t.testName,
        pass: t.passed,
        expected: t.expectedOutput,
        actual: t.actualOutput,
        runtimeError: t.runtimeError,
        durationMs: t.durationMs,
      })),
      metrics: {
        original: originalMetrics,
        refactored: refactoredMetrics,
      },
      improvementStats: {
        cyclomaticDelta:
          originalMetrics.cyclomaticComplexity - refactoredMetrics.cyclomaticComplexity,
        nestingDepthDelta: originalMetrics.maxNestingDepth - refactoredMetrics.maxNestingDepth,
        maxFunctionLOCDelta: originalMetrics.maxFunctionLOC - refactoredMetrics.maxFunctionLOC,
        duplicateLineDelta:
          originalMetrics.duplicateLineCount - refactoredMetrics.duplicateLineCount,
      },
      suggestions,
    };

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Submission failed.' });
  }
}
