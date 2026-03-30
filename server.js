const express = require("express");
const cors    = require("cors");
const mongoose = require("mongoose");
const jwt     = require("jsonwebtoken");
const bcrypt  = require("bcryptjs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Connect MongoDB ────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/wasteconnect")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

// ── Schemas ────────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  points:     { type: Number, default: 0 },
  level:      { type: String, default: "Eco Beginner" },
  totalItems: { type: Number, default: 0 },
  co2Saved:   { type: Number, default: 0 },
  createdAt:  { type: Date, default: Date.now },
});

const TransactionSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type:     String, // waste type
  points:   Number,
  action:   String, // "earn" | "redeem"
  date:     { type: Date, default: Date.now },
});

const PickupSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  wasteType: String,
  date:      String,
  time:      String,
  status:    { type: String, default: "scheduled" }, // scheduled|collected|cancelled
  address:   String,
  points:    Number,
  createdAt: { type: Date, default: Date.now },
});

const User        = mongoose.model("User",        UserSchema);
const Transaction = mongoose.model("Transaction", TransactionSchema);
const Pickup      = mongoose.model("Pickup",      PickupSchema);

// ── Auth Middleware ────────────────────────────────────────────────────────────
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    req.user = jwt.verify(token, process.env.JWT_SECRET || "waste_connect_secret");
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ── Points config ──────────────────────────────────────────────────────────────
const POINTS = { plastic:15, glass:20, paper:10, metal:25, organic:12, ewaste:30, textile:18 };
const CO2    = { plastic:0.3, glass:0.2, paper:0.1, metal:0.5, organic:0.05, ewaste:0.8, textile:0.4 };

// ── Routes ─────────────────────────────────────────────────────────────────────

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "waste_connect_secret", { expiresIn: "30d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, points: user.points } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "waste_connect_secret", { expiresIn: "30d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, points: user.points, level: user.level } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get profile
app.get("/api/user/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Earn points (after AI detection + confirmation)
app.post("/api/waste/earn", auth, async (req, res) => {
  try {
    const { wasteType } = req.body;
    const pts = POINTS[wasteType] || 10;
    const co2 = CO2[wasteType]    || 0.1;

    const user = await User.findByIdAndUpdate(req.user.id,
      { $inc: { points: pts, totalItems: 1, co2Saved: co2 } },
      { new: true }
    );

    // Update level
    let level = "Eco Beginner";
    if (user.points >= 5000) level = "Planet Guardian";
    else if (user.points >= 2000) level = "Eco Hero";
    else if (user.points >= 800)  level = "Green Warrior";
    await User.findByIdAndUpdate(req.user.id, { level });

    await Transaction.create({ userId: req.user.id, type: wasteType, points: pts, action: "earn" });
    res.json({ pointsEarned: pts, totalPoints: user.points + pts, level });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Schedule pickup
app.post("/api/pickup/schedule", auth, async (req, res) => {
  try {
    const { wasteType, date, time, address } = req.body;
    const pts = POINTS[wasteType] || 10;
    const pickup = await Pickup.create({ userId: req.user.id, wasteType, date, time, address, points: pts });
    res.json({ pickup, message: "Pickup scheduled successfully!", pointsPending: pts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get user's pickups
app.get("/api/pickup/list", auth, async (req, res) => {
  try {
    const pickups = await Pickup.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json(pickups);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Transaction history
app.get("/api/transactions", auth, async (req, res) => {
  try {
    const txns = await Transaction.find({ userId: req.user.id }).sort({ date: -1 }).limit(50);
    res.json(txns);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Redeem points
app.post("/api/rewards/redeem", auth, async (req, res) => {
  try {
    const { productId, productName, cost } = req.body;
    const user = await User.findById(req.user.id);
    if (user.points < cost) return res.status(400).json({ error: "Insufficient points" });
    await User.findByIdAndUpdate(req.user.id, { $inc: { points: -cost } });
    await Transaction.create({ userId: req.user.id, type: productName, points: -cost, action: "redeem" });
    res.json({ success: true, message: `Order placed for ${productName}!`, pointsSpent: cost });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Leaderboard
app.get("/api/leaderboard", async (req, res) => {
  try {
    const leaders = await User.find().select("name points level totalItems").sort({ points: -1 }).limit(10);
    res.json(leaders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
