const searchForm = document.querySelector(".search-panel");
const API_BASE_URL = "http://localhost:8080";

const authGuestElements = [...document.querySelectorAll("[data-auth-guest]")];
const authUserElement = document.querySelector("[data-auth-user]");
const profileAvatar = document.querySelector("[data-profile-avatar]");
const logoutButton = document.querySelector("[data-logout-button]");
const authStatus = document.querySelector("[data-auth-status]");

const showAuthStatus = (message) => {
  if (!authStatus || !message) {
    return;
  }

  authStatus.textContent = message;
  authStatus.hidden = false;

  window.setTimeout(() => {
    authStatus.hidden = true;
    authStatus.textContent = "";
  }, 2600);
};

const getSignedInUser = () => {
  try {
    return JSON.parse(window.localStorage.getItem("zoroUser"));
  } catch {
    return null;
  }
};

const renderAuthHeader = () => {
  const user = getSignedInUser();

  authGuestElements.forEach((element) => {
    element.hidden = Boolean(user);
  });

  if (!authUserElement) {
    return;
  }

  authUserElement.hidden = !user;

  if (!user || !profileAvatar) {
    return;
  }

  profileAvatar.replaceChildren();
  profileAvatar.setAttribute("title", user.fullName || "Profile");

  if (user.imageUrl) {
    const image = document.createElement("img");
    image.src = `${API_BASE_URL}${user.imageUrl}`;
    image.alt = user.fullName || "Profile";
    profileAvatar.append(image);
    return;
  }

  profileAvatar.textContent = (user.fullName || user.email || "U").slice(0, 1).toUpperCase();
};

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    window.localStorage.removeItem("zoroUser");
    renderAuthHeader();
    showAuthStatus("Logged out successfully.");
  });
}

if (profileAvatar) {
  profileAvatar.addEventListener("click", () => {
    window.location.href = "profile.html";
  });
}

renderAuthHeader();

const authMessage = window.localStorage.getItem("zoroAuthMessage");

if (authMessage) {
  window.localStorage.removeItem("zoroAuthMessage");
  showAuthStatus(authMessage);
}

if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}

const dateFields = [...document.querySelectorAll("[data-date-field]")];
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});
const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const getDateTimeParts = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = dateFormatter.formatToParts(date).reduce((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});

  return {
    date,
    weekday: parts.weekday,
    day: parts.day,
    month: parts.month,
    time: `${parts.hour}:${parts.minute}`,
  };
};

const isSameDate = (first, second) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const lastDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const addMonths = (date, months) => new Date(date.getFullYear(), date.getMonth() + months, 1);

const toDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const toDateTimeValue = (date, time) => `${toDateValue(date)}T${time}`;
const getPickupMinDate = () => addDays(startOfDay(new Date()), 2);
const getFieldByRole = (role) => dateFields.find((field) => field.dataset.dateRole === role);
const getFieldInput = (field) => field?.querySelector(".date-input");
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const positionCalendarPreview = (field) => {
  const calendar = field.querySelector(".calendar-preview");

  if (!calendar || window.matchMedia("(max-width: 980px)").matches) {
    return;
  }

  const fieldRect = field.getBoundingClientRect();
  const calendarWidth = calendar.offsetWidth || 360;
  const viewportPadding = 16;
  const preferredLeft =
    field.dataset.dateRole === "return"
      ? fieldRect.right - calendarWidth - 24
      : fieldRect.left + 24;

  field.style.setProperty(
    "--calendar-left",
    `${clamp(preferredLeft, viewportPadding, window.innerWidth - calendarWidth - viewportPadding)}px`,
  );
  field.style.setProperty("--calendar-top", `${fieldRect.bottom + 12}px`);
};

const closeCalendarPreviews = () => {
  dateFields.forEach((field) => field.classList.remove("is-open"));
};

const positionOpenCalendarPreview = () => {
  const openField = dateFields.find((field) => field.classList.contains("is-open"));

  if (openField) {
    positionCalendarPreview(openField);
  }
};

const getFieldMinDate = (field) => {
  if (field.dataset.dateRole !== "return") {
    return getPickupMinDate();
  }

  const pickupParts = getDateTimeParts(getFieldInput(getFieldByRole("pickup"))?.value);
  return addDays(startOfDay(pickupParts?.date || getPickupMinDate()), 1);
};

const setInputValue = (input, date, time) => {
  input.value = toDateTimeValue(startOfDay(date), time);
};

const setFieldView = (field, date) => {
  const monthDate = firstDayOfMonth(date);

  field.dataset.viewYear = String(monthDate.getFullYear());
  field.dataset.viewMonth = String(monthDate.getMonth());
};

