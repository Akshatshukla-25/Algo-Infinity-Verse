import {
  findMissingSkills,
  detectTargetRole,
  mapSkillsToRoadmapTopics,
} from '../backend/resume-analyzer/skills.js';

describe('Resume Analyzer to Roadmap Generator Integration', () => {
  describe('backend/resume-analyzer/skills.js', () => {
    it('detects missing technical skills from resume text', () => {
      const resumeText = 'Experienced developer skilled in React, Node, and SQL.';
      const missing = findMissingSkills(resumeText);

      expect(missing).toContain('Graph Algorithms');
      expect(missing).toContain('Dynamic Programming');
      expect(missing).toContain('Trees');
      expect(missing).not.toContain('React');
      expect(missing).not.toContain('Node');
      expect(missing).not.toContain('SQL');
    });

    it('detects target role correctly', () => {
      const frontendResume = 'Passionate UI developer specializing in React and CSS.';
      const backendResume =
        'Backend Software Engineer working with Node.js, Express, microservices.';
      const genericResume = 'Computer Science graduate looking for opportunities.';

      expect(detectTargetRole(frontendResume)).toBe('Frontend Engineer');
      expect(detectTargetRole(backendResume)).toBe('Backend Engineer');
      expect(detectTargetRole(genericResume)).toBe('Software Engineer');
    });

    it('maps missing skills and target role to roadmap topics', () => {
      const missingSkills = ['Graph Algorithms', 'Dynamic Programming', 'Trees'];
      const topics = mapSkillsToRoadmapTopics(missingSkills, 'Backend Engineer');

      expect(topics).toContain('Graph Algorithms');
      expect(topics).toContain('Graph Essentials');
      expect(topics).toContain('Dynamic Programming Intro');
      expect(topics).toContain('Trees & Binary Trees');
    });
  });
});
