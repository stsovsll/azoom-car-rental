function safeNext(defaultPage) {
  const next = getQueryParam("next");
  return next && /^[a-z-]+\.html([?#].*)?$/i.test(next) ? next : defaultPage;
}

function homeFor(user) {
  return user.role === "staff" ? "staff-dashboard.html" : "my-bookings.html";
}

function setupLogin() {
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  const tabs = [...document.querySelectorAll(".tab")];
  let role = getQueryParam("role") === "staff" ? "staff" : "customer";

  function selectRole(newRole, focus) {
    const changed = newRole !== role;
    role = newRole;
    tabs.forEach(t => {
      const on = t.dataset.role === role;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    document.querySelector(".tabs").dataset.active = role;

    document.getElementById("login-title").textContent =
      role === "staff" ? "Staff login" : "Log in to your account";
    document.querySelectorAll("#register-link [data-role]").forEach(span => {
      span.classList.toggle("swap-off", span.dataset.role !== role);
    });
    const demo = DEMO_USERS.find(u => u.role === role);
    document.getElementById("demo-text").innerHTML =
      `${role === "staff" ? "Staff" : "Customer"}: <code>${demo.email}</code> / <code>${demo.password}</code>`;
    errorBox.hidden = true;

    if (changed)
      slideIn(
        ["login-title", "register-link", "demo-text"],
        role === "staff" ? "slide-in-right" : "slide-in-left"
      );
  }

  function slideIn(ids, className) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      el.classList.remove("slide-in-right", "slide-in-left");
      void el.offsetWidth;
      el.classList.add(className);
    });
  }
  tabs.forEach(t =>
    t.addEventListener("click", () => selectRole(t.dataset.role))
  );

  const indicator = document.querySelector(".tab-indicator");
  indicator.style.transition = "none";
  selectRole(role);
  void indicator.offsetWidth;
  indicator.style.transition = "";

  const current = getCurrentUser();
  if (current) {
    const box = document.getElementById("already");
    box.hidden = false;
    box.innerHTML = `<p>You're already logged in as <strong>${escapeHtml(current.email)}</strong>. <a href="${homeFor(current)}">Continue</a></p>`;
  }

  document.getElementById("fill-demo").addEventListener("click", () => {
    const demo = DEMO_USERS.find(u => u.role === role);
    form.elements.email.value = demo.email;
    form.elements.password.value = demo.password;
    form.querySelectorAll("input").forEach(i => setFieldError(i, ""));
    form.querySelector('button[type="submit"]').focus();
  });

  const validate = setupForm(form, {
    email: v =>
      !v.trim()
        ? "Enter your email."
        : !isEmail(v)
          ? "Enter a valid email address."
          : "",
    password: v => (!v ? "Enter your password." : "")
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    errorBox.hidden = true;
    if (!validate()) return;

    const user = loginUser(
      form.elements.email.value,
      form.elements.password.value
    );
    if (!user) {
      errorBox.hidden = false;
      errorBox.innerHTML = `${icon("alert")}<p>That email and password don't match an account. Check them and try again.</p>`;
      form.elements.password.value = "";
      form.elements.password.focus();
      return;
    }
    if (role === "staff" && user.role !== "staff") {
      logoutUser();
      errorBox.hidden = false;
      errorBox.innerHTML = `${icon("alert")}<p>This account doesn't have staff access. Use the Customer tab instead.</p>`;
      return;
    }
    sessionStorage.setItem(
      "azoom_flash",
      `Welcome back, ${user.name.split(" ")[0]}!`
    );
    location.href = safeNext(homeFor(user));
  });
}

function setupRegister() {
  const form = document.getElementById("register-form");
  document.getElementById("side-age").textContent = POLICY.minAge;
  document.getElementById("side-years").textContent = plural(
    POLICY.minLicenceYears,
    "year"
  );
  form.elements.dob.max = localDate(new Date());

  const selectedCountry = setupCountryCodes(form);

  setupStrengthMeter(
    form.elements.password,
    document.getElementById("r-strength")
  );

  const validate = setupForm(form, {
    name: v =>
      !v.trim()
        ? "Enter your full name."
        : !/^[A-Za-z][A-Za-z '\-.\/]+$/.test(v.trim())
          ? "Use letters only."
          : v.trim().split(/\s+/).length < 2
            ? "Enter your first and last name."
            : "",
    email: v => {
      if (!v.trim()) return "Enter your email.";
      if (!isEmail(v)) return "Enter a valid email, like name@example.com.";
      if (
        getUsers().some(u => u.email.toLowerCase() === v.trim().toLowerCase())
      )
        return "An account with this email already exists. Log in instead.";
      return "";
    },
    phone: v =>
      !v.trim()
        ? "Enter your mobile number."
        : phoneError(selectedCountry(), v),
    dob: v => {
      if (!v) return "Enter your date of birth.";
      const age = yearsSince(v);
      if (age < POLICY.minAge)
        return `You must be at least ${POLICY.minAge} to rent with AZoom.`;
      if (age > 100) return "Check your date of birth.";
      return "";
    },
    password: v => {
      if (!v) return "Create a password.";
      if (v.length < 8) return "Use at least 8 characters.";
      if (!/[a-z]/.test(v) || !/[A-Z]/.test(v))
        return "Use both upper and lower case letters.";
      if (!/\d/.test(v)) return "Add at least one number.";
      return "";
    },
    confirm: (v, f) =>
      !v
        ? "Type your password again."
        : v !== f.elements.password.value
          ? "Passwords don’t match."
          : "",
    terms: checked =>
      checked ? "" : "You need to accept the terms to continue."
  });

  form.elements.password.addEventListener("input", () => {
    if (form.elements.confirm.value)
      form.elements.confirm.dispatchEvent(new Event("blur"));
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!validate()) return;
    const users = getUsers();
    const user = {
      name: form.elements.name.value.trim().replace(/\s+/g, " "),
      email: form.elements.email.value.trim().toLowerCase(),
      password: form.elements.password.value,
      role: "customer",
      phone: formatPhone(selectedCountry(), form.elements.phone.value),
      dob: form.elements.dob.value
    };
    users.push(user);
    saveData("users", users);
    loginUser(user.email, user.password);
    sessionStorage.setItem(
      "azoom_flash",
      `Account created. Welcome to AZoom, ${user.name.split(" ")[0]}!`
    );
    location.href = safeNext("booking.html");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupPasswordToggles();
  if (document.getElementById("login-form")) setupLogin();
  if (document.getElementById("register-form")) setupRegister();
});
