const MAX_COMPARE = 3;
let compareList = [];

function setupFilters() {
  const brands = [...new Set(CARS.map(c => c.brand))];
  document.getElementById("brand-filters").innerHTML = brands
    .map(
      b =>
        `<label class="check"><input type="checkbox" name="brand" value="${b}"> ${b} <span class="text-muted small">(${CARS.filter(c => c.brand === b).length})</span></label>`
    )
    .join("");

  const price = document.getElementById("f-price");
  const prices = CARS.map(c => c.daily);
  price.min = Math.floor(Math.min(...prices) / 10) * 10;
  price.max = Math.ceil(Math.max(...prices) / 10) * 10;
  price.value = price.max;

  const form = document.getElementById("filters");
  form.addEventListener("input", renderCars);
  form.addEventListener("change", renderCars);
  document.getElementById("sort").addEventListener("change", renderCars);
  document.getElementById("clear-filters").addEventListener("click", () => {
    form.reset();
    price.value = price.max;
    renderCars();
  });
}

function readFilters() {
  const form = document.getElementById("filters");
  return {
    brands: [...form.querySelectorAll('input[name="brand"]:checked')].map(
      i => i.value
    ),
    seats: Number(form.elements.seats.value),
    maxPrice: Number(form.elements.price.value),
    minRange: Number(form.elements.range.value)
  };
}

function sortCars(list, how) {
  const sorters = {
    "price-asc": (a, b) => a.daily - b.daily,
    "price-desc": (a, b) => b.daily - a.daily,
    "range-desc": (a, b) => b.range - a.range,
    "charge-asc": (a, b) => a.dcMins - b.dcMins,
    "seats-desc": (a, b) => b.seats - a.seats || a.daily - b.daily,
    "name-asc": (a, b) => carName(a).localeCompare(carName(b))
  };
  return list.slice().sort(sorters[how]);
}

function renderCars() {
  const f = readFilters();
  document.getElementById("f-price-out").textContent =
    `${formatMoney(f.maxPrice)}/day`;
  document.getElementById("f-range-out").textContent = `${f.minRange} km+`;

  const matches = CARS.filter(
    c =>
      (!f.brands.length || f.brands.includes(c.brand)) &&
      c.seats >= f.seats &&
      c.daily <= f.maxPrice &&
      c.range >= f.minRange
  );
  const sorted = sortCars(matches, document.getElementById("sort").value);

  document.getElementById("result-count").textContent =
    `Showing ${sorted.length} of ${CARS.length} cars`;
  updateFilterSummary(sorted.length, f);
  const grid = document.getElementById("car-grid");
  grid.innerHTML = sorted.length
    ? sorted.map(c => carCardHTML(c, true)).join("")
    : `<div class="empty-state" style="grid-column:1/-1">${icon("search")}<p><strong>No cars match those filters.</strong></p><p class="mb-0">Try a higher price or a shorter range.</p></div>`;

  grid.querySelectorAll(".compare-box").forEach(box => {
    box.checked = compareList.includes(box.value);
  });
}

function updateFilterSummary(count, f) {
  const price = document.getElementById("f-price");
  const range = document.getElementById("f-range");
  const active =
    (f.brands.length ? 1 : 0) +
    (f.seats > 0 ? 1 : 0) +
    (f.maxPrice < Number(price.max) ? 1 : 0) +
    (f.minRange > Number(range.min) ? 1 : 0);

  const badge = document.getElementById("filter-count");
  badge.hidden = active === 0;
  badge.textContent = active;
  document.getElementById("filter-bar-count").textContent = plural(count, "car");
  document.getElementById("show-results").textContent = count
    ? `Show ${plural(count, "car")}`
    : "No cars match, change the filters";
}

function setupMobileFilters() {
  const panel = document.getElementById("filter-panel");
  const openBtn = document.getElementById("open-filters");
  const closeBtn = document.getElementById("close-filters");

  const isOpen = () => panel.classList.contains("is-open");

  const open = () => {
    panel.classList.add("is-open");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    document.body.classList.add("modal-open");
    openBtn.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  };

  const close = () => {
    if (!isOpen()) return;
    panel.classList.remove("is-open");
    panel.removeAttribute("role");
    panel.removeAttribute("aria-modal");
    document.body.classList.remove("modal-open");
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  };

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  document.getElementById("show-results").addEventListener("click", close);

  document.addEventListener("keydown", e => {
    if (!isOpen()) return;
    if (e.key === "Escape") close();
    if (e.key === "Tab") {
      const items = [
        ...panel.querySelectorAll("button, input, select")
      ].filter(el => !el.disabled && el.offsetParent !== null);
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) close();
  });
}

