let staff = null;
let boardFilter = "all";

const branchFilter = () => document.getElementById("branch-filter").value;
const inBranch = branchId =>
  branchFilter() === "all" || branchFilter() === branchId;

function renderAll() {
  renderKpis();
  renderPickups();
  renderReturns();
  renderBoard();
}

function renderKpis() {
  const bookings = getBookings();
  const fleet = getFleet().filter(v => inBranch(v.branchId));
  const counts = {};
  Object.keys(VEHICLE_STATUS).forEach(s => {
    counts[s] = 0;
  });
  fleet.forEach(v => {
    counts[vehicleStatus(v, bookings)]++;
  });
  document.getElementById("kpis").innerHTML = Object.entries(VEHICLE_STATUS)
    .map(
      ([id, label]) =>
        `<button type="button" class="kpi status-${id}" data-status="${id}" aria-pressed="${boardFilter === id}"><strong>${counts[id]}</strong><span>${label}</span></button>`
    )
    .join("");
}

function renderPickups() {
  const list = getBookings()
    .filter(b => b.status === "upcoming" && inBranch(b.branchId))
    .sort((a, b) => parseLocal(a.pickupAt) - parseLocal(b.pickupAt))
    .slice(0, 6);
  document.getElementById("pickup-list").innerHTML = list.length
    ? list
        .map(
          b => `
    <li>
      <span><button type="button" class="btn btn-ghost btn-sm" data-pick="${b.ref}">${b.ref}</button> ${escapeHtml(b.driver.name)} · ${carName(getCar(b.carId))}</span>
      <span class="small text-muted">${formatDateTime(b.pickupAt)}</span>
    </li>`
        )
        .join("")
    : '<li class="text-muted">No upcoming pick-ups.</li>';
}

function lookupBooking(ref) {
  const input = document.getElementById("lookup-ref");
  input.value = ref;
  const b = getBooking(ref);
  const panel = document.getElementById("checkout-panel");
  if (!/^AZ-[A-Z0-9]{6}$/i.test(ref.trim())) {
    setFieldError(input, "References look like AZ-8F3K2Q.");
    return;
  }
  if (!b) {
    setFieldError(input, "No booking found with that reference.");
    return;
  }
  setFieldError(input, "");

  if (b.status !== "upcoming") {
    panel.innerHTML = `<div class="alert alert-warning">${icon("info")}<p><strong>${b.ref}</strong> can't be checked out. Its status is ${statusBadge(b.status)}.
      ${b.checkout ? `<br>Checked out ${formatDateTime(b.checkout.at)} by ${escapeHtml(b.checkout.staff)}.` : ""}</p></div>`;
    return;
  }
  if (hoursFromNow(b.pickupAt) > 24) {
    panel.innerHTML = `<div class="alert alert-warning">${icon("clock")}<p>Pick-up for <strong>${b.ref}</strong> is on ${formatDateTime(b.pickupAt)}. Cars can be checked out from 24 hours before the booked time.</p></div>`;
    return;
  }
  renderCheckoutForm(b);
}

const hoursFromNow = text => (parseLocal(text) - new Date()) / 3600000;

