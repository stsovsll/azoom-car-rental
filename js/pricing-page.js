function renderPricingTables() {
  const $ = id => document.getElementById(id);

  $("rate-rows").innerHTML = CARS.slice()
    .sort((a, b) => a.daily - b.daily)
    .map(c => {
      const r = getRates(c);
      return `<tr>
      <td><strong>${carName(c)}</strong> <span class="small text-muted">${c.type}</span></td>
      <td>${c.seats}</td>
      <td class="num">${formatMoney(r.daily)}</td>
      <td class="num">${formatMoney(r.weekly)}</td>
      <td class="num">${formatMoney(r.monthly)}</td>
      <td class="num"><span class="badge badge-success">Save ${formatMoney(c.daily * POLICY.monthDays - r.monthly)}</span></td>
    </tr>`;
    })
    .join("");

  $("p-deposit").textContent = formatMoney(POLICY.deposit);
  $("p-modify").textContent = POLICY.modifyCutoffHours;

  $("extras-list").innerHTML = EXTRAS.map(
    x =>
      `<li><span>${icon(x.icon)} ${x.name}</span><span>${formatMoney(x.perDay)}/day</span></li>`
  ).join("");

  $("insurance-rows").innerHTML = INSURANCE.map(
    t => `<tr>
      <td><strong>${t.name}</strong><br><span class="small text-muted">${t.desc}</span></td>
      <td class="num">${t.perDay ? formatMoney(t.perDay) : "Included"}</td>
      <td class="num">${formatMoney(t.excess)}</td>
    </tr>`
  ).join("");

  $("late-policy").innerHTML = `
    <li>Cars are due back by 11:59 pm on the return date.</li>
    <li>${POLICY.lateGraceMins}-minute grace period: no charge.</li>
    <li>After that, ${formatMoney(POLICY.lateFeePerHour)} for every started hour.</li>
    <li>Capped at ${POLICY.lateFeeCapFactor}× the car's daily rate for each 24 hours late.</li>
    <li>Tell us early if you'll be late and we'll try to extend your booking instead.</li>`;

  $("battery-policy").innerHTML = `
    <li>Cars are handed over fully charged (90–100%).</li>
    <li>Return with at least ${POLICY.lowBatteryThreshold}% battery.</li>
    <li>Below ${POLICY.lowBatteryThreshold}%, a ${formatMoney(POLICY.lowBatteryFee)} recharging fee applies.</li>
    <li>Most return car parks have EV chargers you can use before returning.</li>`;

  $("damage-rows").innerHTML = DAMAGE_TYPES.map(
    d =>
      `<tr><td>${d.name}</td>${d.charges.map(c => `<td class="num">${formatMoney(c)}</td>`).join("")}</tr>`
  ).join("");

  $("cancel-rows").innerHTML = `
    <tr><td>More than ${POLICY.freeCancelHours} hours before pick-up</td><td><span class="badge badge-success">Free</span> full deposit released</td></tr>
    <tr><td>${POLICY.freeCancelHours} hours or less before pick-up</td><td>One day's rental for the booked car</td></tr>
    <tr><td>No-show (not collected on the pick-up day)</td><td>One day's rental for the booked car</td></tr>`;
}

function setupPriceCheck() {
  const carSel = document.getElementById("pc-car");
  const daysInput = document.getElementById("pc-days");
  carSel.innerHTML = CARS.map(
    c =>
      `<option value="${c.id}">${carName(c)} (${formatMoney(c.daily)}/day)</option>`
  ).join("");

  function update() {
    const days = Math.min(
      90,
      Math.max(1, Math.round(Number(daysInput.value) || 1))
    );
    const car = getCar(carSel.value);
    const combo = cheapestCombination(days, car.daily);
    document.getElementById("pc-total").textContent = formatMoney(combo.cost);
    document.getElementById("pc-lines").innerHTML =
      combo.lines
        .map(
          l =>
            `<li><span>${l.label}</span><span>${formatMoney(l.amount)}</span></li>`
        )
        .join("") +
      (combo.saving > 0
        ? `<li class="discount"><span>You save vs. ${plural(days, "day")} at the daily rate</span><span>−${formatMoney(combo.saving)}</span></li>`
        : "");
  }
  carSel.addEventListener("change", update);
  daysInput.addEventListener("input", update);
  update();
}

document.addEventListener("DOMContentLoaded", () => {
  renderPricingTables();
  setupPriceCheck();
});
