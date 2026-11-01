let staffUser = null;
let booking = null;
const photos = {};
const MAX_PHOTOS = 3;

function renderPicker(selectedRef) {
  const queue = getBookings()
    .filter(b => b.status === "returned")
    .sort((a, b) => parseLocal(a.returned.at) - parseLocal(b.returned.at));
  const select = document.getElementById("pick-ref");
  select.innerHTML = queue.length
    ? queue
        .map(
          b =>
            `<option value="${b.ref}" ${b.ref === selectedRef ? "selected" : ""}>${b.ref} – ${carName(getCar(b.carId))} (${b.plate}) – returned ${formatDateTime(b.returned.at)}</option>`
        )
        .join("")
    : '<option value="">No cars waiting for inspection</option>';
}

function startInspection(ref) {
  const b = getBooking(ref);
  const form = document.getElementById("inspect-form");
  if (!b) return;
  if (b.status !== "returned") {
    form.hidden = true;
    showToast(
      `${b.ref} is not waiting for inspection (status: ${BOOKING_STATUS[b.status]}).`,
      "warning"
    );
    if (b.bill) location.href = `billing.html?ref=${b.ref}`;
    return;
  }
  booking = b;
  Object.keys(photos).forEach(k => delete photos[k]);
  form.reset();
  form.hidden = false;
  renderBookingInfo();
  renderAreas();
  setupReadings();
  setupValidation();
  updateTotals();
  history.replaceState(null, "", `inspection.html?ref=${b.ref}`);
}

function renderBookingInfo() {
  const b = booking;
  const late = lateFee(b.returnAt, b.returned.at, getCar(b.carId).daily);
  document.getElementById("booking-info").innerHTML = `
    <div class="flex flex-wrap between">
      <div class="summary-car mb-0"><img src="${carImage(b.carId)}" alt=""><div><strong>${carName(getCar(b.carId))}</strong><div class="small text-muted">Plate ${b.plate} · ${b.ref}</div></div></div>
      <ul class="spec-list" style="flex:1 1 15rem;max-width:640px">
        <li><span>Customer</span><span>${escapeHtml(b.driver.name)}</span></li>
        <li><span>Insurance</span><span>${b.quote.insurance.label.split(" (")[0]} (excess ${formatMoney(b.quote.insurance.excess)})</span></li>
        <li><span>Due back</span><span>${formatDateTime(b.returnAt)}</span></li>
        <li><span>Returned</span><span>${formatDateTime(b.returned.at)} ${late.fee ? `<span class="badge badge-danger">late</span>` : ""}</span></li>
        <li><span>Car park</span><span>${getCarpark(b.returned.carparkId).name}</span></li>
        <li><span>At check-out</span><span>${b.checkout ? `${b.checkout.mileage.toLocaleString()} km · ${b.checkout.battery}%` : "–"}</span></li>
      </ul>
    </div>`;
}

function setupReadings() {
  const f = document.getElementById("inspect-form").elements;
  const out = booking.checkout ? booking.checkout.mileage : 0;
  f.mileage.min = out;
  f.mileage.value = "";
  document.getElementById("i-mileage-hint").textContent =
    `At check-out: ${out.toLocaleString()} km.`;
  f.battery.value = 50;
  const update = () => {
    const v = Number(f.battery.value);
    document.getElementById("i-battery-out").textContent = `${v}%`;
    const hint = document.getElementById("i-battery-hint");
    hint.innerHTML =
      v < POLICY.lowBatteryThreshold
        ? `<span class="badge badge-warning">${icon("battery")} Below ${POLICY.lowBatteryThreshold}%: ${formatMoney(POLICY.lowBatteryFee)} low-battery fee applies</span>`
        : `At or above ${POLICY.lowBatteryThreshold}%: no fee.`;
    updateTotals();
  };
  f.battery.oninput = update;
  update();
}