function renderCheckoutForm(b) {
  const vehicle = getFleet().find(v => v.plate === b.plate);
  const age = yearsSince(b.driver.dob);
  const licenceYears = yearsSince(b.driver.licenceIssued);
  const panel = document.getElementById("checkout-panel");
  panel.innerHTML = `
    <div class="summary-car"><img src="${carImage(b.carId)}" alt=""><div><strong>${carName(getCar(b.carId))}</strong><div class="small text-muted">Plate ${b.plate} · ${b.ref}</div></div></div>
    <ul class="spec-list">
      <li><span>Customer</span><span>${escapeHtml(b.driver.name)}</span></li>
      <li><span>Age</span><span>${age} ${age >= POLICY.minAge ? "✓" : "✗"}</span></li>
      <li><span>Licence</span><span>${escapeHtml(b.driver.licenceNo)}</span></li>
      <li><span>Licence held</span><span>${plural(licenceYears, "year")} ${licenceYears >= POLICY.minLicenceYears ? "✓" : "✗"}</span></li>
      <li><span>Pick-up</span><span>${formatDateTime(b.pickupAt)}</span></li>
      <li><span>Card</span><span>${b.card.type} ··${b.card.last4}</span></li>
    </ul>
    <form id="checkout-form" novalidate>
      <div class="form-group"><label class="check"><input type="checkbox" name="licenceOk"> Licence sighted: name and number match (${escapeHtml(b.driver.licenceNo)})</label></div>
      <div class="form-group"><label class="check"><input type="checkbox" name="cardOk"> Credit card sighted: ${b.card.type} ending ${b.card.last4}, name ${escapeHtml(b.card.name)}</label></div>
      <div class="form-row">
        <div class="form-group"><label for="co-mileage">Starting mileage (km)</label><input type="number" id="co-mileage" name="mileage" min="0" value="${vehicle.mileage}"></div>
        <div class="form-group"><label for="co-battery">Battery (%)</label><input type="number" id="co-battery" name="battery" min="0" max="100" value="${vehicle.battery}"></div>
      </div>
      <button type="submit" class="btn btn-primary">${icon("key")} Complete check-out</button>
      <button type="button" class="btn btn-ghost" id="co-cancel">Cancel</button>
    </form>`;

  const form = document.getElementById("checkout-form");
  const validate = setupForm(form, {
    licenceOk: c => (c ? "" : "Check the customer’s licence first."),
    cardOk: c => (c ? "" : "Check the credit card first."),
    mileage: v =>
      v === "" || Number(v) < 0
        ? "Enter the odometer reading."
        : Number(v) < vehicle.mileage
          ? `Can’t be lower than the last recorded ${vehicle.mileage.toLocaleString()} km.`
          : "",
    battery: v =>
      v === "" || Number(v) < 0 || Number(v) > 100
        ? "Enter a battery level from 0 to 100."
        : Number(v) < 80
          ? "Charge the car to at least 80% before handing it over."
          : ""
  });
  document.getElementById("co-cancel").addEventListener("click", () => {
    panel.innerHTML =
      '<div class="empty-state">Look up a booking reference to start the check-out.</div>';
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validate()) return;
    const mileage = Number(form.elements.mileage.value);
    const battery = Number(form.elements.battery.value);
    const ok = await confirmDialog({
      title: `Hand over ${b.plate}?`,
      message: `${escapeHtml(b.driver.name)} is picking up the ${carName(getCar(b.carId))} with ${mileage.toLocaleString()} km and ${battery}% battery. Due back ${formatDateTime(b.returnAt)} at ${getCarpark(b.returnCarparkId).name}.`,
      confirmText: "Complete check-out"
    });
    if (!ok) return;
    updateBooking(
      b.ref,
      {
        status: "active",
        checkout: {
          at: localDateTime(new Date()),
          mileage,
          battery,
          staff: staff.name,
          licenceChecked: true,
          cardChecked: true
        }
      },
      `Picked up at ${getBranch(b.branchId).name}. Checked out by ${staff.name}.`
    );
    const fleet = getFleet();
    Object.assign(
      fleet.find(v => v.plate === b.plate),
      { mileage, battery }
    );
    saveFleet(fleet);
    panel.innerHTML = `<div class="alert alert-success">${icon("check-circle")}<p><strong>${b.ref}</strong> checked out. The car is now marked as Rented.</p></div>`;
    showToast(`${b.plate} handed over to ${escapeHtml(b.driver.name)}.`);
    renderAll();
  });
}

function renderReturns() {
  const list = getBookings()
    .filter(
      b =>
        b.status === "returned" &&
        inBranch(getCarpark(b.returned.carparkId).branchId)
    )
    .sort((a, b) => parseLocal(a.returned.at) - parseLocal(b.returned.at));
  document.getElementById("returns-count").textContent = list.length;
  document.getElementById("returns-rows").innerHTML = list.length
    ? list
        .map(b => {
          const late = lateFee(
            b.returnAt,
            b.returned.at,
            getCar(b.carId).daily
          );
          return `<tr>
      <td><strong>${b.ref}</strong></td>
      <td>${carName(getCar(b.carId))}<br><span class="plate small">${b.plate}</span></td>
      <td>${escapeHtml(b.driver.name)}</td>
      <td>${formatDateTime(b.returned.at)}${late.fee ? `<br><span class="badge badge-danger">${plural(late.hours, "hour")} late</span>` : ""}</td>
      <td>${getCarpark(b.returned.carparkId).name}</td>
      <td><a class="btn btn-primary btn-sm" href="inspection.html?ref=${b.ref}">${icon("clipboard")} Inspect</a></td>
    </tr>`;
        })
        .join("")
    : '<tr><td colspan="6" class="text-center text-muted">No cars waiting for inspection.</td></tr>';
}

