let draft = null;
let step = 1;
let user = null;
const validators = {};

function newDraft() {
  const tomorrow = localDate(addDays(new Date(), 1));
  return {
    branchId: BRANCHES[0].id,
    pickupDate: tomorrow,
    pickupTime: "10:00",
    returnDate: localDate(addDays(new Date(), 8)),
    returnCarparkId: CARPARKS[0].id,
    carId: "",
    extras: { childSeat: false, extraDriver: false, charger: false },
    insurance: "basic",
    driver: {},
    savedAt: Date.now()
  };
}

function loadDraft() {
  let d = loadData("draft");
  if (!d || getQueryParam("new") || Date.now() - d.savedAt > 86400000)
    d = newDraft();

  const branch = getQueryParam("branch");
  if (getBranch(branch)) {
    d.branchId = branch;
    d.returnCarparkId = CARPARKS.find(c => c.branchId === branch).id;
  }
  const car = getQueryParam("car");
  if (getCar(car)) d.carId = car;
  const pickup = getQueryParam("pickup");
  const ret = getQueryParam("return");
  if (/^\d{4}-\d{2}-\d{2}$/.test(pickup || "")) d.pickupDate = pickup;
  if (/^\d{4}-\d{2}-\d{2}$/.test(ret || "")) d.returnDate = ret;
  return d;
}

function saveDraft() {
  draft.savedAt = Date.now();
  saveData("draft", draft);
}

const pickupAt = () => `${draft.pickupDate}T${draft.pickupTime}`;
const returnAt = () => `${draft.returnDate}T${POLICY.returnByTime}`;

function currentQuote() {
  if (!draft.carId || !(parseLocal(returnAt()) > parseLocal(pickupAt())))
    return null;
  return calculateQuote(
    draft.carId,
    pickupAt(),
    returnAt(),
    draft.extras,
    draft.insurance
  );
}

function buildForm() {
  const form = document.getElementById("wizard");

  document.getElementById("branch-options").innerHTML = BRANCHES.map(
    b => `
    <label class="option-card">
      <input type="radio" name="branch" value="${b.id}" ${b.id === draft.branchId ? "checked" : ""}>
      <span class="option-body">
        <span class="option-title"><span>${icon("pin")} ${b.name}</span></span>
        <span class="small text-muted">${b.address}</span>
      </span>
    </label>`
  ).join("");

  form.elements.pickupTime.innerHTML = timeSlots(8, 20.5)
    .map(t => `<option>${t}</option>`)
    .join("");
  form.elements.carpark.innerHTML = BRANCHES.map(
    b =>
      `<optgroup label="${b.name}">${CARPARKS.filter(c => c.branchId === b.id)
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join("")}</optgroup>`
  ).join("");

  document.getElementById("extras-options").innerHTML = EXTRAS.map(
    x => `
    <label class="option-card">
      <input type="checkbox" name="extra" value="${x.id}" ${draft.extras[x.id] ? "checked" : ""}>
      <span class="option-body">
        <span class="option-title"><span>${icon(x.icon)} ${x.name}</span><span>${formatMoney(x.perDay)}/day</span></span>
        <span class="small text-muted">${x.desc}</span>
      </span>
    </label>`
  ).join("");

  document.getElementById("insurance-options").innerHTML = INSURANCE.map(
    t => `
    <label class="option-card">
      <input type="radio" name="insurance" value="${t.id}" ${t.id === draft.insurance ? "checked" : ""}>
      <span class="option-body">
        <span class="option-title"><span>${icon("shield")} ${t.name}</span><span>${t.perDay ? formatMoney(t.perDay) + "/day" : "Included"}</span></span>
        <span class="small text-muted">${t.desc}</span>
      </span>
    </label>`
  ).join("");

  lengthDays = Math.max(1, daysBetween(draft.pickupDate, draft.returnDate));
  form.elements.pickupDate.value = draft.pickupDate;
  form.elements.pickupDate.min = localDate(new Date());
  form.elements.pickupTime.value = draft.pickupTime;
  form.elements.returnDate.value = draft.returnDate;
  form.elements.carpark.value = draft.returnCarparkId;

  const d = Object.assign(
    {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      dob: user.dob || "",
      licenceNo: user.licenceNo || "",
      licenceIssued: user.licenceIssued || ""
    },
    draft.driver
  );
  form.elements.driverName.value = d.name;
  form.elements.driverEmail.value = d.email;
  form.elements.driverPhone.value = d.phone;
  form.elements.driverDob.value = d.dob;
  form.elements.driverLicence.value = d.licenceNo;
  form.elements.driverIssued.value = d.licenceIssued;
  form.elements.driverDob.max = localDate(new Date());
  form.elements.driverIssued.max = localDate(new Date());
  form.elements.cardName.value = user.name.toUpperCase();

  document.querySelectorAll(".js-deposit").forEach(el => {
    el.textContent = formatMoney(POLICY.deposit);
  });
  document.querySelector(".js-min-age").textContent = POLICY.minAge;
  document.querySelector(".js-min-years").textContent = plural(
    POLICY.minLicenceYears,
    "year"
  );
}

