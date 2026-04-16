const searchForm = document.querySelector(".search-panel");

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
  const day = document.createElement("span");
  const main = document.createElement("span");
  const time = document.createElement("span");

  day.className = "date-day";
  main.className = "date-main";
  time.className = "date-time";

  day.textContent = parts.weekday;
  main.textContent = `${parts.day} ${parts.month}`;
  time.textContent = parts.time;

  display.replaceChildren(day, main, time);
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
  };

  syncField();

  const openPicker = () => {
    dateFields.forEach((otherField) => {
      if (otherField !== field) {
        otherField.classList.remove("is-open");
      }
    });

    field.classList.add("is-open");
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
      field.classList.remove("is-open");
    }
  });

  field.addEventListener("sync-date-field", syncField);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-date-field]")) {
    dateFields.forEach((field) => field.classList.remove("is-open"));
  }
});

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
