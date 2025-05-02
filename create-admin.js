// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { firebaseConfig } from "firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const createAdminForm = document.getElementById("create-admin-form");
  const createAdminBtn = document.getElementById("create-admin-btn");
  const errorMessage = document.getElementById("error-message");
  const errorText = document.getElementById("error-text");
  const successMessage = document.getElementById("success-message");
  const successText = document.getElementById("success-text");

  // Check if user is already logged in
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, redirect to dashboard
      window.location.href = "dashboard.html";
    }
  });

  // Handle create admin form submission
  createAdminForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get form values
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // Show loading state
    const originalBtnText = createAdminBtn.innerHTML;
    createAdminBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    createAdminBtn.disabled = true;

    // Hide previous messages
    errorMessage.style.display = "none";
    successMessage.style.display = "none";

    // Validate passwords match
    if (password !== confirmPassword) {
      errorText.textContent = "Password dan konfirmasi password tidak cocok.";
      errorMessage.style.display = "block";
      createAdminBtn.innerHTML = originalBtnText;
      createAdminBtn.disabled = false;
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      errorText.textContent = "Password harus minimal 6 karakter.";
      errorMessage.style.display = "block";
      createAdminBtn.innerHTML = originalBtnText;
      createAdminBtn.disabled = false;
      return;
    }

    try {
      // Create user with email and password
      await createUserWithEmailAndPassword(auth, email, password);

      // Show success message
      successText.textContent =
        "Akun admin berhasil dibuat! Anda akan dialihkan ke halaman login.";
      successMessage.style.display = "block";

      // Clear form
      createAdminForm.reset();

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        window.location.href = "login.html";
      }, 3000);
    } catch (error) {
      console.error("Error creating admin account:", error);

      // Show error message
      let errorMsg = "Terjadi kesalahan saat membuat akun. Silakan coba lagi.";

      // Customize error message based on error code
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMsg = "Email sudah digunakan. Silakan gunakan email lain.";
          break;
        case "auth/invalid-email":
          errorMsg = "Format email tidak valid.";
          break;
        case "auth/weak-password":
          errorMsg = "Password terlalu lemah. Gunakan minimal 6 karakter.";
          break;
      }

      errorText.textContent = errorMsg;
      errorMessage.style.display = "block";

      // Reset button state
      createAdminBtn.innerHTML = originalBtnText;
      createAdminBtn.disabled = false;
    }
  });
});
