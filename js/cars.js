function carCardHTML(car, showCompare = false) {
  const r = getRates(car);
  return `
    <article class="card card-hover car-card" data-car="${car.id}">
      <div class="car-media">
        <span class="badge badge-accent">${icon("bolt")} ${car.tag}</span>
        <img src="${carImage(car.id)}" alt="${carName(car)} in ${car.colours[0][0].toLowerCase()}, side view" loading="lazy" width="496" height="210">
      </div>
      <div class="card-body">
        <div class="car-brand">${car.brand} · ${car.type}</div>
        <h3 class="card-title">${car.model}</h3>
        <div class="car-specs">
          <div class="car-spec">${icon("gauge")}<strong>${car.range} km</strong>Range</div>
          <div class="car-spec">${icon("users")}<strong>${car.seats}</strong>Seats</div>
          <div class="car-spec">${icon("bolt")}<strong>${car.dcMins} min</strong>10–80%</div>
        </div>
        <div class="rates" aria-label="Rates">
          <div class="rate"><small>Day</small><strong>${formatMoney(r.daily)}</strong></div>
          <div class="rate"><small>Week</small><strong>${formatMoney(r.weekly)}</strong></div>
          <div class="rate"><small>Month</small><strong>${formatMoney(r.monthly)}</strong></div>
        </div>
        ${showCompare ? `<label class="compare-check"><input type="checkbox" class="compare-box" value="${car.id}"> Compare</label>` : ""}
        <div class="car-actions">
          <button type="button" class="btn btn-outline btn-sm" data-details="${car.id}">Details</button>
          <a class="btn btn-primary btn-sm" href="booking.html?car=${car.id}">Book ${icon("arrow-right")}</a>
        </div>
      </div>
    </article>`;
}

function openCarDetails(carId) {
  const car = getCar(carId);
  if (!car) return;
  const r = getRates(car);
  const photos = car.colours
    .map((c, i) => ({
      src: carImage(car.id, i),
      alt: `${carName(car)} in ${c[0].toLowerCase()}`,
      label: c[0]
    }))
    .concat([
      {
        src: "images/gallery-interior.svg",
        alt: "Illustration of an EV interior with a central touchscreen",
        label: "Interior"
      },
      {
        src: "images/gallery-charging.svg",
        alt: "Illustration of the car at a DC fast charger",
        label: "Charging"
      }
    ]);

  const content = `
    <div class="grid grid-2" style="align-items:start">
      <div>
        <div class="gallery-main"><img id="gallery-main" src="${photos[0].src}" alt="${photos[0].alt}"></div>
        <p class="small text-muted mt-1 mb-1" id="gallery-caption">${photos[0].label}</p>
        <div class="gallery-thumbs" role="group" aria-label="Choose a photo">
          ${photos.map((p, i) => `<button type="button" data-index="${i}" aria-label="Show ${p.label}" aria-current="${i === 0}"><img src="${p.src}" alt=""></button>`).join("")}
        </div>
      </div>
      <div>
        <div class="car-brand">${car.brand} · ${car.type}</div>
        <p class="mt-1">${car.description}</p>
        <ul class="spec-list">
          <li><span>Range (WLTP)</span><span>${car.range} km</span></li>
          <li><span>Seats</span><span>${car.seats}</span></li>
          <li><span>Battery</span><span>${car.battery} kWh</span></li>
          <li><span>DC fast charge</span><span>${car.dcMins} min (10–80%)</span></li>
          <li><span>AC charge (full)</span><span>~${car.acHours} h</span></li>
          <li><span>0–100 km/h</span><span>${car.acceleration} s</span></li>
          <li><span>Boot space</span><span>${car.boot} L</span></li>
          <li><span>Colours</span><span>${car.colours.length}</span></li>
        </ul>
        <h3 class="h4">Highlights</h3>
        <div class="flex flex-wrap">${car.features.map(f => `<span class="badge">${icon("check")} ${f}</span>`).join("")}</div>
        <div class="rates mt-3">
          <div class="rate"><small>Day</small><strong>${formatMoney(r.daily)}</strong></div>
          <div class="rate"><small>Week</small><strong>${formatMoney(r.weekly)}</strong></div>
          <div class="rate"><small>Month</small><strong>${formatMoney(r.monthly)}</strong></div>
        </div>
      </div>
    </div>`;

  const modal = openModal({
    title: carName(car),
    content,
    size: "lg",
    buttons: [
      { text: "Close", className: "btn-outline" },
      {
        text: `Book the ${car.model}`,
        className: "btn-primary",
        onClick: () => {
          location.href = `booking.html?car=${car.id}`;
        }
      }
    ]
  });

  const main = modal.el.querySelector("#gallery-main");
  const caption = modal.el.querySelector("#gallery-caption");
  const thumbs = [...modal.el.querySelectorAll(".gallery-thumbs button")];
  const show = i => {
    main.src = photos[i].src;
    main.alt = photos[i].alt;
    caption.textContent = photos[i].label;
    thumbs.forEach((t, j) => t.setAttribute("aria-current", i === j));
  };
  thumbs.forEach((t, i) => {
    t.addEventListener("click", () => show(i));
    t.addEventListener("keydown", e => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const next =
          (i + (e.key === "ArrowRight" ? 1 : -1) + thumbs.length) %
          thumbs.length;
        thumbs[next].focus();
        show(next);
      }
    });
  });
}

document.addEventListener("click", e => {
  const btn = e.target.closest("[data-details]");
  if (btn) openCarDetails(btn.dataset.details);
});