const getFieldViewDate = (field, fallbackDate) => {
  const year = Number(field.dataset.viewYear);
  const month = Number(field.dataset.viewMonth);

  if (Number.isInteger(year) && Number.isInteger(month)) {
    return new Date(year, month, 1);
  }

  setFieldView(field, fallbackDate);
  return firstDayOfMonth(fallbackDate);
};

const normalizeFieldValue = (field) => {
  const input = getFieldInput(field);
  const minDate = getFieldMinDate(field);
  const fallbackTime = field.dataset.dateRole === "return" ? "11:00" : "09:00";
  const parts = getDateTimeParts(input.value);
  const selectedDate = parts ? startOfDay(parts.date) : minDate;
  const time = parts?.time || fallbackTime;

  if (!parts || selectedDate < minDate) {
    setInputValue(input, minDate, time);
    setFieldView(field, minDate);
  }
};

const renderDateDisplay = (display, parts) => {
  const main = document.createElement("span");

  main.className = "date-main";
  main.textContent = `${parts.weekday} ${parts.day} ${parts.month}, ${parts.time}`;

  display.replaceChildren(main);
};

const updateCalendarPreview = (field, parts) => {
  const summary = field.querySelector("[data-calendar-summary]");
  const calendarGrid = field.querySelector(".calendar-preview-grid");
  const timeOptions = field.querySelector(".time-options");
  const minDate = getFieldMinDate(field);
  const selectedDate = startOfDay(parts.date);
  const viewDate = getFieldViewDate(field, selectedDate);
  const visibleMonth = lastDayOfMonth(viewDate) < minDate ? firstDayOfMonth(minDate) : viewDate;

  if (visibleMonth.getFullYear() !== viewDate.getFullYear() || visibleMonth.getMonth() !== viewDate.getMonth()) {
    setFieldView(field, visibleMonth);
  }

  if (summary) {
    summary.textContent = monthFormatter.format(visibleMonth);
  }

  field.querySelectorAll("[data-calendar-shift]").forEach((button) => {
    const nextView = addMonths(visibleMonth, Number(button.dataset.calendarShift || 0));
    button.disabled = Number(button.dataset.calendarShift) < 0 && lastDayOfMonth(nextView) < minDate;
    button.classList.toggle("is-disabled", button.disabled);
  });

  const note = field.querySelector("[data-calendar-note]");

  if (note) {
    note.textContent =
      field.dataset.dateRole === "return"
        ? "Return must be at least the next day after pickup."
        : "Pickup is available from day after tomorrow.";
  }

  if (calendarGrid) {
    [...calendarGrid.querySelectorAll("[data-calendar-day], [data-calendar-pad], [data-date-value]")].forEach((cell) => cell.remove());

    const startDate = firstDayOfMonth(visibleMonth);
    const daysInMonth = lastDayOfMonth(visibleMonth).getDate();
    const leadingDays = (startDate.getDay() + 6) % 7;

    Array.from({ length: leadingDays }).forEach(() => {
      const pad = document.createElement("span");
      pad.className = "calendar-pad";
      pad.dataset.calendarPad = "";
      calendarGrid.append(pad);
    });

    Array.from({ length: daysInMonth }, (_, index) => addDays(startDate, index)).forEach((dayDate) => {
      const cell = document.createElement("button");
      const isSelected = isSameDate(dayDate, selectedDate);
      const isDisabled = dayDate < minDate;

      cell.dataset.calendarDay = "";
      cell.dataset.dateValue = toDateValue(dayDate);
      cell.textContent = dayDate.getDate();
      cell.type = "button";
      cell.disabled = isDisabled;
      cell.classList.toggle("is-selected", isSelected);
      cell.classList.toggle("is-disabled", isDisabled);
      calendarGrid.append(cell);
    });
  }

  if (timeOptions) {
    [...timeOptions.querySelectorAll("[data-time-option]")].forEach((option) => option.remove());

    timeSlots.forEach((slot) => {
      const option = document.createElement("button");
      option.type = "button";
      option.dataset.timeOption = "";
      option.textContent = slot;
      option.classList.toggle("is-selected", slot === parts.time);
      timeOptions.append(option);
    });
  }
};

