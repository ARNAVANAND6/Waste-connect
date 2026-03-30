# ♻️ Waste Connect — AI-Powered Waste Management App

> **Youth for Change Initiative** · USAR & Vigyan Bhawan Presentation 2025

![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![AI](https://img.shields.io/badge/AI-Claude%20Vision-orange)
![YOLO](https://img.shields.io/badge/Model-YOLO11-purple)

---

## 🌍 Problem Statement

Waste management is one of the biggest environmental challenges globally:
- Landfills are **overflowing** — India generates 62 million tonnes of waste annually
- Recycling rates are **critically low** (~20%)
- Valuable resources are lost due to improper segregation
- Citizens lack **incentives** to participate in proper waste disposal

## 💡 Our Solution: Waste Connect

A **smart, AI-driven mobile/web application** that:
1. **Identifies** waste types through computer vision (YOLO11 / Claude Vision)
2. **Rewards** users with green points for responsible disposal
3. **Connects** waste contributors with recyclers & eco-conscious buyers
4. **Schedules** doorstep pickups automatically

---

## 🤖 Technical Approach

### AI Pipeline
```
📸 User uploads photo
     ↓
🤖 YOLO11 / Claude Vision API
     ↓
🏷️ Classify: Plastic | Glass | Paper | Metal | Organic | E-Waste | Textile
     ↓
📊 Confidence Score + Recycling Instructions
     ↓
🎖️ Reward Points Allocated
     ↓
🚛 Pickup Scheduled
```

### System Architecture
```
┌─────────────────────────────────────────────────┐
│                WASTE CONNECT APP                 │
├───────────────┬─────────────┬────────────────────┤
│  React PWA    │  Node.js    │  Python ML Server  │
│  (Frontend)   │  REST API   │  (YOLO11 / Vision) │
├───────────────┼─────────────┼────────────────────┤
│ • Dashboard   │ • Auth      │ • Image preprocess │
│ • AI Scanner  │ • Users     │ • YOLO11 inference │
│ • Rewards     │ • Pickups   │ • Claude Vision    │
│ • Marketplace │ • Rewards   │ • Multi-class det. │
│ • Schedule    │ • Products  │ • Confidence score │
└───────────────┴─────────────┴────────────────────┘
         ↕               ↕               ↕
    ┌─────────┐    ┌──────────┐   ┌──────────────┐
    │ MongoDB │    │  Redis   │   │ Anthropic API│
    └─────────┘    └──────────┘   └──────────────┘
```

---

## 🚀 Features

| Feature | Description |
|---|---|
| 📸 **AI Waste Detection** | Upload a photo — AI classifies waste type in seconds |
| 🏷️ **7 Waste Categories** | Plastic, Glass, Paper, Metal, Organic, E-Waste, Textile |
| 🎖️ **Reward Points** | Earn green points for every item recycled |
| 🛍️ **Eco Marketplace** | Redeem points for sustainable/upcycled products |
| 🚛 **Pickup Scheduling** | Book doorstep collection with time slots |
| 📊 **Impact Dashboard** | Track CO₂ saved, items recycled, day streaks |
| 👤 **User Profiles** | History, badges, leaderboard |

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- Custom CSS (no component library — pixel-perfect UI)
- Progressive Web App (PWA) support

**Backend**
- Node.js + Express
- MongoDB (users, pickups, transactions)
- Redis (session cache, leaderboard)
- JWT Authentication

**AI / ML**
- **YOLO11** — real-time object detection for waste classification
- **Claude Vision API** (Anthropic) — semantic understanding & recycling guidance
- **Python FastAPI** — ML inference server

---

## 📁 Repository Structure

```
waste-connect/
├── frontend/                 # React app (Vite)
│   ├── src/
│   │   ├── App.jsx           # Main app with all pages
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ScanPage.jsx  # AI detection UI
│   │   │   ├── Marketplace.jsx
│   │   │   ├── PickupPage.jsx
│   │   │   └── Profile.jsx
│   │   ├── hooks/
│   │   │   └── useWasteDetect.js
│   │   └── api/
│   │       └── claude.js     # Anthropic API integration
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # Node.js REST API
│   ├── routes/
│   │   ├── auth.js
│   │   ├── waste.js
│   │   ├── pickup.js
│   │   └── rewards.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Pickup.js
│   │   └── Transaction.js
│   ├── middleware/
│   │   └── auth.js
│   └── server.js
│
├── ml-service/               # Python YOLO11 inference
│   ├── app.py                # FastAPI server
│   ├── model/
│   │   └── yolo11_waste.pt   # Trained weights
│   ├── train.py              # Training script
│   └── requirements.txt
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB
- Anthropic API key

### 1. Clone & Install

```bash
git clone https://github.com/YOUR-USERNAME/waste-connect.git
cd waste-connect

# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install

# ML Service
cd ../ml-service && pip install -r requirements.txt
```

### 2. Environment Variables

```bash
# Copy example env
cp .env.example .env

# Edit .env:
ANTHROPIC_API_KEY=your_key_here
MONGODB_URI=mongodb://localhost:27017/wasteconnect
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
```

### 3. Run Development

```bash
# Terminal 1 — Frontend
cd frontend && npm run dev       # http://localhost:5173

# Terminal 2 — Backend
cd backend && npm run dev        # http://localhost:3001

# Terminal 3 — ML Service (optional)
cd ml-service && python app.py   # http://localhost:8000
```

### 4. Docker (Recommended)

```bash
docker-compose up --build
# App at http://localhost:5173
```

---

## 🎖️ Reward System

| Waste Type | Points Earned |
|---|---|
| 🧴 Plastic | 15 pts |
| 📄 Paper | 10 pts |
| 🍂 Organic | 12 pts |
| 👕 Textile | 18 pts |
| 🍾 Glass | 20 pts |
| 🥫 Metal | 25 pts |
| 💡 E-Waste | 30 pts |

**Levels:** Eco Beginner → Green Warrior → Eco Hero → Planet Guardian 🌍

---

## 🌱 Impact Metrics

Each recycled item contributes to:
- **CO₂ savings** tracked per category
- **Landfill diversion** statistics
- **Community leaderboards** to encourage participation

---

## 📱 Wireframes & Screens

The app follows a mobile-first design with 5 main screens:
1. **Dashboard** — Points, streaks, quick actions, recent activity
2. **AI Scanner** — Upload photo, detect waste, claim points
3. **Pickup Scheduler** — Select waste type, date, time slot
4. **Eco Marketplace** — Browse & redeem for sustainable products
5. **Profile** — History, badges, impact stats

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👥 Team

**Waste Connect — Youth for Change**  
University School of Automation and Robotics (USAR), Delhi

*"Turning waste into a resource, one scan at a time."* 🌍
