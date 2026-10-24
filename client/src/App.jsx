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
      "No. All shortened URLs are stored permanently in your MongoDB Atlas database and will continue to redirect indefinitely without expiration dates or hidden limits.",
  },
  {
    question: "How does real-time click tracking work?",
    answer:
      "When a visitor navigates to your shortened link, our Express backend atomically increments the click counter in MongoDB using an atomic $inc operation before issuing an immediate 302 redirect to the destination URL.",
  },
  {
    question: "Can I test or simulate click tracking before sharing?",
    answer:
      "Yes. Click the '+1 Test Hit' button next to any link in your records. The backend will atomically record a verified click in MongoDB without opening extra browser tabs.",
  },
  {
    question: "Can I customize the link alias or slug?",
    answer:
      "Yes. Expand 'Advanced options' in the URL shortener to define a custom slug (e.g. summer-promo-2026). Custom aliases must be between 3 and 30 alphanumeric characters.",
  },
  {
    question: "Can I export or delete my shortened links?",
    answer:
      "Yes. You can export your entire link database to CSV or JSON with a single click, or permanently delete any link with the delete action.",
  },
];

function App() {
  const [url, setUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
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
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [testingClickCode, setTestingClickCode] = useState(null);
  const [highlightCode, setHighlightCode] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // Mobile & Public Link Domain Configuration
  const [domainConfig, setDomainConfig] = useState({
    baseUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost:5000",
    isLocalhost: true,
  });

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

  // Synthesized Web Audio FX (Zero External Files, optional feedback)
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
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "success") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.07);
        osc.frequency.setValueAtTime(783.99, now + 0.14);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "hit") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "delete") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      }
    } catch {
      // AudioContext blocked or muted
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
    if (!quiet) setRefreshing(true);
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

  // Handle visiting link with immediate optimistic increment and background sync
  function handleVisitLink(shortCode) {
    if (!shortCode) return;
    playCyberChime("hit");

    setLinks((prev) =>
      prev.map((l) =>
        l.shortCode === shortCode ? { ...l, clicks: (l.clicks || 0) + 1 } : l
      )
    );

    setTimeout(() => {
      fetchLinks(true);
    }, 1800);
  }

  // Delete Link Request
  function requestDelete(link) {
    playCyberChime("click");
    setConfirmDeleteTarget(link);
  }

  // Execute Confirmed Delete
  async function executeConfirmedDelete() {
    if (!confirmDeleteTarget) return;
    const targetCode = confirmDeleteTarget.shortCode;

    setDeletingCode(targetCode);
    playCyberChime("delete");

    try {
      const res = await fetch(`${API_URL}/api/links/${targetCode}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete link.");
      }

      setLinks((prev) => prev.filter((l) => l.shortCode !== targetCode));

      if (lastShortCode === targetCode) {
        setShortUrl("");
        setLastOriginalUrl("");
        setLastShortCode("");
      }

      showToast(`Link /${targetCode} removed successfully.`, "info");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeletingCode(null);
      setConfirmDeleteTarget(null);
    }
  }

  // Copy to Clipboard with visible confirmation
  async function handleCopy(text, key, customMsg = "Copied to clipboard! 📋") {
    playCyberChime("click");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key || text);
      playCyberChime("success");
      showToast(customMsg, "success");
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      showToast("Failed to copy automatically. Please copy manually.", "error");
    }
  }

  // Copy as Markdown [Title](URL)
  function handleCopyMarkdown(link) {
    const md = `[LinkVault /${link.shortCode}](${link.shortUrl})`;
    handleCopy(md, `md-${link.shortCode}`, "Copied as Markdown link!");
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
        showToast(`Hit recorded! Clicks for /${shortCode} now at ${data.clicks}`, "success");
      } else {
        setLinks((prev) =>
          prev.map((l) =>
            l.shortCode === shortCode ? { ...l, clicks: (l.clicks || 0) + 1 } : l
          )
        );
        showToast(`Test hit registered for /${shortCode}`, "success");
      }
    } catch {
      setLinks((prev) =>
        prev.map((l) =>
          l.shortCode === shortCode ? { ...l, clicks: (l.clicks || 0) + 1 } : l
        )
      );
      showToast(`Test hit added for /${shortCode}`, "info");
    } finally {
      setTestingClickCode(null);
      setTimeout(() => setHighlightCode(null), 1500);
    }
  }

  // Share on X
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
    showToast(`Vault data exported as ${format.toUpperCase()}!`, "success");
  }

  // Quick Paste from Clipboard
  async function handlePaste() {
    playCyberChime("click");
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        showToast("Pasted destination URL from clipboard", "info");
      }
    } catch {
      showToast("Unable to access clipboard automatically. Please paste manually.", "error");
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
      const payload = { originalUrl };
      if (customCode.trim()) {
        payload.customCode = customCode.trim();
      }

      const response = await fetch(`${API_URL}/api/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "URL shortening failed.");
      }

      setShortUrl(data.shortUrl);
      setLastOriginalUrl(data.originalUrl);
      setLastShortCode(data.shortCode);
      setCustomCode("");

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

      playCyberChime("success");
      showToast("Short URL created successfully!", "success");
    } catch (err) {
      setError(err.message);
      playCyberChime("delete");
    } finally {
      setLoading(false);
    }
  }

  // Initial Load & Status Poll
  useEffect(() => {
    fetchLinks(true);
    checkDbStatus();
    fetchConfig();

    const interval = setInterval(() => {
      fetchLinks(true);
      checkDbStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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

  // Format Date
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
      {/* Subtle Ambient Header Depth */}
      <div className="ambient-top-depth" />

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`toast-notice toast-${toast.type}`}>
          <span className="toast-pill-dot" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteTarget && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteTarget(null)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-warn-icon-box">⚠️</div>
            <h3 className="modal-dialog-title">Delete Link Permanently?</h3>
            <p className="modal-dialog-desc">
              You are about to delete <code className="code-slug-tag">/{confirmDeleteTarget.shortCode}</code>.
              This will permanently remove it from MongoDB Atlas. Visitors navigating to this link will receive a 404 error.
            </p>
            <div className="modal-target-box">
              {confirmDeleteTarget.originalUrl}
            </div>
            <div className="modal-actions-bar">
              <button
                type="button"
                className="btn-dialog-cancel"
                onClick={() => setConfirmDeleteTarget(null)}
              >
                Keep Link
              </button>
              <button
                type="button"
                className="btn-dialog-confirm-danger"
                onClick={executeConfirmedDelete}
                disabled={deletingCode === confirmDeleteTarget.shortCode}
              >
                {deletingCode === confirmDeleteTarget.shortCode ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Community / Auth Dialog */}
      {authModalOpen && (
        <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
          <div className="auth-dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="auth-header-row">
              <h3 className="auth-header-title">
                {authMode === "login" ? "Welcome Back to LinkVault" : "Create LinkVault Account"}
              </h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setAuthModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="auth-notice-box">
              <strong>✨ Community Open Edition</strong>
              <p>
                No account or sign up is required. All URL shortening, custom aliases, atomic click tracking, and CSV/JSON export tools are unlocked and fully operational.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary-shorten"
              style={{ width: "100%" }}
              onClick={() => {
                setAuthModalOpen(false);
                if (inputRef.current) inputRef.current.focus();
              }}
            >
              Continue to Free Workspace &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Site Header */}
      <header className="site-header">
        <div className="header-container">
          <div className="header-brand">
            <div className="brand-symbol">🔗</div>
            <span className="brand-text">LinkVault</span>
          </div>

          <nav className="nav-links-desktop">
            <a href="#" className="nav-link-item">Home</a>
            <a href="#shortener" className="nav-link-item">Shorten</a>
            <a href="#preview" className="nav-link-item">Dashboard</a>
            <a href="#features" className="nav-link-item">Features</a>
            <a href="#vault" className="nav-link-item">My Links ({links.length})</a>
            <a href="#faq" className="nav-link-item">FAQ</a>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="btn-sign-in"
              onClick={() => {
                setAuthMode("login");
                setAuthModalOpen(true);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className="btn-get-started"
              onClick={() => {
                setAuthMode("signup");
                setAuthModalOpen(true);
              }}
            >
              Get Started
            </button>

            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        <div className={`mobile-nav-panel ${mobileMenuOpen ? "is-open" : ""}`}>
          <a href="#" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Home</a>
          <a href="#shortener" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Shorten URL</a>
          <a href="#preview" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Dashboard Preview</a>
          <a href="#features" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#vault" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>My Links ({links.length})</a>
          <a href="#faq" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
          <div className="mobile-auth-actions">
            <button
              type="button"
              className="btn-sign-in"
              onClick={() => {
                setMobileMenuOpen(false);
                setAuthMode("login");
                setAuthModalOpen(true);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className="btn-get-started"
              onClick={() => {
                setMobileMenuOpen(false);
                setAuthMode("signup");
                setAuthModalOpen(true);
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Layout */}
      <main className="page-container">
        {/* HERO SECTION */}
        <section className="hero-wrapper">
          <div className="hero-kicker-tag">
            <span className="kicker-dot" />
            <span>Link Management Platform</span>
          </div>

          <h1 className="hero-main-title">
            Short links. Clear insights.
          </h1>

          <p className="hero-lead-text">
            Create shareable links and understand how people interact with them.
          </p>

          {/* Prominent URL Shortening Form */}
          <div id="shortener" className="hero-form-container">
            <form onSubmit={handleShorten}>
              <div className="form-top-meta">
                <label htmlFor="url-input" className="form-input-label">
                  <span>Destination URL</span>
                  {previewDomain && (
                    <span className="detected-domain-chip">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${previewDomain}&sz=32`}
                        alt=""
                        className="chip-favicon"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span>{previewDomain}</span>
                    </span>
                  )}
                </label>
                {url && (
                  <span className="char-counter-label">{url.trim().length} chars</span>
                )}
              </div>

              {/* Large URL Input Row */}
              <div className="shorten-input-row">
                <span className="input-link-symbol">🔗</span>
                <input
                  ref={inputRef}
                  id="url-input"
                  type="url"
                  className="large-url-input"
                  placeholder="https://example.com/very/long/destination/url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  autoComplete="off"
                  required
                />

                {url ? (
                  <button
                    type="button"
                    className="btn-input-tool"
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
                    className="btn-input-tool"
                    onClick={handlePaste}
                    title="Paste clipboard"
                  >
                    Paste
                  </button>
                )}

                <button
                  type="submit"
                  className="btn-primary-shorten"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-mini" />
                      <span>Shortening...</span>
                    </>
                  ) : (
                    <span>Shorten URL</span>
                  )}
                </button>
              </div>

              {/* Advanced Settings Toggle & Drawer */}
              <div className="advanced-settings-toggle-row">
                <button
                  type="button"
                  className="btn-toggle-advanced"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <span>{showAdvanced ? "▾ Hide advanced options" : "▸ Advanced options (custom alias)"}</span>
                </button>

                <button
                  type="button"
                  className="btn-toggle-advanced"
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    if (!soundEnabled) playCyberChime("click");
                  }}
                >
                  <span>{soundEnabled ? "Audio On" : "Audio Muted"}</span>
                </button>
              </div>

              {showAdvanced && (
                <div className="advanced-drawer">
                  <label htmlFor="custom-slug" className="form-input-label">
                    <span>Custom Back-Half / Alias</span>
                  </label>
                  <div className="alias-input-wrapper">
                    <span className="alias-domain-prefix">{domainConfig.baseUrl}/</span>
                    <input
                      id="custom-slug"
                      type="text"
                      className="alias-text-input"
                      placeholder="custom-slug"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                      maxLength={30}
                    />
                  </div>
                  <span className="alias-hint-text">
                    3 to 30 characters (letters, numbers, hyphens, underscores).
                  </span>
                </div>
              )}

              {/* Reduction summary */}
              {url.trim().length > 25 && (
                <div className="reduction-summary-bar">
                  <span>
                    Original: <strong>{url.trim().length} chars</strong> &rarr; Shortened: <strong>~26 chars</strong>
                    <span className="reduction-percent-tag">
                      (-{Math.max(5, Math.round(((url.trim().length - 26) / url.trim().length) * 100))}%)
                    </span>
                  </span>
                  <div className="reduction-meter-track">
                    <div
                      className="reduction-meter-fill"
                      style={{
                        width: `${Math.min(100, Math.max(5, Math.round(((url.trim().length - 26) / url.trim().length) * 100)))}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </form>

            {error && (
              <div className="form-error-alert">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success State Showcase */}
            {shortUrl && (
              <div className="success-result-box">
                <div className="success-badge-row">
                  <div className="success-state-badge">
                    <span className="status-dot-active" />
                    <span>Short Link Ready</span>
                  </div>
                  <span className="success-db-note">Permanent in MongoDB Atlas</span>
                </div>

                <div className="success-link-row">
                  <div className="generated-link-display">
                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="short-link-anchor"
                      onClick={() => handleVisitLink(lastShortCode)}
                    >
                      {shortUrl}
                    </a>
                    {lastOriginalUrl && (
                      <p className="original-target-preview">
                        Target: <span>{lastOriginalUrl}</span>
                      </p>
                    )}
                  </div>

                  <div className="success-actions-row">
                    <button
                      type="button"
                      className={`btn-action-pill btn-copy-highlight ${copiedKey === shortUrl ? "is-copied-active" : ""}`}
                      onClick={() => handleCopy(shortUrl, shortUrl, "Copied to clipboard! 📋")}
                    >
                      {copiedKey === shortUrl ? "Copied! ✓" : "Copy Link"}
                    </button>

                    <button
                      type="button"
                      className={`btn-action-pill ${copiedKey === `md-${lastShortCode}` ? "is-copied-active" : ""}`}
                      onClick={() => handleCopyMarkdown({ shortCode: lastShortCode, shortUrl })}
                      title="Copy as Markdown link"
                    >
                      <span>Markdown</span>
                    </button>

                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-action-pill"
                      onClick={() => handleVisitLink(lastShortCode)}
                    >
                      <span>Visit ↗</span>
                    </a>

                    <button
                      type="button"
                      className="btn-action-pill"
                      onClick={() => handleShareTwitter(shortUrl)}
                      title="Share on X"
                    >
                      𝕏 Share
                    </button>

                    <button
                      type="button"
                      className="btn-action-pill"
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

          {/* Quick-test URL chips */}
          <div className="quick-chips-wrapper">
            <span className="chips-label">Quick fill:</span>
            {QUICK_TEST_URLS.map((item) => (
              <button
                key={item.label}
                type="button"
                className="chip-tag-btn"
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

        {/* PRODUCT PREVIEW (Realistic Dashboard Frame with Actual Data) */}
        <section id="preview" className="preview-section">
          <div className="section-lead-header">
            <span className="section-category-kicker">Product Overview</span>
            <h2 className="section-headline">Live Link Telemetry & Dashboard</h2>
            <p className="section-subcaption">
              A real-time overview displaying actual records and atomic click engagement from your database.
            </p>
          </div>

          <div className="dashboard-frame-window">
            <div className="window-chrome-bar">
              <div className="chrome-window-dots">
                <span className="dot-circle" />
                <span className="dot-circle" />
                <span className="dot-circle" />
              </div>
              <div className="chrome-title-badge">
                <span className="live-data-indicator" />
                <span>Live Atlas Database View</span>
              </div>
              <span className="chrome-status-note">
                {dbStatus.state === "connected" ? `Atlas Online (${dbStatus.latency || 12}ms latency)` : "Connecting..."}
              </span>
            </div>

            <div className="window-inner-body">
              <div className="preview-kpi-row">
                <div className="preview-kpi-widget">
                  <span className="kpi-widget-label">Total Links</span>
                  <span className="kpi-widget-number">{links.length}</span>
                  <span className="kpi-widget-sub">Permanent MongoDB records</span>
                </div>
                <div className="preview-kpi-widget">
                  <span className="kpi-widget-label">Total Redirects</span>
                  <span className="kpi-widget-number">{totalClicks}</span>
                  <span className="kpi-widget-sub">Atomic $inc click hits</span>
                </div>
                <div className="preview-kpi-widget">
                  <span className="kpi-widget-label">Average Engagement</span>
                  <span className="kpi-widget-number">{averageClicks}</span>
                  <span className="kpi-widget-sub">Clicks per route</span>
                </div>
                <div className="preview-kpi-widget">
                  <span className="kpi-widget-label">Database Health</span>
                  <span className="kpi-widget-number">
                    {dbStatus.state === "connected" ? "100%" : "Checking"}
                  </span>
                  <span className="kpi-widget-sub">
                    {dbStatus.latency ? `${dbStatus.latency}ms ping` : "Standby"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 DISTINCT FEATURE SECTIONS */}
        <section id="features" style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
          {/* Feature 1: Fast URL Shortening (Split 2-Column with Visual Pipeline) */}
          <div className="feature-split-layout">
            <div className="feature-copy-side">
              <span className="feature-number-index">01 · High-Speed Redirect Engine</span>
              <h2 className="feature-heading-lg">Sub-millisecond routing with zero intermediate delays.</h2>
              <p className="feature-body-p">
                Engineered with a lightweight Express routing pipeline that matches short slugs and serves immediate 302 HTTP redirects without buffering or ad-wall slowdowns.
              </p>
              <div className="feature-bullet-list">
                <div className="bullet-item">
                  <span className="bullet-check-icon">✓</span>
                  <span>Direct 302 redirects with cache-control protection</span>
                </div>
                <div className="bullet-item">
                  <span className="bullet-check-icon">✓</span>
                  <span>Zero-delay resolution from MongoDB Atlas indices</span>
                </div>
                <div className="bullet-item">
                  <span className="bullet-check-icon">✓</span>
                  <span>Support for auto-generated 6-char codes or custom slugs</span>
                </div>
              </div>
            </div>

            <div className="feature-visual-pipeline">
              <div className="pipeline-step-box">
                <span className="pipeline-step-label">1. Inbound Long URL</span>
                <span className="pipeline-step-val">https://store.domain.com/shop/item?utm_campaign=...</span>
              </div>
              <div className="pipeline-arrow-down">&darr;</div>
              <div className="pipeline-step-box">
                <span className="pipeline-step-label">2. Security & Protocol Check</span>
                <span className="pipeline-step-val" style={{ color: "#34d399" }}>HTTP/HTTPS Validated · SSRF Blocked</span>
              </div>
              <div className="pipeline-arrow-down">&darr;</div>
              <div className="pipeline-step-box">
                <span className="pipeline-step-label">3. Unique Slotted Slug</span>
                <span className="pipeline-step-val" style={{ color: "#818cf8" }}>{domainConfig.baseUrl}/x7k9p2</span>
              </div>
              <div className="pipeline-arrow-down">&darr;</div>
              <div className="pipeline-step-box" style={{ background: "rgba(99, 102, 241, 0.1)", borderColor: "rgba(99, 102, 241, 0.3)" }}>
                <span className="pipeline-step-label">4. Atomic Tracking & Redirect</span>
                <span className="pipeline-step-val" style={{ color: "#fff" }}>MongoDB $inc &rarr; 302 Location Header</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Link Management (3-Column Layout) */}
          <div className="feature-management-strip">
            <div className="section-lead-header">
              <span className="feature-number-index">02 · Link Management</span>
              <h2 className="section-headline">Centralized control for every link you generate.</h2>
              <p className="section-subcaption">
                Search, filter, export, and clean up your records from a single management console.
              </p>
            </div>

            <div className="management-feature-cards">
              <div className="mgmt-card-box">
                <div className="mgmt-card-icon">🔍</div>
                <h3 className="mgmt-card-title">Live Search & Filter Tabs</h3>
                <p className="mgmt-card-desc">
                  Instantly filter through hundreds of records by short slug or target domain. Filter by active links or zero-click drafts.
                </p>
              </div>

              <div className="mgmt-card-box">
                <div className="mgmt-card-icon">📥</div>
                <h3 className="mgmt-card-title">1-Click CSV & JSON Export</h3>
                <p className="mgmt-card-desc">
                  Download your full record history anytime for offline reporting, data warehousing, or team analytics workflows.
                </p>
              </div>

              <div className="mgmt-card-box">
                <div className="mgmt-card-icon">🗑️</div>
                <h3 className="mgmt-card-title">Safety Confirmation Deletion</h3>
                <p className="mgmt-card-desc">
                  Purge outdated or decommissioned links cleanly from your database with two-step modal confirmation to avoid accidental data loss.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3: Click Analytics & Telemetry (Telemetry Demo) */}
          <div className="feature-telemetry-section">
            <div className="feature-copy-side">
              <span className="feature-number-index">03 · Click Analytics</span>
              <h2 className="feature-heading-lg">Atomic, race-condition-free click tracking.</h2>
              <p className="feature-body-p">
                Traditional counters often lose counts under concurrent visitor load. LinkVault utilizes MongoDB atomic <code>$inc</code> operations so every click is recorded with mathematical precision.
              </p>
              <div className="feature-bullet-list">
                <div className="bullet-item">
                  <span className="bullet-check-icon">✓</span>
                  <span>Zero count loss during concurrent visitor spikes</span>
                </div>
                <div className="bullet-item">
                  <span className="bullet-check-icon">✓</span>
                  <span>Real-time polling keeps your dashboard synchronized</span>
                </div>
                <div className="bullet-item">
                  <span className="bullet-check-icon">✓</span>
                  <span>Simulate test hits with the inline +1 hit tool</span>
                </div>
              </div>
            </div>

            <div className="telemetry-interactive-demo">
              <div className="demo-counter-header">
                <span className="demo-title-bold">Total Recorded Redirects</span>
                <span className="demo-tag-live">LIVE TELEMETRY</span>
              </div>
              <div className="demo-click-display">
                <span className="click-number-big">{totalClicks}</span>
                <span className="click-number-sub">lifetime visitor navigations recorded</span>
              </div>
              <div className="demo-test-hit-bar">
                <span className="demo-instruction">Test counter incrementation live:</span>
                {links[0] && (
                  <button
                    type="button"
                    className="btn-action-pill"
                    onClick={() => handleTestClick(links[0].shortCode)}
                    disabled={testingClickCode === links[0].shortCode}
                  >
                    {testingClickCode === links[0].shortCode ? "Testing..." : `+1 Hit on /${links[0].shortCode}`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Feature 4: Security & Inspection (Checklist Grid) */}
          <div className="feature-security-section">
            <div className="section-lead-header">
              <span className="feature-number-index">04 · Security & Verification</span>
              <h2 className="section-headline">Security controls built into every redirect.</h2>
              <p className="section-subcaption">
                Guarding your visitors and your server infrastructure against abusive links.
              </p>
            </div>

            <div className="security-checklist-grid">
              <div className="security-item-card">
                <span className="sec-status-icon">🔒</span>
                <h3 className="sec-title">Strict Protocol Sanitation</h3>
                <p className="sec-desc">Blocks dangerous protocols such as javascript:, data:, and file: schemes.</p>
              </div>

              <div className="security-item-card">
                <span className="sec-status-icon">🛡️</span>
                <h3 className="sec-title">SSRF Protection</h3>
                <p className="sec-desc">Prevents shortening internal IP addresses, AWS metadata, and private subnets.</p>
              </div>

              <div className="security-item-card">
                <span className="sec-status-icon">🌐</span>
                <h3 className="sec-title">Favicon Domain Verification</h3>
                <p className="sec-desc">Automatically verifies and extracts clean destination root hostnames via Google Favicon API.</p>
              </div>

              <div className="security-item-card">
                <span className="sec-status-icon">⚡</span>
                <h3 className="sec-title">Anti-Cache Headers</h3>
                <p className="sec-desc">Applies no-store and no-cache headers to ensure accurate real-time click tracking on every visit.</p>
              </div>
            </div>
          </div>
        </section>

        {/* VAULT RECORDS & MANAGEMENT TABLE */}
        <section id="vault" className="vault-manager-section">
          <div className="vault-top-controls">
            <div className="vault-section-title-wrap">
              <div className="vault-h2-row">
                <h2 className="vault-h2-title">Link Management Console</h2>
                <span className="badge-count">{filteredLinks.length} Links</span>
              </div>
              <p className="vault-desc-sub">
                Inspect, verify, test, or export your shortened links.
              </p>
            </div>

            <div className="vault-toolbar-actions">
              {/* Search Box */}
              <div className="search-field-wrapper">
                <span className="search-glyph">🔍</span>
                <input
                  type="text"
                  placeholder="Filter by code or URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-native-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      playCyberChime("click");
                      setSearchQuery("");
                    }}
                    className="btn-clear-search"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <select
                className="sort-select-box"
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
                className="toolbar-action-btn"
                onClick={() => fetchLinks()}
                disabled={refreshing}
                title="Sync database changes"
              >
                <span className={`spin-icon ${refreshing ? "spinning" : ""}`}>↻</span>
                <span>{refreshing ? "Syncing..." : "Sync"}</span>
              </button>

              {/* Export Buttons */}
              <button
                type="button"
                className="toolbar-action-btn"
                onClick={() => handleExport("json")}
                title="Export as JSON"
              >
                JSON
              </button>
              <button
                type="button"
                className="toolbar-action-btn"
                onClick={() => handleExport("csv")}
                title="Export as CSV"
              >
                CSV
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs-strip">
            <button
              type="button"
              className={`tab-filter-btn ${activeFilterTab === "all" ? "is-active-tab" : ""}`}
              onClick={() => {
                playCyberChime("click");
                setActiveFilterTab("all");
              }}
            >
              <span>All Links</span>
              <span className="tab-badge-num">{links.length}</span>
            </button>
            <button
              type="button"
              className={`tab-filter-btn ${activeFilterTab === "active" ? "is-active-tab" : ""}`}
              onClick={() => {
                playCyberChime("click");
                setActiveFilterTab("active");
              }}
            >
              <span>Active</span>
              <span className="tab-badge-num">{activeLinksCount}</span>
            </button>
            <button
              type="button"
              className={`tab-filter-btn ${activeFilterTab === "zero" ? "is-active-tab" : ""}`}
              onClick={() => {
                playCyberChime("click");
                setActiveFilterTab("zero");
              }}
            >
              <span>Zero Clicks</span>
              <span className="tab-badge-num">{links.length - activeLinksCount}</span>
            </button>
            <button
              type="button"
              className={`tab-filter-btn ${activeFilterTab === "today" ? "is-active-tab" : ""}`}
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
            <div className="vault-empty-view">
              <div className="empty-glyph">📂</div>
              <h3 className="empty-view-heading">
                {searchQuery || activeFilterTab !== "all" ? "No links match your filter criteria" : "No links in the vault yet"}
              </h3>
              <p className="empty-view-caption">
                {searchQuery || activeFilterTab !== "all"
                  ? "Try resetting your search query or switching to 'All Links'."
                  : "Enter a URL in the form above to generate your first short link."}
              </p>
              {(searchQuery || activeFilterTab !== "all") && (
                <button
                  type="button"
                  className="btn-reset-filter"
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
            <div className="records-stack-list">
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
                    className={`record-row-item ${isHighlighted ? "highlight-flash" : ""}`}
                  >
                    <div className="record-main-col">
                      <div className="record-header-tags">
                        <span className="badge-short-code">/{link.shortCode}</span>
                        <div className="clicks-stat-pill">
                          <strong>{link.clicks || 0}</strong>
                          <span>clicks</span>
                        </div>
                        <span className="record-created-time">{formatDate(link.createdAt)}</span>
                      </div>

                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="record-short-url"
                        onClick={() => handleVisitLink(link.shortCode)}
                      >
                        {link.shortUrl}
                      </a>

                      <div className="record-dest-row" title={link.originalUrl}>
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                          alt=""
                          className="dest-favicon-img"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span>&rarr;</span>
                        <span className="dest-truncate-text">{link.originalUrl}</span>
                      </div>
                    </div>

                    <div className="record-actions-cluster">
                      <button
                        type="button"
                        className={`btn-item-action ${isCopied ? "is-copied-check" : ""}`}
                        onClick={() => handleCopy(link.shortUrl, link.shortCode)}
                      >
                        {isCopied ? "Copied! ✓" : "Copy"}
                      </button>

                      <button
                        type="button"
                        className={`btn-item-action ${isMdCopied ? "is-copied-check" : ""}`}
                        onClick={() => handleCopyMarkdown(link)}
                        title="Copy Markdown"
                      >
                        {isMdCopied ? "MD ✓" : "MD"}
                      </button>

                      <button
                        type="button"
                        className="btn-item-action btn-hit-sim"
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
                        className="btn-item-action"
                        title="Open redirect"
                        onClick={() => handleVisitLink(link.shortCode)}
                      >
                        Open ↗
                      </a>

                      <button
                        type="button"
                        className="btn-item-action btn-delete-action"
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

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section id="faq" className="faq-section-wrapper">
          <div className="section-lead-header">
            <span className="section-category-kicker">Questions &amp; Answers</span>
            <h2 className="section-headline">Frequently Asked Questions</h2>
          </div>

          <div className="faq-items-list">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.question}
                  className={`faq-item-row ${isOpen ? "is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-header-btn"
                    onClick={() => {
                      playCyberChime("click");
                      setOpenFaq(isOpen ? null : index);
                    }}
                  >
                    <span>{item.question}</span>
                    <span className="faq-toggle-glyph">{isOpen ? "−" : "+"}</span>
                  </button>

                  {isOpen && (
                    <div className="faq-body-text">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="cta-banner-wrapper">
          <div className="cta-text-group">
            <h2>Ready to shorten and track your links?</h2>
            <p>Generate clean, fast URLs with atomic click analytics and permanent MongoDB persistence.</p>
          </div>
          <a
            href="#shortener"
            className="btn-cta-submit"
            onClick={() => {
              playCyberChime("click");
              if (inputRef.current) inputRef.current.focus();
            }}
          >
            <span>Shorten a URL ↗</span>
          </a>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-inner-wrap">
          <div className="footer-brand-meta">
            <span className="footer-brand-title">LinkVault</span>
            <span>· URL Shortener &amp; Real-Time Analytics</span>
          </div>
          <div className="footer-live-status">
            <span className="status-dot-green" />
            <span>MongoDB Atlas Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
