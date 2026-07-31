// backend/routes/routeGroups/feedbackRoutes.js
//
// Issue #2402 — feature-grouped route registration.
import { handleSubmitFeedback } from '../../handlers/feedbackHandlers.js';

export const feedbackRoutes = [
  {
    name: 'Feedback',
    routes: [
      {
        method: 'POST',
        path: '/api/feedback',
        handler: handleSubmitFeedback,
        tier: 'default',
        requiresAuth: true,
      },
    ],
  },
];

export default feedbackRoutes;
