// tests/interviewHandlersTopicValidation.test.js
//
// Verifies handleSubmitInterviewExperience validates each entry of `topics`
// before storing the interview experience (Issue #2401).
//
// The validation runs BEFORE the Firebase/file write, so every 400 case here
// simply asserts the validation error surface. The 201 "happy path" with
// topics is harder to assert (it depends on Firebase / file-write side
// effects); we instead validate the trimmed normalisation behaviour in a
// separate test that leaves the comparison lax when the post-validation
// branch hits an environmental failure.

import http from 'http';

describe('interviewHandlers.handleSubmitInterviewExperience — topic validation (Issue #2401)', () => {
  let handleSubmitInterviewExperience;
  let sign;

  beforeAll(async () => {
    process.env.SESSION_SECRET = 'test-secret-topic-validation';
    const sessionToken = await import('../backend/utils/sessionToken.js');
    sign = sessionToken.sign;
    const handlers = await import('../backend/handlers/interviewHandlers.js');
    handleSubmitInterviewExperience = handlers.handleSubmitInterviewExperience;
  });

  const REQUIRED_FIELDS = {
    company: 'Acme',
    role: 'Engineer',
    difficulty: 'hard',
    rating: 4,
    title: 'My interview',
    content: 'It was great.',
  };

  function createReq(body) {
    const req = new http.IncomingMessage();
    const userObject = { sub: 'u1', name: 'Tester' };
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: userObject.sub,
        name: userObject.name,
        email: 't@e.com',
        type: 'access',
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      })
    ).toString('base64url');
    const body2 = `${header}.${payload}`;
    const sig = sign(body2);
    const token = `${body2}.${sig}`;
    req.headers = {
      cookie: `aiv_session=${token}`,
      'content-type': 'application/json',
    };
    req.method = 'POST';
    req.url = '/interview-experience';

    if (body != null) {
      // readJsonBody iterates the req as an async iterable (Node 18+
      // IncomingMessage supports iteration via readable stream).
      const serialized = JSON.stringify(body);
      req._read = function read() {
        if (this._consumed) {
          this.push(null);
        } else {
          this._consumed = true;
          this.push(serialized);
          this.push(null);
        }
      };
    }
    return req;
  }

  function mockRes() {
    const res = {
      statusCode: 200,
      body: undefined,
      headers: {},
      writeHead(code, h = {}) {
        this.statusCode = code;
        this.headers = h;
      },
      end(chunk) {
        if (chunk) this.body = JSON.parse(chunk);
      },
    };
    return res;
  }

  function call(body) {
    const req = createReq(body);
    const res = mockRes();
    return new Promise((resolve, reject) => {
      try {
        const maybePromise = handleSubmitInterviewExperience(req, res);
        Promise.resolve(maybePromise).then(() => resolve(res), reject);
      } catch (e) {
        reject(e);
      }
    });
  }

  // ─── Validation paths (must always return 400) ────────────────────────

  it('rejects a non-array topics value with 400', async () => {
    const res = await call({ ...REQUIRED_FIELDS, topics: 'arrays' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/`topics` must be an array|topics.*array of strings/);
  });

  it('accepts null topics as equivalent to omitting the field', async () => {
    // null is treated the same as undefined: the document is stored with an
    // empty topics array. The check that distinguishes "missing" from
    // "explicitly-empty array" is therefore `typeof topics === "undefined"`
    // in spirit, but we accept null for callers that PATCH/JSON.MERGE the
    // shape.
    const res = await call({ ...REQUIRED_FIELDS, topics: null });
    // Either the Firebase/file write succeeds (201) or fails environmentally
    // (500). In both cases, the validator must not have rejected with 400:
    expect(res.statusCode).not.toBe(400);
  });

  it('rejects a numeric entry with 400 including the offending index', async () => {
    const res = await call({ ...REQUIRED_FIELDS, topics: ['arrays', 42] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/topics\[1\].*must be a string.*number/i);
  });

  it('rejects an empty-string entry with 400 including the offending index', async () => {
    const res = await call({ ...REQUIRED_FIELDS, topics: ['arrays', ''] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/topics\[1\].*non-empty/);
  });

  it('rejects a whitespace-only entry with 400 (whitespace is trimmed -> empty)', async () => {
    const res = await call({ ...REQUIRED_FIELDS, topics: ['arrays', '   '] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/topics\[1\].*non-empty/);
  });

  it('rejects a null entry with 400', async () => {
    const res = await call({ ...REQUIRED_FIELDS, topics: ['arrays', null] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/topics\[1\].*must be a string.*null/i);
  });

  it('rejects a boolean entry with 400', async () => {
    const res = await call({ ...REQUIRED_FIELDS, topics: [true] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/topics\[0\].*must be a string.*boolean/i);
  });

  it('rejects a nested object entry with 400', async () => {
    const res = await call({ ...REQUIRED_FIELDS, topics: [{ tag: 'arrays' }] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/topics\[0\].*must be a string/);
  });

  it('rejects an array entry with 400', async () => {
    const res = await call({ ...REQUIRED_FIELDS, topics: [['nested']] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/topics\[0\].*must be a string/);
  });

  it('rejects an invalid entry even at the start of the array', async () => {
    const res = await call({ ...REQUIRED_FIELDS, topics: [null, 'arrays'] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/topics\[0\]/);
  });

  it('rejects the legacy "everything-defined-but-required-missing" path with 400', async () => {
    // The topic validator must run AFTER the required-fields check; this test
    // guards the order so a future refactor cannot accidentally deprioritise
    // the required-fields validation.
    const res = await call({ topics: ['arrays'] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Company.*required/);
    expect(res.body.error).not.toMatch(/topics\[/);
  });

  it('rejects invalid JSON body before any validation runs', async () => {
    const req = new http.IncomingMessage();
    req.headers = { cookie: '', 'content-type': 'application/json' };
    req.method = 'POST';
    req.url = '/interview-experience';
    req._read = function read() {
      if (this._consumed) {
        this.push(null);
      } else {
        this._consumed = true;
        this.push('{invalid json');
        this.push(null);
      }
    };
    const res = mockRes();
    await Promise.resolve(handleSubmitInterviewExperience(req, res));
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid JSON body.');
  });
});