function renderAreas() {
  const typeOptions = DAMAGE_TYPES.map(
    t => `<option value="${t.id}">${t.name}</option>`
  ).join("");
  const sevOptions = SEVERITIES.map(
    s => `<option value="${s.id}">${s.name}</option>`
  ).join("");
  document.getElementById("areas").innerHTML = INSPECTION_AREAS.map(
    a => `
    <div class="area-card" id="area-${a.id}">
      <h3 class="h4">${a.name}
        <label class="check small mb-0"><input type="checkbox" name="dmg-${a.id}" data-area="${a.id}"> Damage found</label>
      </h3>
      <p class="small text-muted mb-0 ok-text">${icon("check")} No new damage</p>
      <div class="area-details" hidden>
        <div class="form-group">
          <label for="type-${a.id}">Damage type</label>
          <select id="type-${a.id}" name="type-${a.id}"><option value="">Choose a type</option>${typeOptions}</select>
        </div>
        <div class="form-group">
          <label for="sev-${a.id}">Severity</label>
          <select id="sev-${a.id}" name="sev-${a.id}"><option value="">Choose severity</option>${sevOptions}</select>
        </div>
        <div class="form-group">
          <label for="photo-${a.id}">Photos (up to ${MAX_PHOTOS})</label>
          <input type="file" id="photo-${a.id}" accept="image/*" multiple data-photo="${a.id}">
          <div class="photo-previews" id="prev-${a.id}"></div>
        </div>
        <p class="small mb-0">Charge: <strong id="charge-${a.id}">–</strong></p>
      </div>
    </div>`
  ).join("");
}

function toggleArea(areaId, damaged) {
  const card = document.getElementById("area-" + areaId);
  card.classList.toggle("has-damage", damaged);
  card.querySelector(".area-details").hidden = !damaged;
  card.querySelector(".ok-text").hidden = damaged;
  if (damaged) card.querySelector("select").focus();
  updateTotals();
}

function readInspection() {
  const f = document.getElementById("inspect-form").elements;
  const areas = {};
  INSPECTION_AREAS.forEach(a => {
    const damaged = f["dmg-" + a.id].checked;
    areas[a.id] = damaged
      ? {
          ok: false,
          type: f["type-" + a.id].value,
          severity: f["sev-" + a.id].value,
          photos: (photos[a.id] || []).slice()
        }
      : { ok: true };
  });
  return {
    at: localDateTime(new Date()),
    staff: staffUser.name,
    mileage: Number(f.mileage.value),
    battery: Number(f.battery.value),
    notes: f.notes.value.trim(),
    areas
  };
}

function updateTotals() {
  if (!booking) return;
  const insp = readInspection();
  INSPECTION_AREAS.forEach(a => {
    const x = insp.areas[a.id];
    const el = document.getElementById("charge-" + a.id);
    if (el)
      el.textContent =
        !x.ok && x.type && x.severity
          ? formatMoney(damageCharge(x.type, x.severity))
          : "–";
  });
  const bill = calculateBill(Object.assign({}, booking, { inspection: insp }));
  const li = (l, v, cls = "") =>
    `<li class="${cls}"><span>${l}</span><span>${v}</span></li>`;
  document.getElementById("inspect-totals").innerHTML =
    li(`Damages found (${bill.damages.length})`, formatMoney(bill.damagesRaw)) +
    (bill.damagesWaived
      ? li(
          `Covered by insurance (excess ${formatMoney(bill.insurance.excess)})`,
          "−" + formatMoney(bill.damagesWaived),
          "discount"
        )
      : "") +
    li("Late return fee", formatMoney(bill.late.fee)) +
    li("Low battery fee", formatMoney(bill.lowBattery)) +
    li(
      "Estimated amount due after deposit",
      formatMoney(bill.amountDue),
      "total"
    );
}

function resizeImage(file, maxWidth = 480) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas
          .getContext("2d")
          .drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function addPhotos(areaId, input) {
  const list = photos[areaId] || (photos[areaId] = []);
  for (const file of input.files) {
    if (list.length >= MAX_PHOTOS) {
      showToast(`Only ${MAX_PHOTOS} photos per area.`, "warning");
      break;
    }
    if (!file.type.startsWith("image/")) {
      showToast(`${escapeHtml(file.name)} is not an image.`, "error");
      continue;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast(`${escapeHtml(file.name)} is larger than 10 MB.`, "error");
      continue;
    }
    try {
      list.push(await resizeImage(file));
    } catch (e) {
      showToast(`Couldn't read ${escapeHtml(file.name)}.`, "error");
    }
  }
  input.value = "";
  renderPreviews(areaId);
}

