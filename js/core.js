const STORAGE_PREFIX = "azoom_";

function loadData(key, fallback = null) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn("Could not save to localStorage", e);
  }
}

function initData() {
  if (loadData("seedVersion") !== SEED_VERSION || !loadData("bookings"))
    seedDemoData();
}

function resetDemoData() {
  [
    "users",
    "fleet",
    "bookings",
    "session",
    "seedVersion",
    "draft",
    "messages"
  ].forEach(k => {
    try {
      localStorage.removeItem(STORAGE_PREFIX + k);
    } catch (e) {}
  });
  seedDemoData();
}

function formatMoney(amount) {
  const n = Math.abs(Number(amount) || 0);
  const hasCents = Math.round(n * 100) % 100 !== 0;
  const text = n.toLocaleString("en-SG", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2
  });
  return (amount < 0 ? "−" : "") + POLICY.currency + text;
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

const pad = n => String(n).padStart(2, "0");

function localDateTime(date, time) {
  const d = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${d}T${time || `${pad(date.getHours())}:${pad(date.getMinutes())}`}`;
}

function localDate(date) {
  return localDateTime(date).slice(0, 10);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function parseLocal(text) {
  if (!text) return new Date(NaN);
  if (text instanceof Date) return text;
  return new Date(text.length === 10 ? text + "T00:00" : text);
}

function timeSlots(from, to) {
  const out = [];
  for (let m = from * 60; m <= to * 60; m += 30)
    out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  return out;
}

function pickupWindow(dateText) {
  const day = parseLocal(dateText).getDay();
  if (day === 0) return ["09:00", "16:30"];
  if (day === 6) return ["08:00", "17:30"];
  return ["08:00", "20:30"];
}

function formatDate(text) {
  return parseLocal(text).toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(text) {
  const d = parseLocal(text);
  return `${formatDate(text)}, ${d.toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" })}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]
  );
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

const getCar = id => CARS.find(c => c.id === id);
const getBranch = id => BRANCHES.find(b => b.id === id);
const getCarpark = id => CARPARKS.find(c => c.id === id);
const carName = car =>
  car.model.startsWith(car.brand) ? car.model : `${car.brand} ${car.model}`;

function carImage(carId, colour = 0) {
  return `images/cars/${carId}-${colour + 1}.svg`;
}

const BOOKING_STATUS = {
  upcoming: "Upcoming",
  active: "Active rental",
  returned: "Awaiting inspection",
  inspected: "Payment due",
  completed: "Completed",
  cancelled: "Cancelled"
};
const VEHICLE_STATUS = {
  available: "Available",
  reserved: "Reserved",
  rented: "Rented",
  inspection: "Under inspection",
  maintenance: "Maintenance"
};

function getBookings() {
  return loadData("bookings", []);
}
function saveBookings(list) {
  saveData("bookings", list);
}
function getBooking(ref) {
  return getBookings().find(
    b =>
      b.ref ===
      String(ref || "")
        .trim()
        .toUpperCase()
  );
}

function updateBooking(ref, changes, note) {
  const list = getBookings();
  const i = list.findIndex(b => b.ref === ref);
  if (i === -1) return null;
  list[i] = Object.assign({}, list[i], changes);
  if (note)
    list[i].history = (list[i].history || []).concat({
      at: localDateTime(new Date()),
      note
    });
  saveBookings(list);
  return list[i];
}

function generateRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const existing = getBookings().map(b => b.ref);
  let ref;
  do {
    ref =
      "AZ-" +
      Array.from(
        { length: 6 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join("");
  } while (existing.includes(ref));
  return ref;
}

function getFleet() {
  return loadData("fleet", []);
}
function saveFleet(list) {
  saveData("fleet", list);
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return (
    parseLocal(aStart) < parseLocal(bEnd) &&
    parseLocal(bStart) < parseLocal(aEnd)
  );
}

function findAvailableVehicle(carId, branchId, pickupAt, returnAt, ignoreRef) {
  const busy = getBookings().filter(
    b =>
      b.ref !== ignoreRef &&
      ["upcoming", "active", "returned"].includes(b.status)
  );
  return (
    getFleet().find(
      v =>
        v.carId === carId &&
        v.branchId === branchId &&
        !v.maintenance &&
        !busy.some(
          b =>
            b.plate === v.plate &&
            overlaps(pickupAt, returnAt, b.pickupAt, b.returnAt)
        )
    ) || null
  );
}

function vehicleStatus(vehicle, bookings = getBookings()) {
  if (vehicle.maintenance) return "maintenance";
  const mine = bookings.filter(b => b.plate === vehicle.plate);
  if (mine.some(b => b.status === "active")) return "rented";
  if (mine.some(b => b.status === "returned")) return "inspection";
  const soon = addDays(new Date(), 3);
  if (mine.some(b => b.status === "upcoming" && parseLocal(b.pickupAt) <= soon))
    return "reserved";
  return "available";
}

function getUsers() {
  return loadData("users", []);
}

function loginUser(email, password) {
  const user = getUsers().find(
    u =>
      u.email.toLowerCase() === email.trim().toLowerCase() &&
      u.password === password
  );
  if (user)
    saveData("session", {
      email: user.email,
      role: user.role,
      loginAt: new Date().toISOString()
    });
  return user || null;
}

function logoutUser() {
  saveData("session", null);
}

function getCurrentUser() {
  const session = loadData("session");
  if (!session) return null;
  return getUsers().find(u => u.email === session.email) || null;
}

function requireRole(role) {
  const user = getCurrentUser();
  if (!user || (role && user.role !== role)) {
    const next = encodeURIComponent(
      location.pathname.split("/").pop() + location.search
    );
    location.replace(
      `login.html?next=${next}${role === "staff" ? "&role=staff" : ""}`
    );
    return null;
  }
  return user;
}

const ICONS = {
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  logout:
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  battery:
    '<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M6 11v2M10 11v2"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  shield:
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  calendar:
    '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  "check-circle": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert:
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4M12 17h.01"/>',
  print:
    '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash:
    '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  "eye-off":
    '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.39-1.61M2 2l20 20"/>',
  plug: '<path d="M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  "arrow-right": '<path d="M5 12h14M12 5l7 7-7 7"/>',
  "arrow-left": '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  wrench:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  clipboard:
    '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  camera:
    '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  receipt:
    '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11"/>',
  baby: '<path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>',
  columns:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/>',
  layout:
    '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  refresh:
    '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
  upload:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  quiet: '<path d="M11 5 6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6"/>',
  filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  parking:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  fuel: '<path d="M3 22h12M4 9h10M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9.83a2 2 0 0 0-.59-1.42L18 5"/>',
  coins:
    '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
  star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'
};

function icon(name, extraClass = "") {
  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`;
}

function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach(el => {
    el.outerHTML = icon(el.dataset.icon, el.className);
  });
}

const NAV_LINKS = [
  { page: "home", href: "index.html", label: "Home" },
  { page: "fleet", href: "fleet.html", label: "Our fleet" },
  { page: "branches", href: "branches.html", label: "Branches" },
  { page: "pricing", href: "pricing.html", label: "Pricing" },
  { page: "faq", href: "faq.html", label: "FAQ" },
  { page: "contact", href: "contact.html", label: "Contact" }
];

const STAFF_LINKS = [
  { page: "staff", href: "staff-dashboard.html", label: "Dashboard" },
  {
    page: "staff-checkout",
    href: "staff-dashboard.html#checkout",
    label: "Check-out"
  },
  {
    page: "staff-returns",
    href: "staff-dashboard.html#returns",
    label: "Returns queue"
  },
  {
    page: "staff-board",
    href: "staff-dashboard.html#board",
    label: "Fleet board"
  },
  { page: "inspection", href: "inspection.html", label: "Inspection" },
  { page: "billing", href: "billing.html", label: "Billing" }
];

const LOGO_HTML = `<span class="logo-mark">${'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>'}</span><span>A<span class="zoom">Zoom</span></span>`;

function renderHeader() {
  const holder = document.getElementById("site-header");
  if (!holder) return;
  const page = document.body.dataset.page;
  const user = getCurrentUser();

  const isStaff = user && user.role === "staff";
  const links =
    (isStaff ? STAFF_LINKS : NAV_LINKS)
      .map(
        l =>
          `<li><a href="${l.href}" data-link="${l.page}"${l.page === page ? ' aria-current="page"' : ""}>${l.label}</a></li>`
      )
      .join("") +
    (isStaff
      ? ""
      : '<li class="mobile-only"><a href="fleet.html">Book now</a></li>');

  let account;
  if (user) {
    const first = escapeHtml(user.name.split(" ")[0]);
    const dash =
      user.role === "staff"
        ? `<a href="index.html">${icon("eye")} View public site</a>`
        :`<a href="my-bookings.html">${icon("calendar")} My bookings</a><a href="booking.html">${icon("plus")} New booking</a>`;
    account = `
      <div class="user-menu">
        <button class="btn btn-outline btn-sm" id="user-menu-btn" aria-haspopup="true" aria-expanded="false" aria-controls="user-menu-panel">
          ${icon("user")}<span class="user-label">${first}${user.role === "staff" ? " (staff)" : ""}</span>${icon("chevron-down")}
        </button>
        <div class="user-menu-panel" id="user-menu-panel" hidden>
          <div class="menu-label">Signed in as<br><strong>${escapeHtml(user.email)}</strong></div>
          ${dash}
          <button type="button" id="logout-btn">${icon("logout")} Log out</button>
        </div>
      </div>`;
  } else {
    account = `<a class="btn btn-outline btn-sm" href="login.html">${icon("user")}<span class="user-label">Log in</span></a>`;
  }

  holder.outerHTML = `
    <a class="skip-link" href="#main">Skip to main content</a>
    <header class="site-header${isStaff ? " is-staff" : ""}">
      <div class="container nav">
        <a class="logo" href="${isStaff ? "staff-dashboard.html" : "index.html"}" aria-label="${isStaff ? "AZoom staff portal – dashboard" : "AZoom Car Rental – home"}">${LOGO_HTML}${isStaff ? '<span class="logo-tag">Staff</span>' : ""}</a>
        <nav aria-label="${isStaff ? "Staff" : "Main"}">
          <ul class="nav-links" id="nav-links">${links}</ul>
        </nav>
        <div class="nav-actions">
          <button class="icon-btn" id="theme-toggle" type="button"></button>
          ${account}
          ${isStaff ? "" : '<a class="btn btn-primary btn-sm nav-book" href="fleet.html">Book now</a>'}
          <button class="icon-btn nav-toggle" id="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">${icon("menu")}</button>
        </div>
      </div>
    </header>`;

  setupNavToggle();
  setupUserMenu();
  updateThemeButton();
  document
    .getElementById("theme-toggle")
    .addEventListener("click", toggleTheme);

  if (isStaff && page === "staff") setupStaffScrollSpy();
}

function setupStaffScrollSpy() {
  const sections = [
    { link: "staff-checkout", id: "checkout" },
    { link: "staff-returns", id: "returns" },
    { link: "staff-board", id: "board" }
  ];
  const links = document.querySelectorAll("#nav-links a");

  const update = () => {
    const line = document.querySelector(".site-header").offsetHeight + 120;
    let current = "staff";
    sections.forEach(s => {
      const top = document.getElementById(s.id).getBoundingClientRect().top;
      if (top <= line) current = s.link;
    });
    links.forEach(a => {
      if (a.dataset.link === current) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  window.addEventListener("load", () => {
    const target = sections.find(s => `#${s.id}` === location.hash);
    if (target)
      document
        .getElementById(target.id)
        .scrollIntoView({ behavior: "instant" });
    update();
  });
  update();
}

