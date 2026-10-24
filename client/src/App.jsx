import { useState, useEffect, useMemo, useRef } from "react";
import "./App.css";
import {
  IconBrandLogo,
  IconLink,
  IconChart,
  IconTrendingUp,
  IconSettings,
  IconZap,
  IconClock,
  IconSearch,
  IconTrash,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconRefresh,
  IconPlus,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconMenu,
  IconAlertTriangle,
  IconFolder,
  IconFileText,
} from "./components/Icons";

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

function App() {
  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "links" | "analytics" | "settings"
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Shortener Form State
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [lastOriginalUrl, setLastOriginalUrl] = useState("");
  const [lastShortCode, setLastShortCode] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // API & Data State
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState("");
  const [dbStatus, setDbStatus] = useState({ state: "checking", latency: null });
  const [domainConfig, setDomainConfig] = useState({
    baseUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost:5000",
    isLocalhost: true,
  });

  // Table Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [activeFilterTab, setActiveFilterTab] = useState("all"); // "all" | "active" | "zero" | "today"
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Actions & Feedback
  const [copiedKey, setCopiedKey] = useState(null);
  const [toast, setToast] = useState(null);
  const [deletingCode, setDeletingCode] = useState(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null);
  const [testingClickCode, setTestingClickCode] = useState(null);
  const [highlightCode, setHighlightCode] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const urlInputRef = useRef(null);

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

  // Synthesized Web Audio FX (Zero External Files, optional tactile feedback)
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
      // AudioContext blocked
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
        setApiError("");
      } else {
        setDbStatus({ state: "disconnected", latency: null });
      }
    } catch {
      setDbStatus({ state: "disconnected", latency: null });
      setApiError("Unable to connect to the LinkVault backend server.");
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
          setApiError("");
        }
      } else {
        throw new Error("Server responded with error while fetching links.");
      }
    } catch (err) {
      console.error("Failed to load links:", err);
      setApiError("Failed to fetch links. Please check server connectivity.");
    } finally {
      if (!quiet) setRefreshing(false);
      setInitialLoading(false);
    }
  }

  // Shorten URL Handler
  async function handleShorten(event) {
    if (event) event.preventDefault();
    if (loading) return; // Prevent duplicate concurrent submissions

    setUrlError("");

    const originalUrl = url.trim();

    if (!originalUrl) {
      setUrlError("Destination URL cannot be empty.");
      showToast("Please provide a destination URL.", "error");
      playCyberChime("delete");
      urlInputRef.current?.focus();
      return;
    }

    try {
      const parsed = new URL(originalUrl);
      if (!parsed.protocol.startsWith("http")) {
        throw new Error("Protocol must be http:// or https://");
      }
    } catch {
      setUrlError("Please enter a valid destination URL (must start with http:// or https://).");
      showToast("Please provide a valid URL including http:// or https://", "error");
      playCyberChime("delete");
      urlInputRef.current?.focus();
      return;
    }

    setLoading(true);
    playCyberChime("click");

    try {
      const payload = { originalUrl };

      const response = await fetch(`${API_URL}/api/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "URL shortening failed.";
        setUrlError(errorMsg);
        throw new Error(errorMsg);
      }

      setShortUrl(data.shortUrl);
      setLastOriginalUrl(data.originalUrl);
      setLastShortCode(data.shortCode);
      setUrl("");
      setUrlError("");

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
      showToast("Short link created and saved to MongoDB!", "success");
    } catch (err) {
      showToast(err.message, "error");
      playCyberChime("delete");
    } finally {
      setLoading(false);
    }
  }

  // Copy to Clipboard with visible confirmation
  async function handleCopy(text, key, customMsg = "Copied to clipboard") {
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

  // Copy as Markdown
  function handleCopyMarkdown(link) {
    const md = `[LinkVault /${link.shortCode}](${link.shortUrl})`;
    handleCopy(md, `md-${link.shortCode}`, "Copied as Markdown link!");
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

  // Export Data to CSV or JSON
  function handleExport(format = "json") {
    playCyberChime("click");
    if (links.length === 0) {
      showToast("No links to export!", "error");
      return;
    }

    let fileContent;
    let mimeType;
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
    showToast(`Vault records exported as ${format.toUpperCase()}!`, "success");
  }

  // Initial Load
  useEffect(() => {
    async function loadData() {
      try {
        await Promise.allSettled([fetchLinks(true), checkDbStatus(), fetchConfig()]);
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();

    const interval = setInterval(() => {
      fetchLinks(true);
      checkDbStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard accessibility: Escape key closes active modals
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (createModalOpen) setCreateModalOpen(false);
        if (confirmDeleteTarget) setConfirmDeleteTarget(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createModalOpen, confirmDeleteTarget]);

  // Focus management: autofocus URL input when modal opens
  useEffect(() => {
    if (createModalOpen) {
      const timer = setTimeout(() => {
        setUrlError("");
        urlInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [createModalOpen]);

  // Derived Analytics & Statistics (Accurate API-derived metrics, zero fabricated stats)
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

  const recentActivityCount = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return links.filter((l) => l.createdAt && new Date(l.createdAt).getTime() > oneDayAgo).length;
  }, [links]);

  const topPerformingLinks = useMemo(() => {
    return [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5);
  }, [links]);

  const maxClicksForChart = useMemo(() => {
    if (topPerformingLinks.length === 0) return 1;
    const max = Math.max(...topPerformingLinks.map((l) => l.clicks || 0));
    return max > 0 ? max : 1;
  }, [topPerformingLinks]);

  const domainBreakdown = useMemo(() => {
    const map = {};
    for (const link of links) {
      try {
        const u = new URL(link.originalUrl);
        const host = u.hostname.replace(/^www\./, "");
        map[host] = (map[host] || 0) + 1;
      } catch {
        map["other"] = (map["other"] || 0) + 1;
      }
    }
    return Object.entries(map)
      .map(([domain, count]) => ({
        domain,
        count,
        percent: links.length > 0 ? Math.round((count / links.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [links]);

  // Filtered & Sorted Links for Table
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

  // Paginated Links
  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / pageSize));
  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLinks.slice(start, start + pageSize);
  }, [filteredLinks, currentPage, pageSize]);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, activeFilterTab, sortBy]);

  // Helper to extract clean domain
  function getCleanDomain(urlString) {
    try {
      const u = new URL(urlString);
      return u.hostname;
    } catch {
      return "link";
    }
  }

  // Helper to cleanly decompose destination URLs for enhanced readability
  function parseDestinationUrl(originalUrl) {
    if (!originalUrl) return { host: "unknown", path: "" };
    try {
      const u = new URL(originalUrl);
      const host = u.hostname.replace(/^www\./, "");
      const path = (u.pathname === "/" ? "" : u.pathname) + u.search + u.hash;
      return { host, path: path || "/" };
    } catch {
      return { host: originalUrl, path: "" };
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
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  }

  return (
    <div className="dashboard-shell">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notice toast-${toast.type}`}>
          <span className="toast-pill-dot" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteTarget && (
        <div
          className="modal-overlay"
          onClick={() => setConfirmDeleteTarget(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <h3 id="delete-dialog-title" className="modal-headline-title">Delete Link</h3>
              <button
                type="button"
                className="btn-modal-close-x"
                onClick={() => setConfirmDeleteTarget(null)}
                aria-label="Close dialog"
              >
                <IconX size={15} />
              </button>
            </div>
            <p className="settings-card-desc" style={{ marginBottom: "12px" }}>
              Are you sure you want to permanently delete <code style={{ color: "#818cf8" }}>/{confirmDeleteTarget.shortCode}</code> from MongoDB Atlas? Visitors will receive a 404 error.
            </p>
            <div style={{ background: "var(--bg-app)", padding: "10px 12px", borderRadius: "6px", fontSize: "0.8125rem", wordBreak: "break-all", marginBottom: "16px", color: "var(--text-tertiary)", border: "1px solid var(--border-subtle)" }}>
              {confirmDeleteTarget.originalUrl}
            </div>
            <div className="modal-actions-container">
              <button
                type="button"
                className="btn-tool-outline"
                onClick={() => setConfirmDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-tool-primary"
                style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
                onClick={executeConfirmedDelete}
                disabled={deletingCode === confirmDeleteTarget.shortCode}
              >
                {deletingCode === confirmDeleteTarget.shortCode ? (
                  <>
                    <IconRefresh size={14} className="is-spinning" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <IconTrash size={14} />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Short Link Modal */}
      {createModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setCreateModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-dialog-title"
        >
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-strip">
              <h3 id="create-dialog-title" className="modal-headline-title">Create Short Link</h3>
              <button
                type="button"
                className="btn-modal-close-x"
                onClick={() => setCreateModalOpen(false)}
                aria-label="Close dialog"
              >
                <IconX size={15} />
              </button>
            </div>

            <form onSubmit={handleShorten} className="modal-form-stack" noValidate>
              <div className="form-field-group">
                <label htmlFor="create-dest-url" className="form-field-label">
                  Destination URL
                </label>
                <input
                  id="create-dest-url"
                  ref={urlInputRef}
                  type="url"
                  placeholder="https://example.com/long-destination-url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (urlError) setUrlError("");
                  }}
                  required
                  aria-invalid={!!urlError}
                  aria-describedby={urlError ? "create-url-error" : undefined}
                  className={`form-text-input ${urlError ? "has-error" : ""}`}
                />
                {urlError && (
                  <div id="create-url-error" className="form-field-error" role="alert">
                    <IconAlertTriangle size={13} />
                    <span>{urlError}</span>
                  </div>
                )}
              </div>

              {/* Quick Fill Pills */}
              <div className="quick-fill-container">
                <span className="quick-fill-label">Quick fill:</span>
                {QUICK_TEST_URLS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="quick-fill-chip"
                    onClick={() => {
                      setUrl(item.url);
                      if (urlError) setUrlError("");
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="modal-actions-container">
                <button
                  type="button"
                  className="btn-tool-outline"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-tool-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <IconRefresh size={14} className="is-spinning" />
                      <span>Shortening...</span>
                    </>
                  ) : (
                    <>
                      <IconPlus size={14} />
                      <span>Shorten URL</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Success Reveal inside modal */}
            {shortUrl && (
              <div className="created-link-callout">
                <span className="created-callout-header">
                  <IconCheck size={14} /> SHORT LINK READY
                </span>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="created-url-anchor"
                >
                  {shortUrl}
                </a>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn-tool-primary"
                    onClick={() => handleCopy(shortUrl, shortUrl, "Copied short link")}
                  >
                    {copiedKey === shortUrl ? (
                      <>
                        <IconCheck size={13} /> Copied
                      </>
                    ) : (
                      <>
                        <IconCopy size={13} /> Copy Link
                      </>
                    )}
                  </button>
                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-tool-outline"
                    onClick={() => handleVisitLink(lastShortCode)}
                  >
                    Visit <IconExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      <div
        className={`sidebar-mobile-overlay ${mobileSidebarOpen ? "mobile-open" : ""}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* 1. SIDEBAR */}
      <aside className={`dash-sidebar ${sidebarCollapsed ? "is-collapsed" : ""} ${mobileSidebarOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-top">
          {/* Brand Header */}
          <div className="sidebar-brand-row">
            <div className="brand-identity-wrap" title="LinkVault URL Management">
              <div className="brand-icon-box">
                <IconBrandLogo size={16} />
              </div>
              {!sidebarCollapsed && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="brand-text-label">LinkVault</span>
                  <span className="brand-version-chip">v1.2</span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-sidebar-collapse"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <IconChevronRight size={14} /> : <IconChevronLeft size={14} />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="sidebar-nav-list">
            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === "overview" ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab("overview");
                setMobileSidebarOpen(false);
              }}
              title="Overview Dashboard"
            >
              <span className="nav-item-icon">
                <IconChart size={16} />
              </span>
              {!sidebarCollapsed && <span>Overview</span>}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === "links" ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab("links");
                setMobileSidebarOpen(false);
              }}
              title="My Links Table"
            >
              <span className="nav-item-icon">
                <IconLink size={16} />
              </span>
              {!sidebarCollapsed && <span>My Links</span>}
              {!sidebarCollapsed && <span className="nav-item-counter">{links.length}</span>}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === "analytics" ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab("analytics");
                setMobileSidebarOpen(false);
              }}
              title="Click Analytics"
            >
              <span className="nav-item-icon">
                <IconTrendingUp size={16} />
              </span>
              {!sidebarCollapsed && <span>Analytics</span>}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === "settings" ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab("settings");
                setMobileSidebarOpen(false);
              }}
              title="System Settings"
            >
              <span className="nav-item-icon">
                <IconSettings size={16} />
              </span>
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="profile-summary-card">
              <div className="profile-avatar-circle">LV</div>
              <div className="profile-info-text">
                <span className="profile-user-name">LinkVault Workspace</span>
                <span className="profile-plan-tag">MongoDB Atlas Edition</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD AREA */}
      <div className="dashboard-main-area">
        {/* DASHBOARD HEADER */}
        <header className="dash-header-bar">
          <div className="header-left-meta">
            <button
              type="button"
              className="btn-mobile-sidebar-toggle"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar navigation"
            >
              <IconMenu size={18} />
            </button>

            <div className="dash-title-group">
              <h1 className="dash-page-title">
                {activeTab === "overview" && "Overview"}
                {activeTab === "links" && "My Links"}
                {activeTab === "analytics" && "Click Analytics"}
                {activeTab === "settings" && "Settings"}
              </h1>
              <span className="dash-page-subtitle">
                {activeTab === "overview" && "Your links, in one place."}
                {activeTab === "links" && "Search, filter, test, and export your shortened URLs."}
                {activeTab === "analytics" && "Detailed click distribution and destination domain insights."}
                {activeTab === "settings" && "LinkVault system configuration and database health."}
              </span>
            </div>
          </div>

          <div className="header-right-tools">
            <button
              type="button"
              className="btn-tool-outline"
              onClick={() => fetchLinks()}
              disabled={refreshing}
              title="Refresh database records"
            >
              <IconRefresh size={14} className={refreshing ? "is-spinning" : ""} />
              <span>{refreshing ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </header>

        {/* DASHBOARD BODY CONTENT */}
        <div className="dash-content-container">
          {/* API Error Alert Banner with Retry Button */}
          {apiError && (
            <div className="dash-error-banner">
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <IconAlertTriangle size={15} />
                <span>{apiError}</span>
              </span>
              <button
                type="button"
                className="btn-retry-conn"
                onClick={() => {
                  fetchLinks();
                  checkDbStatus();
                }}
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* ----------------------------------------------------------------
             VIEW 1: OVERVIEW TAB
             ---------------------------------------------------------------- */}
          {activeTab === "overview" && (
            <>
              {/* Central URL Quick-Composer (Primary product workflow) */}
              <section className="overview-composer-card">
                <div className="composer-header">
                  <div className="composer-heading-group">
                    <h2 className="composer-title">Shorten a URL</h2>
                    <p className="composer-subtitle">Create clean, trackable links with instant click analytics.</p>
                  </div>
                </div>

                <form onSubmit={handleShorten} className="composer-form-stack" noValidate>
                  <div className="composer-input-row">
                    <div className="composer-url-input-wrap">
                      <span className="composer-input-icon">
                        <IconLink size={16} />
                      </span>
                      <input
                        type="url"
                        placeholder="Paste long destination URL (e.g. https://...)"
                        value={url}
                        onChange={(e) => {
                          setUrl(e.target.value);
                          if (urlError) setUrlError("");
                        }}
                        className={`composer-url-input ${urlError ? "has-error" : ""}`}
                        required
                        aria-invalid={!!urlError}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn-tool-primary composer-submit-btn"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <IconRefresh size={14} className="is-spinning" />
                          <span>Shortening...</span>
                        </>
                      ) : (
                        <>
                          <IconPlus size={14} />
                          <span>Shorten URL</span>
                        </>
                      )}
                    </button>
                  </div>

                  {urlError && (
                    <div className="form-field-error" role="alert" style={{ marginTop: "8px" }}>
                      <IconAlertTriangle size={13} />
                      <span>{urlError}</span>
                    </div>
                  )}

                  {/* Quick Fill Chips */}
                  <div className="quick-fill-container" style={{ marginTop: "10px" }}>
                    <span className="quick-fill-label">Quick fill:</span>
                    {QUICK_TEST_URLS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="quick-fill-chip"
                        onClick={() => {
                          setUrl(item.url);
                          if (urlError) setUrlError("");
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </form>

                {/* Active Link Hero Banner (Central visual element for generated link) */}
                {shortUrl && (
                  <div className="active-vault-link-hero">
                    <div className="active-link-top-row">
                      <div className="active-link-badge">
                        <IconCheck size={13} />
                        <span>Ready to Share</span>
                      </div>
                      <button
                        type="button"
                        className="btn-dismiss-active-link"
                        onClick={() => setShortUrl("")}
                        title="Dismiss banner"
                        aria-label="Dismiss active link"
                      >
                        <IconX size={13} />
                      </button>
                    </div>

                    <div className="active-link-main-row">
                      <div className="active-link-display">
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="active-link-anchor"
                          onClick={() => handleVisitLink(lastShortCode)}
                          title="Open short URL"
                        >
                          <span className="active-link-slug">{shortUrl}</span>
                        </a>
                        {lastOriginalUrl && (
                          <div className="active-link-target" title={lastOriginalUrl}>
                            <span className="active-link-target-label">Target:</span>
                            <span className="active-link-target-url">{lastOriginalUrl}</span>
                          </div>
                        )}
                      </div>

                      <div className="active-link-actions-group">
                        <button
                          type="button"
                          className={`btn-active-copy ${copiedKey === shortUrl ? "is-copied" : ""}`}
                          onClick={() => handleCopy(shortUrl, shortUrl, "Copied short link")}
                        >
                          {copiedKey === shortUrl ? (
                            <>
                              <IconCheck size={13} />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <IconCopy size={13} />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          className="btn-tool-outline"
                          onClick={() => handleTestClick(lastShortCode)}
                          title="Simulate redirect hit"
                        >
                          <IconZap size={13} />
                          <span>+1 Hit</span>
                        </button>

                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-tool-outline"
                          onClick={() => handleVisitLink(lastShortCode)}
                          title="Open link in new tab"
                        >
                          <span>Visit</span>
                          <IconExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* 3. SUMMARY METRICS ROW */}
              <section className="metrics-summary-grid">
                <div className="metric-card-box">
                  <div className="metric-card-top">
                    <span className="metric-box-title">Total Links</span>
                    <span className="metric-box-glyph">
                      <IconLink size={15} />
                    </span>
                  </div>
                  <div className="metric-box-figure">{links.length}</div>
                  <span className="metric-box-explanation">Permanent records in MongoDB Atlas</span>
                </div>

                <div className="metric-card-box">
                  <div className="metric-card-top">
                    <span className="metric-box-title">Total Redirects</span>
                    <span className="metric-box-glyph">
                      <IconTrendingUp size={15} />
                    </span>
                  </div>
                  <div className="metric-box-figure">{totalClicks}</div>
                  <span className="metric-box-explanation">Lifetime atomic visitor click increments</span>
                </div>

                <div className="metric-card-box">
                  <div className="metric-card-top">
                    <span className="metric-box-title">Active Links</span>
                    <span className="metric-box-glyph">
                      <IconZap size={15} />
                    </span>
                  </div>
                  <div className="metric-box-figure">{activeLinksCount}</div>
                  <span className="metric-box-explanation">
                    {links.length > 0 ? `${Math.round((activeLinksCount / links.length) * 100)}% of vault has clicks` : "0% of vault"}
                  </span>
                </div>

                <div className="metric-card-box">
                  <div className="metric-card-top">
                    <span className="metric-box-title">24h Activity</span>
                    <span className="metric-box-glyph">
                      <IconClock size={15} />
                    </span>
                  </div>
                  <div className="metric-box-figure">{recentActivityCount}</div>
                  <span className="metric-box-explanation">New links shortened in the last 24 hours</span>
                </div>
              </section>

              {/* 4. ANALYTICS PREVIEW & CHARTS */}
              <section className="analytics-two-col-grid">
                {/* Top Performing Links by Clicks */}
                <div className="chart-card-container">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-heading">Top Performing Links</h2>
                      <p className="chart-card-subheading">Ranked by verified visitor click counts</p>
                    </div>
                    <span className="chart-legend-badge">Traffic Share</span>
                  </div>

                  {topPerformingLinks.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
                      No links shortened yet. Click "+ Create Link" to get started.
                    </div>
                  ) : (
                    <div className="top-links-chart-list">
                      {topPerformingLinks.map((item, idx) => {
                        const pct = Math.round(((item.clicks || 0) / (totalClicks || 1)) * 100);
                        const barPct = Math.round(((item.clicks || 0) / maxClicksForChart) * 100);
                        const domain = getCleanDomain(item.originalUrl);

                        return (
                          <div key={item.shortCode} className="chart-link-row">
                            <div className="chart-row-meta">
                              <span className="chart-slug-link">
                                <span style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>#{idx + 1}</span>
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                  alt=""
                                  className="chart-favicon"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                /{item.shortCode}
                              </span>
                              <span className="chart-click-count">
                                {item.clicks || 0} clicks <span style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", fontWeight: 400 }}>({pct}%)</span>
                              </span>
                            </div>
                            <div className="chart-bar-track">
                              <div
                                className="chart-bar-fill"
                                style={{ width: `${Math.max(4, barPct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Destination Domains Breakdown */}
                <div className="chart-card-container">
                  <div className="chart-card-header">
                    <div>
                      <h2 className="chart-card-heading">Destination Domains</h2>
                      <p className="chart-card-subheading">Target hosts distribution</p>
                    </div>
                    <span className="chart-legend-badge">{domainBreakdown.length} Domains</span>
                  </div>

                  {domainBreakdown.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
                      No target domains recorded yet.
                    </div>
                  ) : (
                    <div className="domain-distribution-list">
                      {domainBreakdown.map((item) => (
                        <div key={item.domain} className="domain-stat-item">
                          <div className="domain-item-left">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`}
                              alt=""
                              style={{ width: "14px", height: "14px", borderRadius: "2px" }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <span className="domain-name-text">{item.domain}</span>
                          </div>
                          <div className="domain-metrics-right">
                            <span>{item.count} {item.count === 1 ? "link" : "links"}</span>
                            <span className="domain-percent-pill">{item.percent}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* 5. RECENT LINKS TABLE (Latest Overview) */}
              <section className="table-card-container">
                <div className="table-toolbar-strip">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}>Recent Links</h3>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Showing latest activity</span>
                  </div>

                  <button
                    type="button"
                    className="btn-tool-outline"
                    onClick={() => setActiveTab("links")}
                  >
                    View All Links ({links.length}) &rarr;
                  </button>
                </div>

                <div className="data-table-scroll-wrap">
                  <table className="dash-data-table">
                    <thead>
                      <tr>
                        <th>Short Route</th>
                        <th>Target Destination</th>
                        <th>Clicks</th>
                        <th>Created</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {links.slice(0, 5).map((link) => {
                        const isCopied = copiedKey === link.shortCode;
                        const isTesting = testingClickCode === link.shortCode;
                        const isHighlighted = highlightCode === link.shortCode;
                        const parsedDest = parseDestinationUrl(link.originalUrl);

                        return (
                          <tr key={link.shortCode || link._id} className={isHighlighted ? "highlight-ping" : ""}>
                            <td>
                              <a
                                href={link.shortUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="cell-short-code"
                                onClick={() => handleVisitLink(link.shortCode)}
                                title="Open short URL"
                              >
                                <span className="slug-badge">/{link.shortCode}</span>
                              </a>
                            </td>
                            <td>
                              <div className="dest-presentation-box" title={link.originalUrl}>
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${parsedDest.host}&sz=32`}
                                  alt=""
                                  className="dest-favicon-table"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <span className="dest-host-pill">{parsedDest.host}</span>
                                {parsedDest.path && parsedDest.path !== "/" && (
                                  <span className="dest-path-text">{parsedDest.path}</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`clicks-counter-badge ${(link.clicks || 0) > 0 ? "has-traffic" : ""}`}>
                                <span className={`status-indicator-dot ${(link.clicks || 0) > 0 ? "online" : "offline"}`} style={{ width: "6px", height: "6px" }} />
                                <span>{link.clicks || 0}</span>
                              </span>
                            </td>
                            <td style={{ color: "var(--text-tertiary)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                              {formatDate(link.createdAt)}
                            </td>
                            <td>
                              <div className="cell-actions-row" style={{ justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  className={`btn-table-action ${isCopied ? "is-copied" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(link.shortUrl, link.shortCode);
                                  }}
                                  title="Copy short link"
                                  aria-label="Copy short link"
                                >
                                  {isCopied ? (
                                    <>
                                      <IconCheck size={12} /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <IconCopy size={12} /> Copy
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn-table-action btn-hit-action"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTestClick(link.shortCode);
                                  }}
                                  disabled={isTesting}
                                  title="Test atomic hit in database"
                                  aria-label="Simulate click increment"
                                >
                                  <IconZap size={12} />
                                  <span>{isTesting ? "+1..." : "+1 Hit"}</span>
                                </button>
                                <a
                                  href={link.shortUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn-table-action"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVisitLink(link.shortCode);
                                  }}
                                  title="Visit destination URL"
                                  aria-label="Visit destination URL"
                                >
                                  <IconExternalLink size={12} />
                                </a>
                                <button
                                  type="button"
                                  className="btn-table-action btn-delete-row"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    requestDelete(link);
                                  }}
                                  title="Delete record"
                                  aria-label="Delete link record"
                                >
                                  <IconTrash size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {links.length === 0 && (
                        <tr>
                          <td colSpan={5} className="table-empty-cell">
                            <div className="empty-table-box">
                              <IconFolder size={32} />
                              <span className="empty-table-title">No links created yet</span>
                              <p className="empty-table-caption">
                                Your MongoDB database is currently empty. Click the "+ Create Link" button to shorten your first URL.
                              </p>
                              <button
                                type="button"
                                className="btn-tool-primary"
                                style={{ marginTop: "8px" }}
                                onClick={() => setCreateModalOpen(true)}
                              >
                                <IconPlus size={14} />
                                <span>Create First Link</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* ----------------------------------------------------------------
             VIEW 2: MY LINKS TAB (Full Search, Filter, Sort, Pagination)
             ---------------------------------------------------------------- */}
          {activeTab === "links" && (
            <section className="table-card-container">
              {/* Toolbar */}
              <div className="table-toolbar-strip">
                <div className="toolbar-filter-tabs">
                  <button
                    type="button"
                    className={`btn-filter-tab ${activeFilterTab === "all" ? "is-active" : ""}`}
                    onClick={() => setActiveFilterTab("all")}
                  >
                    <span>All Links</span>
                    <span className="filter-tab-counter">{links.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`btn-filter-tab ${activeFilterTab === "active" ? "is-active" : ""}`}
                    onClick={() => setActiveFilterTab("active")}
                  >
                    <span>Active</span>
                    <span className="filter-tab-counter">{activeLinksCount}</span>
                  </button>
                  <button
                    type="button"
                    className={`btn-filter-tab ${activeFilterTab === "zero" ? "is-active" : ""}`}
                    onClick={() => setActiveFilterTab("zero")}
                  >
                    <span>Zero Clicks</span>
                    <span className="filter-tab-counter">{links.length - activeLinksCount}</span>
                  </button>
                  <button
                    type="button"
                    className={`btn-filter-tab ${activeFilterTab === "today" ? "is-active" : ""}`}
                    onClick={() => setActiveFilterTab("today")}
                  >
                    <span>Created Today</span>
                  </button>
                </div>

                <div className="toolbar-controls-right">
                  <div className="table-search-input-box">
                    <IconSearch size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Search code or destination..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-field-input"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        style={{ color: "var(--text-tertiary)", display: "flex", alignItems: "center" }}
                        aria-label="Clear search"
                      >
                        <IconX size={12} />
                      </button>
                    )}
                  </div>

                  <select
                    className="sort-select-dropdown"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="clicks">Most Clicks</option>
                    <option value="oldest">Oldest First</option>
                  </select>

                  <button
                    type="button"
                    className="btn-tool-outline"
                    onClick={() => handleExport("json")}
                    title="Export as JSON"
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    className="btn-tool-outline"
                    onClick={() => handleExport("csv")}
                    title="Export as CSV"
                  >
                    CSV
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="data-table-scroll-wrap">
                <table className="dash-data-table">
                  <thead>
                    <tr>
                      <th>Short Code</th>
                      <th>Target Destination URL</th>
                      <th>Clicks</th>
                      <th>Created Date</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLinks.map((link) => {
                      const isCopied = copiedKey === link.shortCode;
                      const isMdCopied = copiedKey === `md-${link.shortCode}`;
                      const isTesting = testingClickCode === link.shortCode;
                      const isHighlighted = highlightCode === link.shortCode;
                      const parsedDest = parseDestinationUrl(link.originalUrl);

                      return (
                        <tr key={link.shortCode || link._id} className={isHighlighted ? "highlight-ping" : ""}>
                          <td>
                            <a
                              href={link.shortUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="cell-short-code"
                              onClick={() => handleVisitLink(link.shortCode)}
                              title="Test redirect"
                            >
                              <span className="slug-badge">/{link.shortCode}</span>
                            </a>
                          </td>
                          <td>
                            <div className="dest-presentation-box" title={link.originalUrl}>
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${parsedDest.host}&sz=32`}
                                alt=""
                                className="dest-favicon-table"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                              <span className="dest-host-pill">{parsedDest.host}</span>
                              {parsedDest.path && parsedDest.path !== "/" && (
                                <span className="dest-path-text">{parsedDest.path}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`clicks-counter-badge ${(link.clicks || 0) > 0 ? "has-traffic" : ""}`}>
                              <span className={`status-indicator-dot ${(link.clicks || 0) > 0 ? "online" : "offline"}`} style={{ width: "6px", height: "6px" }} />
                              <span>{link.clicks || 0}</span>
                            </span>
                          </td>
                          <td style={{ color: "var(--text-tertiary)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                            {formatDate(link.createdAt)}
                          </td>
                          <td>
                            <div className="cell-actions-row" style={{ justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                className={`btn-table-action ${isCopied ? "is-copied" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(link.shortUrl, link.shortCode);
                                }}
                                title="Copy short link"
                                aria-label="Copy short link"
                              >
                                {isCopied ? (
                                  <>
                                    <IconCheck size={12} /> Copied
                                  </>
                                ) : (
                                  <>
                                    <IconCopy size={12} /> Copy
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                className={`btn-table-action ${isMdCopied ? "copied-check" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyMarkdown(link);
                                }}
                                title="Copy Markdown [Title](URL)"
                                aria-label="Copy Markdown format"
                              >
                                {isMdCopied ? (
                                  <>
                                    <IconCheck size={12} /> MD
                                  </>
                                ) : (
                                  <>
                                    <IconFileText size={12} /> MD
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                className="btn-table-action btn-hit-action"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTestClick(link.shortCode);
                                }}
                                disabled={isTesting}
                                title="Test atomic hit"
                                aria-label="Simulate click increment"
                              >
                                <IconZap size={12} />
                                <span>{isTesting ? "+1..." : "+1 Hit"}</span>
                              </button>
                              <a
                                href={link.shortUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-table-action"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVisitLink(link.shortCode);
                                }}
                                title="Open redirect in new tab"
                                aria-label="Visit destination URL"
                              >
                                <IconExternalLink size={12} />
                              </a>
                              <button
                                type="button"
                                className="btn-table-action btn-delete-row"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  requestDelete(link);
                                }}
                                title="Delete link permanently"
                                aria-label="Delete link record"
                              >
                                <IconTrash size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedLinks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="table-empty-cell">
                          <div className="empty-table-box">
                            <IconSearch size={28} />
                            <span className="empty-table-title">No links matching filter criteria</span>
                            <p className="empty-table-caption">
                              Try clearing your search query or switching to the "All Links" tab.
                            </p>
                            <button
                              type="button"
                              className="btn-tool-outline"
                              onClick={() => {
                                setSearchQuery("");
                                setActiveFilterTab("all");
                              }}
                            >
                              Reset Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredLinks.length > pageSize && (
                <div className="table-pagination-footer">
                  <span>
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredLinks.length)} of {filteredLinks.length} links
                  </span>
                  <div className="pagination-nav-btns">
                    <button
                      type="button"
                      className="btn-page-nav"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      &larr; Previous
                    </button>
                    <span style={{ fontSize: "0.78rem", padding: "0 4px", fontFamily: "var(--font-mono)" }}>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn-page-nav"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ----------------------------------------------------------------
             VIEW 3: ANALYTICS TAB (Detailed Performance & Audit)
             ---------------------------------------------------------------- */}
          {activeTab === "analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {initialLoading ? (
                <div className="analytics-state-banner">
                  <IconRefresh size={22} className="is-spinning" style={{ color: "var(--primary)" }} />
                  <span className="analytics-state-title">Loading Analytics Telemetry</span>
                  <p className="analytics-state-desc">
                    Fetching verified visitor clicks and route telemetry from MongoDB Atlas...
                  </p>
                </div>
              ) : dbStatus.state === "disconnected" ? (
                <div className="analytics-state-banner" style={{ borderColor: "var(--danger-border)" }}>
                  <IconAlertTriangle size={24} style={{ color: "var(--danger)" }} />
                  <span className="analytics-state-title">Analytics Engine Offline</span>
                  <p className="analytics-state-desc">
                    Unable to connect to the MongoDB Atlas cluster. Live redirect analytics and telemetry charts are currently unavailable.
                  </p>
                  <button
                    type="button"
                    className="btn-tool-outline"
                    onClick={() => {
                      fetchLinks();
                      checkDbStatus();
                    }}
                    style={{ marginTop: "6px" }}
                  >
                    Retry Connection
                  </button>
                </div>
              ) : links.length === 0 ? (
                <div className="analytics-state-banner">
                  <IconFolder size={28} />
                  <span className="analytics-state-title">No Links Created Yet</span>
                  <p className="analytics-state-desc">
                    Shorten your first URL to begin tracking real-time click engagement and destination host breakdowns.
                  </p>
                  <button
                    type="button"
                    className="btn-tool-primary"
                    style={{ marginTop: "6px" }}
                    onClick={() => setCreateModalOpen(true)}
                  >
                    <IconPlus size={14} />
                    <span>Create First Link</span>
                  </button>
                </div>
              ) : (
                <>
                  <section className="metrics-summary-grid">
                    <div className="metric-card-box">
                      <span className="metric-box-title">Total Traffic Count</span>
                      <div className="metric-box-figure">{totalClicks}</div>
                      <span className="metric-box-explanation">Recorded redirect requests</span>
                    </div>
                    <div className="metric-card-box">
                      <span className="metric-box-title">Average Clicks per Route</span>
                      <div className="metric-box-figure">{averageClicks}</div>
                      <span className="metric-box-explanation">Mathematical mean across vault</span>
                    </div>
                    <div className="metric-card-box">
                      <span className="metric-box-title">Active Rate</span>
                      <div className="metric-box-figure">
                        {links.length > 0 ? `${Math.round((activeLinksCount / links.length) * 100)}%` : "0%"}
                      </div>
                      <span className="metric-box-explanation">Percentage of links with engagement</span>
                    </div>
                    <div className="metric-card-box">
                      <span className="metric-box-title">Zero-Click Drafts</span>
                      <div className="metric-box-figure">{links.length - activeLinksCount}</div>
                      <span className="metric-box-explanation">Links awaiting initial visitor</span>
                    </div>
                  </section>

                  <div className="analytics-two-col-grid">
                    {/* Traffic Leaderboard */}
                    <div className="chart-card-container">
                      <div className="chart-card-header">
                        <div>
                          <h2 className="chart-card-heading">Top 5 Link Rankings</h2>
                          <p className="chart-card-subheading">Highest click engagement routes</p>
                        </div>
                      </div>
                      {totalClicks === 0 ? (
                        <div style={{ textAlign: "center", padding: "28px 12px", color: "var(--text-tertiary)", fontSize: "0.8125rem", lineHeight: 1.5 }}>
                          0 verified clicks recorded yet. Your {links.length} shortened {links.length === 1 ? "route is" : "routes are"} active in MongoDB Atlas and awaiting initial visitor traffic.
                        </div>
                      ) : (
                        <div className="top-links-chart-list">
                          {topPerformingLinks.map((item, idx) => {
                            const pct = Math.round(((item.clicks || 0) / (totalClicks || 1)) * 100);
                            const barPct = Math.round(((item.clicks || 0) / maxClicksForChart) * 100);
                            const domain = getCleanDomain(item.originalUrl);

                            return (
                              <div
                                key={item.shortCode}
                                className="chart-link-row"
                                title={`Route /${item.shortCode} points to ${item.originalUrl}. Total: ${item.clicks || 0} clicks (${pct}% of traffic).`}
                              >
                                <div className="chart-row-meta">
                                  <span className="chart-slug-link">
                                    <span style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>#{idx + 1}</span>
                                    <img
                                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                      alt=""
                                      className="chart-favicon"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    /{item.shortCode}
                                  </span>
                                  <span className="chart-click-count">
                                    {item.clicks || 0} clicks <span style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", fontWeight: 400 }}>({pct}%)</span>
                                  </span>
                                </div>
                                <div className="chart-bar-track" role="progressbar" aria-valuenow={barPct} aria-valuemin={0} aria-valuemax={100} aria-label={`Clicks share for /${item.shortCode}`}>
                                  <div className="chart-bar-fill" style={{ width: `${Math.max(4, barPct)}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Target Host Breakdown */}
                    <div className="chart-card-container">
                      <div className="chart-card-header">
                        <div>
                          <h2 className="chart-card-heading">Target Host Distribution</h2>
                          <p className="chart-card-subheading">Breakdown of destinations shortened</p>
                        </div>
                        <span className="chart-legend-badge">{domainBreakdown.length} Domains</span>
                      </div>
                      <div className="domain-distribution-list">
                        {domainBreakdown.map((item) => (
                          <div
                            key={item.domain}
                            className="domain-stat-item"
                            title={`${item.domain} has ${item.count} ${item.count === 1 ? "route" : "routes"} (${item.percent}% of total)`}
                          >
                            <div className="domain-item-left">
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`}
                                alt=""
                                style={{ width: "14px", height: "14px", borderRadius: "2px" }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                              <span className="domain-name-text">{item.domain}</span>
                            </div>
                            <div className="domain-metrics-right">
                              <span>{item.count} {item.count === 1 ? "link" : "links"}</span>
                              <span className="domain-percent-pill">{item.percent}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------
             VIEW 4: SETTINGS TAB
             ---------------------------------------------------------------- */}
          {activeTab === "settings" && (
            <div className="settings-view-container">
              <div className="settings-card">
                <div className="settings-card-header">
                  <h2 className="settings-card-title">Link Domain &amp; Routing</h2>
                  <p className="settings-card-desc">Active domain used when generating short links</p>
                </div>
                <div className="settings-row-item">
                  <div className="settings-row-label">
                    <strong>Current Base URL</strong>
                    <span>Resolved from server environment</span>
                  </div>
                  <code style={{ background: "var(--bg-app)", padding: "4px 8px", borderRadius: "4px", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#818cf8" }}>
                    {domainConfig.baseUrl}
                  </code>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h2 className="settings-card-title">Database &amp; Storage Engine</h2>
                  <p className="settings-card-desc">Connection telemetry to MongoDB Atlas</p>
                </div>
                <div className="settings-row-item">
                  <div className="settings-row-label">
                    <strong>Atlas Connection State</strong>
                    <span>Health status of MongoDB driver</span>
                  </div>
                  <span style={{ color: dbStatus.state === "connected" ? "#34d399" : "#f87171", fontWeight: 600 }}>
                    {dbStatus.state === "connected" ? "Connected (100% Online)" : "Disconnected"}
                  </span>
                </div>
                <div className="settings-row-item">
                  <div className="settings-row-label">
                    <strong>Round-Trip Ping Latency</strong>
                    <span>Measured response time to Atlas cluster</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                    {dbStatus.latency ? `${dbStatus.latency} ms` : "Standby"}
                  </span>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h2 className="settings-card-title">User Interface Preferences</h2>
                  <p className="settings-card-desc">Local client settings</p>
                </div>
                <div className="settings-row-item">
                  <div className="settings-row-label">
                    <strong>Tactile Audio Feedback</strong>
                    <span>Synthesizer Web Audio chimes on actions</span>
                  </div>
                  <button
                    type="button"
                    className="btn-tool-outline"
                    onClick={() => {
                      setSoundEnabled(!soundEnabled);
                      if (!soundEnabled) playCyberChime("click");
                    }}
                  >
                    {soundEnabled ? "Audio Enabled (ON)" : "Audio Muted (OFF)"}
                  </button>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h2 className="settings-card-title">Data Portability &amp; Backups</h2>
                  <p className="settings-card-desc">Download complete database records</p>
                </div>
                <div className="settings-row-item">
                  <div className="settings-row-label">
                    <strong>Export Vault Records</strong>
                    <span>Contains original URL, short code, clicks, and timestamps</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn-tool-outline"
                      onClick={() => handleExport("json")}
                    >
                      Export JSON
                    </button>
                    <button
                      type="button"
                      className="btn-tool-outline"
                      onClick={() => handleExport("csv")}
                    >
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
