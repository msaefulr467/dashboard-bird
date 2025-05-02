// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { firebaseConfig } from "firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const loadingOverlay = document.getElementById("loading-overlay");
  const dashboardContainer = document.querySelector(".dashboard-container");
  const adminEmailElement = document.getElementById("admin-email");
  const logoutBtn = document.getElementById("logout-btn");
  const birdsTableBody = document.getElementById("birds-table-body");
  const totalBirdsElement = document.getElementById("total-birds");
  const addBirdBtn = document.getElementById("add-bird-btn");
  const birdModal = document.getElementById("bird-modal");
  const deleteModal = document.getElementById("delete-modal");
  const birdForm = document.getElementById("bird-form");
  const modalTitle = document.getElementById("modal-title");
  const closeModalBtns = document.querySelectorAll(".close-modal");
  const cancelBtn = document.getElementById("cancel-btn");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");

  // Bird image preview
  const birdImageInput = document.getElementById("bird-image");
  const previewImg = document.getElementById("preview-img");
  const uploadPlaceholder = document.getElementById("upload-placeholder");

  // Delete confirmation
  const deleteBirdNameSpan = document.getElementById("delete-bird-name");
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");

  // Current bird ID for editing/deleting
  let currentBirdId = null;
  let currentImageFile = null;
  let birds = [];
  let filteredBirds = [];

  // Check authentication state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      adminEmailElement.textContent = user.email;
      loadingOverlay.style.display = "none";
      dashboardContainer.style.display = "flex";

      // Load birds data
      loadBirds();
    } else {
      // User is signed out, redirect to login page
      window.location.href = "login.html";
    }
  });

  // Handle logout
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      await signOut(auth);
      // Redirect will happen automatically due to onAuthStateChanged
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Terjadi kesalahan saat logout. Silakan coba lagi.");
    }
  });

  // Load birds from Firebase
  async function loadBirds() {
    birdsTableBody.innerHTML = `
      <tr class="loading-row">
        <td colspan="6">
          <div class="loading">
            <div class="spinner"></div>
            <p>Memuat data burung...</p>
          </div>
        </td>
      </tr>
    `;

    try {
      const birdsSnapshot = await getDocs(collection(db, "birds"));

      birds = [];
      birdsSnapshot.forEach((doc) => {
        birds.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Update total birds count
      totalBirdsElement.textContent = birds.length;

      // Apply current filters
      applyFilters();
    } catch (error) {
      console.error("Error getting birds: ", error);
      birdsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="error-message">
            Terjadi kesalahan saat memuat data. Silakan coba lagi nanti.
          </td>
        </tr>
      `;
    }
  }

  // Display birds in the table
  function displayBirds(birdsToDisplay) {
    birdsTableBody.innerHTML = "";

    if (birdsToDisplay.length === 0) {
      birdsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="no-birds">
            Tidak ada data burung yang tersedia.
          </td>
        </tr>
      `;
      return;
    }

    birdsToDisplay.forEach((bird) => {
      // Format price with Indonesian Rupiah
      const formattedPrice = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(bird.price);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="bird-image-cell">
          <img src="${bird.imageUrl}" alt="${bird.name}">
        </td>
        <td>${bird.name}</td>
        <td>${getCategoryName(bird.category)}</td>
        <td>${formattedPrice}</td>
        <td>${bird.whatsappNumber}</td>
        <td>
          <div class="bird-actions-cell">
            <div class="action-btn edit-btn" data-id="${bird.id}">
              <i class="fas fa-edit"></i>
            </div>
            <div class="action-btn delete-btn" data-id="${
              bird.id
            }" data-name="${bird.name}">
              <i class="fas fa-trash"></i>
            </div>
          </div>
        </td>
      `;

      birdsTableBody.appendChild(row);

      // Add event listeners to action buttons
      const editBtn = row.querySelector(".edit-btn");
      const deleteBtn = row.querySelector(".delete-btn");

      editBtn.addEventListener("click", () => {
        openEditBirdModal(bird);
      });

      deleteBtn.addEventListener("click", () => {
        openDeleteModal(bird);
      });
    });
  }

  // Get category name for display
  function getCategoryName(category) {
    const categories = {
      lovebird: "Lovebird",
      kenari: "Kenari",
      murai: "Murai",
      other: "Lainnya",
    };

    return categories[category] || category;
  }

  // Apply search and category filters
  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryValue = categoryFilter.value;

    filteredBirds = birds.filter((bird) => {
      // Apply search filter
      const matchesSearch = bird.name.toLowerCase().includes(searchTerm);

      // Apply category filter
      const matchesCategory =
        categoryValue === "all" || bird.category === categoryValue;

      return matchesSearch && matchesCategory;
    });

    displayBirds(filteredBirds);
  }

  // Open add bird modal
  function openAddBirdModal() {
    modalTitle.textContent = "Tambah Burung Baru";
    birdForm.reset();
    document.getElementById("bird-id").value = "";
    previewImg.style.display = "none";
    uploadPlaceholder.style.display = "flex";
    currentBirdId = null;
    currentImageFile = null;

    // Make image required for new birds
    birdImageInput.setAttribute("required", "required");

    birdModal.style.display = "block";
  }

  // Open edit bird modal
  function openEditBirdModal(bird) {
    modalTitle.textContent = "Edit Data Burung";

    // Fill form with bird data
    document.getElementById("bird-id").value = bird.id;
    document.getElementById("bird-name").value = bird.name;
    document.getElementById("bird-category").value = bird.category;
    document.getElementById("bird-price").value = bird.price;
    document.getElementById("bird-description").value = bird.description;
    document.getElementById("bird-whatsapp").value = bird.whatsappNumber;

    // Show image preview
    previewImg.src = bird.imageUrl;
    previewImg.style.display = "block";
    uploadPlaceholder.style.display = "none";

    // Image is not required when editing (unless a new one is selected)
    birdImageInput.removeAttribute("required");

    currentBirdId = bird.id;
    currentImageFile = null;

    birdModal.style.display = "block";
  }

  // Open delete confirmation modal
  function openDeleteModal(bird) {
    deleteBirdNameSpan.textContent = bird.name;
    currentBirdId = bird.id;
    deleteModal.style.display = "block";
  }

  // Close all modals
  function closeModals() {
    birdModal.style.display = "none";
    deleteModal.style.display = "none";
  }

  // Save bird data to Firebase
  async function saveBird(event) {
    event.preventDefault();

    // Get form values
    const birdId = document.getElementById("bird-id").value;
    const name = document.getElementById("bird-name").value;
    const category = document.getElementById("bird-category").value;
    const price = Number.parseInt(document.getElementById("bird-price").value);
    const description = document.getElementById("bird-description").value;
    const whatsappNumber = document.getElementById("bird-whatsapp").value;

    // Show loading state
    const saveBtn = document.getElementById("save-btn");
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveBtn.disabled = true;

    try {
      let imageUrl = "";

      // If editing and no new image selected, use existing image URL
      if (birdId && !currentImageFile) {
        const birdRef = doc(db, "birds", birdId);
        const birdSnap = await getDoc(birdRef);
        if (birdSnap.exists()) {
          imageUrl = birdSnap.data().imageUrl;
        }
      }
      // If new image selected, upload it
      else if (currentImageFile) {
        const storageRef = ref(
          storage,
          `bird-images/${Date.now()}_${currentImageFile.name}`
        );
        await uploadBytes(storageRef, currentImageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // Prepare bird data
      const birdData = {
        name,
        category,
        price,
        description,
        whatsappNumber,
        imageUrl,
        updatedAt: serverTimestamp(),
      };

      // Save to Firestore
      if (birdId) {
        // Update existing bird
        const birdRef = doc(db, "birds", birdId);
        await updateDoc(birdRef, birdData);
      } else {
        // Add new bird
        birdData.createdAt = serverTimestamp();
        await addDoc(collection(db, "birds"), birdData);
      }

      // Close modal and reload birds
      closeModals();
      loadBirds();

      // Show success message
      alert(
        birdId
          ? "Data burung berhasil diperbarui!"
          : "Burung baru berhasil ditambahkan!"
      );
    } catch (error) {
      console.error("Error saving bird:", error);
      alert("Terjadi kesalahan saat menyimpan data. Silakan coba lagi.");
    } finally {
      // Reset button state
      saveBtn.innerHTML = originalBtnText;
      saveBtn.disabled = false;
    }
  }

  // Delete bird from Firebase
  async function deleteBird() {
    if (!currentBirdId) return;

    // Show loading state
    const deleteBtn = document.getElementById("confirm-delete-btn");
    const originalBtnText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
    deleteBtn.disabled = true;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "birds", currentBirdId));

      // Close modal and reload birds
      closeModals();
      loadBirds();

      // Show success message
      alert("Data burung berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting bird:", error);
      alert("Terjadi kesalahan saat menghapus data. Silakan coba lagi.");
    } finally {
      // Reset button state
      deleteBtn.innerHTML = originalBtnText;
      deleteBtn.disabled = false;
    }
  }

  // Handle image preview
  birdImageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.style.display = "block";
        uploadPlaceholder.style.display = "none";
      };

      reader.readAsDataURL(file);
      currentImageFile = file;
    }
  });

  // Event Listeners
  addBirdBtn.addEventListener("click", openAddBirdModal);

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", closeModals);
  });

  cancelBtn.addEventListener("click", closeModals);
  cancelDeleteBtn.addEventListener("click", closeModals);
  confirmDeleteBtn.addEventListener("click", deleteBird);

  birdForm.addEventListener("submit", saveBird);

  searchInput.addEventListener("input", applyFilters);
  categoryFilter.addEventListener("change", applyFilters);

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === birdModal || e.target === deleteModal) {
      closeModals();
    }
  });
});
