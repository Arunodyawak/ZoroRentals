const API_BASE_URL = "http://localhost:8080";

const profileForm = document.querySelector("#profileForm");
const profileMessage = document.querySelector("[data-profile-message]");
const profilePhoto = document.querySelector("[data-profile-photo]");
const profileName = document.querySelector("[data-profile-name]");
const profileEmail = document.querySelector("[data-profile-email]");
const profileDate = document.querySelector("[data-profile-date]");
const logoutButton = document.querySelector("[data-profile-logout]");
const editButton = document.querySelector("[data-edit-profile]");
const cancelButton = document.querySelector("[data-cancel-edit]");
const formActions = document.querySelector("[data-profile-form-actions]");

const fields = profileForm.elements;
let currentUser = null;

const getStoredUser = () => JSON.parse(window.localStorage.getItem("zoroUser") || "null");

const showMessage = (message, type = "") => {
  profileMessage.textContent = message;
  profileMessage.className = `profile-message${type ? ` is-${type}` : ""}`;
};

const readApiError = async (response) => {
  try {
    const data = await response.json();
    return data.message || data.error || "Request failed.";
  } catch {
    return "Request failed.";
  }
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const setFieldValue = (fieldName, value) => {
  fields[fieldName].value = value || "";
};

const showProfileImage = (user) => {
  profilePhoto.innerHTML = "";

  if (user.imageUrl) {
    const image = document.createElement("img");
    image.src = `${API_BASE_URL}${user.imageUrl}`;
    image.alt = user.fullName || "Profile";
    profilePhoto.append(image);
    return;
  }

  profilePhoto.textContent = (user.fullName || user.email || "U").slice(0, 1).toUpperCase();
};

const setEditMode = (isEditing) => {
  formActions.hidden = !isEditing;
  editButton.hidden = isEditing;

  fields.phone.readOnly = !isEditing;
  fields.address.readOnly = !isEditing;

  // NIC and driving license can be added once, then they become locked.
  fields.nicNumber.readOnly = !isEditing || Boolean(currentUser.nicNumber);
  fields.drivingLicenseNumber.readOnly = !isEditing || Boolean(currentUser.drivingLicenseNumber);
};

const renderProfile = (user) => {
  currentUser = user;

  document.querySelector("#profile-title").textContent = `Welcome, ${user.fullName || "Rider"}`;
  profileName.textContent = user.fullName || "Profile";
  profileEmail.textContent = user.email || "";
  profileDate.textContent = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  showProfileImage(user);
  setFieldValue("fullName", user.fullName);
  setFieldValue("email", user.email);
  setFieldValue("phone", user.phone);
  setFieldValue("address", user.address);
  setFieldValue("nicNumber", user.nicNumber);
  setFieldValue("drivingLicenseNumber", user.drivingLicenseNumber);
  setFieldValue("createdAt", formatDate(user.createdAt));
  setFieldValue("updatedAt", formatDate(user.updatedAt));
  setEditMode(false);
};

const validateProfile = () => {
  const phone = fields.phone.value.trim();
  const address = fields.address.value.trim();
  const nicNumber = fields.nicNumber.value.trim();
  const drivingLicenseNumber = fields.drivingLicenseNumber.value.trim();

  if (!/^\+?[0-9]{7,15}$/.test(phone)) {
    return "Phone must contain 7 to 15 digits and may start with +.";
  }

  if (address.length > 255) {
    return "Address must be 255 characters or fewer.";
  }

  const nicError = ZoroUserValidation.validateNic(nicNumber);
  if (nicError) {
    return nicError;
  }

  const drivingLicenseError = ZoroUserValidation.validateDrivingLicense(drivingLicenseNumber);
  if (drivingLicenseError) {
    return drivingLicenseError;
  }

  return "";
};

const loadProfile = async () => {
  const storedUser = getStoredUser();

  if (!storedUser?.id) {
    window.location.href = "signin.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${storedUser.id}`);

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const user = await response.json();
    window.localStorage.setItem("zoroUser", JSON.stringify(user));
    renderProfile(user);
    showMessage("");
  } catch (error) {
    showMessage(error.message, "error");
  }
};

const saveProfile = async (event) => {
  event.preventDefault();

  const validationError = validateProfile();

  if (validationError) {
    showMessage(validationError, "error");
    return;
  }

  const formData = new FormData();
  formData.set("fullName", currentUser.fullName);
  formData.set("email", currentUser.email);
  formData.set("phone", fields.phone.value.trim());
  formData.set("address", fields.address.value.trim());
  formData.set("nicNumber", fields.nicNumber.value.trim());
  formData.set("drivingLicenseNumber", fields.drivingLicenseNumber.value.trim());

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const updatedUser = await response.json();
    window.localStorage.setItem("zoroUser", JSON.stringify(updatedUser));
    renderProfile(updatedUser);
    showMessage("Profile updated successfully.", "success");
  } catch (error) {
    showMessage(error.message, "error");
  }
};

editButton.addEventListener("click", () => {
  setEditMode(true);
  showMessage("Phone and address can be edited. NIC and license can only be saved once.");
});

cancelButton.addEventListener("click", () => {
  renderProfile(currentUser);
  showMessage("");
});

logoutButton.addEventListener("click", () => {
  window.localStorage.removeItem("zoroUser");
  window.localStorage.setItem("zoroAuthMessage", "Logged out successfully.");
  window.location.href = "index.html";
});

profileForm.addEventListener("submit", saveProfile);
loadProfile();