function readForm() {
  const f = document.getElementById("wizard").elements;
  draft.branchId = f.branch.value;
  draft.pickupDate = f.pickupDate.value;
  draft.pickupTime = f.pickupTime.value;
  draft.returnDate = f.returnDate.value;
  draft.returnCarparkId = f.carpark.value;
  const car = document.querySelector('input[name="car"]:checked');
  if (car) draft.carId = car.value;
  EXTRAS.forEach(x => {
    draft.extras[x.id] = !!document.querySelector(
      `input[name="extra"][value="${x.id}"]:checked`
    );
  });
  draft.insurance = f.insurance.value || "basic";
  draft.driver = {
    name: f.driverName.value.trim(),
    email: f.driverEmail.value.trim(),
    phone: f.driverPhone.value.trim(),
    dob: f.driverDob.value,
    licenceNo: f.driverLicence.value.trim().toUpperCase(),
    licenceIssued: f.driverIssued.value
  };
  saveDraft();
  renderSummary();
}

let lengthDays = 7;
const daysBetween = (from, to) =>
  Math.round((parseLocal(to) - parseLocal(from)) / 86400000);

function shiftReturnDate() {
  const f = document.getElementById("wizard").elements;
  if (f.pickupDate.value)
    f.returnDate.value = localDate(
      addDays(parseLocal(f.pickupDate.value), lengthDays)
    );
}

function rememberLength() {
  const f = document.getElementById("wizard").elements;
  const d = daysBetween(f.pickupDate.value, f.returnDate.value);
  if (d > 0) lengthDays = d;
}

function renderPeriod() {
  const days = rentalDays(pickupAt(), returnAt());
  document.getElementById("b-period").innerHTML = days
    ? `${plural(days, "day")} <span class="small">· charged as ${periodLabel(days)}</span>`
    : '<span class="small">Choose a return date on or after pick-up</span>';
  document.getElementById("b-return-by").textContent = draft.returnDate
    ? formatDateTime(returnAt())
    : "11:59 pm on your return date";
}

function renderCarOptions() {
  const days = rentalDays(pickupAt(), returnAt());
  document.getElementById("car-step-info").textContent =
    `${plural(days, "day")} from AZoom ${getBranch(draft.branchId).name}, ${formatDateTime(pickupAt())} to ${formatDateTime(returnAt())}.`;

  const list = CARS.map(car => ({
    car,
    available: !!findAvailableVehicle(
      car.id,
      draft.branchId,
      pickupAt(),
      returnAt()
    ),
    price: cheapestCombination(days, car.daily).cost
  })).sort((a, b) => b.available - a.available || a.price - b.price);

  if (draft.carId && !list.find(x => x.car.id === draft.carId).available)
    draft.carId = "";

  document.getElementById("car-options").innerHTML = list
    .map(
      ({ car, available, price }) => `
    <label class="option-card ${available ? "" : "unavailable"}">
      <input type="radio" name="car" value="${car.id}" ${car.id === draft.carId ? "checked" : ""} ${available ? "" : "disabled"}>
      <span class="option-body">
        <img src="${carImage(car.id)}" alt="">
        <span class="option-title"><span>${carName(car)}</span><span>${formatMoney(price)}</span></span>
        <span class="small text-muted">${car.range} km · ${car.seats} seats · ${car.dcMins} min charge</span><br>
        ${available ? `<span class="badge badge-success">${icon("check")} Available</span>` : '<span class="badge badge-danger">Fully booked for these dates</span>'}
      </span>
    </label>`
    )
    .join("");
}

