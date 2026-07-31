export function findMissingSkills(text) {
  const allSkills = [
    'React',
    'Node',
    'SQL',
    'Git',
    'Python',
    'Graph Algorithms',
    'Dynamic Programming',
    'Trees',
    'Linked Lists',
    'Arrays',
    'Strings',
    'System Design',
    'Docker',
    'REST API',
  ];

  return allSkills.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return !regex.test(text || '');
  });
}

export function detectTargetRole(text, fallbackRole = 'Software Engineer') {
  if (!text || typeof text !== 'string') return fallbackRole;
  const lower = text.toLowerCase();

  if (lower.includes('frontend') || lower.includes('react') || lower.includes('ui developer')) {
    return 'Frontend Engineer';
  }
  if (
    lower.includes('backend') ||
    lower.includes('node') ||
    lower.includes('express') ||
    lower.includes('microservices')
  ) {
    return 'Backend Engineer';
  }
  if (
    lower.includes('fullstack') ||
    lower.includes('full stack') ||
    lower.includes('web developer')
  ) {
    return 'Full Stack Developer';
  }
  if (
    lower.includes('data engineer') ||
    lower.includes('machine learning') ||
    lower.includes('data scientist')
  ) {
    return 'Data / ML Engineer';
  }

  return fallbackRole;
}

export function mapSkillsToRoadmapTopics(missingSkills = [], targetRole = 'Software Engineer') {
  const topicsSet = new Set();

  (missingSkills || []).forEach((skill) => {
    const s = String(skill).toLowerCase();
    if (s.includes('graph')) {
      topicsSet.add('Graph Algorithms');
      topicsSet.add('Advanced Graph Algorithms');
      topicsSet.add('Graph Essentials');
    }
    if (s.includes('dynamic programming') || s.includes('dp')) {
      topicsSet.add('Dynamic Programming');
      topicsSet.add('Dynamic Programming Intro');
      topicsSet.add('Advanced Dynamic Programming');
    }
    if (s.includes('tree')) {
      topicsSet.add('Trees & Binary Trees');
      topicsSet.add('Tree Traversals');
      topicsSet.add('Trees');
    }
    if (s.includes('linked list')) {
      topicsSet.add('Linked Lists');
      topicsSet.add('Linked Lists Deep Dive');
    }
    if (s.includes('array')) {
      topicsSet.add('Arrays & Array Manipulation');
      topicsSet.add('Arrays & Strings');
      topicsSet.add('Advanced Arrays & Optimization');
      topicsSet.add('Arrays Fundamentals');
    }
    if (s.includes('string')) {
      topicsSet.add('Strings Mastery');
      topicsSet.add('Arrays & Strings');
    }
    if (
      s.includes('system design') ||
      s.includes('sql') ||
      s.includes('node') ||
      s.includes('docker')
    ) {
      topicsSet.add('System Design');
      topicsSet.add('Advanced Optimization & Interview Strategies');
    }
  });

  // Ensure high-priority topics based on target role if missing skills list is brief
  if (targetRole.includes('Backend') || targetRole.includes('Full Stack')) {
    topicsSet.add('Graph Algorithms');
    topicsSet.add('System Design');
  } else if (targetRole.includes('Frontend')) {
    topicsSet.add('Arrays & Strings');
    topicsSet.add('Trees & Binary Trees');
  }

  return Array.from(topicsSet);
}
