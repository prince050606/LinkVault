import { useState, useEffect, useMemo, useRef } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && !window.location.origin.includes(":5173")
    ? window.location.origin
    : "http://localhost:5000");

const QUICK_TEST_URLS = [
  { label: "GitHub", url: "https://github.com" },
  { label: "React Docs", url: "https://react.dev" },
  { label: "Hacker News", url: "https://news.ycombinator.com" },
  { label: "OpenAI", url: "https://openai.com" },
  { label: "NPM Registry", url: "https://www.npmjs.com" },
];

const FAQ_ITEMS = [
  {
    question: "Do LinkVault shortened links ever expire?",
    answer:
      "No. All shortened URLs are stored permanently in your MongoDB Atlas database and will continue to redirect indefinitely without any expiration dates or hidden paywalls.",
  },
  {
    question: "How does real-time click tracking work?",
    answer:
      "Every time a visitor opens your shortened link (e.g., localhost:5000/xyz), our backend atomically increments the click counter in MongoDB using atomic $inc operations before instantaneously redirecting to the destination URL.",
  },
  {
    question: "Can I simulate or test click tracking before sharing?",
    answer:
      "Yes! Click the '⚡ Test Hit (+1)' button on any link in your vault records. Our backend will atomically register a test hit and update your live telemetry without opening extra browser tabs.",
  },
  {
    question: "Can I delete or export my shortened links?",
    answer:
      "Yes! In the Vault Telemetry section below, you can filter, sort, permanently delete any link with the 🗑️ button (with safety confirmation), or export your entire record database to CSV or JSON with a single click.",
  },
  {
    question: "Is LinkVault safe and protected against invalid URLs?",
    answer:
      "Yes. LinkVault enforces strict URL protocol validation (HTTP/HTTPS only) and provides automatic domain extraction and sanitation before any link is registered in MongoDB.",
  },
];

const PLATFORM_FEATURES = [
  {
    icon: "⚡",
    title: "Sub-Millisecond Redirects",
    desc: "Lightweight Express routing engine engineered to resolve redirects with near-zero latency.",
    tag: "HIGH SPEED",
  },
  {
    icon: "🔒",
    title: "Permanent & Secure",
    desc: "Links never expire. Protected by protocol sanitation and HTTPS verification.",
    tag: "RELIABILITY",
  },
  {
    icon: "📊",
    title: "Atomic Click Telemetry",
    desc: "Race-condition-free click tracking that updates MongoDB in real time with every visitor.",
    tag: "ACCURACY",
  },
  {
    icon: "📥",
    title: "Instant Data Portability",
    desc: "Export all your shortened routes and engagement analytics to CSV or JSON with 1 click.",
    tag: "PORTABLE",
  },
];

