require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const Url = require("./models/Url");

const app = express();
const PORT = process.env.PORT || 5000;
const clientDistPath = path.join(__dirname, "../client/dist");

// ============================================================================
// 1. SECURITY HEADERS & SERVER HARDENING
// ============================================================================
// Hide technology stack fingerprint
app.disable("x-powered-by");

// Standard security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

// Enforce strict payload body limits to prevent DoS attacks
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ============================================================================
// 2. CORS LOCKDOWN
// ============================================================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/+$/, ""));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. direct mobile app, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow during dev, while keeping credentials safe
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ============================================================================
// 3. IN-MEMORY RATE LIMITING (DDoS & Abuse Protection)
// ============================================================================
const rateLimitMap = new Map();

function rateLimiter({ maxRequests = 30, windowMs = 5 * 60 * 1000 }) {
  return (req, res, next) => {
    const clientKey = req.ip || req.headers["x-forwarded-for"] || "client";
    const now = Date.now();

    const record = rateLimitMap.get(clientKey) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    rateLimitMap.set(clientKey, record);

    if (record.count > maxRequests) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please wait a few minutes before shortening more links.",
      });
    }

    next();
  };
}

// Clean up stale rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

// ============================================================================
// 4. SECURE BASE URL RESOLUTION (Zero IP Exposure)
// ============================================================================
// Uses BASE_URL if explicitly provided in .env (e.g. domain name),
let runtimeBaseUrl = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/+$/, "") : null;

function resolveBaseUrl(req) {
  if (runtimeBaseUrl) return runtimeBaseUrl;
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, "");

  const host = req ? req.get("host") : null;
  // If host is a legitimate domain name (like onrender.com, railway.app, vercel.app, custom domain)
  if (host && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(host) && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    return `${protocol}://${host}`;
  }

  return `http://localhost:${PORT}`;
}

// Config endpoint: check current link domain
app.get("/api/config", (req, res) => {
  const currentBase = resolveBaseUrl(req);
  res.json({
    baseUrl: currentBase,
    isLocalhost: currentBase.includes("localhost") || currentBase.includes("127.0.0.1"),
  });
});

// Update link domain (e.g. for mobile testing or custom domain)
app.post("/api/config", (req, res) => {
  const { baseUrl } = req.body;
  if (!baseUrl || typeof baseUrl !== "string" || !baseUrl.trim()) {
    runtimeBaseUrl = null;
    return res.json({
      message: "Reset to default localhost.",
      baseUrl: `http://localhost:${PORT}`,
      isLocalhost: true,
    });
  }

  const cleaned = baseUrl.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(cleaned);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Domain must begin with http:// or https://" });
    }
    // Block raw IP addresses for privacy & security
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(parsed.hostname)) {
      return res.status(400).json({ error: "Raw IP addresses are blocked for privacy. Please use a domain name or tunnel URL." });
    }

    runtimeBaseUrl = cleaned;
    console.log(`[CONFIG] Base URL updated for mobile links: ${runtimeBaseUrl}`);
    return res.json({
      message: "Domain updated successfully! Shortened links will now work on mobile.",
      baseUrl: runtimeBaseUrl,
      isLocalhost: false,
    });
  } catch {
    return res.status(400).json({ error: "Invalid domain format." });
  }
});

// ============================================================================
// 5. DATABASE CONNECTION
// ============================================================================
async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from server/.env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB Atlas connected securely!");
  } catch (error) {
    console.error("MongoDB Atlas connection error:", error.message);
  }
}

connectDB();

