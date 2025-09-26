const API_URL = "http://localhost:5000";

document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault(); // prevent page reload

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const isLogin = document.querySelector("button[type='submit']").textContent === "Login";

  try {
    const res = await fetch(`${API_URL}/${isLogin ? "login" : "signup"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

if (!res.ok) {
  const msg = isLogin ? "Invalid login" : "Signup failed";
  const errorBox = document.getElementById("auth-error");
  errorBox.textContent = msg;
  errorBox.style.display = "block"; // 👈 make it visible
  return;
}


    const data = await res.json();

    // ✅ Success case feedback
    document.getElementById("auth-error").textContent = "";
    document.getElementById("auth-status").style.color = "green";
    document.getElementById("auth-status").textContent = isLogin
      ? "✅ Login successful! Redirecting..."
      : "✅ Signup successful! Redirecting...";

    localStorage.setItem("token", data.token);

    // Small delay so user sees the message
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);

  } catch (err) {
  console.error("Auth failed:", err);
  const errorBox = document.getElementById("auth-error");
  errorBox.textContent = "Something went wrong. Try again.";
  errorBox.style.display = "block"; // 👈 make it visible
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
    document.getElementById("toggle-auth").textContent = "Already have an account? Login here";
  } else {
    submitBtn.textContent = "Login";
    title.textContent = "Budget Tracker - Login";
    document.getElementById("toggle-auth").textContent = "Don’t have an account? Sign up here";
  }
});