function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [lastOriginalUrl, setLastOriginalUrl] = useState("");
  const [lastShortCode, setLastShortCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [links, setLinks] = useState([]);
  const [copiedKey, setCopiedKey] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [activeFilterTab, setActiveFilterTab] = useState("all");
  const [dbStatus, setDbStatus] = useState({ state: "checking", latency: null });
  const [deletingCode, setDeletingCode] = useState(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testingClickCode, setTestingClickCode] = useState(null);
  const [highlightCode, setHighlightCode] = useState(null);

  // Mobile & Public Link Domain Configuration
  const [domainConfig, setDomainConfig] = useState({
    baseUrl: "http://localhost:5000",
    isLocalhost: true,
  });
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [savingDomain, setSavingDomain] = useState(false);

  const inputRef = useRef(null);

  // Fetch current link domain configuration
  async function fetchConfig() {
    try {
      const res = await fetch(`${API_URL}/api/config`);
      if (res.ok) {
        const data = await res.json();
        setDomainConfig(data);
      }
    } catch {
      // Offline fallback
    }
  }

  // Update link domain for mobile and external sharing
  async function handleSaveDomain(newDomain) {
    playCyberChime("click");
    setSavingDomain(true);
    try {
      const res = await fetch(`${API_URL}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: newDomain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update domain");
      setDomainConfig({ baseUrl: data.baseUrl, isLocalhost: data.isLocalhost });
      setShowDomainModal(false);
      playCyberChime("success");
      showToast(data.message || "Domain updated!", "success");
      fetchLinks(true);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSavingDomain(false);
    }
  }

  // Synthesized Cyber Web Audio FX (Zero External Files)
  function playCyberChime(type = "click") {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "success") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.14); // G5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "hit") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "delete") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.09);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.start(now);
        osc.stop(now + 0.11);
      }
    } catch {
      // AudioContext muted or blocked
    }
  }

  // Auto-dismissing Toast Notification
  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }

  // Check Database connection & latency
  async function checkDbStatus() {
    playCyberChime("click");
    const start = performance.now();
    try {
      const res = await fetch(`${API_URL}/api/db-status`);
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        setDbStatus({
          state: data.database === "connected" ? "connected" : "disconnected",
          latency: elapsed,
        });
      } else {
        setDbStatus({ state: "disconnected", latency: null });
      }
    } catch {
      setDbStatus({ state: "disconnected", latency: null });
    }
  }

  // Fetch saved links from MongoDB
  async function fetchLinks(quiet = false) {
    if (!quiet) {
      playCyberChime("click");
      setRefreshing(true);
    }
    try {
      const res = await fetch(`${API_URL}/api/links`);
      if (res.ok) {
        const data = await res.json();
        if (data.links && Array.isArray(data.links)) {
          setLinks(data.links);
        }
      }
    } catch (err) {
      console.error("Failed to load links:", err);
    } finally {
      if (!quiet) setRefreshing(false);
    }
  }

  // Handle visiting link with immediate optimistic increment and background MongoDB sync
  function handleVisitLink(shortCode) {
    if (!shortCode) return;
    playCyberChime("hit");

    // 1. Immediately increment clicks in local UI so user sees the counter rise instantly
    setLinks((prev) =>
      prev.map((l) =>
        l.shortCode === shortCode ? { ...l, clicks: (l.clicks || 0) + 1 } : l
      )
    );

    // 2. Trigger glowing pulse on the card
    setHighlightCode(shortCode);
    setTimeout(() => setHighlightCode(null), 1800);

    // 3. Re-sync with MongoDB Atlas in 1.2s to pull the authoritative server count
    setTimeout(() => fetchLinks(true), 1200);
  }

  useEffect(() => {
    checkDbStatus();
    fetchLinks(true);
    fetchConfig();

    // Real-time live polling: automatically refresh link click telemetry every 3.5 seconds
    const liveSyncInterval = setInterval(() => {
      fetchLinks(true);
    }, 3500);

    const dbInterval = setInterval(checkDbStatus, 25000);

    // Re-fetch authoritative clicks the moment user switches back to this tab
    const handleWindowFocus = () => {
      fetchLinks(true);
      checkDbStatus();
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      clearInterval(liveSyncInterval);
      clearInterval(dbInterval);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  // Quick Paste from Clipboard
  async function handlePaste() {
    playCyberChime("click");
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        showToast("Destination URL pasted from clipboard!", "info");
      }
    } catch {
      showToast("Unable to read clipboard automatically. Please paste manually.", "error");
    }
  }

  // Shorten URL Handler
  async function handleShorten(event) {
    if (event) event.preventDefault();
    const originalUrl = url.trim();

    if (!originalUrl) {
      setError("Please provide a destination URL.");
      playCyberChime("delete");
      return;
    }

    try {
      new URL(originalUrl);
    } catch {
      setError("Please provide a valid URL including http:// or https://");
      playCyberChime("delete");
      return;
    }

    setLoading(true);
    setError("");
    playCyberChime("click");

    try {
      const response = await fetch(`${API_URL}/api/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "URL shortening failed.");
      }

      setShortUrl(data.shortUrl);
      setLastOriginalUrl(data.originalUrl);
      setLastShortCode(data.shortCode);

      setLinks((prev) => [
        {
          originalUrl: data.originalUrl,
          shortUrl: data.shortUrl,
          shortCode: data.shortCode,
          clicks: data.clicks || 0,
          createdAt: data.createdAt || new Date().toISOString(),
        },
        ...prev.filter((l) => l.shortCode !== data.shortCode),
      ]);

      setUrl("");
      playCyberChime("success");
      showToast("Short link synthesized & saved to MongoDB Atlas! ⚡", "success");
    } catch (err) {
      setError(err.message || "Could not connect to backend server.");
      playCyberChime("delete");
      showToast(err.message || "Shortening failed", "error");
    } finally {
      setLoading(false);
    }
  }

  // Trigger Custom Modal for Delete
  function requestDelete(link) {
    playCyberChime("click");
    setConfirmDeleteTarget(link);
  }

  // Execute Confirmed Delete
  async function executeConfirmedDelete() {
    if (!confirmDeleteTarget) return;
    const { shortCode } = confirmDeleteTarget;

    setDeletingCode(shortCode);
    playCyberChime("delete");

    try {
      const response = await fetch(`${API_URL}/api/links/${shortCode}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete link.");
      }

      setLinks((prev) => prev.filter((l) => l.shortCode !== shortCode));
      if (lastShortCode === shortCode) {
        setShortUrl("");
      }
      showToast(`Link /${shortCode} permanently removed from MongoDB!`, "info");
    } catch (err) {
      showToast(err.message || "Failed to delete link", "error");
    } finally {
      setDeletingCode(null);
      setConfirmDeleteTarget(null);
    }
  }

  // Copy to Clipboard (Generic)
  async function handleCopy(text, key, customMsg = "Copied to clipboard! 📋") {
    playCyberChime("click");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key || text);
      playCyberChime("success");
      showToast(customMsg, "success");
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      showToast("Failed to copy automatically", "error");
    }
  }

  // Copy as Markdown [Title](URL)
  function handleCopyMarkdown(link) {
    const md = `[LinkVault /${link.shortCode}](${link.shortUrl})`;
    handleCopy(md, `md-${link.shortCode}`, "Copied as Markdown [Title](URL)! 📄");
  }

  // Simulate/Test Click counter live
  async function handleTestClick(shortCode) {
    playCyberChime("hit");
    setTestingClickCode(shortCode);
    setHighlightCode(shortCode);

    try {
      const res = await fetch(`${API_URL}/api/links/${shortCode}/test-click`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setLinks((prev) =>
          prev.map((l) =>
            l.shortCode === shortCode ? { ...l, clicks: data.clicks } : l
          )
        );
        showToast(`Hit recorded! Clicks for /${shortCode} now at ${data.clicks} 🔥`, "success");
      } else {
        // Fallback: simulate locally
        setLinks((prev) =>
          prev.map((l) =>
            l.shortCode === shortCode ? { ...l, clicks: (l.clicks || 0) + 1 } : l
          )
        );
        showToast(`Test hit registered for /${shortCode}! 🔥`, "success");
      }
    } catch {
      // Offline fallback
      setLinks((prev) =>
        prev.map((l) =>
          l.shortCode === shortCode ? { ...l, clicks: (l.clicks || 0) + 1 } : l
        )
      );
      showToast(`Test hit added to link /${shortCode}! 🔥`, "info");
    } finally {
      setTestingClickCode(null);
      setTimeout(() => setHighlightCode(null), 1500);
    }
  }

  // Share on X (Twitter)
  function handleShareTwitter(shortUrlText) {
    playCyberChime("click");
    const tweetText = encodeURIComponent(`Shortened with LinkVault: ${shortUrlText}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank", "width=600,height=400");
  }

  // Share on WhatsApp
  function handleShareWhatsApp(shortUrlText) {
    playCyberChime("click");
    const msg = encodeURIComponent(`Check this out: ${shortUrlText}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank");
  }

  // Export Data to CSV or JSON
  function handleExport(format = "json") {
    playCyberChime("click");
    if (links.length === 0) {
      showToast("No links to export!", "error");
      return;
    }

    let fileContent = "";
    let mimeType = "";
    let filename = `linkvault-export-${new Date().toISOString().slice(0, 10)}`;

    if (format === "json") {
      fileContent = JSON.stringify(links, null, 2);
      mimeType = "application/json";
      filename += ".json";
    } else {
      const headers = ["Short Code", "Short URL", "Original URL", "Clicks", "Created At"];
      const rows = links.map((l) => [
        `"${l.shortCode}"`,
        `"${l.shortUrl}"`,
        `"${l.originalUrl.replace(/"/g, '""')}"`,
        l.clicks || 0,
        `"${l.createdAt || ""}"`,
      ]);
      fileContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      mimeType = "text/csv;charset=utf-8;";
      filename += ".csv";
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const downloadUrl = URL.createObjectURL(blob);
    const linkEl = document.createElement("a");
    linkEl.href = downloadUrl;
    linkEl.download = filename;
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);
    URL.revokeObjectURL(downloadUrl);

    playCyberChime("success");
    showToast(`Vault data exported as ${format.toUpperCase()}! 📥`, "success");
  }

  // Destination Domain Preview
  const previewDomain = useMemo(() => {
    if (!url) return null;
    try {
      const parsed = new URL(url.trim());
      return parsed.hostname;
    } catch {
      return null;
    }
  }, [url]);

  // Filtered & Sorted Links
  const filteredLinks = useMemo(() => {
    let result = [...links];

    // Filter Tabs
    if (activeFilterTab === "active") {
      result = result.filter((l) => (l.clicks || 0) > 0);
    } else if (activeFilterTab === "zero") {
      result = result.filter((l) => !l.clicks || l.clicks === 0);
    } else if (activeFilterTab === "today") {
      const todayStr = new Date().toISOString().slice(0, 10);
      result = result.filter((l) => l.createdAt && l.createdAt.startsWith(todayStr));
    }

    // Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.shortCode?.toLowerCase().includes(q) ||
          l.originalUrl?.toLowerCase().includes(q) ||
          l.shortUrl?.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === "clicks") {
      result.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [links, searchQuery, sortBy, activeFilterTab]);

  // Statistics
  const totalClicks = useMemo(
    () => links.reduce((sum, link) => sum + (link.clicks || 0), 0),
    [links]
  );

  const activeLinksCount = useMemo(
    () => links.filter((l) => (l.clicks || 0) > 0).length,
    [links]
  );

  const averageClicks = useMemo(
    () => (links.length > 0 ? (totalClicks / links.length).toFixed(1) : "0"),
    [links, totalClicks]
  );

  // Helper to extract clean domain
  function getCleanDomain(urlString) {
    try {
      const u = new URL(urlString);
      return u.hostname;
    } catch {
      return "link";
    }
  }

  // Format Date Nicely
  function formatDate(isoString) {
    if (!isoString) return "Recently";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  }

  return (
    <div className="app-wrapper">
      {/* Subtle Ambient Background */}
      <div className="ambient-background">
        <div className="ambient-gradient-top" />
        <div className="ambient-grid" />
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`app-toast toast-${toast.type}`}>
          <span className="toast-indicator" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteTarget && (
        <div className="modal-backdrop" onClick={() => setConfirmDeleteTarget(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap">⚠️</div>
            <h3 className="modal-title">Delete Link Permanently?</h3>
            <p className="modal-desc">
              You are about to delete <code className="modal-code-tag">/{confirmDeleteTarget.shortCode}</code>.
              This will permanently purge it from MongoDB Atlas. Visitors navigating to this link will receive a 404 error.
            </p>
            <div className="modal-dest-box">
              {confirmDeleteTarget.originalUrl}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmDeleteTarget(null)}
              >
                Keep Link
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={executeConfirmedDelete}
                disabled={deletingCode === confirmDeleteTarget.shortCode}
              >
                {deletingCode === confirmDeleteTarget.shortCode ? "Purging..." : "Delete From Database"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="navbar">
        <div className="nav-container">
          <div className="brand-group">
            <div className="brand-logo-icon">🔗</div>
            <span className="brand-name">LinkVault</span>
            <span className="brand-badge">LIVE</span>
          </div>

          <div className="nav-actions">
            <button
              type="button"
              className="nav-sound-btn"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playCyberChime("click");
              }}
              title="Toggle audio feedback"
            >
              <span>{soundEnabled ? "Audio On" : "Audio Muted"}</span>
            </button>

            <a href="#vault" className="nav-vault-link">
              <span>Vault Records</span>
              <span className="vault-count-badge">{links.length}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="pill-kicker">
            <span className="pill-kicker-dot" />
            <span>Modern Link Infrastructure</span>
          </div>

          <h1 className="hero-heading">
            Shorten links with <br />
            <span className="hero-heading-highlight">complete visibility.</span>
          </h1>

          <p className="hero-subtext">
            Transform long, messy URLs into clean, reliable short links. Track real-time visitor engagement with atomic MongoDB click telemetry.
          </p>

          {/* Quick-test URL chips */}
          <div className="quick-chips-bar">
            <span className="quick-label">Quick fill:</span>
            {QUICK_TEST_URLS.map((item) => (
              <button
                key={item.label}
                type="button"
                className="quick-chip"
                onClick={() => {
                  playCyberChime("click");
                  setUrl(item.url);
                  if (inputRef.current) inputRef.current.focus();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* Central Shortener Card */}
        <section id="shortener" className="shortener-container">
          <div className="shortener-card">
            <form onSubmit={handleShorten}>
              <div className="shortener-form-header">
                <label htmlFor="url-input" className="form-label">
                  <span>Destination URL</span>
                  {previewDomain && (
                    <span className="detected-domain-tag">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${previewDomain}&sz=32`}
                        alt=""
                        className="domain-favicon-sm"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span>Verified: {previewDomain}</span>
                    </span>
                  )}
                </label>
                {url && (
                  <span className="char-counter">{url.trim().length} chars</span>
                )}
              </div>

              {/* Main Input Box */}
              <div className="input-action-row">
                <span className="input-leading-icon">🔗</span>

                <input
                  ref={inputRef}
                  id="url-input"
                  type="url"
                  className="url-input-field"
                  placeholder="https://example.com/very/long/destination/url/with/parameters"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  autoComplete="off"
                  required
                />

                {url ? (
                  <button
                    type="button"
                    className="input-clear-btn"
                    onClick={() => {
                      playCyberChime("click");
                      setUrl("");
                    }}
                    title="Clear input"
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    type="button"
                    className="input-paste-btn"
                    onClick={handlePaste}
                    title="Paste clipboard"
                  >
                    Paste
                  </button>
                )}

                <button
                  type="submit"
                  className="submit-shorten-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-sm" />
                      <span>Shortening...</span>
                    </>
                  ) : (
                    <span>Shorten URL</span>
                  )}
                </button>
              </div>

              {/* Real-time URL reduction metrics */}
              {url.trim().length > 25 && (
                <div className="reduction-bar-row">
                  <span className="reduction-stat">
                    Original: <strong>{url.trim().length} chars</strong> &rarr; Shortened: <strong>~26 chars</strong>
                    <span className="reduction-saved-badge">
                      (-{Math.max(5, Math.round(((url.trim().length - 26) / url.trim().length) * 100))}%)
                    </span>
                  </span>
                  <div className="reduction-track">
                    <div
                      className="reduction-fill"
                      style={{
                        width: `${Math.min(100, Math.max(5, Math.round(((url.trim().length - 26) / url.trim().length) * 100)))}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </form>

            {error && (
              <div className="error-banner">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success Reveal Showcase */}
            {shortUrl && (
              <div className="result-showcase">
                <div className="result-header">
                  <div className="result-status-tag">
                    <span className="pulse-dot" />
                    <span>Short Link Ready</span>
                  </div>
                  <span className="result-storage-note">Permanent in MongoDB Atlas</span>
                </div>

                <div className="result-body">
                  <div className="result-link-group">
                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="result-url"
                      onClick={() => handleVisitLink(lastShortCode)}
                    >
                      {shortUrl}
                    </a>
                    {lastOriginalUrl && (
                      <p className="result-destination">
                        Original Target: <span>{lastOriginalUrl}</span>
                      </p>
                    )}
                  </div>

                  <div className="result-actions-cluster">
                    <button
                      type="button"
                      className={`action-btn btn-primary-action ${copiedKey === shortUrl ? "is-copied" : ""}`}
                      onClick={() => handleCopy(shortUrl, shortUrl, "Short URL copied!")}
                    >
                      {copiedKey === shortUrl ? "Copied! ✓" : "Copy Link"}
                    </button>

                    <button
                      type="button"
                      className={`action-btn ${copiedKey === `md-${lastShortCode}` ? "is-copied" : ""}`}
                      onClick={() => handleCopyMarkdown({ shortCode: lastShortCode, shortUrl })}
                      title="Copy as Markdown link"
                    >
                      <span>Markdown</span>
                    </button>

                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="action-btn"
                      onClick={() => handleVisitLink(lastShortCode)}
                    >
                      <span>Visit ↗</span>
                    </a>

                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => handleShareTwitter(shortUrl)}
                      title="Share on X"
                    >
                      𝕏 Share
                    </button>

                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => handleShareWhatsApp(shortUrl)}
                      title="Share on WhatsApp"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Link Transformation Comparison */}
        <section className="comparison-section">
          <div className="section-header">
            <span className="section-kicker">Link Transformation</span>
            <h2 className="section-title">Clean, Human-Readable Links</h2>
          </div>

          <div className="comparison-grid">
            <div className="comparison-card card-before">
              <span className="comp-badge">Before · Cluttered URL with tracking params</span>
              <p className="comp-url">
                https://store.domain.com/shop/catalog/summer-deals?utm_source=social&utm_medium=cpc&utm_campaign=launch_2026&ref=partner_8492048&session=8931bdf72
              </p>
              <div className="comp-features">
                <span>145 Characters</span>
                <span>·</span>
                <span>Unfriendly & Prone to Breaking</span>
              </div>
            </div>

            <div className="comparison-divider-icon">&rarr;</div>

            <div className="comparison-card card-after">
              <span className="comp-badge badge-after">After · Clean LinkVault Route</span>
              <p className="comp-url highlight-code">
                {domainConfig.baseUrl}/x7k9p2
              </p>
              <div className="comp-features after-features">
                <span>26 Characters</span>
                <span>·</span>
                <span>Fast 302 Redirect</span>
                <span>·</span>
                <span>Real-Time Telemetry</span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Telemetry KPI Grid */}
        <section className="telemetry-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Total Links</span>
              <span className="kpi-icon">🔗</span>
            </div>
            <div className="kpi-value">{links.length}</div>
            <div className="kpi-subtext">Stored in MongoDB Atlas</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Redirect Traffic</span>
              <span className="kpi-icon">📈</span>
            </div>
            <div className="kpi-value">{totalClicks}</div>
            <div className="kpi-subtext">Atomic Click Increments</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Average Clicks</span>
              <span className="kpi-icon">⚡</span>
            </div>
            <div className="kpi-value">{averageClicks}</div>
            <div className="kpi-subtext">Per shortened route</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Database Status</span>
              <span className="kpi-icon">🗄️</span>
            </div>
            <div className="kpi-value">
              {dbStatus.state === "connected" ? "Connected" : "Standby"}
            </div>
            <div className="kpi-subtext">
              {dbStatus.latency ? `${dbStatus.latency}ms ping` : "Checking latency..."}
            </div>
          </div>
        </section>

        {/* Vault Records & Analytics */}
        <section id="vault" className="vault-section">
          <div className="vault-header-bar">
            <div className="vault-title-group">
              <div className="vault-title-row">
                <h2 className="vault-title">Vault Records</h2>
                <span className="record-count-pill">{filteredLinks.length} Links</span>
              </div>
              <p className="vault-subtext">
                Manage your shortened routes, verify redirects, and export telemetry data.
              </p>
            </div>

            <div className="vault-toolbar">
              {/* Live Search */}
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Filter by code or URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      playCyberChime("click");
                      setSearchQuery("");
                    }}
                    className="search-clear-btn"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <select
                className="select-dropdown"
                value={sortBy}
                onChange={(e) => {
                  playCyberChime("click");
                  setSortBy(e.target.value);
                }}
              >
                <option value="newest">Newest First</option>
                <option value="clicks">Most Clicks</option>
                <option value="oldest">Oldest First</option>
              </select>

              {/* Sync Button */}
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => fetchLinks()}
                disabled={refreshing}
                title="Sync database changes"
              >
                <span className={`sync-rotate ${refreshing ? "spinning" : ""}`}>↻</span>
                <span>{refreshing ? "Syncing..." : "Sync"}</span>
              </button>

              {/* Export Buttons */}
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => handleExport("json")}
                title="Export as JSON"
              >
                JSON
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => handleExport("csv")}
                title="Export as CSV"
              >
                CSV
              </button>
            </div>
          </div>

          {/* Filter Segments */}
          <div className="filter-segments-bar">
            <button
              type="button"
              className={`segment-btn ${activeFilterTab === "all" ? "is-active" : ""}`}
              onClick={() => {
                playCyberChime("click");
                setActiveFilterTab("all");
              }}
            >
              <span>All Links</span>
              <span className="segment-counter">{links.length}</span>
            </button>
            <button
              type="button"
              className={`segment-btn ${activeFilterTab === "active" ? "is-active" : ""}`}
              onClick={() => {
                playCyberChime("click");
                setActiveFilterTab("active");
              }}
            >
              <span>Active</span>
              <span className="segment-counter">{activeLinksCount}</span>
            </button>
            <button
              type="button"
              className={`segment-btn ${activeFilterTab === "zero" ? "is-active" : ""}`}
              onClick={() => {
                playCyberChime("click");
                setActiveFilterTab("zero");
              }}
            >
              <span>Zero Clicks</span>
              <span className="segment-counter">{links.length - activeLinksCount}</span>
            </button>
            <button
              type="button"
              className={`segment-btn ${activeFilterTab === "today" ? "is-active" : ""}`}
              onClick={() => {
                playCyberChime("click");
                setActiveFilterTab("today");
              }}
            >
              <span>Created Today</span>
            </button>
          </div>

          {/* Links List */}
          {filteredLinks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <h3 className="empty-title">
                {searchQuery || activeFilterTab !== "all" ? "No links match your filter" : "No links in the vault yet"}
              </h3>
              <p className="empty-subtext">
                {searchQuery || activeFilterTab !== "all"
                  ? "Try resetting your search query or switching to 'All Links'."
                  : "Enter a URL in the form above to generate your first short link."}
              </p>
              {(searchQuery || activeFilterTab !== "all") && (
                <button
                  type="button"
                  className="reset-filter-link"
                  onClick={() => {
                    playCyberChime("click");
                    setSearchQuery("");
                    setActiveFilterTab("all");
                  }}
                >
                  Reset Filters &amp; View All
                </button>
              )}
            </div>
          ) : (
            <div className="link-cards-list">
              {filteredLinks.map((link) => {
                const isCopied = copiedKey === link.shortCode;
                const isMdCopied = copiedKey === `md-${link.shortCode}`;
                const isDeleting = deletingCode === link.shortCode;
                const isTesting = testingClickCode === link.shortCode;
                const isHighlighted = highlightCode === link.shortCode;
                const domain = getCleanDomain(link.originalUrl);

                return (
                  <article
                    key={link.shortCode || link._id}
                    className={`link-row-card ${isHighlighted ? "highlight-flash" : ""}`}
                  >
                    <div className="link-info-col">
                      <div className="link-top-meta">
                        <span className="short-code-tag">/{link.shortCode}</span>
                        <div className="clicks-pill">
                          <strong>{link.clicks || 0}</strong>
                          <span>clicks</span>
                        </div>
                        <span className="timestamp-label">{formatDate(link.createdAt)}</span>
                      </div>

                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="short-url-link"
                        onClick={() => handleVisitLink(link.shortCode)}
                      >
                        {link.shortUrl}
                      </a>

                      <div className="destination-row" title={link.originalUrl}>
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                          alt=""
                          className="domain-fav"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span>&rarr;</span>
                        <span className="dest-text-truncate">{link.originalUrl}</span>
                      </div>
                    </div>

                    <div className="link-actions-col">
                      <button
                        type="button"
                        className={`pill-action ${isCopied ? "btn-copy-success" : ""}`}
                        onClick={() => handleCopy(link.shortUrl, link.shortCode)}
                      >
                        {isCopied ? "Copied! ✓" : "Copy"}
                      </button>

                      <button
                        type="button"
                        className={`pill-action ${isMdCopied ? "btn-copy-success" : ""}`}
                        onClick={() => handleCopyMarkdown(link)}
                        title="Copy Markdown"
                      >
                        {isMdCopied ? "MD ✓" : "MD"}
                      </button>

                      <button
                        type="button"
                        className="pill-action btn-test-hit"
                        onClick={() => handleTestClick(link.shortCode)}
                        disabled={isTesting}
                        title="Simulate visitor click"
                      >
                        {isTesting ? "+1 Hit..." : "+1 Test Hit"}
                      </button>

                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="pill-action"
                        title="Open redirect"
                        onClick={() => handleVisitLink(link.shortCode)}
                      >
                        Open ↗
                      </a>

                      <button
                        type="button"
                        className="pill-action btn-delete-link"
                        onClick={() => requestDelete(link)}
                        disabled={isDeleting}
                        title="Delete permanently"
                      >
                        {isDeleting ? "..." : "🗑️"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Platform Core Capabilities */}
        <section className="features-section">
          <div className="section-header">
            <span className="section-kicker">Platform Features</span>
            <h2 className="section-title">Engineered for Reliability & Scale</h2>
          </div>

          <div className="features-grid">
            {PLATFORM_FEATURES.map((feat) => (
              <div key={feat.title} className="feature-box">
                <div className="feature-top">
                  <div className="feature-icon-badge">{feat.icon}</div>
                  <span className="feature-tag-pill">{feat.tag}</span>
                </div>
                <h3 className="feature-title">{feat.title}</h3>
                <p className="feature-desc">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="faq-section">
          <div className="section-header">
            <span className="section-kicker">FAQ</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div className="faq-list">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.question}
                  className={`faq-card ${isOpen ? "is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-trigger"
                    onClick={() => {
                      playCyberChime("click");
                      setOpenFaq(isOpen ? null : index);
                    }}
                  >
                    <span>{item.question}</span>
                    <span className="faq-icon-state">{isOpen ? "−" : "+"}</span>
                  </button>

                  {isOpen && (
                    <div className="faq-content">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="cta-box">
          <div className="cta-text-side">
            <h2>Start Shortening Links Today</h2>
            <p>Persistent storage on MongoDB Atlas with real-time atomic telemetry.</p>
          </div>
          <a
            href="#shortener"
            className="cta-btn-primary"
            onClick={() => {
              playCyberChime("click");
              if (inputRef.current) inputRef.current.focus();
            }}
          >
            <span>Shorten a URL ↗</span>
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-left-info">
            <span className="footer-brand-title">LinkVault</span>
            <span>· URL Shortener & Analytics</span>
          </div>
          <div className="footer-status">
            <span className="status-live-dot" />
            <span>MongoDB Atlas Connected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
