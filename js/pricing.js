function getRates(car) {
  return {
    daily: car.daily,
    weekly: car.daily * POLICY.weeklyMultiplier,
    monthly: car.daily * POLICY.monthlyMultiplier
  };
}

function rentalDays(pickupAt, returnAt) {
  if (!(parseLocal(returnAt) > parseLocal(pickupAt))) return 0;
  const pickupDay = parseLocal(pickupAt.slice(0, 10));
  const returnDay = parseLocal(returnAt.slice(0, 10));
  const days = Math.round((returnDay - pickupDay) / (24 * 60 * 60 * 1000));
  return Math.max(1, days);
}

function cheapestCombination(days, daily) {
  const rates = {
    daily,
    weekly: daily * POLICY.weeklyMultiplier,
    monthly: daily * POLICY.monthlyMultiplier
  };
  let best = null;
  const maxMonths = Math.ceil(days / POLICY.monthDays);
  for (let m = 0; m <= maxMonths; m++) {
    const afterMonths = Math.max(0, days - m * POLICY.monthDays);
    const maxWeeks = Math.ceil(afterMonths / POLICY.weekDays);
    for (let w = 0; w <= maxWeeks; w++) {
      const d = Math.max(0, afterMonths - w * POLICY.weekDays);
      const cost = m * rates.monthly + w * rates.weekly + d * rates.daily;
      if (best === null || cost < best.cost)
        best = { months: m, weeks: w, days: d, cost };
    }
  }
  best.lines = [];
  if (best.months)
    best.lines.push({
      label: `${plural(best.months, "month")} × ${formatMoney(rates.monthly)}`,
      amount: best.months * rates.monthly
    });
  if (best.weeks)
    best.lines.push({
      label: `${plural(best.weeks, "week")} × ${formatMoney(rates.weekly)}`,
      amount: best.weeks * rates.weekly
    });
  if (best.days)
    best.lines.push({
      label: `${plural(best.days, "day")} × ${formatMoney(rates.daily)}`,
      amount: best.days * rates.daily
    });
  best.standardCost = days * daily;
  best.saving = best.standardCost - best.cost;
  return best;
}

function periodLabel(days) {
  const c = cheapestCombination(days, 1);
  return [
    c.months && plural(c.months, "month"),
    c.weeks && plural(c.weeks, "week"),
    c.days && plural(c.days, "day")
  ]
    .filter(Boolean)
    .join(" + ");
}

function extrasCost(extras, days) {
  const chargeDays = Math.min(days, POLICY.extrasCapDays);
  const lines = EXTRAS.filter(x => extras && extras[x.id]).map(x => ({
    id: x.id,
    label: `${x.name} (${plural(chargeDays, "day")} × ${formatMoney(x.perDay)})`,
    amount: x.perDay * chargeDays
  }));
  return { lines, total: lines.reduce((sum, l) => sum + l.amount, 0) };
}

function insuranceCost(tierId, days) {
  const tier = INSURANCE.find(t => t.id === tierId) || INSURANCE[0];
  return {
    tier,
    amount: tier.perDay * days,
    label: `${tier.name} cover${tier.perDay ? ` (${plural(days, "day")} × ${formatMoney(tier.perDay)})` : " (included)"}`
  };
}

function calculateQuote(carId, pickupAt, returnAt, extras, insuranceId) {
  const car = getCar(carId);
  const days = rentalDays(pickupAt, returnAt);
  if (!car || !days) return null;
  const combo = cheapestCombination(days, car.daily);
  const ex = extrasCost(extras, days);
  const ins = insuranceCost(insuranceId, days);
  const total = combo.cost + ex.total + ins.amount;
  return {
    days,
    combo,
    rental: combo.cost,
    extrasLines: ex.lines,
    extrasTotal: ex.total,
    insurance: {
      id: ins.tier.id,
      label: ins.label,
      amount: ins.amount,
      excess: ins.tier.excess
    },
    total,
    deposit: POLICY.deposit
  };
}

function damageCharge(typeId, severityId) {
  const type = DAMAGE_TYPES.find(t => t.id === typeId);
  const idx = SEVERITIES.findIndex(s => s.id === severityId);
  return type && idx >= 0 ? type.charges[idx] : 0;
}

function lateFee(dueAt, returnedAt, daily) {
  const minutesLate = Math.round(
    (parseLocal(returnedAt) - parseLocal(dueAt)) / 60000
  );
  if (minutesLate <= POLICY.lateGraceMins)
    return { minutesLate: Math.max(0, minutesLate), hours: 0, fee: 0 };
  const hours = Math.ceil(minutesLate / 60);
  const cap = Math.ceil(hours / 24) * daily * POLICY.lateFeeCapFactor;
  return {
    minutesLate,
    hours,
    fee: Math.min(hours * POLICY.lateFeePerHour, cap)
  };
}

function calculateBill(booking) {
  const car = getCar(booking.carId);
  const quote = booking.quote;
  const insp = booking.inspection || { areas: {}, battery: 100 };

  const damages = [];
  INSPECTION_AREAS.forEach(area => {
    const a = insp.areas[area.id];
    if (a && !a.ok && a.type && a.severity) {
      const type = DAMAGE_TYPES.find(t => t.id === a.type);
      damages.push({
        area: area.name,
        type: type.name,
        severity: a.severity,
        amount: damageCharge(a.type, a.severity)
      });
    }
  });
  const damagesRaw = damages.reduce((s, d) => s + d.amount, 0);
  const excess = quote.insurance.excess;
  const damagesCharged = Math.min(damagesRaw, excess);

  const returnedAt = booking.returned ? booking.returned.at : booking.returnAt;
  const late = lateFee(booking.returnAt, returnedAt, car.daily);
  const lowBattery =
    insp.battery < POLICY.lowBatteryThreshold ? POLICY.lowBatteryFee : 0;

  const subtotal =
    quote.rental +
    quote.extrasTotal +
    quote.insurance.amount +
    damagesCharged +
    late.fee +
    lowBattery;
  return {
    rental: quote.rental,
    rentalLines: quote.combo.lines,
    extrasLines: quote.extrasLines,
    extrasTotal: quote.extrasTotal,
    insurance: quote.insurance,
    damages,
    damagesRaw,
    damagesCharged,
    damagesWaived: damagesRaw - damagesCharged,
    late,
    battery: insp.battery,
    lowBattery,
    subtotal,
    deposit: POLICY.deposit,
    amountDue: subtotal - POLICY.deposit,
    generatedAt: localDateTime(new Date()),
    paid: false
  };
}

function cancellationFee(booking) {
  const hoursToPickup = (parseLocal(booking.pickupAt) - new Date()) / 3600000;
  return hoursToPickup > POLICY.freeCancelHours
    ? 0
    : getCar(booking.carId).daily;
}
