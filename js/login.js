const API_URL = "http://localhost:5000";

let isLogin = true; // mode tracker

document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const endpoint = isLogin ? "/login" : "/signup";

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const msg = isLogin ? "Invalid login" : "Signup failed";
      document.getElementById("auth-error").textContent = msg;
      return;
    }

    const data = await res.json();

    if (isLogin) {
      // login flow → save token + redirect
      localStorage.setItem("token", data.token);
      window.location.href = "index.html";
    } else {
      // signup flow → just show message
      document.getElementById("auth-error").style.color = "green";
      document.getElementById("auth-error").textContent =
        "Signup successful! You can now login.";
    }
  } catch (err) {
    console.error("Auth failed:", err);
    document.getElementById("auth-error").textContent = "Something went wrong";
  }
});

// toggle login/signup mode
document.getElementById("toggle-auth").addEventListener("click", (e) => {
  e.preventDefault();
  isLogin = !isLogin;

  const authButton = document.getElementById("auth-button");
  const toggleText = document.getElementById("auth-toggle-text");
  const toggleLink = document.getElementById("toggle-auth");

  if (isLogin) {
    authButton.textContent = "Login";
    toggleText.textContent = "Don’t have an account?";
    toggleLink.textContent = "Sign up here";
  } else {
    authButton.textContent = "Sign Up";
    toggleText.textContent = "Already have an account?";
    toggleLink.textContent = "Login here";
  }

  document.getElementById("auth-error").textContent = "";
});
