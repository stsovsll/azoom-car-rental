function fillTerms() {
  const values = {
    minAge: POLICY.minAge,
    licenceYears: plural(POLICY.minLicenceYears, "year"),
    maxDays: POLICY.maxRentalDays,
    weeklyRate: POLICY.weeklyMultiplier,
    monthlyRate: POLICY.monthlyMultiplier,
    extrasDays: POLICY.extrasCapDays,
    deposit: formatMoney(POLICY.deposit),
    returnBy: formatDateTime(`2026-01-01T${POLICY.returnByTime}`)
      .split(", ")
      .pop(),
    graceMins: POLICY.lateGraceMins,
    lateFee: formatMoney(POLICY.lateFeePerHour),
    lateCap: POLICY.lateFeeCapFactor,
    batteryLevel: POLICY.lowBatteryThreshold,
    batteryFee: formatMoney(POLICY.lowBatteryFee),
    modifyHours: POLICY.modifyCutoffHours,
    cancelHours: POLICY.freeCancelHours
  };

  document.querySelectorAll("[data-policy]").forEach(el => {
    el.textContent = values[el.dataset.policy];
  });

  document.getElementById("terms-insurance").innerHTML = INSURANCE.map(
    t =>
      `<li>${t.name}: ${t.perDay ? `${formatMoney(t.perDay)} per day` : "included"}, ${t.excess ? `you pay up to ${formatMoney(t.excess)}` : "you pay nothing"} for damage.</li>`
  ).join("");
}

document.addEventListener("DOMContentLoaded", fillTerms);
