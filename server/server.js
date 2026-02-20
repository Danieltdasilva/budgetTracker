// server/server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config(); // Render injects env vars automatically

// --- Models ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

const entrySchema = new mongoose.Schema({
  date: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ["income", "expense"], required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: "General" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Entry = mongoose.model("Entry", entrySchema);

// --- App setup ---
const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB connection ---
try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");
} catch (err) {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1);
}

// --- JWT Secret ---
const JWT_SECRET = process.env.JWT_SECRET;

// --- Auth Middleware ---
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// =========================
//        API ROUTES
// =========================

app.post("/signup", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({ email, passwordHash });

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }

    next(err);
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

app.get("/entries", authMiddleware, async (req, res, next) => {
  try {
    const entries = await Entry.find({ userId: req.userId }).sort({ _id: 1 });
    res.json(entries);
  } catch (err) {
    next(err);
  }
});

app.post("/entries", authMiddleware, async (req, res, next) => {
  try {
    const { date, description, type, amount, category } = req.body;

    const newEntry = await Entry.create({
      date,
      description,
      type,
      amount: Number(amount),
      category: category || "General",
      userId: req.userId,
    });

    res.json(newEntry);
  } catch (err) {
    next(err);
  }
});

app.put("/entries/:id", authMiddleware, async (req, res, next) => {
  try {
    const updated = await Entry.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Entry not found or not authorized" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

app.delete("/entries/:id", authMiddleware, async (req, res, next) => {
  try {
    const deleted = await Entry.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Entry not found or not authorized" });
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
});

// =========================
//     SERVE FRONTEND
// =========================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from project root
app.use(express.static(path.join(__dirname, "../")));

// Fallback route (for refreshes)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../login.html"));
});

// =========================
//     ERROR HANDLER
// =========================

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// =========================
//        START SERVER
// =========================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
