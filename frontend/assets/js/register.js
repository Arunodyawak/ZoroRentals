const API_BASE_URL = "http://localhost:8080/api/users";
const IMAGE_BASE_URL = "http://localhost:8080";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const form = document.querySelector("#registrationForm");
const formMessage = document.querySelector("#formMessage");
const profilesList = document.querySelector("#profilesList");
const submitButton = document.querySelector("#submitButton");
const resetButton = document.querySelector("#resetButton");
const refreshButton = document.querySelector("#refreshButton");
const userIdInput = document.querySelector("#userId");

let users = [];

const setMessage = (message, type = "") => {
  formMessage.textContent = message;
  formMessage.className = `form-message${type ? ` is-${type}` : ""}`;
};

const resetForm = () => {
  form.reset();
  userIdInput.value = "";
  submitButton.textContent = "Register";
  form.password.required = true;
  setMessage("");
};

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data.message || data.error || "Request failed.";
  } catch {
    return "Request failed.";
  }
};

const imageSizeError = () => {
  const image = form.image?.files?.[0];

  if (image && image.size > MAX_IMAGE_SIZE) {
    return "Profile image must be 10 MB or smaller.";
  }

  return "";
};

const identityError = () => (
  ZoroUserValidation.validateNic(form.nicNumber.value)
  || ZoroUserValidation.validateDrivingLicense(form.drivingLicenseNumber.value)
);

const loadUsers = async () => {
  profilesList.innerHTML = '<p class="empty-state">Loading users...</p>';

  try {
    const response = await fetch(API_BASE_URL);

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    users = await response.json();
    renderUsers();
  } catch (error) {
    profilesList.innerHTML = `<p class="empty-state">${error.message}</p>`;
  }
};

const renderUsers = () => {
  if (!users.length) {
    profilesList.innerHTML = '<p class="empty-state">No users registered yet.</p>';
    return;
  }

  profilesList.replaceChildren(
    ...users.map((user) => {
      const card = document.createElement("article");
      card.className = "profile-card";

      const imageWrap = document.createElement("div");
      imageWrap.className = "profile-image";

      if (user.imageUrl) {
        const image = document.createElement("img");
        image.src = `${IMAGE_BASE_URL}${user.imageUrl}`;
        image.alt = user.fullName;
        imageWrap.append(image);
      } else {
        imageWrap.textContent = user.fullName.slice(0, 1).toUpperCase();
      }

      const details = document.createElement("div");
      const name = document.createElement("div");
      name.className = "profile-name";
      name.textContent = user.fullName;

      const meta = document.createElement("div");
      meta.className = "profile-meta";
      meta.textContent = `${user.email} | ${user.phone}`;

      details.append(name, meta);

      const actions = document.createElement("div");
      actions.className = "profile-actions";

      const editButton = document.createElement("button");
      editButton.className = "secondary-action";
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => fillForm(user));

      const deleteButton = document.createElement("button");
      deleteButton.className = "danger-action";
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => deleteUser(user.id));

      actions.append(editButton, deleteButton);
      card.append(imageWrap, details, actions);

      return card;
    }),
  );
};

const fillForm = (user) => {
  userIdInput.value = user.id;
  form.fullName.value = user.fullName || "";
  form.email.value = user.email || "";
  form.password.value = "";
  form.password.required = false;
  form.phone.value = user.phone || "";
  form.nicNumber.value = user.nicNumber || "";
  form.drivingLicenseNumber.value = user.drivingLicenseNumber || "";
  form.address.value = user.address || "";
  submitButton.textContent = "Update";
  setMessage("Editing existing user. Leave password empty to keep the current password.");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
};

const deleteUser = async (id) => {
  const shouldDelete = window.confirm("Delete this user?");

  if (!shouldDelete) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    setMessage("User deleted.", "success");
    await loadUsers();
  } catch (error) {
    setMessage(error.message, "error");
  }
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const imageError = imageSizeError();
  if (imageError) {
    setMessage(imageError, "error");
    return;
  }

  const userIdentityError = identityError();
  if (userIdentityError) {
    setMessage(userIdentityError, "error");
    return;
  }

  form.nicNumber.value = ZoroUserValidation.clean(form.nicNumber.value);
  form.drivingLicenseNumber.value = ZoroUserValidation.clean(form.drivingLicenseNumber.value);
  const formData = new FormData(form);
  const userId = userIdInput.value;

  if (userId && !form.password.value) {
    formData.delete("password");
  }

  formData.delete("userId");
  setMessage(userId ? "Updating user..." : "Registering user...");

  try {
    const response = await fetch(userId ? `${API_BASE_URL}/${userId}` : API_BASE_URL, {
      method: userId ? "PUT" : "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    resetForm();
    setMessage(userId ? "User updated." : "User registered.", "success");
    await loadUsers();
  } catch (error) {
    setMessage(error.message, "error");
  }
});

resetButton.addEventListener("click", resetForm);
refreshButton.addEventListener("click", loadUsers);

loadUsers();
