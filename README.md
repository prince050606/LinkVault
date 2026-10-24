# 🔗 LinkVault — URL Shortener & Link Analytics Platform

[![Live Demo](https://img.shields.io/badge/Demo-linkvault--bw2e.onrender.com-6366f1?style=flat&logo=render&logoColor=white)](https://linkvault-bw2e.onrender.com)
[![React](https://img.shields.io/badge/React-19.3-61dafb?logo=react&logoColor=black)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Cloud-47a248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production_Ready-10b981)](https://linkvault-bw2e.onrender.com)

> **"Your links, in one place."**  
> A fast, minimal, and professional URL shortener with real-time atomic click telemetry, structured destination domain intelligence, and instant data portability. Built with React 19, Express, and MongoDB Atlas.

---

## 🌐 Live Application
- **Live URL**: [https://linkvault-bw2e.onrender.com](https://linkvault-bw2e.onrender.com)
- **Status**: 24/7 Cloud Deployment on Render with HTTPS and MongoDB Atlas persistence.

---

## 🌟 Key Features

### 1. 🎯 Central Quick-Composer & Active Link Card
- **Zero-Friction Shortening**: No popups or modal barriers—paste any long URL directly on the Overview dashboard to generate a clean short link in milliseconds.
- **Active Link Hero Card**: Newly shortened links immediately surface in a high-visibility hero banner with 1-click clipboard copying, direct destination testing, and atomic click increment simulation.

### 2. 📊 Real-Time Atomic Telemetry
- **Race-Condition Free**: Uses MongoDB's atomic `$inc` operator for accurate, concurrent visitor tracking.
- **Interactive +1 Hit Simulation**: Test link routing and verify live database updates directly from the dashboard.
- **Auditable Metrics**: Tracks Total Links, Total Redirects, Active Rate percentage, and 24h link activity with zero fabricated statistics.

### 3. 🎨 Refined Visual Identity & Design System
- **Dual-Typography Hierarchy**:
  - `Plus Jakarta Sans` for clean, readable headings and UI controls.
  - `JetBrains Mono` for short route slugs, destination domains, and numerical metrics to prevent digit jitter.
- **Restrained Slate & Indigo Palette**: Deep dark neutral surfaces (`#090a0f` base, `#0e111a` surface, `#141724` elevated cards) paired with a focused Indigo primary accent (`#6366f1`).
- **Decomposed Destination URLs**: Intelligently separates root domain hostnames (rendered as a crisp pill with official favicon) from long path segments, ensuring high readability over messy raw URLs.
- **Tactile Feedback**: Distinct emerald confirmation states on copy (`Copied!`), status pulse dots for traffic-active links, and optional Web Audio API synthesized tactile chimes.

### 4. 🗂️ Link Management & Filtering
- **Multi-Tab Filtering**: Filter links by *All Links*, *Active Traffic*, *Zero Clicks*, or *Created Today*.
- **Real-Time Search & Sort**: Instant client-side search across short codes and destination URLs with sorting by newest, oldest, or click volume.
- **Destructive Action Confirmation**: Accessible confirmation dialogs with Escape key listeners and background overlay click-to-dismiss.
- **One-Click Export**: Export your complete database records to **CSV** or **JSON** instantly.

### 5. 🛡️ Enterprise Security Hardening
- **SSRF Defense**: Blocks internal networks (`10.x`, `192.168.x`, `127.0.0.1`) and cloud metadata (`169.254.169.254`) targets.
- **Strict Headers**: Enforces `nosniff`, `DENY` frame embedding, and `Cache-Control: no-store` on redirects so analytics increment accurately on every visit.
- **Sliding-Window Rate Limiting**: Built-in in-memory rate limiter protects endpoints against DDoS and automated crawler abuse.
- **React 19 ErrorBoundary**: Global error boundary catches any unexpected client exceptions and presents a recovery action without unmounting into a blank screen.

---

## 📂 Project Architecture

```text
LinkVault/
├── client/                     # Frontend Application (React 19 + Vite)
│   ├── public/
│   │   └── favicon.svg         # LinkVault Monogram SVG Brand Asset
│   ├── src/
│   │   ├── components/
│   │   │   └── Icons.jsx       # Precision Feather/Lucide SVG Icon Set + Brand Logo
│   │   ├── App.jsx             # Dashboard Views, Composer, Tables & Analytics
│   │   ├── App.css             # Dashboard Styles, Grid Layouts & Micro-Transitions
│   │   ├── index.css           # Global Design Tokens, Color Variables & CSS Reset
│   │   └── main.jsx            # React 19 Entrypoint + Global ErrorBoundary
│   ├── index.html              # HTML Shell + Google Fonts Preconnect
│   └── package.json            # Client Dependencies & Scripts
├── server/                     # Backend API & Redirect Engine (Node.js + Express)
│   ├── models/
│   │   └── Url.js              # Mongoose Schema with Indexed shortCode & TTL support
│   ├── server.js               # Express API, Redirect Engine & Security Hardening
│   ├── .env.example            # Environment Variable Blueprint
│   └── package.json            # Server Dependencies & Scripts
├── render.yaml                 # Infrastructure as Code for 1-Click Render Deployment
├── package.json                # Root Build & Startup Scripts for Cloud Hosts
└── README.md                   # Project Documentation
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `server/` directory (or configure in your cloud host settings):

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `MONGO_URI` | **Yes** | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/linkvault` |
| `PORT` | No | Local server port *(default: 5000)* | `5000` |
| `BASE_URL` | No | Custom domain override *(auto-detected if omitted)* | `https://linkvault-bw2e.onrender.com` |

---

## 🚀 Local Development Quickstart

### Prerequisites
- [Node.js](https://nodejs.org) (v18.0.0 or higher)
- [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (Free M0 tier or local MongoDB instance)

### 1. Clone the Repository
```bash
git clone https://github.com/prince050606/LinkVault.git
cd LinkVault
```

### 2. Configure Environment
```bash
cp server/.env.example server/.env
# Open server/.env and insert your MONGO_URI
```

### 3. Start Backend Server
```bash
cd server
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`.*

### 4. Start Frontend Client
In a separate terminal:
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` with automatic hot-module reloading.*

---

## 🧪 Testing & Code Quality

Verify all layers of the application:

```bash
# 1. Run ESLint code quality checks
cd client
npm run lint

# 2. Run production client build
npm run build

# 3. Test backend integration & database persistence
cd ..
node -e "fetch('http://localhost:5000/api/links').then(r=>r.json()).then(d=>console.log('Active Vault Records:', d.links.length))"
```

---

## 🌐 Cloud Deployment (Render.com)

LinkVault includes unified cloud build scripts in the root `package.json` for 1-click hosting:

1. **Push to GitHub**: Push your changes to `main`.
2. **Connect to Render**:
   - Create a **New Web Service** pointing to your repository.
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Environment Variable**: Add `MONGO_URI` with your MongoDB connection string.
3. Click **Deploy Web Service** — Render builds the client bundle and serves both the React dashboard and Express API from a single instance.

---

## 📄 API Reference

| Method | Endpoint | Description | Sample Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/shorten` | Shorten a long destination URL | `{ shortCode: "xyz123", shortUrl: "https://.../xyz123" }` |
| `GET` | `/api/links` | Fetch all active shortened link records | `{ links: [{ shortCode, originalUrl, clicks, createdAt }] }` |
| `POST` | `/api/links/:shortCode/test-click` | Atomically increment click count by 1 | `{ message: "Click incremented successfully!", clicks: 5 }` |
| `DELETE` | `/api/links/:shortCode` | Permanently delete a link record | `{ message: "Link successfully deleted." }` |
| `GET` | `/api/db-status` | Health check for MongoDB connection | `{ database: "connected", readyState: 1 }` |
| `GET` | `/api/config` | Retrieve current resolved base domain | `{ baseUrl: "https://...", isLocalhost: false }` |
| `GET` | `/:shortCode` | HTTP 302 redirect to original target | Redirects to `originalUrl` with `Cache-Control: no-store` |

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
