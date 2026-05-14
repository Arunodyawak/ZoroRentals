const API_BASE_URL = "http://localhost:8080";

const admin = (() => {
  try {
    return JSON.parse(window.localStorage.getItem("zoroAdmin"));
  } catch {
    return null;
  }
})();

if (!admin) {
  window.location.href = "signin.html";
}

const welcome = document.querySelector("[data-admin-welcome]");
const logoutButton = document.querySelector("[data-admin-logout]");
const dashboardActions = document.querySelector(".admin-actions");
const userManagementView = document.querySelector('[data-admin-view="users"]');
const userManagementButton = document.querySelector('[data-admin-view-button="users"]');
const closeManagementButton = document.querySelector("[data-close-management]");
const seeAdminsButton = document.querySelector("[data-see-admins]");
const seeUsersButton = document.querySelector("[data-see-users]");

const adminForm = document.querySelector("#adminForm");
const adminList = document.querySelector("[data-admin-list]");
const adminTable = document.querySelector("[data-admin-table]");
const adminMessage = document.querySelector("[data-admin-message]");
const adminSubmit = document.querySelector("[data-admin-submit]");
const adminCancel = document.querySelector("[data-admin-cancel]");

const userForm = document.querySelector("#userForm");
const userList = document.querySelector("[data-user-list]");
const userTable = document.querySelector("[data-user-table]");
const userMessage = document.querySelector("[data-user-message]");
const userSubmit = document.querySelector("[data-user-submit]");
const userCancel = document.querySelector("[data-user-cancel]");

let admins = [];
let users = [];

const setMessage = (element, message, type = "") => {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `form-message${type ? ` is-${type}` : ""}`;
};

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    const message = data.message || data.error || "Request failed.";

    if (response.status === 404 && message.includes("No static resource")) {
      return "Admin API is not available. Restart the backend server so the new admin routes are loaded.";
    }

    return message;
  } catch {
    return "Request failed.";
  }
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const resetAdminForm = () => {
  adminForm.reset();
  adminForm.elements.id.value = "";
  adminSubmit.textContent = "Create Admin";
  adminCancel.hidden = true;
};

const resetUserForm = () => {
  userForm.reset();
  userForm.elements.id.value = "";
  userSubmit.textContent = "Create User";
  userCancel.hidden = true;
};

const renderAdmins = () => {
  adminList.replaceChildren();

  if (!admins.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="3">No admins found.</td>';
    adminList.append(row);
    return;
  }

  admins.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.username)}</td>
      <td>${escapeHtml(item.displayName)}</td>
      <td>
        <div class="table-actions">
          <button type="button" data-edit-admin="${item.id}">Edit</button>
          <button class="danger-button" type="button" data-delete-admin="${item.id}">Delete</button>
        </div>
      </td>
    `;
    adminList.append(row);
  });
};

const renderUsers = () => {
  userList.replaceChildren();

  if (!users.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="7">No users found.</td>';
    userList.append(row);
    return;
  }

  users.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.fullName)}</td>
      <td>${escapeHtml(item.email)}</td>
      <td>${escapeHtml(item.phone)}</td>
      <td>${escapeHtml(item.address)}</td>
      <td>${escapeHtml(item.nicNumber)}</td>
      <td>${escapeHtml(item.drivingLicenseNumber)}</td>
      <td>
        <div class="table-actions">
          <button type="button" data-edit-user="${item.id}">Edit</button>
          <button class="danger-button" type="button" data-delete-user="${item.id}">Delete</button>
        </div>
      </td>
    `;
    userList.append(row);
  });
};

const loadAdmins = async () => {
  setMessage(adminMessage, "Loading current admins...");

  try {
    admins = await requestJson("/api/admin/admins");
    renderAdmins();
    adminTable.hidden = false;
    setMessage(adminMessage, "");
  } catch (error) {
    setMessage(adminMessage, error.message, "error");
  }
};

const loadUsers = async () => {
  setMessage(userMessage, "Loading current users...");

  try {
    users = await requestJson("/api/admin/users");
    renderUsers();
    userTable.hidden = false;
    setMessage(userMessage, "");
  } catch (error) {
    setMessage(userMessage, error.message, "error");
  }
};

const showUserManagement = () => {
  dashboardActions.hidden = true;
  userManagementView.hidden = false;
};

const showDashboard = () => {
  userManagementView.hidden = true;
  dashboardActions.hidden = false;
};

const getAdminPayload = () => ({
  username: adminForm.elements.username.value.trim(),
  displayName: adminForm.elements.displayName.value.trim(),
  password: adminForm.elements.password.value,
});

const getUserPayload = () => ({
  fullName: userForm.elements.fullName.value.trim(),
  email: userForm.elements.email.value.trim(),
  password: userForm.elements.password.value,
  phone: userForm.elements.phone.value.trim(),
  address: userForm.elements.address.value.trim(),
  nicNumber: userForm.elements.nicNumber.value.trim(),
  drivingLicenseNumber: userForm.elements.drivingLicenseNumber.value.trim(),
});