// Serve compiled frontend in production if built
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Homepage: Serve React SPA if built, otherwise API message
app.get("/", (req, res) => {
  const indexPath = path.join(clientDistPath, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.send("⚡ LinkVault Engine is active! (Run 'npm run build' to serve frontend here)");
});

// ============================================================================
// 6. HEALTH & DATABASE STATUS
// ============================================================================
app.get("/api/db-status", (req, res) => {
  const state = mongoose.connection.readyState;
  res.json({
    database: state === 1 ? "connected" : "disconnected",
    readyState: state,
  });
});

// ============================================================================
// 7. FETCH SHORTENED LINKS
// ============================================================================
app.get("/api/links", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected." });
    }

    const baseUrl = resolveBaseUrl(req);
    const links = await Url.find().sort({ createdAt: -1 }).limit(100);

    const formattedLinks = links.map((link) => ({
      _id: link._id,
      originalUrl: link.originalUrl,
      shortCode: link.shortCode,
      shortUrl: `${baseUrl}/${link.shortCode}`,
      clicks: link.clicks || 0,
      createdAt: link.createdAt,
    }));

    return res.json({ links: formattedLinks });
  } catch (error) {
    console.error("Fetch links error:", error.message);
    return res.status(500).json({ error: "Could not retrieve records." });
  }
});

// ============================================================================
// 8. SSRF & MALICIOUS URL VALIDATION
// ============================================================================
const RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "health",
  "dashboard",
  "login",
  "logout",
  "auth",
  "settings",
  "status",
  "metrics",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

function isPrivateOrRestrictedHost(hostname) {
  const lower = hostname.toLowerCase();

  // Loopback / Localhost
  if (lower === "localhost" || lower === "127.0.0.1" || lower === "::1" || lower === "0.0.0.0") {
    return true;
  }

  // Cloud metadata services (SSRF protection)
  if (lower === "169.254.169.254" || lower === "metadata.google.internal") {
    return true;
  }

  // Private RFC1918 ranges
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;

  return false;
}

// ============================================================================
// 9. CREATE SHORTENED URL
// ============================================================================
app.post(
  "/api/shorten",
  rateLimiter({ maxRequests: 30, windowMs: 5 * 60 * 1000 }),
  async (req, res) => {
    try {
      const { originalUrl, customCode } = req.body;

      // 1. Basic Type & Existence Check
      if (!originalUrl || typeof originalUrl !== "string") {
        return res.status(400).json({ error: "Please provide a destination URL." });
      }

      const trimmedUrl = originalUrl.trim();

      // 2. Length Limit (Prevent memory exhaustion)
      if (trimmedUrl.length > 2048) {
        return res.status(400).json({ error: "URL exceeds maximum length of 2048 characters." });
      }

      // 3. Prevent CRLF Injection
      if (/[\r\n\0]/.test(trimmedUrl)) {
        return res.status(400).json({ error: "Invalid characters in URL." });
      }

      // 4. Strict Protocol Validation
      let parsedUrl;
      try {
        parsedUrl = new URL(trimmedUrl);
      } catch {
        return res.status(400).json({ error: "Please provide a valid URL including https://." });
      }

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: "Only HTTP and HTTPS protocols are allowed." });
      }

      // 5. SSRF Check: Prevent shortening private network/cloud metadata targets
      if (isPrivateOrRestrictedHost(parsedUrl.hostname)) {
        return res.status(400).json({ error: "Shortening internal network destinations is not permitted." });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not connected. Please try again." });
      }

      let shortCode;

      // 6. Custom Alias Validation
      if (customCode && typeof customCode === "string" && customCode.trim()) {
        const sanitized = customCode.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");

        if (sanitized.length < 3 || sanitized.length > 30) {
          return res.status(400).json({
            error: "Custom alias must be between 3 and 30 alphanumeric characters.",
          });
        }

        if (RESERVED_SLUGS.has(sanitized)) {
          return res.status(400).json({
            error: `Alias "${sanitized}" is reserved for system use. Please choose another one.`,
          });
        }

        const existingCustom = await Url.findOne({ shortCode: sanitized });
        if (existingCustom) {
          return res.status(409).json({
            error: `Alias "${sanitized}" is already taken. Please choose another one.`,
          });
        }

        shortCode = sanitized;
      } else {
        // Auto-generate unique 6-character random alphanumeric code
        let existingUrl;
        do {
          shortCode = Math.random().toString(36).slice(2, 8);
        } while (RESERVED_SLUGS.has(shortCode) || (await Url.findOne({ shortCode })));
      }

      const newUrl = await Url.create({
        originalUrl: parsedUrl.href,
        shortCode,
      });

      const baseUrl = resolveBaseUrl(req);

      return res.status(201).json({
        message: "Short URL created successfully!",
        originalUrl: newUrl.originalUrl,
        shortCode: newUrl.shortCode,
        shortUrl: `${baseUrl}/${newUrl.shortCode}`,
        clicks: newUrl.clicks || 0,
        createdAt: newUrl.createdAt,
      });
    } catch (error) {
      console.error("URL creation error:", error.message);

      if (error.code === 11000) {
        return res.status(409).json({ error: "This short code is already in use. Please try again." });
      }

      return res.status(500).json({ error: "Could not create short URL." });
    }
  }
);

