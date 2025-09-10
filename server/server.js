import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/budgetTracker", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Budget Tracker API is running...");
});

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));
