let me = null;
let currentTab = "upcoming";

const TABS = {
  upcoming: ["upcoming"],
  active: ["active", "returned"],
  past: ["inspected", "completed", "cancelled"]
};

function myBookings() {
  return getBookings().filter(b => b.userEmail === me.email);
}

const hoursUntil = text => (parseLocal(text) - new Date()) / 3600000;

function friendlyDuration(hours) {
  const h = Math.abs(hours);
  return h >= 48
    ? plural(Math.round(h / 24), "day")
    : h >= 1
      ? plural(Math.round(h), "hour")
      : plural(Math.max(1, Math.round(h * 60)), "minute");
}

function renderPaymentAlerts() {
  const due = myBookings().filter(
    b => b.status === "inspected" && b.bill && !b.bill.paid
  );
  document.getElementById("payment-alerts").innerHTML = due
    .map(
      b => `
    <div class="alert alert-warning mb-2">
      ${icon("receipt")}
      <p>Your final bill for <strong>${carName(getCar(b.carId))}</strong> (${b.ref}) is ready:
      <strong>${b.bill.amountDue >= 0 ? formatMoney(b.bill.amountDue) + " to pay" : formatMoney(-b.bill.amountDue) + " refund"}</strong>.
      <a href="invoice.html?ref=${b.ref}">View invoice and ${b.bill.amountDue > 0 ? "pay now" : "confirm"}</a></p>
    </div>`
    )
    .join("");
}

function renderBookings() {
  const all = myBookings();
  document.querySelectorAll(".dash-tab").forEach(t => {
    const count = all.filter(b =>
      TABS[t.dataset.tab].includes(b.status)
    ).length;
    t.querySelector(".count").textContent = count;
    const on = t.dataset.tab === currentTab;
    t.setAttribute("aria-selected", on);
    t.tabIndex = on ? 0 : -1;
  });
  document
    .getElementById("booking-panel")
    .setAttribute("aria-labelledby", "tab-" + currentTab);

  const list = all.filter(b => TABS[currentTab].includes(b.status));
  list.sort((a, b) =>
    currentTab === "past"
      ? parseLocal(b.pickupAt) - parseLocal(a.pickupAt)
      : parseLocal(a.pickupAt) - parseLocal(b.pickupAt)
  );

  const empty = {
    upcoming: `<div class="empty-state">${icon("calendar")}<p><strong>No upcoming bookings</strong></p><a class="btn btn-primary" href="booking.html?new=1">Book an EV</a></div>`,
    active: `<div class="empty-state">${icon("car")}<p class="mb-0"><strong>No active rentals right now.</strong></p></div>`,
    past: `<div class="empty-state">${icon("clock")}<p class="mb-0"><strong>No past rentals yet.</strong></p></div>`
  };
  document.getElementById("booking-panel").innerHTML = list.length
    ? list.map(bookingCardHTML).join("")
    : empty[currentTab];
  renderPaymentAlerts();
}

