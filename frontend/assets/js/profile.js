const API_BASE_URL = "http://localhost:8080";

const profileForm = document.querySelector("#profileForm");
const profileMessage = document.querySelector("[data-profile-message]");
const profilePhoto = document.querySelector("[data-profile-photo]");
const profileName = document.querySelector("[data-profile-name]");
const profileEmail = document.querySelector("[data-profile-email]");
const profileDate = document.querySelector("[data-profile-date]");
const logoutButton = document.querySelector("[data-profile-logout]");
const editButton = document.querySelector("[data-edit-profile]");
const deleteButton = document.querySelector("[data-delete-profile]");
const cancelButton = document.querySelector("[data-cancel-edit]");
const formActions = document.querySelector("[data-profile-form-actions]");

let currentUser = null;

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const getSignedInUser = () => {
  try {
    return JSON.parse(window.localStorage.getItem("zoroUser"));
  } catch {
    return null;
  }
};

const setMessage = (message, type = "") => {
  profileMessage.textContent = message;
  profileMessage.className = `profile-message${type ? ` is-${type}` : ""}`;
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const renderProfileImage = (user) => {
  profilePhoto.replaceChildren();

  if (user.imageUrl) {
    const image = document.createElement("img");
    image.src = `${API_BASE_URL}${user.imageUrl}`;
    image.alt = user.fullName || "Profile";
    profilePhoto.append(image);
    return;
  }

  profilePhoto.textContent = (user.fullName || user.email || "U").slice(0, 1).toUpperCase();
};

const setField = (name, value) => {
  profileForm.elements[name].value = value || "";
};

const setEditMode = (isEditing) => {
  formActions.hidden = !isEditing;
  editButton.hidden = isEditing;

  profileForm.elements.phone.readOnly = !isEditing;
  profileForm.elements.address.readOnly = !isEditing;

  const canSetNic = isEditing && !currentUser?.nicNumber;
  const canSetLicense = isEditing && !currentUser?.drivingLicenseNumber;

  profileForm.elements.nicNumber.readOnly = !canSetNic;
  profileForm.elements.drivingLicenseNumber.readOnly = !canSetLicense;
};

const renderProfile = (user) => {
  currentUser = user;
  profileName.textContent = user.fullName || "Profile";
  profileEmail.textContent = user.email || "";
  profileDate.textContent = dateFormatter.format(new Date());
  document.querySelector("#profile-title").textContent = `Welcome, ${user.fullName || "Rider"}`;
  renderProfileImage(user);

  setField("fullName", user.fullName);
  setField("email", user.email);
  setField("phone", user.phone);
  setField("address", user.address);
  setField("nicNumber", user.nicNumber);
  setField("drivingLicenseNumber", user.drivingLicenseNumber);
  setField("createdAt", formatDateTime(user.createdAt));
  setField("updatedAt", formatDateTime(user.updatedAt));
  setEditMode(false);
};

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data.message || data.error || "Request failed.";
  } catch {
    return "Request failed.";
  }
};

const validateProfileForm = () => {
  const phone = profileForm.elements.phone.value.trim();
  const address = profileForm.elements.address.value.trim();
  const nicNumber = profileForm.elements.nicNumber.value.trim();
  const drivingLicenseNumber = profileForm.elements.drivingLicenseNumber.value.trim();

  if (!/^\+?[0-9]{7,15}$/.test(phone)) {
    return "Phone must contain 7 to 15 digits and may start with +.";
  }

  if (address.length > 255) {
    return "Address must be 255 characters or fewer.";
  }

  if (nicNumber && !ZoroUserValidation.isValidNic(nicNumber)) {
    return ZoroUserValidation.messages.nic;
  }

  if (drivingLicenseNumber && !ZoroUserValidation.isValidDrivingLicense(drivingLicenseNumber)) {
    return ZoroUserValidation.messages.drivingLicense;
  }

  return "";
};

const loadProfile = async () => {
  const signedInUser = getSignedInUser();

  if (!signedInUser?.id) {
    window.location.href = "signin.html";
    return;
  }

  setMessage("Loading profile...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${signedInUser.id}`);

    if (!response.ok) {
      throw new Error("Could not load profile.");
    }

    const user = await response.json();
    window.localStorage.setItem("zoroUser", JSON.stringify(user));
    setMessage("");
    renderProfile(user);
  } catch (error) {
    setMessage(error.message, "error");
  }
};

if (editButton) {
  editButton.addEventListener("click", () => {
    setEditMode(true);
    setMessage("Phone and address can be edited. NIC and license can only be saved once.");
  });
}

if (cancelButton) {
  cancelButton.addEventListener("click", () => {
    renderProfile(currentUser);
    setMessage("");
  });
}

if (deleteButton) {
  deleteButton.addEventListener("click", async () => {
    if (!currentUser?.id) {
      setMessage("Could not find the signed-in profile.", "error");
      return;
    }

    const confirmed = window.confirm("Delete your profile permanently?");

    if (!confirmed) {
      return;
    }

    deleteButton.disabled = true;
    setMessage("Deleting profile...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      window.localStorage.removeItem("zoroUser");
      window.localStorage.setItem("zoroAuthMessage", "Profile deleted successfully.");
      window.location.href = "index.html";
    } catch (error) {
      deleteButton.disabled = false;
      setMessage(error.message, "error");
    }
  });
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const validationMessage = validateProfileForm();

  if (validationMessage) {
    setMessage(validationMessage, "error");
    return;
  }

  const formData = new FormData();
  formData.set("fullName", currentUser.fullName);
  formData.set("email", currentUser.email);
  formData.set("phone", profileForm.elements.phone.value.trim());
  formData.set("address", profileForm.elements.address.value.trim());
  formData.set("nicNumber", profileForm.elements.nicNumber.value.trim());
  formData.set("drivingLicenseNumber", profileForm.elements.drivingLicenseNumber.value.trim());

  setMessage("Saving profile...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const updatedUser = await response.json();
    window.localStorage.setItem("zoroUser", JSON.stringify(updatedUser));
    renderProfile(updatedUser);
    setMessage("Profile updated successfully.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
});

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    window.localStorage.removeItem("zoroUser");
    window.localStorage.setItem("zoroAuthMessage", "Logged out successfully.");
    window.location.href = "index.html";
  });
}

loadProfile();