dateFields.forEach((field) => {
  const input = field.querySelector(".date-input");
  const display = field.querySelector("[data-date-display]");

  if (!input || !display) {
    return;
  }

  const syncField = () => {
    normalizeFieldValue(field);
    const parts = getDateTimeParts(input.value);

    if (!parts) {
      return;
    }

    renderDateDisplay(display, parts);
    updateCalendarPreview(field, parts);
    positionOpenCalendarPreview();
  };

  syncField();

  const openPicker = () => {
    dateFields.forEach((otherField) => {
      if (otherField !== field) {
        otherField.classList.remove("is-open");
      }
    });

    field.classList.add("is-open");
    positionCalendarPreview(field);
  };

  let handledPointerAction = false;

  const handlePickerAction = (event) => {
    const dayButton = event.target.closest("[data-calendar-day]");
    const timeButton = event.target.closest("[data-time-option]");
    const shiftButton = event.target.closest("[data-calendar-shift]");

    if (shiftButton) {
      event.preventDefault();
      event.stopPropagation();

      if (!shiftButton.disabled) {
        const parts = getDateTimeParts(input.value);
        const currentView = getFieldViewDate(field, parts?.date || getFieldMinDate(field));

        setFieldView(field, addMonths(currentView, Number(shiftButton.dataset.calendarShift || 0)));
        syncField();
      }

      openPicker();
      return true;
    }

    if (dayButton) {
      event.preventDefault();
      event.stopPropagation();

      if (dayButton.disabled) {
        openPicker();
        return true;
      }

      const parts = getDateTimeParts(input.value);
      const time = parts?.time || "09:00";
      const nextDate = new Date(`${dayButton.dataset.dateValue}T00:00`);

      input.value = `${dayButton.dataset.dateValue}T${time}`;
      setFieldView(field, nextDate);
      syncField();

      if (field.dataset.dateRole === "pickup") {
        getFieldByRole("return")?.dispatchEvent(new CustomEvent("sync-date-field"));
      }

      openPicker();
      return true;
    }

    if (timeButton) {
      event.preventDefault();
      event.stopPropagation();
      const parts = getDateTimeParts(input.value);

      if (parts) {
        input.value = toDateTimeValue(parts.date, timeButton.textContent.trim());
        syncField();
      }

      openPicker();
      return true;
    }

    return false;
  };

  field.addEventListener("pointerdown", (event) => {
    handledPointerAction = handlePickerAction(event);
  });

  field.addEventListener("click", (event) => {
    if (handledPointerAction) {
      handledPointerAction = false;
      return;
    }

    if (handlePickerAction(event)) {
      return;
    }

    openPicker();
  });

  field.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }

    if (event.key === "Escape") {
      closeCalendarPreviews();
    }
  });

  field.addEventListener("sync-date-field", syncField);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-date-field]")) {
    closeCalendarPreviews();
  }
});

window.addEventListener("resize", positionOpenCalendarPreview);
window.addEventListener("scroll", positionOpenCalendarPreview, { passive: true });

const setupDealCarousel = () => {
  const track = document.querySelector(".deal-track");
  const cards = [...(track?.querySelectorAll(".deal-card") || [])];

  if (!track || cards.length === 0) {
    return;
  }

  const dealCarouselPrefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeCard = track.querySelector(".deal-card.is-featured") || cards[0];
  let frameId = 0;

  const syncCardStates = () => {
    const activeIndex = cards.indexOf(activeCard);

    cards.forEach((card, index) => {
      const isActive = index === activeIndex;
      const isNeighbor = index === activeIndex - 1 || index === activeIndex + 1;

      card.classList.toggle("is-active", isActive);
      card.classList.toggle("is-neighbor", isNeighbor);
    });
  };

  const setActiveCard = (card) => {
    if (!card) {
      return;
    }

    activeCard = card;
    syncCardStates();
  };

  const getClosestCard = () => {
    const trackCenter = track.scrollLeft + track.clientWidth / 2;

    return cards.reduce((closestCard, card) => {
      const cardCenter = card.offsetLeft - track.offsetLeft + card.offsetWidth / 2;
      const closestCenter = closestCard.offsetLeft - track.offsetLeft + closestCard.offsetWidth / 2;

      return Math.abs(cardCenter - trackCenter) < Math.abs(closestCenter - trackCenter) ? card : closestCard;
    }, cards[0]);
  };

  const updateActiveCard = () => {
    frameId = 0;
    setActiveCard(getClosestCard());
  };

  const requestActiveUpdate = () => {
    if (!frameId) {
      frameId = window.requestAnimationFrame(updateActiveCard);
    }
  };

  const centerCard = (card, behavior = "smooth") => {
    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const nextScrollLeft = track.scrollLeft + cardRect.left - trackRect.left - (track.clientWidth - card.clientWidth) / 2;

    setActiveCard(card);
    track.scrollTo({
      left: Math.max(0, nextScrollLeft),
      behavior: dealCarouselPrefersReducedMotion ? "auto" : behavior,
    });
  };

  syncCardStates();

  track.addEventListener("scroll", requestActiveUpdate, { passive: true });
  track.addEventListener("click", (event) => {
    const card = event.target.closest(".deal-card");

    if (card && card !== activeCard) {
      centerCard(card);
    }
  });
  track.addEventListener("focusin", (event) => {
    const card = event.target.closest(".deal-card");

    if (card) {
      centerCard(card);
    }
  });
  track.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const activeIndex = cards.indexOf(activeCard);
    const nextIndex = clamp(activeIndex + direction, 0, cards.length - 1);

    centerCard(cards[nextIndex]);
  });

  window.requestAnimationFrame(() => centerCard(activeCard, "auto"));
  window.addEventListener("load", () => centerCard(activeCard, "auto"));
  window.addEventListener("resize", () => centerCard(activeCard, "auto"));
};

