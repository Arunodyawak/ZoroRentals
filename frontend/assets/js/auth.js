const API_BASE_URL = "http://localhost:8080";

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

const signupForm = document.querySelector("#signupForm");
const signupMessage = document.querySelector("#signupMessage");

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(signupMessage, "Creating your account...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
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
