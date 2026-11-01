const FAQS = [
  {
    cat: "Booking",
    q: "Who can rent a car from AZoom?",
    a: `Drivers must be at least ${POLICY.minAge} years old and have held a valid driving licence for at least ${plural(POLICY.minLicenceYears, "year")}. The same rules apply to any additional driver.`
  },
  {
    cat: "Booking",
    q: "Can I book without an account?",
    a: "You need a free AZoom account so you can manage your booking, see your invoice and pay the final bill. Registration takes less than a minute."
  },
  {
    cat: "Booking",
    q: "Do I need to choose a daily, weekly or monthly rental?",
    a: "No. Just choose your pick-up and return dates. We automatically charge the cheapest mix of monthly (30 days for the price of 22), weekly (7 days for the price of 6) and daily rates. For example, 9 days is charged as 1 week + 2 days."
  },
  {
    cat: "Booking",
    q: "Can I change or cancel my booking?",
    a: `Yes. Go to My bookings. You can change dates, extras, insurance or return car park up to ${POLICY.modifyCutoffHours} hours before pick-up. Cancelling is free more than ${POLICY.freeCancelHours} hours before pick-up. After that, one day's rental is charged.`
  },
  {
    cat: "Payment",
    q: "Which payment methods do you accept?",
    a: "Credit cards only: Visa, Mastercard and American Express. We do not accept debit or prepaid cards, cash or e-wallets, because a deposit must be held on a credit card. If you enter a debit or prepaid card, the booking form will tell you straight away."
  },
  {
    cat: "Payment",
    q: "How does the deposit work?",
    a: `A refundable ${formatMoney(POLICY.deposit)} deposit is held on your card when you reserve. After the car is inspected, it is used towards your final bill and anything left over is refunded to your card.`
  },
  {
    cat: "Payment",
    q: "When do I pay for the rental?",
    a: "Your card is verified and the deposit is held when you reserve. The rental, extras and any fees are charged on the final bill after the car is returned and inspected."
  },
  {
    cat: "Pick-up and return",
    q: "What do I need to bring when I pick up the car?",
    a: "Bring your physical driving licence, NRIC or passport, and the same credit card you used to book. Our staff will check them, note the mileage and battery level, and hand you the key card."
  },
  {
    cat: "Pick-up and return",
    q: "Where do I return the car?",
    a: 'Return it to the designated AZoom car park you chose when booking. See the <a href="branches.html">Branches page</a> for the full list. You don\'t need to come back to the office. Before you leave, confirm the return in My bookings and add a photo of the car.'
  },
  {
    cat: "Pick-up and return",
    q: "What happens if I return the car late?",
    a: `Cars are due back by 11:59 pm on your return date, so you don't need to choose a return time. There is a ${POLICY.lateGraceMins}-minute grace period. After that we charge ${formatMoney(POLICY.lateFeePerHour)} per started hour, capped at ${POLICY.lateFeeCapFactor}× the daily rate per 24 hours.`
  },
  {
    cat: "Pick-up and return",
    q: "What happens after I return the car?",
    a: "An AZoom employee inspects the car for new damage (front, rear, sides, interior and tyres) and records the battery level. You then receive your final bill in My bookings and can pay it with your saved card."
  },
  {
    cat: "Charging",
    q: "How do I charge the car?",
    a: "All our cars work with public Type 2 AC chargers and CCS2 DC fast chargers found at malls, HDB car parks and petrol stations. Most of our return car parks also have chargers. You can add a portable 3-pin charger as an extra."
  },
  {
    cat: "Charging",
    q: "How much battery should I return the car with?",
    a: `At least ${POLICY.lowBatteryThreshold}%. If the battery is lower, a ${formatMoney(POLICY.lowBatteryFee)} recharging fee is added to your bill.`
  },
  {
    cat: "Charging",
    q: "How far can I drive on a full charge?",
    a: "Between about 420 km and 570 km depending on the model. That's enough for several days of normal driving in Singapore. Each car's range is shown on the <a href=\"fleet.html\">Fleet page</a>."
  },
  {
    cat: "Damage and insurance",
    q: "What if the car gets damaged?",
    a: 'Report it to us straight away. After you return the car, damage is charged using our <a href="pricing.html#damage">damage charge schedule</a>, up to the excess of your insurance tier.'
  },
  {
    cat: "Damage and insurance",
    q: "Should I upgrade my insurance?",
    a: "Basic cover is included, but you could pay up to S$3,000 for damage. Standard reduces this to S$1,000 and Premium to S$0, so you won't pay anything for damage."
  }
];

let activeCat = "All";

function renderCategories() {
  const cats = ["All", ...new Set(FAQS.map(f => f.cat))];
  const holder = document.getElementById("faq-cats");
  holder.innerHTML = cats
    .map(
      c =>
        `<button type="button" class="chip" aria-pressed="${c === activeCat}" data-cat="${c}">${c}</button>`
    )
    .join("");
  holder.addEventListener("click", e => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    activeCat = btn.dataset.cat;
    holder
      .querySelectorAll(".chip")
      .forEach(c => c.setAttribute("aria-pressed", c === btn));
    renderFaqs();
  });
}

function renderFaqs() {
  const term = document.getElementById("faq-search").value.trim().toLowerCase();
  const list = FAQS.filter(
    f =>
      (activeCat === "All" || f.cat === activeCat) &&
      (!term || (f.q + " " + f.a).toLowerCase().includes(term))
  );

  document.getElementById("faq-list").innerHTML = list
    .map(
      (f, i) => `
    <div class="accordion-item">
      <h2 class="mb-0" style="font-size:inherit">
        <button type="button" class="accordion-trigger" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}">
          <span>${f.q}</span>${icon("chevron-down")}
        </button>
      </h2>
      <div class="accordion-panel" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}" hidden><p>${f.a}</p></div>
    </div>`
    )
    .join("");

  document.getElementById("faq-list").hidden = list.length === 0;
  document.getElementById("faq-empty").hidden = list.length > 0;
}

function toggleFaq(trigger) {
  const open = trigger.getAttribute("aria-expanded") === "true";
  document
    .querySelectorAll('.accordion-trigger[aria-expanded="true"]')
    .forEach(t => {
      t.setAttribute("aria-expanded", "false");
      document.getElementById(t.getAttribute("aria-controls")).hidden = true;
    });
  if (!open) {
    trigger.setAttribute("aria-expanded", "true");
    document.getElementById(trigger.getAttribute("aria-controls")).hidden =
      false;
  }
}

function faqKeys(e) {
  const triggers = [...document.querySelectorAll(".accordion-trigger")];
  const i = triggers.indexOf(document.activeElement);
  if (i === -1) return;
  const moves = {
    ArrowDown: i + 1,
    ArrowUp: i - 1,
    Home: 0,
    End: triggers.length - 1
  };
  if (e.key in moves) {
    e.preventDefault();
    triggers[(moves[e.key] + triggers.length) % triggers.length].focus();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderFaqs();
  const list = document.getElementById("faq-list");
  list.addEventListener("click", e => {
    const trigger = e.target.closest(".accordion-trigger");
    if (trigger) toggleFaq(trigger);
  });
  list.addEventListener("keydown", faqKeys);
  document.getElementById("faq-search").addEventListener("input", renderFaqs);
});