function renderBoard() {
  const bookings = getBookings();
  const allVehicles = getFleet().filter(v => inBranch(v.branchId));
  const search = document
    .getElementById("board-search")
    .value.trim()
    .toLowerCase();
  const location = document.getElementById("board-location").value;
  const model = document.getElementById("board-model").value;

  const bookingFor = (v, status) =>
    bookings.find(
      x =>
        x.plate === v.plate &&
        (
          {
            rented: ["active"],
            inspection: ["returned"],
            reserved: ["upcoming"]
          }[status] || []
        ).includes(x.status)
    );

  const matches = v => {
    const b = bookingFor(v, vehicleStatus(v, bookings));
    const text = [
      v.plate,
      carName(getCar(v.carId)),
      getBranch(v.branchId).name,
      v.note,
      b ? b.ref : "",
      b ? b.driver.name : ""
    ]
      .join(" ")
      .toLowerCase();
    return (
      (location === "all" || v.branchId === location) &&
      (model === "all" || v.carId === model) &&
      text.includes(search)
    );
  };

  const fleet = allVehicles.filter(matches);
  const groups = {};
  Object.keys(VEHICLE_STATUS).forEach(s => {
    groups[s] = [];
  });
  fleet.forEach(v => groups[vehicleStatus(v, bookings)].push(v));

  const item = (v, status) => {
    const b = bookingFor(v, status);
    const low = v.battery < 30;
    let note = "";
    let action = "";
    if (b)
      note = `${b.ref} · ${status === "reserved" ? "pick-up " + formatDate(b.pickupAt) : status === "rented" ? "due " + formatDate(b.returnAt) : "returned " + formatDate(b.returned.at)}`;
    if (status === "maintenance") {
      note = escapeHtml(v.note);
      action = `<button type="button" class="btn btn-outline btn-sm btn-block" data-service="${v.plate}">Back in service</button>`;
    }
    if (status === "available")
      action = `<button type="button" class="btn btn-outline btn-sm btn-block" data-maint="${v.plate}">${icon("wrench")} Maintenance</button>`;
    if (status === "inspection" && b)
      action = `<a class="btn btn-outline btn-sm btn-block" href="inspection.html?ref=${b.ref}">Inspect</a>`;
    return `<div class="board-item">
      <div class="board-item-head">
        <strong>${carName(getCar(v.carId))}</strong>
        <span class="badge status-${status}">${VEHICLE_STATUS[status]}</span>
      </div>
      <div class="board-item-meta"><span class="plate">${v.plate}</span><span>${getBranch(v.branchId).name}</span></div>
      <div class="board-item-battery">
        <span class="battery-bar"><span class="${low ? "low" : ""}" style="width:${v.battery}%"></span></span>
        <span class="num">${v.battery}%</span>
      </div>
      <div class="board-item-meta"><span>Mileage</span><span class="num">${v.mileage.toLocaleString()} km</span></div>
      ${note ? `<p class="board-item-note">${note}</p>` : ""}
      ${action ? `<div class="board-item-action">${action}</div>` : ""}
    </div>`;
  };

  const chip = (id, label, count) =>
    `<button type="button" class="chip" data-status="${id}" aria-pressed="${boardFilter === id}">${label} (${count})</button>`;
  document.getElementById("board-filters").innerHTML =
    chip("all", "All", fleet.length) +
    Object.entries(VEHICLE_STATUS)
      .map(([id, label]) => chip(id, label, groups[id].length))
      .join("");

  const shown = Object.keys(VEHICLE_STATUS).filter(
    id => boardFilter === "all" || boardFilter === id
  );
  const cards = shown
    .map(id => groups[id].map(v => item(v, id)).join(""))
    .join("");
  const shownCount = shown.reduce((sum, id) => sum + groups[id].length, 0);
  document.getElementById("board-count").textContent =
    `Showing ${shownCount} of ${plural(allVehicles.length, "vehicle")}`;
  document.getElementById("board-cols").innerHTML =
    cards || '<p class="board-empty">No vehicles match these filters.</p>';
}

