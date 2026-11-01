function statusBadge(status) {
  return `<span class="badge status-${status}">${BOOKING_STATUS[status] || status}</span>`;
}

function quoteLinesHTML(quote, { showDeposit = true } = {}) {
  if (!quote)
    return '<p class="text-muted small mb-0">Choose your dates and car to see the price.</p>';
  const li = (label, amount, cls = "") =>
    `<li class="${cls}"><span>${label}</span><span>${amount}</span></li>`;
  let html = li(
    `<strong>Rental (${plural(quote.days, "day")})</strong>`,
    formatMoney(quote.rental)
  );
  html += quote.combo.lines
    .map(l => li(l.label, formatMoney(l.amount), "sub"))
    .join("");
  if (quote.combo.saving > 0)
    html += li(
      "Long-rental saving",
      "−" + formatMoney(quote.combo.saving),
      "sub discount"
    );
  html += quote.extrasLines
    .map(l => li(l.label, formatMoney(l.amount)))
    .join("");
  html += li(
    quote.insurance.label,
    quote.insurance.amount ? formatMoney(quote.insurance.amount) : "Included"
  );
  html += li("Estimated total", formatMoney(quote.total), "total");
  if (showDeposit)
    html += li(
      `Refundable deposit held on card`,
      formatMoney(quote.deposit),
      "sub"
    );
  return `<ul class="line-items">${html}</ul>`;
}

function bookingSummaryHTML(b) {
  const car = getCar(b.carId);
  const branch = getBranch(b.branchId);
  const carpark = getCarpark(b.returnCarparkId);
  const extras =
    EXTRAS.filter(x => b.extras[x.id])
      .map(x => x.name)
      .join(", ") || "None";
  return `
    <div class="grid grid-2">
      <div>
        <div class="summary-car">
          <img src="${carImage(car.id)}" alt="${carName(car)}">
          <div><div class="car-brand">${car.brand} · ${car.type}</div><strong>${carName(car)}</strong>${b.plate ? `<div class="small text-muted">Plate ${b.plate}</div>` : ""}</div>
        </div>
        <ul class="info-list small">
          <li>${icon("pin")}<span><strong>Pick-up:</strong> AZoom ${branch.name}<br>${formatDateTime(b.pickupAt)}<br><span class="text-muted">${branch.address}</span></span></li>
          <li>${icon("parking")}<span><strong>Return:</strong> ${carpark.name}<br>${formatDateTime(b.returnAt)}<br><span class="text-muted">${carpark.lots}</span></span></li>
          <li>${icon("user")}<span><strong>Driver:</strong> ${escapeHtml(b.driver.name)} · Licence ${escapeHtml(b.driver.licenceNo)}<br><span class="text-muted">${escapeHtml(b.driver.email)} · ${escapeHtml(b.driver.phone)}</span></span></li>
          <li>${icon("card")}<span><strong>Card:</strong> ${b.card.type} ending ${b.card.last4} (exp ${b.card.expiry})</span></li>
          <li>${icon("plus")}<span><strong>Extras:</strong> ${extras}</span></li>
        </ul>
      </div>
      <div>
        <h3 class="h4">Price summary</h3>
        ${quoteLinesHTML(b.quote)}
        <p class="small text-muted mt-2 mb-0">The rental is charged on your final bill after the car is returned and inspected. Damages, late fees and low-battery fees may be added. <a href="pricing.html">See policies</a>.</p>
      </div>
    </div>`;
}

