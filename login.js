// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { firebaseConfig } from "firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const loginForm = document.getElementById("login-form");
  const loginBtn = document.getElementById("login-btn");
  const errorMessage = document.getElementById("error-message");
  const errorText = document.getElementById("error-text");

  // Check if user is already logged in
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, redirect to dashboard
      window.location.href = "dashboard.html";
    }
  });

  // Handle login form submission
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get form values
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Show loading state
    const originalBtnText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    loginBtn.disabled = true;

    // Hide previous error messages
    errorMessage.style.display = "none";

    try {
      // Sign in with email and password
      await signInWithEmailAndPassword(auth, email, password);

      // Redirect to dashboard on successful login
      window.location.href = "index.html";
    } catch (error) {
      console.error("Error signing in:", error);

      // Show error message
      let errorMsg = "Terjadi kesalahan saat login. Silakan coba lagi.";

      // Customize error message based on error code
      switch (error.code) {
        case "auth/invalid-email":
          errorMsg = "Format email tidak valid.";
          break;
        case "auth/user-not-found":
          errorMsg = "Email tidak terdaftar sebagai admin.";
          break;
        case "auth/wrong-password":
          errorMsg = "Password salah. Silakan coba lagi.";
          break;
        case "auth/too-many-requests":
          errorMsg = "Terlalu banyak percobaan login. Silakan coba lagi nanti.";
          break;
      }

      errorText.textContent = errorMsg;
      errorMessage.style.display = "block";

      // Reset button state
      loginBtn.innerHTML = originalBtnText;
      loginBtn.disabled = false;
    }
  });
});
