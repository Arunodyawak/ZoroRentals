const API_BASE_URL = "http://localhost:8080";

const signupForm = document.querySelector("#signupForm");
const signinForm = document.querySelector("#signinForm");
const signupMessage = document.querySelector("#signupMessage");
const signinMessage = document.querySelector("#signinMessage");

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
    return data.message || data.error || "Request failed.";
  } catch {
    return "Request failed.";
  }
};

const validateSignupForm = () => {
  const fullName = signupForm.elements.fullName.value.trim();
  const email = signupForm.elements.email.value.trim();
  const password = signupForm.elements.password.value;
  const phone = signupForm.elements.phone.value.trim();
  const nicNumber = signupForm.elements.nicNumber.value.trim();
  const drivingLicenseNumber = signupForm.elements.drivingLicenseNumber.value.trim();

  if (!fullName || !email || !password || !phone || !nicNumber || !drivingLicenseNumber) {
    return "Please fill in all required fields.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (!/^\+?[0-9]{7,15}$/.test(phone)) {
    return "Phone must contain 7 to 15 digits and may start with +.";
  }

  if (!ZoroUserValidation.isValidNic(nicNumber)) {
    return ZoroUserValidation.messages.nic;
  }

  if (!ZoroUserValidation.isValidDrivingLicense(drivingLicenseNumber)) {
    return ZoroUserValidation.messages.drivingLicense;
  }

  return "";
};

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const validationMessage = validateSignupForm();

    if (validationMessage) {
      setMessage(signupMessage, validationMessage, "error");
      return;
    }

    const formData = new FormData(signupForm);
    formData.set("fullName", signupForm.elements.fullName.value.trim());
    formData.set("email", signupForm.elements.email.value.trim());
    formData.set("phone", signupForm.elements.phone.value.trim());
    formData.set("nicNumber", signupForm.elements.nicNumber.value.trim());
    formData.set("drivingLicenseNumber", signupForm.elements.drivingLicenseNumber.value.trim());

    setMessage(signupMessage, "Creating account...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      window.localStorage.setItem("zoroAuthMessage", "Account created. Please sign in.");
      window.location.href = "signin.html";
    } catch (error) {
      setMessage(signupMessage, error.message, "error");
    }
  });
}

if (signinForm) {
  const authMessage = window.localStorage.getItem("zoroAuthMessage");

  if (authMessage) {
    setMessage(signinMessage, authMessage, "success");
    window.localStorage.removeItem("zoroAuthMessage");
  }

  signinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = signinForm.elements.email.value.trim();
    const password = signinForm.elements.password.value;

    if (!email || !password) {
      setMessage(signinMessage, "Email and password are required.", "error");
      return;
    }

    setMessage(signinMessage, "Signing in...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const user = await response.json();
      window.localStorage.setItem("zoroUser", JSON.stringify(user));
      window.location.href = "index.html";
    } catch (error) {
      setMessage(signinMessage, error.message, "error");
    }
  });
}