function setupBoardControls() {
  const form = document.getElementById("board-controls");
  const search = document.getElementById("board-search");
  const location = document.getElementById("board-location");
  const model = document.getElementById("board-model");

  location.innerHTML += BRANCHES.map(
    b => `<option value="${b.id}">${b.name}</option>`
  ).join("");
  model.innerHTML += CARS.slice()
    .sort((a, b) => carName(a).localeCompare(carName(b)))
    .map(c => `<option value="${c.id}">${carName(c)}</option>`)
    .join("");

  form.addEventListener("submit", e => e.preventDefault());
  search.addEventListener("input", renderBoard);
  location.addEventListener("change", renderBoard);
  model.addEventListener("change", renderBoard);

  document.getElementById("board-clear").addEventListener("click", () => {
    search.value = "";
    model.value = "all";
    syncBoardLocation();
    setBoardFilter("all");
  });
}

function syncBoardLocation() {
  const location = document.getElementById("board-location");
  location.value = branchFilter();
  location.disabled = branchFilter() !== "all";
}

function setBoardFilter(status) {
  boardFilter = status;
  renderKpis();
  renderBoard();
}

function sendToMaintenance(plate) {
  const form = document.createElement("form");
  form.noValidate = true;
  form.innerHTML = `<div class="form-group"><label for="mt-note">Reason</label><input type="text" id="mt-note" name="note" placeholder="Tyre replacement"></div>`;
  form.addEventListener("submit", e => e.preventDefault());
  const validate = setupForm(form, {
    note: v => (v.trim().length < 3 ? "Enter a short reason." : "")
  });
  openModal({
    title: `Send ${plate} for maintenance`,
    content: form,
    buttons: [
      { text: "Cancel" },
      {
        text: "Send to maintenance",
        className: "btn-primary",
        onClick: m => {
          if (!validate()) return;
          const fleet = getFleet();
          Object.assign(
            fleet.find(v => v.plate === plate),
            { maintenance: true, note: form.elements.note.value.trim() }
          );
          saveFleet(fleet);
          m.close();
          showToast(`${plate} moved to Maintenance.`, "info");
          renderAll();
        }
      }
    ]
  });
}

async function backInService(plate) {
  if (
    !(await confirmDialog({
      title: `Return ${plate} to service?`,
      message: "The car will show as Available for new bookings.",
      confirmText: "Back in service"
    }))
  )
    return;
  const fleet = getFleet();
  Object.assign(
    fleet.find(v => v.plate === plate),
    { maintenance: false, note: "", battery: 100 }
  );
  saveFleet(fleet);
  showToast(`${plate} is available again.`);
  renderAll();
}

document.addEventListener("DOMContentLoaded", () => {
  staff = requireRole("staff");
  if (!staff) return;
  document.getElementById("staff-hello").textContent =
    `Signed in as ${staff.name} · ${formatDate(localDate(new Date()))}`;

  const filter = document.getElementById("branch-filter");
  filter.innerHTML += BRANCHES.map(
    b => `<option value="${b.id}">${b.name}</option>`
  ).join("");
  filter.addEventListener("change", () => {
    syncBoardLocation();
    renderAll();
  });
  setupBoardControls();
  renderAll();

  document.getElementById("lookup-form").addEventListener("submit", e => {
    e.preventDefault();
    lookupBooking(
      document.getElementById("lookup-ref").value.trim().toUpperCase()
    );
  });
  document.getElementById("pickup-list").addEventListener("click", e => {
    const btn = e.target.closest("[data-pick]");
    if (btn) lookupBooking(btn.dataset.pick);
  });
  document.getElementById("board-filters").addEventListener("click", e => {
    const chip = e.target.closest("[data-status]");
    if (!chip) return;
    setBoardFilter(chip.dataset.status);
    document
      .querySelector(`#board-filters [data-status="${boardFilter}"]`)
      .focus();
  });
  document.getElementById("kpis").addEventListener("click", e => {
    const tile = e.target.closest("[data-status]");
    if (!tile) return;
    const status = tile.dataset.status;
    setBoardFilter(boardFilter === status ? "all" : status);
    document.querySelector(`#kpis [data-status="${status}"]`).focus();
    if (boardFilter !== "all")
      document.getElementById("board").scrollIntoView();
  });
  document.getElementById("board-cols").addEventListener("click", e => {
    const maint = e.target.closest("[data-maint]");
    const service = e.target.closest("[data-service]");
    if (maint) sendToMaintenance(maint.dataset.maint);
    if (service) backInService(service.dataset.service);
  });
});
