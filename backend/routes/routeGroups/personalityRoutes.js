// backend/routes/routeGroups/personalityRoutes.js
//
// Issue #2402 — feature-grouped route registration.
import { handleUserPersonality } from '../../handlers/personalityHandlers.js';

export const personalityRoutes = [
  {
    name: 'Personality',
    routes: [
      {
        method: 'GET',
        path: '/api/user/personality',
        handler: handleUserPersonality,
        tier: 'default',
        requiresAuth: true,
      },
    ],
  },
];

export default personalityRoutes;