function bookingCardHTML(b) {
  const car = getCar(b.carId);
  const branch = getBranch(b.branchId);
  const carpark = getCarpark(b.returnCarparkId);
  const btn = (action, label, cls = "btn-outline") =>
    `<button type="button" class="btn ${cls} btn-sm" data-action="${action}" data-ref="${b.ref}">${label}</button>`;
  let note = "";
  let actions = btn("view", `${icon("eye")} Details`);

  if (b.status === "upcoming") {
    const h = hoursUntil(b.pickupAt);
    note =
      h > 0
        ? `Pick-up in ${friendlyDuration(h)}`
        : "Pick-up time has passed – please visit the branch";
    if (h > POLICY.modifyCutoffHours)
      actions += btn("modify", `${icon("edit")} Modify`);
    actions += btn("cancel", `${icon("x")} Cancel`, "btn-ghost");
  }
  if (b.status === "active") {
    const h = hoursUntil(b.returnAt);
    note =
      h >= 0
        ? `Due back in ${friendlyDuration(h)}`
        : `<span class="badge badge-danger">${icon("alert")} Overdue by ${friendlyDuration(h)}</span>`;
    actions =
      btn("return", `${icon("parking")} Return car`, "btn-primary") + actions;
  }
  if (b.status === "returned")
    note = `Returned ${formatDateTime(b.returned.at)}. Our staff will inspect the car and send your bill.`;
  if (b.status === "inspected") {
    note = `<strong>Final bill: ${b.bill.amountDue >= 0 ? formatMoney(b.bill.amountDue) + " due" : formatMoney(-b.bill.amountDue) + " refund"}</strong>`;
    actions =
      `<a class="btn btn-primary btn-sm" href="invoice.html?ref=${b.ref}">${icon("receipt")} ${b.bill.amountDue > 0 ? "Pay now" : "View bill"}</a>` +
      actions;
  }
  if (b.status === "completed") {
    note = `Paid ${formatDateTime(b.bill.paidAt)}`;
    actions += `<a class="btn btn-outline btn-sm" href="invoice.html?ref=${b.ref}">${icon("receipt")} Invoice</a>`;
  }
  if (b.status === "cancelled")
    note = `Cancelled ${b.cancelledAt ? formatDate(b.cancelledAt) : ""}${b.cancelFee ? ` · Fee ${formatMoney(b.cancelFee)}` : " · No fee"}`;
  if (["upcoming", "active"].includes(b.status))
    actions += `<a class="btn btn-ghost btn-sm" href="invoice.html?ref=${b.ref}">${icon("print")} Print</a>`;

  return `
    <article class="card booking-card">
      <img src="${carImage(car.id)}" alt="${carName(car)}">
      <div>
        <div class="flex flex-wrap">${statusBadge(b.status)}<span class="small text-muted">Ref <strong>${b.ref}</strong></span></div>
        <h2 class="h4 mt-1 mb-0">${carName(car)}</h2>
        <div class="booking-meta">
          <span>${icon("pin")} ${branch.name} · ${formatDateTime(b.pickupAt)}</span>
          <span>${icon("parking")} ${carpark.name} · ${formatDateTime(b.returnAt)}</span>
          <span>${icon("calendar")} ${plural(b.quote.days, "day")} · est. ${formatMoney(b.quote.total)}</span>
        </div>
        ${note ? `<p class="small mt-1 mb-0">${note}</p>` : ""}
      </div>
      <div class="booking-actions">${actions}</div>
    </article>`;
}

function openDetails(ref) {
  const b = getBooking(ref);
  const history = (b.history || [])
    .map(
      h =>
        `<li><span class="text-muted">${formatDateTime(h.at)}</span> – ${escapeHtml(h.note)}</li>`
    )
    .join("");
  openModal({
    title: `Booking ${b.ref}`,
    size: "lg",
    content: `<p>${statusBadge(b.status)}</p>${bookingSummaryHTML(b)}${history ? `<h3 class="h4 mt-3">History</h3><ul class="small">${history}</ul>` : ""}`,
    buttons: [
      { text: "Close" },
      {
        text: `${icon("print")} Printable summary`,
        className: "btn-primary",
        onClick: () => {
          location.href = `invoice.html?ref=${b.ref}`;
        }
      }
    ]
  });
}

async function cancelBooking(ref) {
  const b = getBooking(ref);
  const fee = cancellationFee(b);
  const ok = await confirmDialog({
    title: `Cancel booking ${b.ref}?`,
    message: fee
      ? `Pick-up is less than ${POLICY.freeCancelHours} hours away, so a cancellation fee of <strong>${formatMoney(fee)}</strong> (one day's rental) will be charged to your ${b.card.type} ending ${b.card.last4}. The rest of your deposit is released.`
      : `This cancellation is <strong>free</strong>. Your ${formatMoney(POLICY.deposit)} deposit hold will be released to your ${b.card.type} ending ${b.card.last4}.`,
    confirmText: "Yes, cancel booking",
    cancelText: "Keep booking",
    danger: true
  });
  if (!ok) return;
  updateBooking(
    ref,
    {
      status: "cancelled",
      cancelledAt: localDateTime(new Date()),
      cancelFee: fee
    },
    `Cancelled by customer.${fee ? ` Cancellation fee ${formatMoney(fee)}.` : " No fee."}`
  );
  showToast(`Booking ${ref} cancelled.`, "info");
  renderBookings();
}

