const API_BASE_URL = "http://localhost:8080";

const reviewForm = document.querySelector("#reviewForm");
const composer = document.querySelector("[data-review-composer]");
const signinPanel = document.querySelector("[data-signin-panel]");
const reviewsList = document.querySelector("[data-reviews-list]");
const reviewMessage = document.querySelector("[data-review-message]");
const reviewCount = document.querySelector("[data-review-count]");
const formTitle = document.querySelector("[data-form-title]");
const submitButton = document.querySelector("[data-submit-review]");
const cancelEditButton = document.querySelector("[data-cancel-edit]");
const profileLink = document.querySelector("[data-profile-link]");
const guestLink = document.querySelector("[data-guest-link]");

let editingReviewId = null;
let reviews = [];

const currentUser = JSON.parse(window.localStorage.getItem("zoroUser") || "null");

const showMessage = (message, isError = false) => {
  reviewMessage.textContent = message;
  reviewMessage.className = `review-message${isError ? " is-error" : ""}`;
};

const readApiError = async (response) => {
  try {
    const data = await response.json();
    return data.message || data.error || "Request failed.";
  } catch {
    return "Request failed.";
  }
};

const escapeHtml = (value = "") =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);

const formatDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const validateReview = () => {
  const rating = Number(reviewForm.rating.value);
  const comment = reviewForm.comment.value.trim();

  if (rating < 1 || rating > 5) {
    return "Select a rating between 1 and 5.";
  }

  if (comment.length < 10 || comment.length > 500) {
    return "Review must be between 10 and 500 characters.";
  }

  return "";
};

const resetForm = () => {
  editingReviewId = null;
  reviewForm.reset();
  formTitle.textContent = "Add a review";
  submitButton.textContent = "Post review";
  cancelEditButton.hidden = true;
};

const startEdit = (reviewId) => {
  const review = reviews.find((item) => item.id === reviewId);

  if (!review) {
    return;
  }

  editingReviewId = review.id;
  reviewForm.rating.value = review.rating;
  reviewForm.comment.value = review.comment;
  formTitle.textContent = "Edit your review";
  submitButton.textContent = "Save review";
  cancelEditButton.hidden = false;
  showMessage("Editing your review.");
  composer.scrollIntoView({ behavior: "smooth" });
};

const getAvatarHtml = (review) => {
  if (review.userImageUrl) {
    return `<img src="${API_BASE_URL}${review.userImageUrl}" alt="${escapeHtml(review.userName || "Reviewer")}">`;
  }

  return escapeHtml((review.userName || "R").slice(0, 1).toUpperCase());
};

const getReviewActionsHtml = (review) => {
  if (!currentUser || currentUser.id !== review.userId) {
    return "";
  }

  return `
    <div class="review-actions">
      <button class="review-action is-edit" type="button" data-edit-review="${review.id}">Edit</button>
      <button class="review-action is-delete" type="button" data-delete-review="${review.id}">Delete</button>
    </div>
  `;
};

const renderReviews = () => {
  reviewCount.textContent = `${reviews.length} review${reviews.length === 1 ? "" : "s"}`;

  if (!reviews.length) {
    reviewsList.innerHTML = '<p class="empty-state">No reviews yet.</p>';
    return;
  }

  reviewsList.innerHTML = reviews.map((review) => `
    <article class="review-card">
      <div class="review-top">
        <div class="review-avatar">${getAvatarHtml(review)}</div>
        <div class="review-author">
          <h3>${escapeHtml(review.userName || "Zoro rider")}</h3>
          <p>${formatDate(review.updatedAt || review.createdAt)}</p>
        </div>
        <div class="review-stars" aria-label="${review.rating} out of 5 stars">
          ${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}
        </div>
      </div>
      <blockquote>${escapeHtml(review.comment)}</blockquote>
      ${getReviewActionsHtml(review)}
    </article>
  `).join("");
};

const loadReviews = async () => {
  reviewsList.innerHTML = '<p class="empty-state">Loading reviews...</p>';

  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews`);

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    reviews = await response.json();
    renderReviews();
  } catch (error) {
    reviewsList.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
};

const deleteReview = async (reviewId) => {
  if (!currentUser || !window.confirm("Delete this review?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}?userId=${currentUser.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    resetForm();
    showMessage("Review deleted.");
    await loadReviews();
  } catch (error) {
    showMessage(error.message, true);
  }
};

const saveReview = async (event) => {
  event.preventDefault();

  if (!currentUser) {
    showMessage("Sign in to add a review.", true);
    return;
  }

  const validationError = validateReview();

  if (validationError) {
    showMessage(validationError, true);
    return;
  }

  const reviewData = {
    userId: currentUser.id,
    rating: Number(reviewForm.rating.value),
    comment: reviewForm.comment.value.trim(),
  };
  const isEditing = editingReviewId !== null;
  const url = isEditing
    ? `${API_BASE_URL}/api/reviews/${editingReviewId}`
    : `${API_BASE_URL}/api/reviews`;

  try {
    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    resetForm();
    showMessage(isEditing ? "Review updated." : "Review posted.");
    await loadReviews();
  } catch (error) {
    showMessage(error.message, true);
  }
};

if (currentUser) {
  composer.hidden = false;
  signinPanel.hidden = true;
  profileLink.hidden = false;
  guestLink.hidden = true;
} else {
  composer.hidden = true;
  signinPanel.hidden = false;
}

reviewForm.addEventListener("submit", saveReview);
cancelEditButton.addEventListener("click", resetForm);

reviewsList.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-review]");
  const deleteButton = event.target.closest("[data-delete-review]");

  if (editButton) {
    startEdit(Number(editButton.dataset.editReview));
  }

  if (deleteButton) {
    deleteReview(Number(deleteButton.dataset.deleteReview));
  }
});

loadReviews();