const validateUserPayload = (payload, isEditing) => {
  if (!payload.fullName || !payload.email || !payload.phone || !payload.nicNumber || !payload.drivingLicenseNumber) {
    return "Full name, email, phone, NIC, and driving license are required.";
  }

  if (!isEditing && !payload.password) {
    return "Password is required when creating a user.";
  }

  if (payload.password && payload.password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (!/^\+?[0-9]{7,15}$/.test(payload.phone)) {
    return "Phone must contain 7 to 15 digits and may start with +.";
  }

  if (!ZoroUserValidation.isValidNic(payload.nicNumber)) {
    return ZoroUserValidation.messages.nic;
  }

  if (!ZoroUserValidation.isValidDrivingLicense(payload.drivingLicenseNumber)) {
    return ZoroUserValidation.messages.drivingLicense;
  }

  return "";
};

if (welcome && admin) {
  welcome.textContent = `Signed in as ${admin.displayName || admin.username}.`;
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    window.localStorage.removeItem("zoroAdmin");
    window.location.href = "signin.html";
  });
}

if (userManagementButton) {
  userManagementButton.addEventListener("click", showUserManagement);
}

if (closeManagementButton) {
  closeManagementButton.addEventListener("click", showDashboard);
}

if (seeAdminsButton) {
  seeAdminsButton.addEventListener("click", loadAdmins);
}

if (seeUsersButton) {
  seeUsersButton.addEventListener("click", loadUsers);
}

if (adminCancel) {
  adminCancel.addEventListener("click", () => {
    resetAdminForm();
    setMessage(adminMessage, "");
  });
}

if (userCancel) {
  userCancel.addEventListener("click", () => {
    resetUserForm();
    setMessage(userMessage, "");
  });
}

adminForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = adminForm.elements.id.value;
  const payload = getAdminPayload();

  if (!id && !payload.password) {
    setMessage(adminMessage, "Password is required when creating an admin.", "error");
    return;
  }

  setMessage(adminMessage, id ? "Updating admin..." : "Creating admin...");

  try {
    await requestJson(`/api/admin/admins${id ? `/${id}` : ""}`, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    resetAdminForm();
    if (!adminTable.hidden) {
      await loadAdmins();
    }
    setMessage(adminMessage, id ? "Admin updated." : "Admin created.", "success");
  } catch (error) {
    setMessage(adminMessage, error.message, "error");
  }
});

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = userForm.elements.id.value;
  const payload = getUserPayload();
  const validationMessage = validateUserPayload(payload, Boolean(id));

  if (validationMessage) {
    setMessage(userMessage, validationMessage, "error");
    return;
  }

  setMessage(userMessage, id ? "Updating user..." : "Creating user...");

  try {
    await requestJson(`/api/admin/users${id ? `/${id}` : ""}`, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    resetUserForm();
    if (!userTable.hidden) {
      await loadUsers();
    }
    setMessage(userMessage, id ? "User updated." : "User created.", "success");
  } catch (error) {
    setMessage(userMessage, error.message, "error");
  }
});

adminList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-admin]");
  const deleteButton = event.target.closest("[data-delete-admin]");

  if (editButton) {
    const item = admins.find((entry) => String(entry.id) === editButton.dataset.editAdmin);

    if (!item) {
      return;
    }

    adminForm.elements.id.value = item.id;
    adminForm.elements.username.value = item.username;
    adminForm.elements.displayName.value = item.displayName || "";
    adminForm.elements.password.value = "";
    adminSubmit.textContent = "Update Admin";
    adminCancel.hidden = false;
    setMessage(adminMessage, "Leave password blank to keep the current password.");
  }

  if (deleteButton) {
    const id = deleteButton.dataset.deleteAdmin;
    const item = admins.find((entry) => String(entry.id) === id);

    if (!window.confirm(`Delete admin ${item?.username || id}?`)) {
      return;
    }

    try {
      await requestJson(`/api/admin/admins/${id}`, { method: "DELETE" });
      await loadAdmins();
      resetAdminForm();
      setMessage(adminMessage, "Admin deleted.", "success");
    } catch (error) {
      setMessage(adminMessage, error.message, "error");
    }
  }
});

userList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-user]");
  const deleteButton = event.target.closest("[data-delete-user]");

  if (editButton) {
    const item = users.find((entry) => String(entry.id) === editButton.dataset.editUser);

    if (!item) {
      return;
    }

    userForm.elements.id.value = item.id;
    userForm.elements.fullName.value = item.fullName || "";
    userForm.elements.email.value = item.email || "";
    userForm.elements.password.value = "";
    userForm.elements.phone.value = item.phone || "";
    userForm.elements.address.value = item.address || "";
    userForm.elements.nicNumber.value = item.nicNumber || "";
    userForm.elements.drivingLicenseNumber.value = item.drivingLicenseNumber || "";
    userSubmit.textContent = "Update User";
    userCancel.hidden = false;
    setMessage(userMessage, "Leave password blank to keep the current password.");
  }

  if (deleteButton) {
    const id = deleteButton.dataset.deleteUser;
    const item = users.find((entry) => String(entry.id) === id);

    if (!window.confirm(`Delete user ${item?.email || id}?`)) {
      return;
    }

    try {
      await requestJson(`/api/admin/users/${id}`, { method: "DELETE" });
      await loadUsers();
      resetUserForm();
      setMessage(userMessage, "User deleted.", "success");
    } catch (error) {
      setMessage(userMessage, error.message, "error");
    }
  }
});
