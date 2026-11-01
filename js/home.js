function setupQuickSearch() {
  const form = document.getElementById("quick-search");
  const branch = form.elements.branch;
  const pickup = form.elements.pickup;
  const ret = form.elements["return"];
  const periodBox = document.getElementById("qs-period");

  branch.innerHTML = BRANCHES.map(
    b => `<option value="${b.id}">${b.name}</option>`
  ).join("");

  pickup.min = localDate(new Date());
  pickup.value = localDate(addDays(new Date(), 1));
  ret.value = localDate(addDays(new Date(), 8));

  const showPeriod = () => {
    const days =
      pickup.value && ret.value
        ? rentalDays(
            `${pickup.value}T00:00`,
            `${ret.value}T${POLICY.returnByTime}`
          )
        : 0;
    periodBox.innerHTML = days
      ? `${plural(days, "day")} <span class="small">· ${periodLabel(days)}</span>`
      : '<span class="small">Choose your dates</span>';
  };

  let lengthDays = 7;
  pickup.addEventListener("change", () => {
    if (pickup.value)
      ret.value = localDate(addDays(parseLocal(pickup.value), lengthDays));
    showPeriod();
  });
  ret.addEventListener("change", () => {
    if (pickup.value && ret.value >= pickup.value)
      lengthDays = Math.round(
        (parseLocal(ret.value) - parseLocal(pickup.value)) / 86400000
      );
    showPeriod();
  });
  showPeriod();

  const validate = setupForm(form, {
    pickup: v => {
      if (!v) return "Choose a pick-up date.";
      if (v < localDate(new Date())) return "Pick-up can’t be in the past.";
      return "";
    },
    return: v => {
      if (!v) return "Choose a return date.";
      if (pickup.value && v < pickup.value)
        return "Return can’t be before pick-up.";
      const days = (parseLocal(v) - parseLocal(pickup.value)) / 86400000;
      if (days > POLICY.maxRentalDays)
        return `Rentals can be up to ${POLICY.maxRentalDays} days.`;
      return "";
    }
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!validate()) return;
    const params = new URLSearchParams({
      branch: branch.value,
      pickup: pickup.value,
      return: ret.value
    });
    location.href = "booking.html?" + params.toString();
  });
}

function renderFeatured() {
  document.getElementById("featured-cars").innerHTML = CARS.filter(
    c => c.featured
  )
    .map(c => carCardHTML(c))
    .join("");
}

function renderReviews() {
  const stars = rating =>
    `<span class="stars" role="img" aria-label="${rating} out of 5 stars">${"★".repeat(rating)}<span class="star-off">${"★".repeat(5 - rating)}</span></span>`;

  const average =
    REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length;
  document.getElementById("reviews-summary").innerHTML =
    `${stars(Math.round(average))} <strong>${average.toFixed(1)} out of 5</strong> from ${REVIEWS.length} recent rentals`;

  const card = r => {
    const initials = r.name
      .split(" ")
      .map(word => word[0])
      .join("")
      .slice(0, 2);
    const month = addDays(new Date(), -r.daysAgo).toLocaleDateString("en-SG", {
      month: "short",
      year: "numeric"
    });
    return `
      <article class="card review-card">
        <div class="card-body">
          ${stars(r.rating)}
          <blockquote class="review-text"><p>“${escapeHtml(r.text)}”</p></blockquote>
          <div class="review-author">
            <span class="avatar" aria-hidden="true">${initials}</span>
            <div>
              <strong>${escapeHtml(r.name)}</strong>
              <div class="small text-muted">${carName(getCar(r.carId))} · ${getBranch(r.branchId).name} · ${month}</div>
            </div>
          </div>
        </div>
      </article>`;
  };

  const half = Math.ceil(REVIEWS.length / 2);
  const orders = [REVIEWS, REVIEWS.slice(half).concat(REVIEWS.slice(0, half))];
  document
    .querySelectorAll("#review-list .marquee-track")
    .forEach((track, i) => {
      const cards = orders[i].map(card).join("");
      track.innerHTML = `<div class="marquee-group">${cards}</div><div class="marquee-group" aria-hidden="true">${cards}</div>`;
    });
  document
    .querySelectorAll("#review-list .marquee")[1]
    .setAttribute("aria-hidden", "true");
}

function setupHowItWorks() {
  const section = document.getElementById("how");
  const steps = [...section.querySelectorAll(".how-step")];
  const current = document.getElementById("how-current");
  let active = null;

  const update = () => {
    const middle = window.innerHeight / 2;
    let step = steps[0];
    steps.forEach(s => {
      if (s.getBoundingClientRect().top <= middle) step = s;
    });
    if (step === active) return;
    active = step;
    steps.forEach(s => s.classList.toggle("is-active", s === step));
    section.dataset.tone = step.dataset.tone;
    current.textContent = steps.indexOf(step) + 1;
  };

  section.classList.add("how-enhanced");
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

document.addEventListener("DOMContentLoaded", () => {
  setupQuickSearch();
  renderFeatured();
  renderReviews();
  setupHowItWorks();
});