function inspectionHTML(b) {
  const i = b.inspection;
  if (!i) return "";
  const photos = [];
  Object.entries(i.areas).forEach(([areaId, a]) =>
    (a.photos || []).forEach(src =>
      photos.push({
        src,
        area: INSPECTION_AREAS.find(x => x.id === areaId).name
      })
    )
  );
  const out = b.checkout || {};
  return `
    <h3 class="h4 mt-3">Inspection</h3>
    <ul class="spec-list">
      <li><span>Inspected</span><span>${formatDateTime(i.at)}</span></li>
      <li><span>By</span><span>${escapeHtml(i.staff)}</span></li>
      <li><span>Mileage out → in</span><span>${out.mileage ? out.mileage.toLocaleString() : "–"} → ${i.mileage.toLocaleString()} km</span></li>
      <li><span>Distance driven</span><span>${out.mileage ? (i.mileage - out.mileage).toLocaleString() + " km" : "–"}</span></li>
      <li><span>Battery out → in</span><span>${out.battery ?? "–"}% → ${i.battery}%</span></li>
      <li><span>Returned to</span><span>${b.returned ? getCarpark(b.returned.carparkId).name : "–"}</span></li>
    </ul>
    ${i.notes ? `<p class="small"><strong>Notes:</strong> ${escapeHtml(i.notes)}</p>` : ""}
    ${photos.length ? `<div class="photo-previews">${photos.map(p => `<figure><img src="${p.src}" alt="Damage photo – ${p.area}"></figure>`).join("")}</div>` : ""}`;
}

function billTableHTML(b) {
  const bill = b.bill;
  const row = (label, amount, cls = "") =>
    `<tr class="${cls}"><td>${label}</td><td class="num">${amount}</td></tr>`;
  let rows = "";
  rows += row(
    `<strong>Rental – ${carName(getCar(b.carId))} (${plural(b.quote.days, "day")})</strong>`,
    formatMoney(bill.rental)
  );
  rows += bill.rentalLines
    .map(l =>
      row(
        `<span class="text-muted">&nbsp;&nbsp;${l.label}</span>`,
        `<span class="text-muted">${formatMoney(l.amount)}</span>`
      )
    )
    .join("");
  rows += bill.extrasLines
    .map(l => row(l.label, formatMoney(l.amount)))
    .join("");
  rows += row(
    bill.insurance.label,
    bill.insurance.amount ? formatMoney(bill.insurance.amount) : formatMoney(0)
  );

  if (bill.damages.length) {
    rows += bill.damages
      .map(d =>
        row(
          `Damage – ${d.area}: ${d.type} (${d.severity})`,
          formatMoney(d.amount)
        )
      )
      .join("");
    if (bill.damagesWaived > 0)
      rows += row(
        `Covered by ${bill.insurance.label.split(" ")[0]} insurance (excess ${formatMoney(bill.insurance.excess)})`,
        "−" + formatMoney(bill.damagesWaived),
        "text-muted"
      );
  } else {
    rows += row("Damage found at inspection", "None");
  }

  rows += row(
    bill.late.fee
      ? `Late return fee – ${Math.floor(bill.late.minutesLate / 60)} h ${bill.late.minutesLate % 60} min late (${plural(bill.late.hours, "hour")} charged)`
      : "Late return fee – returned on time",
    formatMoney(bill.late.fee)
  );
  rows += row(
    bill.lowBattery
      ? `Low battery fee – returned at ${bill.battery}% (below ${POLICY.lowBatteryThreshold}%)`
      : `Battery on return: ${bill.battery}%`,
    formatMoney(bill.lowBattery)
  );

  return `
    <div class="table-wrap">
      <table class="table">
        <caption class="sr-only">Final bill for booking ${b.ref}</caption>
        <thead><tr><th scope="col">Item</th><th scope="col" class="num">Amount</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td>Subtotal</td><td class="num">${formatMoney(bill.subtotal)}</td></tr>
          <tr><td>Less deposit already held</td><td class="num">−${formatMoney(bill.deposit)}</td></tr>
          <tr><td class="invoice-total">${bill.amountDue >= 0 ? "Amount due" : "Refund to your card"}</td><td class="num invoice-total">${formatMoney(Math.abs(bill.amountDue))}</td></tr>
        </tfoot>
      </table>
    </div>`;
}