function onCompareTick(box) {
  if (box.checked) {
    if (compareList.length >= MAX_COMPARE) {
      box.checked = false;
      showToast(
        `You can compare up to ${MAX_COMPARE} cars. Untick one first.`,
        "warning"
      );
      return;
    }
    compareList.push(box.value);
  } else {
    compareList = compareList.filter(id => id !== box.value);
  }
  updateCompareBar();
}

function updateCompareBar() {
  const bar = document.getElementById("compare-bar");
  bar.hidden = compareList.length === 0;
  const names = compareList.map(id => getCar(id).model).join(", ");
  document.getElementById("compare-text").textContent =
    `${compareList.length}/${MAX_COMPARE} selected: ${names}`;
  document.getElementById("compare-open").disabled = compareList.length < 2;
  document.getElementById("compare-open").title =
    compareList.length < 2 ? "Tick at least 2 cars" : "";
}

function openCompare() {
  const cars = compareList.map(getCar);
  const rows = [
    { label: "Type", get: c => c.type },
    { label: "Daily rate", get: c => c.daily, fmt: formatMoney, best: "min" },
    {
      label: "Weekly rate",
      get: c => getRates(c).weekly,
      fmt: formatMoney,
      best: "min"
    },
    {
      label: "Monthly rate",
      get: c => getRates(c).monthly,
      fmt: formatMoney,
      best: "min"
    },
    { label: "Range", get: c => c.range, fmt: v => `${v} km`, best: "max" },
    { label: "Seats", get: c => c.seats, best: "max" },
    {
      label: "Fast charge 10–80%",
      get: c => c.dcMins,
      fmt: v => `${v} min`,
      best: "min"
    },
    {
      label: "Battery",
      get: c => c.battery,
      fmt: v => `${v} kWh`,
      best: "max"
    },
    {
      label: "0–100 km/h",
      get: c => c.acceleration,
      fmt: v => `${v} s`,
      best: "min"
    },
    { label: "Boot space", get: c => c.boot, fmt: v => `${v} L`, best: "max" }
  ];

  const body = rows
    .map(row => {
      const values = cars.map(row.get);
      const allSame = values.every(v => v === values[0]);
      const target = allSame
        ? null
        : row.best === "min"
          ? Math.min(...values)
          : row.best === "max"
            ? Math.max(...values)
            : null;
      const cells = values
        .map(v => {
          const best = target !== null && v === target;
          return `<td class="${best ? "best" : ""}">${row.fmt ? row.fmt(v) : v}${best ? ` <span class="sr-only">(best)</span>` : ""}</td>`;
        })
        .join("");
      return `<tr><th scope="row">${row.label}</th>${cells}</tr>`;
    })
    .join("");

  const content = `
    <div class="table-wrap">
      <table class="table compare-table">
        <caption class="sr-only">Comparison of ${cars.map(carName).join(", ")}</caption>
        <thead><tr><td></td>${cars.map(c => `<th scope="col" style="text-transform:none;font-size:.95rem;color:var(--text)"><img src="${carImage(c.id)}" alt="" style="width:130px;margin-bottom:.4rem">${carName(c)}</th>`).join("")}</tr></thead>
        <tbody>${body}</tbody>
        <tfoot><tr><td></td>${cars.map(c => `<td><a class="btn btn-primary btn-sm" href="booking.html?car=${c.id}">Book</a></td>`).join("")}</tr></tfoot>
      </table>
    </div>
    <p class="small text-muted mt-2 mb-0">Green values are the best in each row.</p>`;

  openModal({ title: "Compare cars", content, size: "lg" });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-banner").hidden = !!getCurrentUser();
  setupFilters();
  setupMobileFilters();

  const brand = getQueryParam("brand");
  if (brand)
    document.querySelectorAll('input[name="brand"]').forEach(b => {
      b.checked = b.value.toLowerCase() === brand.toLowerCase();
    });
  renderCars();

  document.getElementById("car-grid").addEventListener("change", e => {
    if (e.target.classList.contains("compare-box")) onCompareTick(e.target);
  });
  document
    .getElementById("compare-open")
    .addEventListener("click", openCompare);
  document.getElementById("compare-clear").addEventListener("click", () => {
    compareList = [];
    renderCars();
    updateCompareBar();
  });
});