function modifyBooking(ref) {
  const b = getBooking(ref);
  const [pDate, pTime] = b.pickupAt.split("T");
  const rDate = b.returnAt.slice(0, 10);
  const form = document.createElement("form");
  form.noValidate = true;
  form.innerHTML = `
    <div class="form-row">
      <div class="form-group"><label for="m-pdate">Pick-up date</label><input type="date" id="m-pdate" name="pdate" value="${pDate}" min="${localDate(new Date())}"></div>
      <div class="form-group"><label for="m-ptime">Pick-up time</label><select id="m-ptime" name="ptime">${timeSlots(
        8,
        20.5
      )
        .map(t => `<option ${t === pTime ? "selected" : ""}>${t}</option>`)
        .join("")}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label for="m-rdate">Return date</label><input type="date" id="m-rdate" name="rdate" value="${rDate}"></div>
      <div class="form-group"><span class="label">Return by</span><p class="mb-0">11:59 pm on the return date</p></div>
    </div>
    <div class="form-group"><label for="m-carpark">Return car park</label>
      <select id="m-carpark" name="carpark">${CARPARKS.map(c => `<option value="${c.id}" ${c.id === b.returnCarparkId ? "selected" : ""}>${c.name}</option>`).join("")}</select></div>
    <fieldset><legend class="h4">Extras</legend>
      ${EXTRAS.map(x => `<label class="check mb-1"><input type="checkbox" name="extra" value="${x.id}" ${b.extras[x.id] ? "checked" : ""}> ${x.name} (${formatMoney(x.perDay)}/day)</label>`).join("")}
    </fieldset>
    <div class="form-group"><label for="m-ins">Insurance</label>
      <select id="m-ins" name="insurance">${INSURANCE.map(t => `<option value="${t.id}" ${t.id === b.insurance ? "selected" : ""}>${t.name} – ${t.perDay ? formatMoney(t.perDay) + "/day" : "included"}</option>`).join("")}</select></div>
    <div class="panel" style="padding:1rem"><div class="flex between"><span>Current total</span><strong>${formatMoney(b.quote.total)}</strong></div>
      <div class="flex between"><span>New total</span><strong id="m-new" aria-live="polite"></strong></div></div>
    <p class="small text-muted mt-1 mb-0">To change the car or pick-up branch, cancel and make a new booking.</p>`;

  const f = form.elements;
  const values = () => ({
    pickupAt: `${f.pdate.value}T${f.ptime.value}`,
    returnAt: `${f.rdate.value}T${POLICY.returnByTime}`,
    extras: Object.fromEntries(
      EXTRAS.map(x => [
        x.id,
        form.querySelector(`input[name="extra"][value="${x.id}"]`).checked
      ])
    ),
    insurance: f.insurance.value,
    carpark: f.carpark.value
  });
  const updatePrice = () => {
    const v = values();
    const q = calculateQuote(
      b.carId,
      v.pickupAt,
      v.returnAt,
      v.extras,
      v.insurance
    );
    const diff = q ? q.total - b.quote.total : 0;
    form.querySelector("#m-new").innerHTML = q
      ? `${formatMoney(q.total)} <span class="small ${diff > 0 ? "text-muted" : ""}">(${diff >= 0 ? "+" : ""}${formatMoney(diff)})</span>`
      : "–";
  };
  form.addEventListener("input", updatePrice);
  form.addEventListener("change", updatePrice);
  form.addEventListener("submit", e => e.preventDefault());

  const validate = setupForm(form, {
    pdate: v =>
      !v
        ? "Choose a date."
        : v < localDate(new Date())
          ? "Pick-up can’t be in the past."
          : "",
    ptime: v => {
      const [open, last] = pickupWindow(f.pdate.value);
      if (v < open || v > last)
        return `Pick-up on this day is between ${open} and ${last}.`;
      return hoursUntil(`${f.pdate.value}T${v}`) < POLICY.modifyCutoffHours
        ? `New pick-up must be at least ${POLICY.modifyCutoffHours} hours from now.`
        : "";
    },
    rdate: v => {
      const days = rentalDays(
        `${f.pdate.value}T${f.ptime.value}`,
        `${v}T${POLICY.returnByTime}`
      );
      if (!v || !days) return "Return can’t be before pick-up.";
      return days > POLICY.maxRentalDays
        ? `Rentals can be up to ${POLICY.maxRentalDays} days.`
        : "";
    }
  });

  const modal = openModal({
    title: `Modify ${b.ref}`,
    content: form,
    buttons: [
      { text: "Close" },
      {
        text: "Save changes",
        className: "btn-primary",
        onClick: async m => {
          if (!validate()) return;
          const v = values();
          const vehicle = findAvailableVehicle(
            b.carId,
            b.branchId,
            v.pickupAt,
            v.returnAt,
            b.ref
          );
          if (!vehicle) {
            showToast(
              "Sorry, this car isn’t available for those dates. Try different dates.",
              "error"
            );
            return;
          }
          const q = calculateQuote(
            b.carId,
            v.pickupAt,
            v.returnAt,
            v.extras,
            v.insurance
          );
          const ok = await confirmDialog({
            title: "Save these changes?",
            message: `${formatDateTime(v.pickupAt)} → ${formatDateTime(v.returnAt)}<br>New estimated total: <strong>${formatMoney(q.total)}</strong> (was ${formatMoney(b.quote.total)}).`,
            confirmText: "Save changes"
          });
          if (!ok) return;
          updateBooking(
            b.ref,
            {
              pickupAt: v.pickupAt,
              returnAt: v.returnAt,
              extras: v.extras,
              insurance: v.insurance,
              returnCarparkId: v.carpark,
              plate: vehicle.plate,
              quote: q
            },
            `Booking modified. New total ${formatMoney(q.total)}.`
          );
          m.close();
          showToast(`Booking ${b.ref} updated.`);
          renderBookings();
        }
      }
    ]
  });
  updatePrice();
  return modal;
}

