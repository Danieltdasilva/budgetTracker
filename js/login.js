import { api } from "./api.js";

document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const submitBtn = document.querySelector("button[type='submit']");
  const isLogin = submitBtn.textContent === "Login";

  const errorBox = document.getElementById("auth-error");
  const statusBox = document.getElementById("auth-status");

  // Reset UI messages
  errorBox.textContent = "";
  errorBox.style.display = "none";
  statusBox.textContent = "";

  try {
    const data = isLogin
      ? await api.login(email, password)
      : await api.signup(email, password);

    // Store token if returned
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    // Success feedback
    statusBox.style.color = "green";
    statusBox.textContent = isLogin
      ? "✅ Login successful! Redirecting..."
      : "✅ Signup successful! Redirecting...";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);

  } catch (err) {
    console.error("Auth failed:", err);

    errorBox.textContent = isLogin
      ? "Invalid email or password."
      : "Signup failed. Try again.";

    errorBox.style.display = "block";
  }
});

// Toggle between Login and Signup
document.getElementById("toggle-auth").addEventListener("click", (e) => {
  e.preventDefault();

  const submitBtn = document.querySelector("button[type='submit']");
  const title = document.querySelector("h1");

  if (submitBtn.textContent === "Login") {
    submitBtn.textContent = "Signup";
    title.textContent = "Budget Tracker - Signup";
    e.target.textContent = "Already have an account? Login here";
  } else {
    submitBtn.textContent = "Login";
    title.textContent = "Budget Tracker - Login";
    e.target.textContent = "Don’t have an account? Sign up here";
  }
});