function renderSummary() {
  renderPeriod();
  const car = getCar(draft.carId);
  const valid = parseLocal(returnAt()) > parseLocal(pickupAt());
  const branch = getBranch(draft.branchId);
  const carpark = getCarpark(draft.returnCarparkId);
  document.getElementById("summary-body").innerHTML = `
    ${car ? `<div class="summary-car"><img src="${carImage(car.id)}" alt=""><div><div class="car-brand">${car.brand}</div><strong>${car.model}</strong></div></div>` : '<p class="text-muted small">No car chosen yet.</p>'}
    <ul class="info-list small mb-2">
      <li>${icon("pin")}<span>${branch ? branch.name : ""}${valid ? `<br>${formatDateTime(pickupAt())}` : ""}</span></li>
      <li>${icon("parking")}<span>${carpark ? carpark.name : ""}${valid ? `<br>${formatDateTime(returnAt())}` : ""}</span></li>
    </ul>
    ${quoteLinesHTML(currentQuote())}`;
}

function showStep(n, moveFocus = true) {
  step = n;
  document.querySelectorAll(".wizard-step").forEach(s => {
    s.hidden = Number(s.dataset.step) !== n;
  });
  document.querySelectorAll("#progress li").forEach((li, i) => {
    li.className = i + 1 < n ? "done" : i + 1 === n ? "current" : "";
    if (i + 1 === n) li.setAttribute("aria-current", "step");
    else li.removeAttribute("aria-current");
  });
  const back = document.getElementById("btn-back");
  const next = document.getElementById("btn-next");
  back.style.visibility = n === 1 ? "hidden" : "visible";
  next.innerHTML =
    n === 5
      ? `${icon("lock")} Confirm and hold ${formatMoney(POLICY.deposit)} deposit`
      : `Continue ${icon("arrow-right")}`;
  document.getElementById("wizard-nav").hidden = n === 6;
  if (n === 2) renderCarOptions();
  if (moveFocus) {
    document
      .querySelector(`.wizard-step[data-step="${n}"] h2`)
      .focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function validateStep(n) {
  if (n === 2) {
    const box = document.getElementById("car-error");
    if (!draft.carId) {
      box.innerHTML = icon("alert") + " Choose a car to continue.";
      document.querySelector('input[name="car"]:not(:disabled)')?.focus();
      return false;
    }
    box.innerHTML = "";
    return true;
  }
  return validators[n] ? validators[n]() : true;
}

function setupValidation() {
  const form = document.getElementById("wizard");
  const f = form.elements;

  validators[1] = setupForm(form, {
    pickupDate: v => {
      if (!v) return "Choose a pick-up date.";
      if (v < localDate(new Date())) return "Pick-up can’t be in the past.";
      if (v > localDate(addDays(new Date(), 365)))
        return "You can book up to 1 year ahead.";
      return "";
    },
    pickupTime: v => {
      if (!f.pickupDate.value) return "";
      const [open, last] = pickupWindow(f.pickupDate.value);
      if (v < open || v > last)
        return `On this day, pick-up is between ${open} and ${last}.`;
      if (
        parseLocal(`${f.pickupDate.value}T${v}`) <
        new Date(Date.now() + 2 * 3600000)
      )
        return "Pick-up must be at least 2 hours from now.";
      return "";
    },
    returnDate: v => {
      if (!v) return "Choose a return date.";
      const start = parseLocal(`${f.pickupDate.value}T${f.pickupTime.value}`);
      const end = parseLocal(`${v}T${POLICY.returnByTime}`);
      if (!(end > start)) return "Return can’t be before pick-up.";
      if (
        rentalDays(
          `${f.pickupDate.value}T${f.pickupTime.value}`,
          `${v}T${POLICY.returnByTime}`
        ) > POLICY.maxRentalDays
      )
        return `Rentals can be up to ${POLICY.maxRentalDays} days.`;
      return "";
    },
    carpark: v => (v ? "" : "Choose where you will return the car.")
  });

  validators[4] = setupForm(form, {
    driverName: v =>
      !v.trim()
        ? "Enter the driver’s full name."
        : v.trim().split(/\s+/).length < 2
          ? "Enter first and last name."
          : "",
    driverEmail: v => (!isEmail(v) ? "Enter a valid email address." : ""),
    driverPhone: v =>
      !isAnyPhone(v)
        ? "Enter an 8-digit Singapore number, or an overseas number with its country code, like +60 123456789."
        : "",
    driverDob: v => {
      if (!v) return "Enter the driver’s date of birth.";
      return yearsSince(v) < POLICY.minAge
        ? `Drivers must be at least ${POLICY.minAge} years old.`
        : "";
    },
    driverLicence: v =>
      !v.trim()
        ? "Enter the licence number."
        : !isSgLicence(v)
          ? "Use the format S1234567D (letter, 7 digits, letter)."
          : "",
    driverIssued: v => {
      if (!v) return "Enter the date your licence was issued.";
      if (v > localDate(new Date()))
        return "Issue date can’t be in the future.";
      if (
        f.driverDob.value &&
        yearsSince(f.driverDob.value) - yearsSince(v) < 17
      )
        return "Issue date must be after the driver turned 17.";
      return yearsSince(v) < POLICY.minLicenceYears
        ? `You need at least ${plural(POLICY.minLicenceYears, "year")} of driving experience.`
        : "";
    },
    driverConfirm: checked =>
      checked ? "" : "Please confirm the details are correct."
  });

  validators[5] = setupForm(form, {
    cardNumber: v => cardNumberError(v),
    cardName: v => (!v.trim() ? "Enter the name shown on the card." : ""),
    cardExpiry: v => expiryError(v),
    cardCvv: v => cvvError(v, f.cardNumber.value),
    cardPostal: v => (/^\d{6}$/.test(v) ? "" : "Enter a 6-digit postal code."),
    savedCvv: v => {
      const len = savedCard() && savedCard().type === "Amex" ? 4 : 3;
      if (!v) return "Enter the security code.";
      return new RegExp(`^\\d{${len}}$`).test(v)
        ? ""
        : `The security code is ${len} digits for this card.`;
    },
    terms: checked => (checked ? "" : "You need to accept the terms to book.")
  });
}

function setupCardInputs() {
  const f = document.getElementById("wizard").elements;
  const $ = id => document.getElementById(id);

  f.cardNumber.addEventListener("input", () => {
    f.cardNumber.value = formatCardNumber(f.cardNumber.value);
    const type = detectCardType(f.cardNumber.value);
    const funding = detectCardFunding(f.cardNumber.value);
    const notCredit = !!(funding && funding.funding !== "credit");
    $("p-brand").textContent = notCredit
      ? funding.label.toUpperCase()
      : type
        ? type.name.toUpperCase()
        : "CARD";
    $("p-brand").classList.toggle("card-brand-bad", notCredit);
    if (notCredit)
      setFieldError(f.cardNumber, cardNumberError(f.cardNumber.value));
    $("cp-brand").textContent = type ? type.name : "AZoom Pay";
    f.cardCvv.maxLength = type ? type.cvv : 3;
    $("cp-number").textContent = f.cardNumber.value || "•••• •••• •••• ••••";
  });
  f.cardExpiry.addEventListener("input", e => {
    if (e.inputType && e.inputType.startsWith("delete")) return;
    f.cardExpiry.value = formatExpiry(f.cardExpiry.value);
    $("cp-expiry").textContent = f.cardExpiry.value || "MM/YY";
  });
  f.cardExpiry.addEventListener("change", () => {
    $("cp-expiry").textContent = f.cardExpiry.value || "MM/YY";
  });
  f.cardName.addEventListener("input", () => {
    $("cp-name").textContent = f.cardName.value.toUpperCase() || "YOUR NAME";
  });
  f.cardCvv.addEventListener("input", () => {
    f.cardCvv.value = f.cardCvv.value.replace(/\D/g, "");
  });
  f.cardPostal.addEventListener("input", () => {
    f.cardPostal.value = f.cardPostal.value.replace(/\D/g, "");
  });
  f.savedCvv.addEventListener("input", () => {
    f.savedCvv.value = f.savedCvv.value.replace(/\D/g, "");
  });
  $("cp-name").textContent = f.cardName.value || "YOUR NAME";
}

function savedCard() {
  const u = getUsers().find(x => x.email === user.email);
  return u && u.savedCard ? u.savedCard : null;
}

function usingSavedCard() {
  const choice = document.querySelector('input[name="cardChoice"]:checked');
  return !!choice && choice.value === "saved";
}

function renderSavedCard() {
  const card = savedCard();
  const box = document.getElementById("saved-card-box");
  box.hidden = !card;
  if (card) {
    const expired = !!expiryError(card.expiry);
    document.getElementById("card-choices").innerHTML = `
      <label class="option-card">
        <input type="radio" name="cardChoice" value="saved" ${expired ? "disabled" : "checked"}>
        <span class="option-body">
          <span class="option-title"><span>${icon("card")} ${card.type} •••• ${card.last4}</span>${expired ? '<span class="badge badge-danger">Expired</span>' : '<span class="badge badge-success">Saved</span>'}</span>
          <span class="small text-muted">${escapeHtml(card.name)} · Expires ${card.expiry}</span>
        </span>
      </label>
      <label class="option-card">
        <input type="radio" name="cardChoice" value="new" ${expired ? "checked" : ""}>
        <span class="option-body"><span class="option-title"><span>${icon("plus")} Use a different card</span></span></span>
      </label>`;
  }
  applyCardChoice();
}

function applyCardChoice() {
  const saved = usingSavedCard();
  const newFields = document.getElementById("new-card-fields");
  newFields.hidden = saved;
  newFields.querySelectorAll("input").forEach(i => {
    i.disabled = saved;
  });
  const cvvGroup = document.getElementById("saved-cvv-group");
  cvvGroup.hidden = !saved;
  document.getElementById("p-saved-cvv").disabled = !saved;

  const card = savedCard();
  const f = document.getElementById("wizard").elements;
  document.getElementById("cp-brand").textContent = saved
    ? card.type
    : (detectCardType(f.cardNumber.value) || {}).name || "AZoom Pay";
  document.getElementById("cp-number").textContent = saved
    ? `•••• •••• •••• ${card.last4}`
    : f.cardNumber.value || "•••• •••• •••• ••••";
  document.getElementById("cp-name").textContent = saved
    ? card.name
    : f.cardName.value.toUpperCase() || "YOUR NAME";
  document.getElementById("cp-expiry").textContent = saved
    ? card.expiry
    : f.cardExpiry.value || "MM/YY";
}

async function removeSavedCard() {
  const card = savedCard();
  const ok = await confirmDialog({
    title: "Remove saved card?",
    message: `Your ${card.type} ending ${card.last4} will be removed from your account. You can save a card again on your next booking.`,
    confirmText: "Remove card",
    danger: true
  });
  if (!ok) return;
  const users = getUsers();
  delete users.find(x => x.email === user.email).savedCard;
  saveData("users", users);
  renderSavedCard();
  showToast("Saved card removed.", "info");
}

function saveCardToProfile(card, postal) {
  const users = getUsers();
  const token = "tok_" + Math.random().toString(36).slice(2, 12);
  users.find(x => x.email === user.email).savedCard = Object.assign({}, card, {
    postal,
    token
  });
  saveData("users", users);
}

function processPayment() {
  const f = document.getElementById("wizard").elements;
  const btn = document.getElementById("btn-next");
  btn.disabled = true;
  btn.innerHTML = "Checking your card…";

  setTimeout(() => {
    const vehicle = findAvailableVehicle(
      draft.carId,
      draft.branchId,
      pickupAt(),
      returnAt()
    );
    btn.disabled = false;
    if (!vehicle) {
      showToast(
        "Sorry, that car has just been booked. Choose another car.",
        "error"
      );
      draft.carId = "";
      showStep(2);
      return;
    }

    const useSaved = usingSavedCard();
    const digits = f.cardNumber.value.replace(/\D/g, "");
    const saved = savedCard();
    const card = useSaved
      ? {
          type: saved.type,
          last4: saved.last4,
          expiry: saved.expiry,
          name: saved.name
        }
      : {
          type: detectCardType(digits).name,
          last4: digits.slice(-4),
          expiry: f.cardExpiry.value,
          name: f.cardName.value.trim().toUpperCase()
        };
    const booking = {
      ref: generateRef(),
      userEmail: user.email,
      carId: draft.carId,
      plate: vehicle.plate,
      branchId: draft.branchId,
      returnCarparkId: draft.returnCarparkId,
      pickupAt: pickupAt(),
      returnAt: returnAt(),
      extras: Object.assign({}, draft.extras),
      insurance: draft.insurance,
      driver: Object.assign({}, draft.driver),
      card,
      quote: currentQuote(),
      status: "upcoming",
      createdAt: localDateTime(new Date()),
      history: [
        {
          at: localDateTime(new Date()),
          note: `Booked online. ${formatMoney(POLICY.deposit)} deposit held on card.`
        }
      ]
    };
    const list = getBookings();
    list.push(booking);
    saveBookings(list);

    if (document.getElementById("d-save").checked)
      saveDriverToProfile(draft.driver);
    if (!useSaved && f.saveCard.checked)
      saveCardToProfile(card, f.cardPostal.value);
    saveData("draft", null);
    showConfirmation(booking);
  }, 1200);
}

function saveDriverToProfile(d) {
  const users = getUsers();
  const u = users.find(x => x.email === user.email);
  Object.assign(u, {
    phone: d.phone.trim(),
    dob: d.dob,
    licenceNo: d.licenceNo,
    licenceIssued: d.licenceIssued
  });
  saveData("users", users);
}

function showConfirmation(b) {
  document.getElementById("confirm-ref").textContent = b.ref;
  document.getElementById("confirm-email").textContent = b.driver.email;
  document.getElementById("confirm-summary").innerHTML =
    `<p class="print-only">Reference: <strong>${b.ref}</strong></p>` +
    bookingSummaryHTML(b);
  showStep(6);
  showToast(`Booking ${b.ref} confirmed!`);
}

document.addEventListener("DOMContentLoaded", () => {
  user = requireRole("customer");
  if (!user) return;

  draft = loadDraft();
  buildForm();
  setupValidation();
  setupCardInputs();
  renderSavedCard();
  document
    .getElementById("remove-saved-card")
    .addEventListener("click", removeSavedCard);
  renderSummary();
  showStep(1, false);

  const form = document.getElementById("wizard");
  form.addEventListener("change", e => {
    const name = e.target.name;
    if (name === "pickupDate") shiftReturnDate();
    if (name === "returnDate") rememberLength();
    if (name === "branch")
      form.elements.carpark.value = CARPARKS.find(
        c => c.branchId === e.target.value
      ).id;
    if (name === "car") document.getElementById("car-error").innerHTML = "";
    if (name === "cardChoice") applyCardChoice();
    readForm();
  });
  form.addEventListener("input", e => {
    if (
      ![
        "cardNumber",
        "cardName",
        "cardExpiry",
        "cardCvv",
        "cardPostal",
        "savedCvv",
        "saveCard"
      ].includes(e.target.name)
    )
      readForm();
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    readForm();
    if (!validateStep(step)) return;
    if (step < 5) showStep(step + 1);
    else if (step === 5) processPayment();
  });
  document.getElementById("btn-back").addEventListener("click", () => {
    if (step > 1) showStep(step - 1);
  });
  document
    .getElementById("print-summary")
    .addEventListener("click", () => window.print());
});
