# ⚡ LinkVault — Next-Gen URL Shortener & Telemetry Infrastructure

> A high-performance, cyber-themed URL shortening platform engineered with sub-millisecond Express redirects, atomic MongoDB Atlas click telemetry, real-time analytics, and data portability.

---

## ✨ Features

- **⚡ Sub-Millisecond Redirects**: Low-latency Express routing engine resolving redirects instantaneously.
- **📊 Atomic Click Telemetry**: Race-condition-free click tracking that increments counters directly in MongoDB Atlas with every visitor.
- **🔒 Permanent & Protocol-Safe**: Strict HTTP/HTTPS validation, SSRF protection, and anti-caching headers (`no-store`) so every click is accurately tracked.
- **📱 Universal Multi-Device Support**: Deployable to any cloud host (Render, Railway, Fly.io) with automatic HTTPS reverse-proxy domain resolution.
- **📥 Instant Data Portability**: Export your entire vault database to **JSON** or **CSV** with a single click.
- **🎨 Ultra-Luxury Cyber Aesthetic**: Bioluminescent glow effects, animated laser border beams, tactile 3D buttons, and Web Audio API synthesized feedback chords.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS, JetBrains Mono & Outfit typography
- **Backend**: Node.js, Express.js, Mongoose
- **Database**: MongoDB Atlas (Cloud Cluster)
- **Deployment**: Unified full-stack production build ready for Render / Railway

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/linkvault.git
cd linkvault
```

### 2. Configure Environment Variables
Inside `server/`, create a `.env` file based on `.env.example`:
```env
MONGO_URI=your_mongodb_atlas_connection_string
PORT=5000
```

### 3. Run the Backend
```bash
cd server
npm install
npm run dev
```

### 4. Run the Frontend
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🌐 Deploy to Cloud (Free 24/7 Access)

LinkVault includes a pre-configured `render.yaml` for 1-click cloud deployment on [Render.com](https://render.com):

1. Push your repository to GitHub.
2. Sign in to [Render.com](https://render.com) and click **New + ➔ Web Service**.
3. Select your `linkvault` repository.
4. Set the environment variable:
   - `MONGO_URI`: *(Your MongoDB connection string)*
5. Click **Deploy**!
