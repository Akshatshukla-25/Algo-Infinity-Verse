import express from 'express';
import {
  getCsrfToken,
  logError,
  executeCode,
  executeTracedCode,
} from '../controllers/apiController.js';
import { explainCode } from '../services/codeExplainer.service.js';

import sqlSimulatorRouter from './sqlSimulator.js';
import streaksHandler from '../../api/streaks.js';
import goalsHandler from '../../api/goals.js';
import cheatSheetHandler from '../../api/cheat-sheet.js';

const router = express.Router();

router.get('/csrf-token', getCsrfToken);
router.post('/log-error', logError);
router.post('/execute', executeCode);
router.post('/execute/traced', executeTracedCode);
router.post('/explain-code', async (req, res) => {
  try {
    const { code, language } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'code is required and must be a string' });
    }
    const result = await explainCode({ code, language });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.use('/sql', sqlSimulatorRouter);
router.all('/streaks', (req, res) => streaksHandler(req, res));
router.all('/goals', (req, res) => goalsHandler(req, res));
router.all('/cheat-sheet', (req, res) => cheatSheetHandler(req, res));

// ── API Playground Proxy ────────────────────────────────────────────────
// Forwards requests to external APIs so the client-side API Playground can
// avoid CORS restrictions. Supports GET, POST, PUT, PATCH, DELETE, HEAD.
// In production, consider adding allowlist/denylist logic to avoid SSRF.
router.post('/proxy/request', async (req, res) => {
  try {
    const { method, url, headers, body } = req.body || {};

    // Validate method
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];
    if (!method || !allowedMethods.includes(method.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid or missing HTTP method.' });
    }

    // Validate URL
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required.' });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (_) {
      return res.status(400).json({ error: 'Invalid URL format.' });
    }

    // Block requests to internal/private IP ranges (SSRF protection)
    const hostname = parsedUrl.hostname.toLowerCase();

    // Resolve the hostname to check if it points to a private/internal IP
    let resolvedAddresses = null;
    try {
      const { lookup } = await import('dns/promises');
      const addresses = await lookup(hostname, { all: true });
      resolvedAddresses = addresses.map(function (a) { return a.address; }).filter(Boolean);
    } catch (_lookupErr) {
      // DNS resolution failed — still check against known private patterns
    }

    function isPrivateIP(ip) {
      if (!ip || typeof ip !== 'string') return false;
      // Remove IPv6 mapping prefix if present
      ip = ip.replace(/^::ffff:/, '');

      // IPv4 private ranges
      const parts = ip.split('.');
      if (parts.length === 4) {
        const first = parseInt(parts[0], 10);
        const second = parseInt(parts[1], 10);
        if (first === 10) return true;                                    // 10.0.0.0/8
        if (first === 127) return true;                                   // 127.0.0.0/8 (loopback)
        if (first === 169 && second === 254) return true;                 // 169.254.0.0/16 (link-local)
        if (first === 172 && second >= 16 && second <= 31) return true;   // 172.16.0.0/12
        if (first === 192 && second === 168) return true;                 // 192.168.0.0/16
        if (first === 0) return true;                                     // 0.0.0.0/8
        if (first === 100 && second >= 64 && second <= 127) return true;  // 100.64.0.0/10 (CGNAT)
        if (first === 198 && second === 18) return true;                  // 198.18.0.0/15 (benchmarking)
      }

      // IPv6 private/loopback
      if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;
      if (ip.startsWith('fd') || ip.startsWith('fc')) return true;       // Unique local address
      if (ip.startsWith('fe80')) return true;                            // Link-local

      return false;
    }

    // Check resolved IPs first (catches DNS rebinding / nip.io style attacks)
    if (resolvedAddresses && resolvedAddresses.length > 0) {
      for (const addr of resolvedAddresses) {
        if (isPrivateIP(addr)) {
          return res.status(400).json({ error: 'Requests to private/internal networks are not allowed (resolved IP: ' + addr + ').' });
        }
      }
    }

    // Also check the hostname string itself for obvious patterns
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return res.status(400).json({ error: 'Requests to private/internal networks are not allowed.' });
    }

    // Validate protocol — restrict to http/https
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ error: 'Only http:// and https:// URLs are supported.' });
    }

    // Build fetch options
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: {},
      redirect: 'follow',
      follow: 5,
    };

    // Forward user-agent and content-type from the client headers
    if (headers && typeof headers === 'object') {
      const allowedHeaders = ['content-type', 'authorization', 'accept', 'accept-language', 'x-api-key', 'if-none-match', 'cache-control'];
      for (const [key, value] of Object.entries(headers)) {
        const lowerKey = key.toLowerCase();
        // Skip headers that could cause issues
        if (['host', 'origin', 'referer'].includes(lowerKey)) continue;
        if (allowedHeaders.includes(lowerKey) || lowerKey.startsWith('x-')) {
          fetchOptions.headers[key] = String(value);
        }
      }
    }

    // Set a reasonable timeout (30 seconds)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      // Add body for applicable methods
      if (body !== undefined && body !== null && !['GET', 'HEAD'].includes(method.toUpperCase())) {
        fetchOptions.body = JSON.stringify(body);
        if (!fetchOptions.headers['Content-Type']) {
          fetchOptions.headers['Content-Type'] = 'application/json';
        }
      }

      const startTime = performance.now();
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      const elapsed = Math.round(performance.now() - startTime);

      // Read response body
      const responseBody = await response.text();

      // Get response headers
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Try to parse as JSON
      let bodyParsed = null;
      let isJson = false;
      if (responseBody.length > 0) {
        try {
          bodyParsed = JSON.parse(responseBody);
          isJson = true;
        } catch (_) {
          bodyParsed = responseBody;
        }
      }

      return res.json({
        status: response.status,
        statusText: response.status + ' ' + response.statusText,
        headers: responseHeaders,
        body: bodyParsed,
        bodyRaw: responseBody,
        isJson: isJson,
        size: responseBody.length,
        time: elapsed,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out after 30 seconds.' });
    }
    console.error('[proxy/request] Error:', err.message);
    return res.status(502).json({ error: 'Failed to proxy request: ' + err.message });
  }
});

export default router;
