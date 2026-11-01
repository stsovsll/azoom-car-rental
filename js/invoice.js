let viewer = null;

function renderInvoice(b) {
  const isBill = !!b.bill;
  const branch = getBranch(b.branchId);
  document.title = `${isBill ? "Invoice" : "Booking summary"} ${b.ref} – AZoom`;

  document.getElementById("invoice").innerHTML = `
    <div class="invoice-head">
      <div>
        <div class="logo">${LOGO_HTML}</div>
        <p class="small text-muted mt-1 mb-0">AZoom Car Rental Pte Ltd (fictional)<br>${branch.address}<br>${branch.phone} · ${branch.email}</p>
      </div>
      <div class="invoice-meta">
        <h1 class="h3 mb-1">${isBill ? "Tax invoice" : "Booking summary"}</h1>
        <div>Reference <strong>${b.ref}</strong></div>
        <div>${isBill ? "Issued" : "Booked"} ${formatDate(isBill ? b.bill.generatedAt : b.createdAt)}</div>
        <div class="mt-1">${statusBadge(b.status)}</div>
        ${isBill && b.bill.paid ? `<div class="mt-2"><span class="paid-stamp">PAID</span></div>` : ""}
      </div>
    </div>
    ${
      isBill
        ? `
      <div class="invoice-parties">
        <div><strong>Billed to</strong><br>${escapeHtml(b.driver.name)}<br>${escapeHtml(b.driver.email)}<br>${escapeHtml(b.driver.phone)}</div>
        <div><strong>Rental</strong><br>${carName(getCar(b.carId))} · ${b.plate}<br>${formatDateTime(b.pickupAt)} –<br>${formatDateTime(b.returned ? b.returned.at : b.returnAt)}</div>
      </div>
      ${billTableHTML(b)}
      ${b.bill.paid ? `<p class="mt-2 small">Settled ${formatDateTime(b.bill.paidAt)} · ${escapeHtml(b.bill.paidBy)}</p>` : ""}
      ${inspectionHTML(b)}`
        : bookingSummaryHTML(b)
    }
    <p class="small text-muted mt-3 mb-0">This is a simulated document for a school project. No real payment has been taken.</p>`;

  renderPayBox(b);
}

function renderPayBox(b) {
  const box = document.getElementById("pay-box");
  box.innerHTML = "";
  if (!b.bill || b.bill.paid || viewer.role !== "customer") return;
  const due = b.bill.amountDue;
  box.innerHTML = `
    <div class="panel mb-2 flex flex-wrap between">
      <div>
        <strong>${due > 0 ? `Amount due: ${formatMoney(due)}` : `Refund due to you: ${formatMoney(-due)}`}</strong>
        <p class="small text-muted mb-0">${due > 0 ? "Paid" : "Refunded"} using your saved ${b.card.type} ending ${b.card.last4} (the card used to book).</p>
      </div>
      <button type="button" class="btn btn-primary" id="pay-now">${icon("card")} ${due > 0 ? `Pay ${formatMoney(due)} now` : "Accept bill and get refund"}</button>
    </div>`;
  document
    .getElementById("pay-now")
    .addEventListener("click", () => payNow(b.ref));
}

async function payNow(ref) {
  const b = getBooking(ref);
  const due = b.bill.amountDue;
  const ok = await confirmDialog({
    title: due > 0 ? "Confirm payment" : "Confirm bill",
    message:
      due > 0
        ? `Charge <strong>${formatMoney(due)}</strong> to your ${b.card.type} ending ${b.card.last4}? Your ${formatMoney(POLICY.deposit)} deposit has already been applied.`
        : `Accept this bill? <strong>${formatMoney(-due)}</strong> of your deposit will be refunded to your ${b.card.type} ending ${b.card.last4}.`,
    confirmText: due > 0 ? `Pay ${formatMoney(due)}` : "Accept"
  });
  if (!ok) return;

  const btn = document.getElementById("pay-now");
  btn.disabled = true;
  btn.textContent = "Processing…";
  setTimeout(() => {
    const bill = Object.assign({}, b.bill, {
      paid: true,
      paidAt: localDateTime(new Date()),
      paidBy: `${b.card.type} ending ${b.card.last4} (customer, online)`
    });
    const updated = updateBooking(
      ref,
      { bill, status: "completed" },
      due > 0
        ? `Final bill of ${formatMoney(due)} paid online.`
        : `Bill accepted. ${formatMoney(-due)} refunded to card.`
    );
    renderInvoice(updated);
    showToast(
      due > 0
        ? `Payment of ${formatMoney(due)} received. Thank you!`
        : `Refund of ${formatMoney(-due)} is on its way to your card.`
    );
  }, 1200);
}

document.addEventListener("DOMContentLoaded", () => {
  viewer = requireRole(null);
  if (!viewer) return;
  const b = getBooking(getQueryParam("ref"));
  if (viewer.role === "staff") {
    const back = document.getElementById("back-link");
    back.href = "billing.html";
    back.innerHTML = `${icon("arrow-left")} Back to billing`;
  }
  if (!b || (viewer.role === "customer" && b.userEmail !== viewer.email)) {
    document.getElementById("invoice").innerHTML =
      `<div class="empty-state">${icon("search")}<p><strong>Booking not found.</strong></p><p class="mb-0">Check the reference or go to <a href="my-bookings.html">My bookings</a>.</p></div>`;
    document.getElementById("print-btn").hidden = true;
    return;
  }
  renderInvoice(b);
  document
    .getElementById("print-btn")
    .addEventListener("click", () => window.print());
});
