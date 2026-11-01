const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const isSgPhone = v =>
  /^[689]\d{7}$/.test(v.replace(/[\s-]/g, "").replace(/^\+65/, ""));
const phoneDigits = v => v.replace(/\D/g, "").replace(/^0+/, "");
const isPhoneFor = (country, v) => {
  if (country.code === "+65") return isSgPhone(v);
  const length = phoneDigits(v).length;
  return length >= country.min && length <= country.max;
};
const isAnyPhone = v =>
  isSgPhone(v) || /^\+[1-9]\d{6,14}$/.test(v.replace(/[\s-]/g, ""));
const formatPhone = (country, v) => {
  const digits = phoneDigits(v);
  return `${country.code} ${country.code === "+65" ? digits.slice(-8) : digits}`;
};
const phoneError = (country, v) => {
  if (isPhoneFor(country, v)) return "";
  if (country.code === "+65")
    return "Enter an 8-digit Singapore number starting with 6, 8 or 9.";
  const digits =
    country.min === country.max
      ? country.min
      : `${country.min} to ${country.max}`;
  return `A ${country.name} mobile number has ${digits} digits after ${country.code}.`;
};

function setupCountryCodes(form) {
  const select = form.elements.countryCode;
  const phone = form.elements.phone;
  select.innerHTML = PHONE_CODES.map(
    c => `<option value="${c.code}">${c.name} (${c.code})</option>`
  ).join("");
  select.addEventListener("change", () => {
    phone.placeholder = select.value === "+65" ? "9123 4567" : "Mobile number";
    if (phone.value) phone.dispatchEvent(new Event("blur"));
  });
  return () => PHONE_CODES.find(c => c.code === select.value);
}

const isSgLicence = v => /^[STFG]\d{7}[A-Z]$/i.test(v.trim());

function yearsSince(dateText) {
  const d = parseLocal(dateText),
    now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  if (
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  )
    years--;
  return years;
}

function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12 && score < 4) score++;
  if (pw.length < 8) score = Math.min(score, 1);
  const levels = [
    { label: "Very weak", color: "#DC2626" },
    { label: "Weak", color: "#F97316" },
    { label: "Fair", color: "#F59E0B" },
    { label: "Good", color: "#22C55E" },
    { label: "Strong", color: "#0B8F6A" }
  ];
  return Object.assign({ score }, levels[score]);
}

function luhnCheck(number) {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 12) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function detectCardType(number) {
  const n = number.replace(/\D/g, "");
  if (/^4/.test(n))
    return { name: "Visa", lengths: [13, 16, 19], cvv: 3, gaps: [4, 8, 12] };
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n))
    return { name: "Mastercard", lengths: [16], cvv: 3, gaps: [4, 8, 12] };
  if (/^3[47]/.test(n))
    return { name: "Amex", lengths: [15], cvv: 4, gaps: [4, 10] };
  return null;
}

function detectCardFunding(number) {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return (
    NON_CREDIT_BINS.find(b => digits.startsWith(b.prefix)) || {
      funding: "credit"
    }
  );
}

function formatCardNumber(value) {
  const type = detectCardType(value);
  const max = type ? Math.max(...type.lengths) : 19;
  const digits = value.replace(/\D/g, "").slice(0, max);
  const gaps = type ? type.gaps : [4, 8, 12, 16];
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (gaps.includes(i)) out += " ";
    out += digits[i];
  }
  return out;
}

function formatExpiry(value) {
  let digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 1 && Number(digits) > 1) digits = "0" + digits;
  return digits.length > 2
    ? digits.slice(0, 2) + "/" + digits.slice(2)
    : digits;
}

function cardNumberError(value) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "Enter your card number.";
  const type = detectCardType(digits);
  if (!type) return "We only accept Visa, Mastercard and American Express.";
  if (!type.lengths.includes(digits.length))
    return `A ${type.name} number has ${type.lengths.join(" or ")} digits.`;
  if (!luhnCheck(digits))
    return "This card number is not valid. Check for typing mistakes.";
  const funding = detectCardFunding(digits);
  if (funding && funding.funding !== "credit")
    return `This is a ${funding.label} card. AZoom accepts credit cards only – please use a credit card.`;
  return "";
}