function renderPreviews(areaId) {
  const area = INSPECTION_AREAS.find(a => a.id === areaId).name;
  document.getElementById("prev-" + areaId).innerHTML = (photos[areaId] || [])
    .map(
      (src, i) => `
    <figure><img src="${src}" alt="Damage photo ${i + 1} – ${area}">
      <button type="button" data-remove="${areaId}:${i}" aria-label="Remove photo ${i + 1} (${area})">×</button></figure>`
    )
    .join("");
}

let validateInspection = () => true;

function setupValidation() {
  const form = document.getElementById("inspect-form");
  const f = form.elements;
  const rules = {
    mileage: v => {
      const out = booking.checkout ? booking.checkout.mileage : 0;
      if (v === "") return "Enter the odometer reading.";
      if (Number(v) < out)
        return `Must be at least the check-out reading (${out.toLocaleString()} km).`;
      if (Number(v) - out > 10000)
        return "That is over 10,000 km driven. Check the reading.";
      return "";
    }
  };
  INSPECTION_AREAS.forEach(a => {
    rules["type-" + a.id] = v =>
      f["dmg-" + a.id].checked && !v ? "Choose the damage type." : "";
    rules["sev-" + a.id] = v =>
      f["dmg-" + a.id].checked && !v ? "Choose how severe it is." : "";
  });
  validateInspection = setupForm(form, rules);
}

async function saveInspection() {
  if (!validateInspection()) {
    showToast("Please complete the highlighted fields.", "error");
    return;
  }
  const insp = readInspection();
  const bill = calculateBill(Object.assign({}, booking, { inspection: insp }));
  const ok = await confirmDialog({
    title: "Save inspection?",
    message: `${bill.damages.length ? plural(bill.damages.length, "damage item") + ` (${formatMoney(bill.damagesCharged)} charged)` : "No damage"} · battery ${insp.battery}% · ${insp.mileage.toLocaleString()} km.<br>Amount due after deposit: <strong>${formatMoney(bill.amountDue)}</strong>. The customer will see the bill in My bookings.`,
    confirmText: "Save and generate bill"
  });
  if (!ok) return;

  const updated = updateBooking(
    booking.ref,
    { inspection: insp, bill, status: "inspected" },
    `Inspected by ${staffUser.name}. Final bill ${formatMoney(bill.amountDue)}.`
  );
  if (!updated || !getBooking(booking.ref).inspection) {
    showToast(
      "Could not save – the photos may be too large. Remove some and try again.",
      "error"
    );
    return;
  }
  const fleet = getFleet();
  Object.assign(
    fleet.find(v => v.plate === booking.plate),
    { mileage: insp.mileage, battery: insp.battery }
  );
  saveFleet(fleet);
  sessionStorage.setItem(
    "azoom_flash",
    `Inspection saved for ${booking.ref}. Bill generated.`
  );
  location.href = `billing.html?ref=${booking.ref}`;
}

document.addEventListener("DOMContentLoaded", () => {
  staffUser = requireRole("staff");
  if (!staffUser) return;

  const ref = getQueryParam("ref");
  renderPicker(ref);
  document.getElementById("pick-form").addEventListener("submit", e => {
    e.preventDefault();
    const v = document.getElementById("pick-ref").value;
    if (v) startInspection(v);
  });
  if (ref) startInspection(ref.toUpperCase());

  const form = document.getElementById("inspect-form");
  form.addEventListener("change", e => {
    if (e.target.dataset.area)
      toggleArea(e.target.dataset.area, e.target.checked);
    else if (e.target.dataset.photo)
      addPhotos(e.target.dataset.photo, e.target);
    else updateTotals();
  });
  form.addEventListener("click", e => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    const [areaId, i] = btn.dataset.remove.split(":");
    photos[areaId].splice(Number(i), 1);
    renderPreviews(areaId);
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    saveInspection();
  });
});
