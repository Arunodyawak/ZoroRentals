const API_BASE_URLS = ["http://localhost:8080", "http://127.0.0.1:8080"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

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

const getNetworkErrorMessage = (error) => {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Cannot connect to backend. Start the backend on port 8080 and try again.";
  }

  return error.message || "Request failed.";
};

const imageSizeError = (form) => {
  const image = form.image?.files?.[0];

  if (image && image.size > MAX_IMAGE_SIZE) {
    return "Profile image must be 10 MB or smaller.";
  }

  return "";
};

const userIdentityError = (form) => (
  ZoroUserValidation.validateNic(form.nicNumber.value)
  || ZoroUserValidation.validateDrivingLicense(form.drivingLicenseNumber.value)
);

// Try localhost first. If the browser cannot reach it, try 127.0.0.1.
const sendRequest = async (path, options) => {
  let lastError;

  for (const baseUrl of API_BASE_URLS) {
    try {
      return await fetch(`${baseUrl}${path}`, options);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const signupForm = document.querySelector("#signupForm");
const signupMessage = document.querySelector("#signupMessage");

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const imageError = imageSizeError(signupForm);
    if (imageError) {
      setMessage(signupMessage, imageError, "error");
      return;
    }

    const identityError = userIdentityError(signupForm);
    if (identityError) {
      setMessage(signupMessage, identityError, "error");
      return;
    }

    signupForm.nicNumber.value = ZoroUserValidation.clean(signupForm.nicNumber.value);
    signupForm.drivingLicenseNumber.value = ZoroUserValidation.clean(signupForm.drivingLicenseNumber.value);
    setMessage(signupMessage, "Creating your account...");

    try {
      const response = await sendRequest("/api/users", {
        method: "POST",
        body: new FormData(signupForm),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      signupForm.reset();
      setMessage(signupMessage, "Account created. Opening sign in...", "success");
      window.setTimeout(() => {
        window.location.href = "signin.html";
      }, 700);
    } catch (error) {
      setMessage(signupMessage, getNetworkErrorMessage(error), "error");
    }
  });
}

const signinForm = document.querySelector("#signinForm");
const signinMessage = document.querySelector("#signinMessage");

if (signinForm) {
  signinForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(signinMessage, "Signing in...");

    const payload = {
      email: signinForm.email.value,
      password: signinForm.password.value,
    };

    try {
      const response = await sendRequest("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const user = await response.json();
      window.localStorage.setItem("zoroUser", JSON.stringify(user));
      window.localStorage.setItem("zoroAuthMessage", "Logged in successfully.");
      setMessage(signinMessage, `Signed in as ${user.fullName}. Opening home...`, "success");
      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 700);
    } catch (error) {
      setMessage(signinMessage, getNetworkErrorMessage(error), "error");
    }
  });
}