function expiryError(value) {
  const m = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!m) return "Enter the expiry date as MM/YY.";
  const month = Number(m[1]),
    year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return "Month must be between 01 and 12.";
  const endOfMonth = new Date(year, month, 0, 23, 59);
  if (endOfMonth < new Date()) return "This card has expired.";
  if (year > new Date().getFullYear() + 20) return "Check the expiry year.";
  return "";
}

function cvvError(value, cardNumber) {
  const type = detectCardType(cardNumber || "");
  const len = type ? type.cvv : 3;
  if (!value) return "Enter the security code.";
  if (!new RegExp(`^\\d{${len}}$`).test(value))
    return `The security code is ${len} digits${type ? ` for ${type.name}` : ""}.`;
  return "";
}

function setFieldError(input, message) {
  const group = input.closest(".form-group") || input.parentElement;
  let box = group.querySelector(".field-error");
  if (!box) {
    box = document.createElement("div");
    box.className = "field-error";
    box.id = (input.id || input.name) + "-error";
    box.setAttribute("aria-live", "polite");
    group.appendChild(box);
  }
  const describedBy = (input.getAttribute("aria-describedby") || "")
    .split(" ")
    .filter(x => x && x !== box.id);
  if (message) {
    box.innerHTML = icon("alert") + "<span>" + escapeHtml(message) + "</span>";
    input.classList.add("is-invalid");
    input.classList.remove("is-valid");
    input.setAttribute("aria-invalid", "true");
    describedBy.push(box.id);
  } else {
    box.innerHTML = "";
    input.classList.remove("is-invalid");
    if (input.value) input.classList.add("is-valid");
    input.removeAttribute("aria-invalid");
  }
  if (describedBy.length)
    input.setAttribute("aria-describedby", describedBy.join(" "));
  else input.removeAttribute("aria-describedby");
}

function setupForm(form, rules) {
  const fieldFor = name => form.elements[name];

  function validateField(name) {
    const input = fieldFor(name);
    if (!input || input.disabled) return true;
    const value = input.type === "checkbox" ? input.checked : input.value;
    const message = rules[name](value, form) || "";
    setFieldError(input, message);
    return !message;
  }

  Object.keys(rules).forEach(name => {
    const input = fieldFor(name);
    if (!input) return;
    input.addEventListener("blur", () => {
      if (input.value || input.classList.contains("is-invalid"))
        validateField(name);
    });
    input.addEventListener(
      input.type === "checkbox" || input.tagName === "SELECT"
        ? "change"
        : "input",
      () => {
        if (
          input.classList.contains("is-invalid") ||
          input.type === "checkbox" ||
          input.tagName === "SELECT"
        )
          validateField(name);
      }
    );
  });

  return function validateAll() {
    let firstBad = null;
    Object.keys(rules).forEach(name => {
      if (!validateField(name) && !firstBad) firstBad = fieldFor(name);
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  };
}

function setupPasswordToggles(root = document) {
  root.querySelectorAll("[data-toggle-password]").forEach(btn => {
    const input = document.getElementById(btn.dataset.togglePassword);
    const update = () => {
      const shown = input.type === "text";
      btn.innerHTML = icon(shown ? "eye-off" : "eye");
      btn.setAttribute("aria-label", shown ? "Hide password" : "Show password");
      btn.setAttribute("aria-pressed", shown);
    };
    btn.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
      update();
      input.focus();
    });
    update();
  });
}

function setupStrengthMeter(input, meter) {
  const bar = meter.querySelector(".strength-bar span");
  const label = meter.querySelector(".strength-label");
  const update = () => {
    if (!input.value) {
      bar.style.width = "0";
      label.textContent =
        "Use 8+ characters with upper and lower case letters, a number and a symbol.";
      return;
    }
    const s = passwordStrength(input.value);
    bar.style.width = ((s.score + 1) / 5) * 100 + "%";
    bar.style.background = s.color;
    label.textContent = "Strength: " + s.label;
  };
  input.addEventListener("input", update);
  update();
}
