const API_URL = "http://localhost:5000";

const form = document.getElementById("auth-form");
const toggle = document.getElementById("toggle-auth");
const errorBox = document.getElementById("auth-error");

let isLogin = true; // toggle state

toggle.addEventListener("click", (e) => {
  e.preventDefault();
  isLogin = !isLogin;
  document.querySelector("h1").textContent = isLogin
    ? "Budget Tracker - Login"
    : "Budget Tracker - Sign Up";
  form.querySelector("button").textContent = isLogin ? "Login" : "Sign Up";
  toggle.textContent = isLogin
    ? "Sign up here"
    : "Already have an account? Login";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.textContent = "";

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_URL}/${isLogin ? "login" : "signup"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    if (isLogin) {
      // store token and redirect
      localStorage.setItem("token", data.token);
      window.location.href = "index.html"; // go to main app
    } else {
      alert("✅ Signup successful! Please login.");
      isLogin = true;
      document.querySelector("h1").textContent = "Budget Tracker - Login";
      form.querySelector("button").textContent = "Login";
      toggle.textContent = "Sign up here";
    }
  } catch (err) {
    errorBox.textContent = err.message;
  }
});