function setupNavToggle() {
  const btn = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-links");
  btn.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    btn.innerHTML = icon(open ? "x" : "menu");
  });
  menu.addEventListener("click", e => {
    if (e.target.closest("a") && menu.classList.contains("open")) btn.click();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && menu.classList.contains("open")) {
      btn.click();
      btn.focus();
    }
  });
}

function setupUserMenu() {
  const btn = document.getElementById("user-menu-btn");
  if (!btn) return;
  const panel = document.getElementById("user-menu-panel");
  const setOpen = open => {
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", open);
  };
  btn.addEventListener("click", e => {
    e.stopPropagation();
    setOpen(panel.hidden);
  });
  document.addEventListener("click", e => {
    if (!panel.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !panel.hidden) {
      setOpen(false);
      btn.focus();
    }
  });
  document.getElementById("logout-btn").addEventListener("click", () => {
    logoutUser();
    sessionStorage.setItem("azoom_flash", "You have been logged out.");
    location.href = "index.html";
  });
}

function renderFooter() {
  const holder = document.getElementById("site-footer");
  if (!holder) return;
  const branches = BRANCHES.map(
    b =>
      `<li><strong>${b.name}</strong><br><a href="tel:${b.phone.replace(/\s/g, "")}">${b.phone}</a></li>`
  ).join("");
  holder.outerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="logo" href="index.html" aria-label="AZoom – home">${LOGO_HTML}</a>
            <p class="mt-2">Electric car rental made simple. Daily, weekly and monthly EV rentals from two convenient branches in Singapore.</p>
            <p class="small">${icon("card")} Credit cards only · Visa, Mastercard, Amex</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>${NAV_LINKS.slice(1)
              .map(l => `<li><a href="${l.href}">${l.label}</a></li>`)
              .join("")}</ul>
          </div>
          <div>
            <h4>Your account</h4>
            <ul>
              <li><a href="booking.html">Book a car</a></li>
              <li><a href="my-bookings.html">My bookings</a></li>
              <li><a href="login.html">Log in</a></li>
              <li><a href="register.html">Create account</a></li>
              <li><a href="terms.html">Terms and Conditions</a></li>
            </ul>
          </div>
          <div>
            <h4>Branches</h4>
            <ul>${branches}</ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} AZoom Car Rental. A fictional company for an ISIT207 school project – no real bookings or payments.</span>
          <button type="button" id="reset-demo">${icon("refresh")} Reset demo data</button>
        </div>
      </div>
    </footer>
    <div class="toast-region" id="toast-region" role="status" aria-live="polite"></div>`;

  document.getElementById("reset-demo").addEventListener("click", async () => {
    const ok = await confirmDialog({
      title: "Reset demo data?",
      message:
        "This removes every booking, account and change you have made and restores the original demo data.",
      confirmText: "Reset data",
      danger: true
    });
    if (ok) {
      resetDemoData();
      sessionStorage.setItem("azoom_flash", "Demo data has been reset.");
      location.reload();
    }
  });
}

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("azoom_theme", next);
  } catch (e) {}
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const dark = currentTheme() === "dark";
  btn.innerHTML = icon(dark ? "sun" : "moon");
  btn.setAttribute(
    "aria-label",
    dark ? "Switch to light mode" : "Switch to dark mode"
  );
  btn.title = btn.getAttribute("aria-label");
}

const openModals = [];
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function openModal({ title, content, size = "", buttons = [], onClose } = {}) {
  const lastFocus = document.activeElement;
  const id = "modal-" + Date.now();
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal ${size ? "modal-" + size : ""}" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
      <div class="modal-header">
        <h2 id="${id}-title">${title}</h2>
        <button type="button" class="icon-btn" data-close aria-label="Close">${icon("x")}</button>
      </div>
      <div class="modal-body"></div>
      ${buttons.length ? '<div class="modal-footer"></div>' : ""}
    </div>`;
  const modal = backdrop.querySelector(".modal");
  const body = backdrop.querySelector(".modal-body");
  if (typeof content === "string") body.innerHTML = content;
  else if (content) body.appendChild(content);

  const api = { el: modal, body, close };
  buttons.forEach(b => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn " + (b.className || "btn-outline");
    btn.innerHTML = b.text;
    btn.addEventListener("click", () => (b.onClick ? b.onClick(api) : close()));
    backdrop.querySelector(".modal-footer").appendChild(btn);
  });

  function close() {
    if (!backdrop.isConnected) return;
    backdrop.remove();
    openModals.splice(openModals.indexOf(api), 1);
    if (!openModals.length) document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    if (onClose) onClose();
  }

  function onKey(e) {
    if (openModals[openModals.length - 1] !== api) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
    if (e.key === "Tab") {
      const items = [...modal.querySelectorAll(FOCUSABLE)].filter(
        el => el.offsetParent !== null
      );
      if (!items.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  backdrop.addEventListener("mousedown", e => {
    if (e.target === backdrop) close();
  });
  backdrop.querySelector("[data-close]").addEventListener("click", close);
  document.addEventListener("keydown", onKey);
  document.body.appendChild(backdrop);
  document.body.classList.add("modal-open");
  openModals.push(api);
  hydrateIcons(modal);

  const target =
    body.querySelector("input, select, textarea") ||
    backdrop.querySelector(".modal-footer .btn") ||
    backdrop.querySelector("[data-close]");
  target.focus();
  return api;
}

function confirmDialog({
  title = "Are you sure?",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false
} = {}) {
  return new Promise(resolve => {
    let answered = false;
    openModal({
      title,
      content: `<p class="mb-0">${message}</p>`,
      buttons: [
        { text: cancelText, className: "btn-outline", onClick: m => m.close() },
        {
          text: confirmText,
          className: danger ? "btn-danger" : "btn-primary",
          onClick: m => {
            answered = true;
            m.close();
          }
        }
      ],
      onClose: () => resolve(answered)
    });
  });
}

function showToast(message, type = "success", timeout = 4500) {
  const region = document.getElementById("toast-region");
  if (!region) return;
  const icons = {
    success: "check-circle",
    error: "alert",
    warning: "alert",
    info: "info"
  };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icon(icons[type] || "info")}<div>${message}</div><button type="button" class="toast-close" aria-label="Dismiss">×</button>`;
  region.appendChild(toast);
  const remove = () => {
    toast.classList.add("leaving");
    setTimeout(() => toast.remove(), 250);
  };
  toast.querySelector(".toast-close").addEventListener("click", remove);
  if (timeout) setTimeout(remove, timeout);
}

function showFlashMessage() {
  const msg = sessionStorage.getItem("azoom_flash");
  if (msg) {
    sessionStorage.removeItem("azoom_flash");
    showToast(escapeHtml(msg), "info");
  }
}

function setupDatePickers() {
  document.addEventListener("click", e => {
    const input = e.target.closest('input[type="date"]');
    if (
      !input ||
      input.disabled ||
      input.readOnly ||
      typeof input.showPicker !== "function"
    )
      return;
    try {
      input.showPicker();
    } catch (err) {}
  });
}

initData();
setupDatePickers();
document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  hydrateIcons();
  showFlashMessage();
});
