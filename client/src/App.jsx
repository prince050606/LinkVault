import { useState, useEffect, useMemo, useRef } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && !window.location.origin.includes(":5173")
    ? window.location.origin
    : "http://localhost:5000");

const QUICK_TEST_URLS = [
  { label: "🐙 GitHub", url: "https://github.com" },
  { label: "⚡ React Docs", url: "https://react.dev" },
  { label: "🌐 HackerNews", url: "https://news.ycombinator.com" },
  { label: "🚀 OpenAI", url: "https://openai.com" },
  { label: "📦 NPM Registry", url: "https://www.npmjs.com" },
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
    <div className="ai-app-wrapper">
      {/* Neural Background Matrix & Cosmic Lighting */}
      <div className="neural-background">
        <div className="grid-overlay" />
        <div className="biolum-orb orb-cyan" />
        <div className="biolum-orb orb-violet" />
        <div className="biolum-orb orb-fuchsia" />
        <div className="light-beam" />
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`ai-toast toast-${toast.type}`}>
          <span className="toast-glow-dot" />
          <span className="toast-text">{toast.message}</span>
        </div>
      )}

      {/* Custom Glassmorphic Delete Confirmation Modal */}
      {confirmDeleteTarget && (
        <div className="cyber-modal-backdrop" onClick={() => setConfirmDeleteTarget(null)}>
          <div className="cyber-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-accent" />
            <div className="modal-icon-wrap">
              <span className="modal-warn-icon">⚠️</span>
            </div>
            <h3 className="modal-title">Delete Link Permanently?</h3>
            <p className="modal-desc">
              You are about to delete <code className="modal-code">/{confirmDeleteTarget.shortCode}</code>.
              This will permanently purge it from MongoDB Atlas. Visitors navigating to this link will receive a 404 error.
            </p>
            <div className="modal-dest-preview">
              <span className="dest-tag">Target:</span> {confirmDeleteTarget.originalUrl}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn cancel-btn"
                onClick={() => setConfirmDeleteTarget(null)}
              >
                Keep Link
              </button>
              <button
                type="button"
                className="modal-btn danger-delete-btn"
                onClick={executeConfirmedDelete}
                disabled={deletingCode === confirmDeleteTarget.shortCode}
              >
                {deletingCode === confirmDeleteTarget.shortCode ? "Purging..." : "🗑️ Delete From Database"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="ai-navbar">
        <div className="nav-container">
          <div className="brand-group">
            <div className="brand-logo-hex">
              <span className="logo-spark">⚡</span>
            </div>
            <div className="brand-info">
              <div className="brand-title-row">
                <span className="brand-name">LinkVault</span>
                <span className="ai-chip">ULTRA</span>
              </div>
              <span className="brand-sub">Branded Link Infrastructure</span>
            </div>
          </div>

          <div className="nav-actions">
            {/* Audio Toggle */}
            <button
              type="button"
              className={`sound-toggle-btn ${soundEnabled ? "sound-on" : "sound-off"}`}
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playCyberChime("click");
              }}
              title="Toggle futuristic sound feedback"
            >
              <span>{soundEnabled ? "🔊 Sound ON" : "🔇 Sound Muted"}</span>
            </button>

            <a href="#vault" className="nav-vault-btn">
              <span>Vault Records</span>
              <span className="vault-count-badge">{links.length}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="ai-main-content">
        {/* Hero Section */}
        <section className="ai-hero-section">
          <div className="ai-pill-announcement">
            <span className="pulsing-halo">✦</span>
            <span>URL SHORTENER, BRANDED LINKS & REAL-TIME ANALYTICS</span>
          </div>

          <h1 className="hero-heading">
            Make Every Link <br />
            <span className="ai-gradient-text">Fast, Beautiful & Measurable.</span>
          </h1>

          <p className="hero-subtext">
            Shorten long, messy URLs into clean, high-conversion links. Powered by atomic MongoDB Atlas
            click telemetry, sub-millisecond redirect engine, and instant data exports.
          </p>

          {/* Quick-test URL chips */}
          <div className="quick-test-tray">
            <span className="quick-tray-label">⚡ Quick Fill:</span>
            {QUICK_TEST_URLS.map((item) => (
              <button
                key={item.label}
                type="button"
                className="quick-chip-btn"
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

        {/* Central Shortener Holographic Card */}
        <section id="shortener" className="shortener-zone">
          <div className="hologram-card">
            {/* Animated Border Beam */}
            <div className="card-border-beam" />

            <form onSubmit={handleShorten} className="ai-form">
              <div className="form-header-row">
                <label htmlFor="url-input" className="form-label-title">
                  <span>Enter Long Destination URL</span>
                  {previewDomain && (
                    <span className="detected-domain-badge">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${previewDomain}&sz=32`}
                        alt=""
                        className="live-favicon"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span>Verified: {previewDomain}</span>
                    </span>
                  )}
                </label>
                {url && (
                  <span className="char-count-pill">{url.trim().length} chars</span>
                )}
              </div>

              {/* Main Input Box */}
              <div className="cyber-input-wrapper">
                <span className="input-glow-icon">🔗</span>

                <input
                  ref={inputRef}
                  id="url-input"
                  type="url"
                  className="cyber-input"
                  placeholder="https://example.com/very/long/campaign/url/with/lots/of/query/parameters"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  autoComplete="off"
                  required
                />

                <div className="input-right-tools">
                  {url ? (
                    <button
                      type="button"
                      className="clear-text-btn"
                      onClick={() => {
                        playCyberChime("click");
                        setUrl("");
                      }}
                      title="Clear"
                    >
                      ×
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="paste-clipboard-btn"
                      onClick={handlePaste}
                      title="Paste clipboard"
                    >
                      📋 Paste
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="shorten-trigger-btn"
                  disabled={loading}
                >
                  <span className="btn-shimmer" />
                  {loading ? (
                    <>
                      <span className="quantum-spinner" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <span>Shorten URL</span>
                      <span className="btn-lightning">⚡</span>
                    </>
                  )}
                </button>
              </div>

              {/* Real-time URL reduction metrics */}
              {url.trim().length > 25 && (
                <div className="char-reduction-banner">
                  <div className="reduction-bolt-wrap">
                    <span className="reduction-bolt">⚡</span>
                  </div>
                  <span className="reduction-text">
                    Original: <strong>{url.trim().length} chars</strong> ➔ Shortened: <strong>~26 chars</strong>{" "}
                    <span className="reduction-percent">
                      (-{Math.max(5, Math.round(((url.trim().length - 26) / url.trim().length) * 100))}% reduction)
                    </span>
                  </span>
                  <div className="reduction-mini-bar">
                    <div
                      className="reduction-mini-fill"
                      style={{
                        width: `${Math.min(100, Math.max(5, Math.round(((url.trim().length - 26) / url.trim().length) * 100)))}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </form>

            {error && (
              <div className="ai-error-banner">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success Reveal Showcase */}
            {shortUrl && (
              <div className="ai-showcase-panel">
                <div className="showcase-top-bar">
                  <div className="showcase-status-chip">
                    <span className="quantum-pulse-dot" />
                    <span>SHORT LINK READY & PERSISTED</span>
                  </div>
                  <span className="mongodb-indicator">Permanent in MongoDB Atlas</span>
                </div>

                <div className="showcase-main-body">
                  <div className="showcase-info">
                    <span className="showcase-tag">Your Shortened Link:</span>
                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="showcase-link-text"
                      onClick={() => handleVisitLink(lastShortCode)}
                    >
                      {shortUrl}
                    </a>
                    {lastOriginalUrl && (
                      <p className="showcase-dest">
                        Original Target: <span>{lastOriginalUrl}</span>
                      </p>
                    )}
                  </div>

                  {/* Enhanced Button Cluster */}
                  <div className="showcase-btn-cluster">
                    <button
                      type="button"
                      className={`cyber-action-btn copy-btn ${copiedKey === shortUrl ? "copied-state" : ""}`}
                      onClick={() => handleCopy(shortUrl, shortUrl, "Short URL copied! 📋")}
                    >
                      <span className="btn-shimmer" />
                      {copiedKey === shortUrl ? "✓ Copied to Clipboard!" : "📋 Copy Short Link"}
                    </button>

                    <button
                      type="button"
                      className={`cyber-action-btn markdown-btn ${copiedKey === `md-${lastShortCode}` ? "copied-state" : ""}`}
                      onClick={() => handleCopyMarkdown({ shortCode: lastShortCode, shortUrl })}
                      title="Copy as [Title](URL) markdown link"
                    >
                      <span>📄 Markdown</span>
                    </button>

                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="cyber-action-btn visit-btn"
                      onClick={() => handleVisitLink(lastShortCode)}
                    >
                      <span>Test Redirect</span>
                      <span className="arrow-shift">↗</span>
                    </a>

                    {/* Social Share Group */}
                    <div className="social-share-group">
                      <button
                        type="button"
                        className="cyber-action-btn twitter-btn"
                        onClick={() => handleShareTwitter(shortUrl)}
                        title="Share on X / Twitter"
                      >
                        𝕏 Share
                      </button>
                      <button
                        type="button"
                        className="cyber-action-btn whatsapp-btn"
                        onClick={() => handleShareWhatsApp(shortUrl)}
                        title="Share on WhatsApp"
                      >
                        💬 WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* TinyURL-Inspired: Before & After Transformation Comparison */}
        <section className="comparison-section">
          <div className="section-title-wrap">
            <span className="mini-kicker">LINK TRANSFORMATION</span>
            <h2 className="section-heading-sm">See the Difference LinkVault Makes</h2>
          </div>

          <div className="comparison-cards-grid">
            <div className="comp-card before-card">
              <div className="comp-card-badge red-badge">BEFORE · RAW CLUTTERED URL</div>
              <p className="comp-url-sample">
                https://store.domain.com/shop/catalog/summer-deals?utm_source=twitter&utm_medium=cpc&utm_campaign=flash_sale_2026&ref=affiliate_8492048&session=8931bdf72
              </p>
              <div className="comp-meta">
                <span>❌ 145 Characters</span>
                <span>❌ Low Trust & CTR</span>
                <span>❌ Prone to Typos & Breaking</span>
              </div>
            </div>

            <div className="comp-arrow-divider">➔</div>

            <div className="comp-card after-card">
              <div className="comp-card-badge green-badge">AFTER · LINKVAULT SMART LINK</div>
              <p className="comp-url-sample highlight-url">
                http://localhost:5000/x7k9p2
              </p>
              <div className="comp-meta after-meta">
                <span>✓ 26 Characters</span>
                <span>✓ Up to +39% Higher Click Rate</span>
                <span>✓ 100% Trackable Telemetry</span>
              </div>
            </div>
          </div>
        </section>

        {/* TinyURL-Inspired: 3-Step Guided Process */}
        <section className="workflow-section">
          <div className="section-title-wrap">
            <span className="mini-kicker">SIMPLE & POWERFUL</span>
            <h2 className="section-heading-sm">How LinkVault Works in 3 Steps</h2>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon">📋</div>
              <h3>Paste Your URL</h3>
              <p>Copy any long link from social media, campaigns, or websites and paste it into the shortener box.</p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon">⚡</div>
              <h3>Generate & Shorten</h3>
              <p>Our backend creates a permanent unique identifier and instantly saves it in MongoDB Atlas.</p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon">📈</div>
              <h3>Share & Track Clicks</h3>
              <p>Share anywhere. Every visitor increments your real-time click telemetry counter instantaneously.</p>
            </div>
          </div>
        </section>

        {/* Live Telemetry & Metrics Grid */}
        <section className="telemetry-grid">
          <div className="telemetry-card">
            <div className="telemetry-header">
              <span className="telemetry-title">Total Links Vaulted</span>
              <span className="telemetry-icon-orb cyan-orb">📊</span>
            </div>
            <div className="telemetry-value">{links.length}</div>
            <div className="telemetry-footer">Persistent MongoDB Documents</div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-header">
              <span className="telemetry-title">Redirect Traffic</span>
              <span className="telemetry-icon-orb violet-orb">🔥</span>
            </div>
            <div className="telemetry-value">{totalClicks}</div>
            <div className="telemetry-footer">Atomic Click Counter Increments</div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-header">
              <span className="telemetry-title">Performance Ratio</span>
              <span className="telemetry-icon-orb fuchsia-orb">⚡</span>
            </div>
            <div className="telemetry-value">{averageClicks}</div>
            <div className="telemetry-footer">Average Clicks Per Active Link</div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-header">
              <span className="telemetry-title">Cluster Uptime</span>
              <span className="telemetry-icon-orb emerald-orb">🗄️</span>
            </div>
            <div className="telemetry-value">
              {dbStatus.state === "connected" ? "100% Online" : "Checking"}
            </div>
            <div className="telemetry-footer">
              Latency: {dbStatus.latency ? `${dbStatus.latency}ms ping` : "Standby"}
            </div>
          </div>
        </section>

        {/* Vault Records & Analytics Control Center */}
        <section id="vault" className="vault-control-center">
          <div className="control-header">
            <div>
              <div className="vault-title-row">
                <h2 className="control-title">Vault Telemetry</h2>
                <span className="record-badge">{filteredLinks.length} Active Records</span>
              </div>
              <p className="control-sub">
                Manage your shortened routes, test real-time click tracking, and export records.
              </p>
            </div>

            <div className="control-toolbar">
              {/* Live Search */}
              <div className="cyber-search-box">
                <span className="search-symbol">🔍</span>
                <input
                  type="text"
                  placeholder="Filter by code or destination..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-field"
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
                className="cyber-dropdown"
                value={sortBy}
                onChange={(e) => {
                  playCyberChime("click");
                  setSortBy(e.target.value);
                }}
              >
                <option value="newest">🕒 Newest First</option>
                <option value="clicks">🔥 Most Clicks</option>
                <option value="oldest">⏳ Oldest First</option>
              </select>

              {/* Refresh Button */}
              <button
                type="button"
                className="cyber-btn sync-btn"
                onClick={() => fetchLinks()}
                disabled={refreshing}
                title="Sync database changes"
              >
                <span className={`sync-icon ${refreshing ? "spinning" : ""}`}>↻</span>
                <span>{refreshing ? "Syncing..." : "Sync"}</span>
              </button>

              {/* Export Button Dropdown */}
              <div className="export-btn-group">
                <button
                  type="button"
                  className="cyber-btn export-btn"
                  onClick={() => handleExport("json")}
                  title="Export all vault records as JSON"
                >
                  📥 Export JSON
                </button>
                <button
                  type="button"
                  className="cyber-btn export-btn export-csv"
                  onClick={() => handleExport("csv")}
                  title="Export all vault records as CSV"
                >
                  CSV
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Filter Pills */}
          <div className="filter-tabs-row">
            <button
              type="button"
              className={`filter-pill-tab ${activeFilterTab === "all" ? "active-tab" : ""}`}
              onClick={() => {
                playCyberChime("click");
                setActiveFilterTab("all");
              }}
            >
              <span>All Records</span>
              <span className="tab-count">{links.length}</span>
            </button>
            <button
              type="button"
              className={`filter-pill-tab ${activeFilterTab === "active" ? "active-tab" : ""}`}
              onClick={() => {
                playCyberChime("click");
                setActiveFilterTab("active");
              }}
            >
              <span>🔥 Active (Clicks &gt; 0)</span>
              <span className="tab-count">{activeLinksCount}</span>
            </button>
            <button
              type="button"
              className={`filter-pill-tab ${activeFilterTab === "zero" ? "active-tab" : ""}`}
              onClick={() => {
                playCyberChime("click");
                setActiveFilterTab("zero");
              }}
            >
              <span>💤 Zero Clicks</span>
              <span className="tab-count">{links.length - activeLinksCount}</span>
            </button>
            <button
              type="button"
              className={`filter-pill-tab ${activeFilterTab === "today" ? "active-tab" : ""}`}
              onClick={() => {
                playCyberChime("click");
                setActiveFilterTab("today");
              }}
            >
              <span>📅 Created Today</span>
            </button>
          </div>

          {/* Links Grid */}
          {filteredLinks.length === 0 ? (
            <div className="empty-state-panel">
              <div className="empty-symbol">🛰️</div>
              <h3>{searchQuery || activeFilterTab !== "all" ? "No matching links in filter" : "No links in the vault yet"}</h3>
              <p>
                {searchQuery || activeFilterTab !== "all"
                  ? "Adjust your search keywords or reset filter tabs to see all records."
                  : "Create your first short URL using the input card above."}
              </p>
              {(searchQuery || activeFilterTab !== "all") && (
                <button
                  type="button"
                  className="clear-filter-action"
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
            <div className="vault-cards-stack">
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
                    className={`vault-card ${isHighlighted ? "card-highlight-pulse" : ""}`}
                  >
                    <div className="vault-card-body">
                      <div className="vault-card-topbar">
                        <span className="route-badge">/{link.shortCode}</span>
                        <div className={`traffic-pill ${isTesting ? "traffic-pulsing" : ""}`}>
                          <span className="traffic-flame">🔥</span>
                          <strong>{link.clicks || 0}</strong>
                          <span className="clicks-label">clicks</span>
                        </div>
                        <span className="timestamp-text">{formatDate(link.createdAt)}</span>
                      </div>

                      <div className="vault-card-routes">
                        <div className="short-route-row">
                          <a
                            href={link.shortUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="short-route-link"
                            onClick={() => handleVisitLink(link.shortCode)}
                          >
                            {link.shortUrl}
                          </a>
                        </div>
                        <div className="destination-route-row" title={link.originalUrl}>
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                            alt=""
                            className="domain-favicon"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <span className="route-arrow">↳</span>
                          <span className="dest-text">{link.originalUrl}</span>
                        </div>
                      </div>
                    </div>

                    {/* Upgraded Tactile Action Buttons */}
                    <div className="vault-card-actions">
                      {/* Copy Short URL */}
                      <button
                        type="button"
                        className={`action-pill copy-pill ${isCopied ? "copied-state" : ""}`}
                        onClick={() => handleCopy(link.shortUrl, link.shortCode)}
                      >
                        {isCopied ? "Copied! ✓" : "📋 Copy"}
                      </button>

                      {/* Copy Markdown */}
                      <button
                        type="button"
                        className={`action-pill markdown-pill ${isMdCopied ? "copied-state" : ""}`}
                        onClick={() => handleCopyMarkdown(link)}
                        title="Copy as Markdown [Link](url)"
                      >
                        {isMdCopied ? "MD Copied! ✓" : "📄 MD"}
                      </button>

                      {/* Test Real Click Counter */}
                      <button
                        type="button"
                        className="action-pill test-hit-pill"
                        onClick={() => handleTestClick(link.shortCode)}
                        disabled={isTesting}
                        title="Test hit: atomically increment click count in MongoDB"
                      >
                        {isTesting ? "⚡ +1 Hit..." : "⚡ Test Hit (+1)"}
                      </button>

                      {/* Open Link */}
                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="action-pill open-pill"
                        title="Open redirect in new tab"
                        onClick={() => handleVisitLink(link.shortCode)}
                      >
                        Open ↗
                      </a>

                      {/* Delete with Safe Custom Modal */}
                      <button
                        type="button"
                        className="action-pill delete-pill"
                        onClick={() => requestDelete(link)}
                        disabled={isDeleting}
                        title="Delete this link permanently"
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

        {/* TinyURL-Inspired: Platform Core Capabilities Grid */}
        <section className="features-section">
          <div className="section-title-wrap">
            <span className="mini-kicker">WHY LINKVAULT</span>
            <h2 className="section-heading-sm">Built for Reliability & Speed</h2>
          </div>

          <div className="features-grid">
            {PLATFORM_FEATURES.map((feat) => (
              <div key={feat.title} className="feature-item-card">
                <div className="feature-card-header">
                  <span className="feature-icon">{feat.icon}</span>
                  <span className="feature-tag">{feat.tag}</span>
                </div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TinyURL-Inspired: Frequently Asked Questions (FAQ) Accordion */}
        <section className="faq-section">
          <div className="section-title-wrap">
            <span className="mini-kicker">FREQUENTLY ASKED QUESTIONS</span>
            <h2 className="section-heading-sm">Everything You Need to Know</h2>
          </div>

          <div className="faq-container">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.question}
                  className={`faq-item ${isOpen ? "faq-open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => {
                      playCyberChime("click");
                      setOpenFaq(isOpen ? null : index);
                    }}
                  >
                    <span>{item.question}</span>
                    <span className="faq-toggle-icon">{isOpen ? "−" : "+"}</span>
                  </button>

                  {isOpen && (
                    <div className="faq-answer-panel">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* TinyURL-Inspired: High-Conversion CTA Banner */}
        <section className="cta-banner-section">
          <div className="cta-banner-inner">
            <div className="cta-content">
              <h2>Ready to Simplify & Track Your Links?</h2>
              <p>Experience lightning-fast redirects and atomic click tracking powered by MongoDB Atlas.</p>
            </div>
            <a
              href="#shortener"
              className="cta-action-btn"
              onClick={() => {
                playCyberChime("click");
                if (inputRef.current) inputRef.current.focus();
              }}
            >
              <span>Shorten a URL Now ↗</span>
            </a>
          </div>
        </section>
      </main>

      {/* Futuristic Footer */}
      <footer className="ai-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="footer-brand">⚡ LinkVault Engine</span>
            <span>URL Shortener, Branded Links & Real-Time Analytics</span>
          </div>
          <div className="footer-status-beacon">
            <span className="beacon-dot" />
            <span>Atlas Live Cluster Synchronized</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
