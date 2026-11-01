function setupContactForm() {
  const form = document.getElementById("contact-form");
  const topic = form.elements.topic;
  const refGroup = document.getElementById("ref-group");
  const message = form.elements.message;
  const count = document.getElementById("c-count");
  const selectedCountry = setupCountryCodes(form);

  const user = getCurrentUser();
  if (user) {
    form.elements.name.value = user.name;
    form.elements.email.value = user.email;
  }

  const needsRef = () =>
    ["Existing booking", "Billing or damage charge"].includes(topic.value);
  topic.addEventListener("change", () => {
    refGroup.hidden = !needsRef();
  });

  message.addEventListener("input", () => {
    count.textContent = `${message.value.length} / 1000 characters (minimum 20)`;
  });

  const validate = setupForm(form, {
    name: v =>
      !v.trim()
        ? "Enter your name."
        : v.trim().length < 2
          ? "Name looks too short."
          : "",
    email: v =>
      !v.trim()
        ? "Enter your email address."
        : !isEmail(v)
          ? "Enter a valid email, like name@example.com."
          : "",
    phone: v => (v.trim() ? phoneError(selectedCountry(), v) : ""),
    topic: v => (!v ? "Choose a topic." : ""),
    ref: v => {
      if (!needsRef()) return "";
      if (!v.trim()) return "Enter your booking reference.";
      return /^AZ-[A-Z0-9]{6}$/i.test(v.trim())
        ? ""
        : "References look like AZ-7Q4K2M.";
    },
    message: v =>
      v.trim().length < 20
        ? `Write at least 20 characters (${v.trim().length} so far).`
        : "",
    consent: checked => (checked ? "" : "Tick the box so we can reply to you.")
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!validate()) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }
    const messages = loadData("messages", []);
    messages.push({
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim()
        ? formatPhone(selectedCountry(), form.elements.phone.value)
        : "",
      topic: topic.value,
      ref: needsRef() ? form.elements.ref.value.trim().toUpperCase() : "",
      message: message.value.trim(),
      sentAt: localDateTime(new Date())
    });
    saveData("messages", messages);

    showToast(
      `Thanks ${escapeHtml(form.elements.name.value.trim().split(" ")[0])}! Your message has been sent. We'll reply within one working day.`
    );
    form.reset();
    form.elements.countryCode.dispatchEvent(new Event("change"));
    refGroup.hidden = true;
    count.textContent = "0 / 1000 characters (minimum 20)";
    form
      .querySelectorAll(".is-valid")
      .forEach(i => i.classList.remove("is-valid"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("contact-branches").innerHTML = BRANCHES.map(
    b =>
      `<li>${icon("pin")}<span><strong>${b.name}</strong><br>${b.address}<br><a href="tel:${b.phone.replace(/\s/g, "")}">${b.phone}</a></span></li>`
  ).join("");
  setupContactForm();
});
