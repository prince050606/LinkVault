# ⚡ LinkVault — Next-Gen Branded Link Infrastructure

[![React](https://img.shields.io/badge/React-19.3-61dafb?logo=react&logoColor=black)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Cloud-47a248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production_Ready-emerald)](https://github.com)

> An enterprise-grade, full-stack URL shortening and telemetry platform featuring sub-millisecond redirects, atomic MongoDB Atlas click tracking, comprehensive security hardening, and an ultra-tactile cyber aesthetic.

---

## 🌟 Key Features

- **⚡ Sub-Millisecond Redirects**: High-speed Express routing engine resolving link dispatches with near-zero latency.
- **📊 Atomic Click Telemetry**: Race-condition-free click tracking utilizing MongoDB `$inc` with instant optimistic UI updates and live window focus auto-sync.
- **🛡️ Enterprise Security Hardening**:
  - **Zero IP Exposure**: Never exposes or reveals host IP addresses.
  - **SSRF Defense**: Automatically blocks internal network (`10.x`, `192.168.x`, `127.0.0.1`) and cloud metadata (`169.254.169.254`) targets.
  - **Attack Mitigation**: Built-in sliding-window rate limiting, HTTP security headers (`nosniff`, `DENY`), CRLF protection, and body payload caps (`16kb`).
  - **Anti-Caching Headers**: Enforces `Cache-Control: no-store` so every visit increments analytics accurately.
- **📱 Universal Multi-Device Cloud Ready**: Unified full-stack architecture that serves both the compiled React SPA and Express API from a single cloud instance (Render, Railway, Fly.io).
- **📥 One-Click Data Portability**: Export your complete link database and engagement metrics to **CSV** or **JSON** instantly.
- **🎨 Tactile Cyber Aesthetic**: Dynamic bioluminescent glow matrix, traveling laser border beams, 3D button press physics, and native Web Audio API sound synthesis.

---

## 📂 Project Structure

```text
LinkVault/
├── client/                     # React 19 Frontend (Vite + Vanilla CSS)
│   ├── src/
│   │   ├── App.jsx             # Core Application & UI Components
│   │   ├── App.css             # Cyber Design System & Tactile Buttons
│   │   └── main.jsx            # React Entrypoint
│   └── package.json            # Client Dependencies & Scripts
├── server/                     # Node.js + Express Backend
│   ├── models/
│   │   └── Url.js              # Mongoose Schema with Atomic Click Tracking
│   ├── server.js               # Express API, Redirect Engine & Security Hardening
│   ├── .env.example            # Environment Variable Blueprint
│   └── package.json            # Server Dependencies & Scripts
├── render.yaml                 # 1-Click Cloud Deployment Blueprint
├── package.json                # Universal Cloud Build & Start Scripts
└── README.md                   # Project Documentation
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `server/` directory:

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `MONGO_URI` | **Yes** | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/linkvault` |
| `PORT` | No | Local server port *(default: 5000)* | `5000` |
| `BASE_URL` | No | Custom production domain override | `https://your-custom-domain.com` |

---

## 🚀 Local Development Quickstart

### Prerequisites
- [Node.js](https://nodejs.org) (v18.0.0 or higher)
- [MongoDB Atlas Cluster](https://www.mongodb.com/atlas) (Free tier)

### 1. Clone & Install
```bash
git clone https://github.com/prince050606/LinkVault.git
cd LinkVault
```

### 2. Start the Backend Server
```bash
cd server
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`.*

### 3. Start the Frontend Client
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🌐 24/7 Free Cloud Deployment (Render.com)

LinkVault includes a production-ready `render.yaml` for instant 1-click cloud deployment:

1. **Push to GitHub**: Commit and push your code to your GitHub repository.
2. **Connect to Render**:
   - Go to [render.com](https://render.com) and click **New + ➔ Web Service**.
   - Select your `LinkVault` repository.
3. **Verify Build Settings**:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: **Free**
4. **Add Environment Variable**:
   - `MONGO_URI`: `your_mongodb_atlas_connection_string`
5. Click **Deploy Web Service**!

Your application is live at `https://linkvault-xxxx.onrender.com` with automatic HTTPS, globally accessible on any phone, tablet, laptop, or PC 24/7.

---

## 🔄 Continuous Deployment (CI/CD)

Whenever you make changes to your codebase:
```bash
git add .
git commit -m "Update feature or UI"
git push
```
Render automatically detects the push, builds the project, and updates your live website with **zero downtime**.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
