// server/server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB connect (local) ---
await mongoose.connect("mongodb://127.0.0.1:27017/budgetTracker");
console.log("✅ Connected to MongoDB");

// --- Schema + model ---
const entrySchema = new mongoose.Schema({
date: { type: String, required: true },
description: { type: String, required: true },
type: { type: String, enum: ["income", "expense"], required: true },
amount: { type: Number, required: true },
category: { type: String, default: "General" }
});
const Entry = mongoose.model("Entry", entrySchema);

app.get("/routes", (req, res) => {
res.json(app._router.stack
.filter(r => r.route)
.map(r => ({
    path: r.route.path,
    methods: r.route.methods
}))
);
});

// --- Routes ---
app.get("/entries", async (_req, res) => {
try {
console.log("🔍 Fetching entries...");
const entries = await Entry.find().sort({ _id: 1 });
console.log("✅ Entries fetched:", entries);
res.json(entries);
} catch (err) {
console.error("❌ Error in GET /entries:", err);
res.status(500).json({ error: err.message });
}
});


app.post("/entries", async (req, res, next) => {
try {
const { date, description, type, amount } = req.body;
const newEntry = await Entry.create({
    date,
    description,
    type,
    amount: Number(amount),
});
res.json(newEntry);
} catch (e) { next(e); }
});

app.delete("/entries/:id", async (req, res, next) => {
try {
await Entry.findByIdAndDelete(req.params.id);
res.json({ message: "Deleted" });
} catch (e) { next(e); }
});

// UPDATE an entry (supports partial updates)
app.put("/entries/:id", async (req, res, next) => {
try {
const { id } = req.params;

// Build an updates object only with fields that were sent
const updates = {};
if (req.body.date !== undefined) updates.date = req.body.date;
if (req.body.description !== undefined) updates.description = req.body.description;
if (req.body.type !== undefined) updates.type = req.body.type; // "income" | "expense"
if (req.body.amount !== undefined) updates.amount = Number(req.body.amount);

const updated = await Entry.findByIdAndUpdate(
id,
{ $set: updates },
{ new: true, runValidators: true } // return updated doc + enforce schema
);

if (!updated) return res.status(404).json({ error: "Entry not found" });
res.json(updated);
} catch (err) {
next(err);
}
});


// Health check
app.get("/", (_req, res) => res.send("Budget Tracker API is running..."));

// Basic error handler (helps surface issues as JSON)
app.use((err, _req, res, _next) => {
console.error(err);
res.status(500).json({ error: err.message });
});

// --- Listen ---
const PORT = 5000;
app.listen(PORT, () =>
console.log(`✅ Server running on http://localhost:${PORT}`)
);
