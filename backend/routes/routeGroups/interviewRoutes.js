// backend/routes/routeGroups/interviewRoutes.js
//
// Issue #2402 — feature-grouped route registration.
import { handleSubmitInterviewExperience } from '../../handlers/interviewHandlers.js';

export const interviewRoutes = [
  {
    name: 'Interview',
    routes: [
      {
        method: 'POST',
        path: '/api/interview-experiences',
        handler: handleSubmitInterviewExperience,
        tier: 'default',
        requiresAuth: true,
      },
    ],
  },
];

export default interviewRoutes;