function returnCar(ref) {
  const b = getBooking(ref);
  const late = lateFee(
    b.returnAt,
    localDateTime(new Date()),
    getCar(b.carId).daily
  );
  const form = document.createElement("form");
  form.noValidate = true;
  form.innerHTML = `
    <div class="form-group"><label for="r-carpark">Where did you park?</label>
      <select id="r-carpark" name="carpark">${CARPARKS.map(c => `<option value="${c.id}" ${c.id === b.returnCarparkId ? "selected" : ""}>${c.name} (${c.lots})</option>`).join("")}</select></div>
    <div class="form-group"><label class="check"><input type="checkbox" name="parked"> I've parked in an AZoom lot, locked the car and dropped the key card in the key box.</label></div>
    ${late.fee ? `<div class="alert alert-warning">${icon("clock")}<p>You're returning ${friendlyDuration(late.minutesLate / 60)} late. A late fee of about <strong>${formatMoney(late.fee)}</strong> will be added to your bill.</p></div>` : ""}
    <p class="small text-muted mb-0">Remember: battery below ${POLICY.lowBatteryThreshold}% adds a ${formatMoney(POLICY.lowBatteryFee)} recharging fee.</p>`;
  form.addEventListener("submit", e => e.preventDefault());
  const validate = setupForm(form, {
    parked: c => (c ? "" : "Please confirm the car is parked and locked.")
  });

  openModal({
    title: `Return ${carName(getCar(b.carId))}`,
    content: form,
    buttons: [
      { text: "Not yet" },
      {
        text: "Confirm return",
        className: "btn-primary",
        onClick: m => {
          if (!validate()) return;
          updateBooking(
            ref,
            {
              status: "returned",
              returned: {
                at: localDateTime(new Date()),
                carparkId: form.elements.carpark.value
              }
            },
            `Car returned to ${getCarpark(form.elements.carpark.value).name}.`
          );
          m.close();
          showToast(
            "Thanks! The car is marked as returned. We'll inspect it and send your final bill."
          );
          renderBookings();
        }
      }
    ]
  });
}

document.addEventListener("DOMContentLoaded", () => {
  me = requireRole("customer");
  if (!me) return;
  document.getElementById("welcome").textContent =
    `Hi ${me.name.split(" ")[0]}, here are your rentals.`;

  const wanted = getQueryParam("tab");
  if (TABS[wanted]) currentTab = wanted;
  else if (
    !myBookings().some(b => b.status === "upcoming") &&
    myBookings().some(b => TABS.active.includes(b.status))
  )
    currentTab = "active";
  renderBookings();

  const tabs = document.getElementById("tabs");
  tabs.addEventListener("click", e => {
    const t = e.target.closest(".dash-tab");
    if (t) {
      currentTab = t.dataset.tab;
      renderBookings();
    }
  });
  tabs.addEventListener("keydown", e => {
    const order = Object.keys(TABS);
    const i = order.indexOf(currentTab);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      currentTab =
        order[
          (i + (e.key === "ArrowRight" ? 1 : -1) + order.length) % order.length
        ];
      renderBookings();
      document.getElementById("tab-" + currentTab).focus();
    }
  });

  document.getElementById("booking-panel").addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const actions = {
      view: openDetails,
      cancel: cancelBooking,
      modify: modifyBooking,
      return: returnCar
    };
    actions[btn.dataset.action](btn.dataset.ref);
  });
});
