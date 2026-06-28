import crypto from "crypto";
import { initializeFirebase, getDb, COLLECTIONS } from "../../firebase.js";

initializeFirebase();
const db = getDb();
const useFirestore = !!db;

const SESSION_COOKIE = "aiv_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }
  return "dev-only-change-me-with-SESSION_SECRET-before-deploying";
}

function sign(v) {
  return crypto.createHmac("sha256", sessionSecret()).update(v).digest("base64url");
}

function b64u(i) {
  return Buffer.from(i).toString("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
}

function createSessionToken(u) {
  const h = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const p = b64u(JSON.stringify({
    sub: u.id, name: u.name, email: u.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  }));
  return `${h}.${p}.${sign(`${h}.${p}`)}`;
}

function sessionCookie(token) {
  const secure = process.env.VERCEL === "1";
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly", "SameSite=Lax", "Path=/",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

async function verifyGoogleIdToken(idToken) {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    console.error("[google-auth] FIREBASE_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("[google-auth] lookup HTTP error:", response.status, text);
      return null;
    }

    const data = await response.json();

    if (!data.users || data.users.length === 0) {
      console.error("[google-auth] no users in lookup response");
      return null;
    }

    const user = data.users[0];
    console.log("[google-auth] lookup success for:", user.email);
    return {
      uid: user.localId,
      email: user.email,
      name: user.displayName || user.email,
      picture: user.photoUrl || null,
      emailVerified: user.emailVerified === true,
    };
  } catch (err) {
    console.error("[google-auth] lookup exception:", err);
    return null;
  }
}

async function readUsers() {
  if (!useFirestore) return [];
  try {
    const snap = await db.collection("users").get();
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (e) { console.error(e); return []; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    if (!process.env.FIREBASE_PROJECT_ID) {
      return res.status(500).json({ error: "Firebase is not configured. Set FIREBASE_PROJECT_ID environment variable." });
    }

    let decoded;
    decoded = await verifyGoogleIdToken(idToken);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { uid, email, name, picture } = decoded;
    const cleanEmail = (email || "").toLowerCase().trim();
    const displayName = name || cleanEmail.split("@")[0] || "Learner";

    let user = null;
    const allUsers = await readUsers();
    user = allUsers.find(u => u.firebaseUid === uid) || allUsers.find(u => u.email === cleanEmail);

    if (user) {
      user.name = displayName;
      user.avatar = picture || user.avatar;
      user.lastLogin = new Date().toISOString();
      if (!user.firebaseUid) user.firebaseUid = uid;
      if (!user.authProvider) user.authProvider = "google";
      if (useFirestore) {
        await db.collection("users").doc(user.id).update({
          name: displayName,
          avatar: picture || null,
          lastLogin: new Date().toISOString(),
          firebaseUid: uid,
          authProvider: "google",
        });
      }
    } else {
      const newUser = {
        id: uid,
        name: displayName,
        email: cleanEmail,
        avatar: picture || null,
        firebaseUid: uid,
        authProvider: "google",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      if (useFirestore) {
        const docRef = await db.collection("users").add(newUser);
        newUser.id = docRef.id;
      }
      user = newUser;
    }

    const token = createSessionToken(user);
    const cookie = sessionCookie(token);

    return res.status(200)
      .setHeader("Set-Cookie", cookie)
      .json({
        authenticated: true,
        user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
      });

  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