setupDealCarousel();

const removePhonePreviewTexture = () => {
  const phonePreview = document.querySelector(".phone-preview");

  if (!phonePreview) {
    return;
  }

  const processPreview = () => {
    if (phonePreview.dataset.textureRemoved === "true" || !phonePreview.naturalWidth || !phonePreview.naturalHeight) {
      return;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return;
    }

    const width = phonePreview.naturalWidth;
    const height = phonePreview.naturalHeight;

    canvas.width = width;
    canvas.height = height;
    context.drawImage(phonePreview, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    const { data } = imageData;
    const visited = new Uint8Array(width * height);
    const queue = [];
    let queueIndex = 0;

    const isBackgroundPixel = (x, y) => {
      const offset = (y * width + x) * 4;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const alpha = data[offset + 3];
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);

      return alpha > 0 && red >= 220 && green >= 220 && blue >= 220 && max - min <= 28;
    };

    const enqueue = (x, y) => {
      const index = y * width + x;

      if (visited[index] || !isBackgroundPixel(x, y)) {
        return;
      }

      visited[index] = 1;
      queue.push([x, y]);
    };

    for (let x = 0; x < width; x += 1) {
      enqueue(x, 0);
      enqueue(x, height - 1);
    }

    for (let y = 0; y < height; y += 1) {
      enqueue(0, y);
      enqueue(width - 1, y);
    }

    while (queueIndex < queue.length) {
      const [x, y] = queue[queueIndex];
      queueIndex += 1;

      const offset = (y * width + x) * 4;
      data[offset + 3] = 0;

      if (x > 0) enqueue(x - 1, y);
      if (x < width - 1) enqueue(x + 1, y);
      if (y > 0) enqueue(x, y - 1);
      if (y < height - 1) enqueue(x, y + 1);
    }

    context.putImageData(imageData, 0, 0);
    phonePreview.dataset.textureRemoved = "true";
    phonePreview.src = canvas.toDataURL("image/png");
  };

  if (phonePreview.complete) {
    processPreview();
    return;
  }

  phonePreview.addEventListener("load", processPreview, { once: true });
};

removePhonePreviewTexture();

const assignRevealGroup = (selector, { baseDelay = 0, step = 70 } = {}) => {
  document.querySelectorAll(selector).forEach((item, index) => {
    item.classList.add("reveal-item");
    item.style.setProperty("--reveal-delay", `${baseDelay + index * step}ms`);
  });
};

assignRevealGroup(".hero-copy", { step: 0 });
assignRevealGroup(".works-header", { step: 0 });
assignRevealGroup(".works-timeline > .step-card", { step: 80 });
assignRevealGroup(".why .section-label, .why h2, .why-intro", { step: 70 });
assignRevealGroup(".why-grid > .why-card", { step: 75 });
assignRevealGroup(".deals .section-label, .deals h2, .show-all-button", { step: 70 });
assignRevealGroup(".deal-track > .deal-card", { step: 55 });
assignRevealGroup(".feedback-copy, .feedback-proof", { step: 90 });
assignRevealGroup(".feedback-grid > .testimonial-card", { step: 75 });
assignRevealGroup(".feedback-actions", { step: 0, baseDelay: 120 });
assignRevealGroup(".download-copy, .footer-brand, .footer-column, .footer-bottom", { step: 70 });

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = [...document.querySelectorAll(".reveal-item")];
const parallaxItems = [...document.querySelectorAll("[data-parallax]")];

if (!prefersReducedMotion) {
  document.documentElement.classList.add("motion-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  revealItems.forEach((item) => {
    if (item.getBoundingClientRect().top < window.innerHeight * 0.92) {
      item.classList.add("is-visible");
      return;
    }

    observer.observe(item);
  });

  let ticking = false;

  const updateParallax = () => {
    const viewportCenter = window.innerHeight / 2;

    parallaxItems.forEach((item) => {
      const strength = Number(item.dataset.parallax || 0);
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const offset = (viewportCenter - itemCenter) * strength;

      item.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
    });

    ticking = false;
  };

  const requestParallax = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  window.addEventListener("scroll", requestParallax, { passive: true });
  window.addEventListener("resize", requestParallax);
  requestParallax();
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
