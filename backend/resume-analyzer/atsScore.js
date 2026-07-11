export function calculateATS(text) {
  const keywords = [
    'javascript',
    'python',
    'react',
    'node',
    'sql',
    'html',
    'css',
    'github',
    'machine learning',
  ];

  let score = 0;

  keywords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(text)) {
      score += 10;
    }
  });

  return Math.min(score, 100);
}
