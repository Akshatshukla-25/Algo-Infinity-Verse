// backend/routes/routeGroups/authenticationRoutes.js
//
// Issue #2402 — feature-grouped route registration.
//
// All authentication-related endpoints (the "Authentication" feature
// group) live here. Each entry is a plain route descriptor consumed by
// `setupApiRoutes` in `../apiRoutes.js`:
//
//   {
//     method,         // 'GET' | 'POST' | 'PUT' | 'DELETE'
//     path,           // exact path string, e.g. '/api/login'
//     handler,        // async (req, res) => void
//     tier,           // 'default' | 'memory' | 'critical'
//     requiresAuth,   // boolean
//   }
//
// Keeping this as data (not control flow) means new routes can be added
// without touching `setupApiRoutes`, and `applySecurityHeaders` /
// `wrapHandler` see one uniform shape per route.
import {
  handleGuestLogin,
  handleSignup,
  handleLogin,
  handleLogout,
  handleDeactivateAccount,
  handleSession,
} from '../../handlers/authHandlers.js';

export const authenticationRoutes = [
  {
    name: 'Authentication',
    routes: [
      {
        method: 'POST',
        path: '/api/guest',
        handler: handleGuestLogin,
        tier: 'default',
        requiresAuth: false,
      },
      {
        method: 'GET',
        path: '/api/session',
        handler: handleSession,
        tier: 'default',
        requiresAuth: false,
      },
      {
        method: 'POST',
        path: '/api/signup',
        handler: handleSignup,
        tier: 'default',
        requiresAuth: false,
      },
      {
        method: 'POST',
        path: '/api/login',
        handler: handleLogin,
        tier: 'default',
        requiresAuth: false,
      },
      {
        method: 'POST',
        path: '/api/deactivate-account',
        handler: handleDeactivateAccount,
        tier: 'critical',
        requiresAuth: true,
      },
      {
        method: 'POST',
        path: '/api/logout',
        handler: handleLogout,
        tier: 'default',
        requiresAuth: true,
      },
    ],
  },
];

export default authenticationRoutes;
