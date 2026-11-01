let billStaff = null;
let billFilter = "due";

function renderBillList() {
  const all = getBookings().filter(b => b.bill);
  const groups = {
    due: all.filter(b => !b.bill.paid),
    paid: all.filter(b => b.bill.paid),
    all
  };
  document.querySelectorAll("#bill-tabs .dash-tab").forEach(t => {
    t.querySelector(".count").textContent = groups[t.dataset.filter].length;
    const on = t.dataset.filter === billFilter;
    t.setAttribute("aria-selected", on);
    t.tabIndex = on ? 0 : -1;
  });
  document
    .getElementById("bill-table")
    .setAttribute("aria-labelledby", "bt-" + billFilter);

  const waiting = getBookings().filter(b => b.status === "returned").length;
  document.getElementById("awaiting-note").innerHTML = waiting
    ? `${plural(waiting, "car")} still waiting for inspection. <a href="inspection.html">Inspect now</a> to generate the bill.`
    : "Bills are created automatically when an inspection is saved.";

  const list = groups[billFilter].sort(
    (a, b) => parseLocal(b.inspection.at) - parseLocal(a.inspection.at)
  );
  document.getElementById("bill-rows").innerHTML = list.length
    ? list
        .map(
          b => `
    <tr>
      <td><strong>${b.ref}</strong></td>
      <td>${escapeHtml(b.driver.name)}</td>
      <td>${carName(getCar(b.carId))}<br><span class="plate small">${b.plate}</span></td>
      <td>${formatDate(b.inspection.at)}</td>
      <td>${b.bill.amountDue >= 0 ? formatMoney(b.bill.amountDue) : `<span class="text-muted">refund</span> ${formatMoney(-b.bill.amountDue)}`}</td>
      <td>${b.bill.paid ? '<span class="badge status-completed">Paid</span>' : '<span class="badge status-inspected">Payment due</span>'}</td>
      <td><a class="btn btn-outline btn-sm" href="billing.html?ref=${b.ref}">Open</a></td>
    </tr>`
        )
        .join("")
    : '<tr><td colspan="7" class="text-center text-muted">No bills here.</td></tr>';
}

function formulaHTML(bill) {
  const part = (label, value, sign = "+") =>
    `<span class="stat-card" style="padding:.6rem .8rem"><span class="stat-label">${sign} ${label}</span><br><strong class="num">${formatMoney(value)}</strong></span>`;
  return `
    <h2 class="h4">Final bill calculation</h2>
    <div class="flex flex-wrap" style="gap:.5rem">
      ${part("Rental", bill.rental, "")}
      ${part("Extras", bill.extrasTotal)}
      ${part("Insurance", bill.insurance.amount)}
      ${part("Damages", bill.damagesCharged)}
      ${part("Late fee", bill.late.fee)}
      ${part("Low battery", bill.lowBattery)}
      ${part("Deposit", bill.deposit, "−")}
      <span class="stat-card" style="padding:.6rem .8rem;border-color:var(--primary)"><span class="stat-label">= ${bill.amountDue >= 0 ? "Amount due" : "Refund"}</span><br><strong class="num">${formatMoney(Math.abs(bill.amountDue))}</strong></span>
    </div>`;
}