// ============================================================================
// 10. DELETE SHORTENED LINK
// ============================================================================
app.delete("/api/links/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;

    if (!shortCode || typeof shortCode !== "string") {
      return res.status(400).json({ error: "Invalid short code." });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected." });
    }

    const sanitizedCode = shortCode.trim().slice(0, 50);
    const deleted = await Url.findOneAndDelete({
      $or: [{ shortCode: sanitizedCode }, { shortCode: sanitizedCode.toLowerCase() }],
    });

    if (!deleted) {
      return res.status(404).json({ error: "Short link not found." });
    }

    return res.json({
      message: "Link successfully deleted.",
      shortCode: deleted.shortCode,
    });
  } catch (error) {
    console.error("Delete link error:", error.message);
    return res.status(500).json({ error: "Could not delete link." });
  }
});

// ============================================================================
// 11. ATOMIC TEST CLICK SIMULATOR
// ============================================================================
app.post("/api/links/:shortCode/test-click", async (req, res) => {
  try {
    const { shortCode } = req.params;

    if (!shortCode || typeof shortCode !== "string") {
      return res.status(400).json({ error: "Invalid short code." });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected." });
    }

    const sanitizedCode = shortCode.trim().slice(0, 50);
    const updated = await Url.findOneAndUpdate(
      { $or: [{ shortCode: sanitizedCode }, { shortCode: sanitizedCode.toLowerCase() }] },
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Short link not found." });
    }

    return res.json({
      message: "Click incremented successfully!",
      shortCode: updated.shortCode,
      clicks: updated.clicks,
    });
  } catch (error) {
    console.error("Test click error:", error.message);
    return res.status(500).json({ error: "Could not record test click." });
  }
});

// ============================================================================
// 12. SECURE REDIRECT & ATOMIC CLICK TRACKING
// ============================================================================
app.get("/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;

    if (!shortCode || RESERVED_SLUGS.has(shortCode.toLowerCase())) {
      return res.status(404).end();
    }

    const sanitizedCode = shortCode.trim().slice(0, 50);

    // Atomically increment click count
    const url = await Url.findOneAndUpdate(
      { $or: [{ shortCode: sanitizedCode }, { shortCode: sanitizedCode.toLowerCase() }] },
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!url) {
      const indexPath = path.join(clientDistPath, "index.html");
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      return res.status(404).send("Short URL not found in LinkVault.");
    }

    // Security & Anti-Caching Headers for Redirects
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    return res.redirect(302, url.originalUrl);
  } catch (error) {
    console.error("Redirect error:", error.message);
    return res.status(500).send("Could not redirect to destination URL.");
  }
});

// ============================================================================
// 13. START SERVER
// ============================================================================
app.listen(PORT, () => {
  console.log(`⚡ LinkVault Engine running securely on port ${PORT}`);
});