function renderBill(ref) {
  const b = getBooking(ref);
  document.getElementById("bill-list-view").hidden = true;
  document.getElementById("bill-view").hidden = false;
  const doc = document.getElementById("bill-doc");
  const actions = document.getElementById("bill-actions");

  if (!b) {
    doc.innerHTML = `<div class="empty-state">${icon("search")}<p class="mb-0"><strong>No booking ${escapeHtml(ref)}.</strong></p></div>`;
    return;
  }
  if (!b.bill) {
    doc.innerHTML = `<div class="alert alert-warning">${icon("info")}<p><strong>${b.ref}</strong> has no final bill yet (status: ${BOOKING_STATUS[b.status]}).
      ${b.status === "returned" ? `<a href="inspection.html?ref=${b.ref}">Inspect the car</a> to generate it.` : "A bill is generated after the car is returned and inspected."}</p></div>`;
    document.getElementById("bill-formula").hidden = true;
    return;
  }

  document.title = `Bill ${b.ref} – AZoom staff`;
  document.getElementById("bill-formula").hidden = false;
  document.getElementById("bill-formula").innerHTML = formulaHTML(b.bill);
  const branch = getBranch(b.branchId);
  doc.innerHTML = `
    <div class="invoice-head">
      <div>
        <div class="logo">${LOGO_HTML}</div>
        <p class="small text-muted mt-1 mb-0">AZoom Car Rental Pte Ltd (fictional)<br>${branch.address}<br>${branch.phone}</p>
      </div>
      <div class="invoice-meta">
        <h1 class="h3 mb-1">Tax invoice</h1>
        <div>Reference <strong>${b.ref}</strong></div>
        <div>Issued ${formatDate(b.bill.generatedAt)}</div>
        <div class="mt-1">${statusBadge(b.status)}</div>
        ${b.bill.paid ? '<div class="mt-2"><span class="paid-stamp">PAID</span></div>' : ""}
      </div>
    </div>
    <div class="invoice-parties">
      <div><strong>Billed to</strong><br>${escapeHtml(b.driver.name)}<br>${escapeHtml(b.driver.email)}<br>${escapeHtml(b.driver.phone)}<br>Card: ${b.card.type} ending ${b.card.last4}</div>
      <div><strong>Rental</strong><br>${carName(getCar(b.carId))} · ${b.plate}<br>Out: ${formatDateTime(b.checkout ? b.checkout.at : b.pickupAt)}<br>In: ${formatDateTime(b.returned.at)} (due ${formatDateTime(b.returnAt)})</div>
    </div>
    ${billTableHTML(b)}
    ${b.bill.paid ? `<p class="mt-2 small">Settled ${formatDateTime(b.bill.paidAt)} · ${escapeHtml(b.bill.paidBy)}</p>` : ""}
    ${inspectionHTML(b)}`;

  actions.innerHTML = `
    <button type="button" class="btn btn-outline" id="print-bill">${icon("print")} Print invoice</button>
    ${b.bill.paid ? "" : `<button type="button" class="btn btn-primary" id="mark-paid">${icon("check")} Mark as paid</button>`}`;
  document
    .getElementById("print-bill")
    .addEventListener("click", () => window.print());
  const payBtn = document.getElementById("mark-paid");
  if (payBtn) payBtn.addEventListener("click", () => markPaid(b.ref));
}

async function markPaid(ref) {
  const b = getBooking(ref);
  const due = b.bill.amountDue;
  const ok = await confirmDialog({
    title: `Mark ${b.ref} as paid?`,
    message:
      due >= 0
        ? `Confirm that <strong>${formatMoney(due)}</strong> has been charged to the customer's ${b.card.type} ending ${b.card.last4} (deposit of ${formatMoney(b.bill.deposit)} already applied).`
        : `Confirm that <strong>${formatMoney(-due)}</strong> of the deposit has been refunded to the customer's ${b.card.type} ending ${b.card.last4}.`,
    confirmText: "Mark as paid"
  });
  if (!ok) return;
  const bill = Object.assign({}, b.bill, {
    paid: true,
    paidAt: localDateTime(new Date()),
    paidBy: `${b.card.type} ending ${b.card.last4} (processed by ${billStaff.name})`
  });
  updateBooking(
    ref,
    { bill, status: "completed" },
    `Bill marked as paid by ${billStaff.name}.`
  );
  showToast(`${b.ref} marked as paid.`);
  renderBill(ref);
}

document.addEventListener("DOMContentLoaded", () => {
  billStaff = requireRole("staff");
  if (!billStaff) return;
  const ref = getQueryParam("ref");
  if (ref) {
    renderBill(ref.toUpperCase());
    return;
  }

  renderBillList();
  const tabs = document.getElementById("bill-tabs");
  tabs.addEventListener("click", e => {
    const t = e.target.closest(".dash-tab");
    if (t) {
      billFilter = t.dataset.filter;
      renderBillList();
    }
  });
  tabs.addEventListener("keydown", e => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const order = ["due", "paid", "all"];
    billFilter =
      order[(order.indexOf(billFilter) + (e.key === "ArrowRight" ? 1 : 2)) % 3];
    renderBillList();
    document.getElementById("bt-" + billFilter).focus();
  });
});
