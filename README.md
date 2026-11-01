# AZoom Car Rental – ISIT207 Assignment (Part A)

A front-end website for **AZoom**, a fictional electric-car rental company with two branches in Singapore.
It is built with **plain HTML, CSS and JavaScript only**. There is no framework, back-end or database.
All data is simulated with JavaScript arrays and `localStorage`.

---

## How to run

1. Open the project folder in VS Code.
2. Right-click `index.html` → **Open with Live Server** (recommended), or just double-click `index.html` to open it in Chrome, Edge or Firefox.
3. The demo data (users, cars, bookings) is created automatically the first time a page loads.
4. To start fresh at any time, click **Reset demo data** at the bottom of any page.

> The Branches page uses Google Maps embeds, so an internet connection is needed for the maps and web fonts. Everything else works offline.

---

## Demo login details

| Role | Email | Password | Lands on |
|---|---|---|---|
| Customer | `demo@azoom.sg` | `Demo@1234` | My bookings |
| Staff | `staff@azoom.sg` | `Staff@1234` | Staff dashboard |

The login page has **Customer / Staff** tabs and a **Fill in demo details** button. You can also register a new customer account.

### Test credit cards (no real payment is taken)

| Card type | Number | Expiry | CVV |
|---|---|---|---|
| Visa | `4242 4242 4242 4242` | any future date, e.g. `12/29` | any 3 digits |
| Mastercard | `5555 5555 5555 4444` | any future date | any 3 digits |
| Amex | `3782 822463 10005` | any future date | any 4 digits |

Any number that fails the **Luhn check** (for example `4242 4242 4242 4241`) is rejected.

**Debit and prepaid cards are rejected** (credit cards only). These test cards pass the Luhn check but are refused:

| Card type | Number |
|---|---|
| Visa debit | `4000 0566 5566 5556` |
| Mastercard debit | `5200 8282 8282 8210` |
| Mastercard prepaid | `5105 1051 0510 5100` |

---

## Suggested demo walkthrough

The demo data is set relative to *today's date*, so these scenarios always work.

**As the customer (`demo@azoom.sg`)**
1. **Home** – use the quick search (branch and dates; the rental period is shown automatically) → it opens the booking wizard pre-filled.
2. **Booking wizard** – go through all 6 steps and pay with a test card. The price panel shows the cheapest rate combination (for example, 9 days = 1 week + 2 days).
3. **My bookings**
   - *Upcoming* – **Modify** booking `AZ-7Q4K2M` (price recalculates) or **Cancel** it (confirmation dialog shows the fee).
   - *Active* – **Return car** for `AZ-5T8R1N` (choose the car park).
   - *Past* – booking `AZ-3H6W9D` has a bill with a scratch, a late fee and a low-battery fee → open the invoice and click **Pay now**.
   - **Print** any booking for a printable summary.

**As staff (`staff@azoom.sg`)**
1. **Check-out** – look up `AZ-8F3K2Q` (Priya, picking up today), tick licence and card verified, record mileage and battery.
2. **Returns queue** – `AZ-6J1L5V` and `AZ-4D9P7S` are waiting. Click **Inspect**.
3. **Inspection** – tick *Damage found* on an area, choose type and severity, upload a photo (preview shown), set the ending battery (below 20% adds a fee) → **Save inspection and generate bill**.
4. **Billing** – see the bill formula, then **Mark as paid** and **Print invoice**.
5. **Fleet status board** – every vehicle in a grid, with buttons to show only Available, Reserved, Rented, Under inspection or Maintenance. You can send a car to maintenance and back.

---

## Features (mapped to the brief)

### Public pages
- **Home** (`index.html`): hero, quick search (branch, dates, and the rental period detected automatically), "Why rent with AZoom?" (six reasons to choose AZoom), featured EVs, "Why go electric", 5-step "How it works" (steps scroll past a pinned heading while the background fades from mint green to deep forest green and back), and customer reviews in two rows that slide continuously across the page.
- **Fleet** (`fleet.html`): 9 cars with range, seats, charging time and daily/weekly/monthly rates. Filters (brand, seats, max price, min range) that stay pinned beside the cars on desktop, and open from a pinned "Filters" button on phones and tablets, sorting, **details modal with gallery** (3 colours + interior + charging), and a **compare tool** for 2–3 cars that highlights the best value in each row.
- **Branches** (`branches.html`): Ang Mo Kio and Jurong East with address, hours, contact, embedded Google Map, and the table of **designated return car parks**.
- **Pricing & policies** (`pricing.html`): rate table, deposit, extras, insurance tiers, late fees, low-battery fee, damage charge schedule, cancellation policy and a **credit-card-only** notice. Includes a "try it" price calculator.
- **FAQ** (`faq.html`): accordion with topic filter, search and keyboard navigation (↑ ↓ Home End).
- **Contact** (`contact.html`): validated form with inline errors, character counter and a conditional booking-reference field.

### Customer functions
- **Register / login** (`register.html`, `login.html`): JS validation, **password-strength meter**, **show/hide password** toggle, customer and staff roles, redirect back to the page you came from.
- **Booking wizard** (`booking.html`): 6 steps (trip → car → extras → driver and licence → payment → confirmation with booking reference). Step 1 covers branch, dates and the rental period. The draft is saved so a refresh doesn't lose progress.
- **Live price calculator** that picks the **cheapest combination** of monthly, weekly and daily rates.
- **Payment step**: card-number formatting, **Luhn check**, **card-type detection** (Visa, Mastercard, Amex), expiry and CVV validation, live card preview, and debit/prepaid cards rejected.
- **Save card for next time**: tick "Save this card" and the next booking offers "Visa •••• 4242". The customer only re-enters the security code. Saved cards can be removed, and an expired saved card can't be used.
- **My bookings** (`my-bookings.html`): upcoming / active / past tabs, **modify and cancel behind confirmation dialogs**, return car, payment-due alerts.
- **Printable booking summary and invoice** (`invoice.html?ref=…`): itemised damages and fees, **Pay now** with the saved card, print-friendly layout.

### Staff portal (staff login only)
- **Staff dashboard** (`staff-dashboard.html`): fleet KPIs, **check-out** (look up reference, verify licence and card, record starting mileage and battery), **returns queue**, **fleet status board**, branch filter.
- **Inspection** (`inspection.html`): checklist of 6 areas (front, rear, left, right, interior, tyres), damage type and severity drop-downs, **photo upload with preview** (resized in the browser), ending mileage, **ending battery % with low-battery fee** below 20%, live totals.
- **Final bill generator** (`billing.html`): rental + extras + insurance + damages + late fee + low-battery fee − deposit, **Mark as paid** and **Print invoice**.

### Extras
- Fully responsive (tested at 375 px, 800 px and 1280 px with no sideways scrolling) with a **hamburger menu** on small screens.
- **Dark / light mode** toggle (follows the system setting until you choose, then remembers your choice).
- **Custom modals** (focus trapped inside, Escape to close, focus returned afterwards) and **toast notifications**. `alert()` and `confirm()` are never used.
- **Accessibility**: skip link, alt text on every image, a label for every field, `aria-invalid` and inline error messages, `aria-live` updates, keyboard-operable tabs, accordion and gallery, visible focus rings, reduced-motion support, and colour contrast checked to WCAG AA in both themes.

---

## Assumptions (business rules)

| Area | Assumption |
|---|---|
| Branches | Two branches: **Ang Mo Kio** and **Jurong East**. Pick-up happens at the branch office during opening hours (Mon–Fri 8 am–9 pm, Sat 8 am–6 pm, Sun/PH 9 am–5 pm; last pick-up 30 min before closing). |
| Returns | Cars are returned **only to designated car parks** (4 car parks, 2 per branch). Any designated car park can be used. The customer confirms the return online. |
| Driver | Minimum age **19** with at least **1 year** of driving experience. The same rules apply to any additional driver. Singapore licence numbers use the NRIC/FIN format (e.g. `S1234567D`). |
| Rates | **Weekly = 6 × daily** (7 days), **monthly = 22 × daily** (30 days). A "month" is a fixed 30-day block, not a calendar month, so the same number of days always costs the same whatever month it is (a 31-day rental is 1 month + 1 day). **Customers don't choose daily, weekly or monthly.** They pick dates, and the site shows the detected period read-only (e.g. "9 days · 1 week + 2 days") and applies the cheapest combination. This matches how popular Singapore rental sites work and avoids a customer choosing a period that costs more. The system always charges the **cheapest combination** of months, weeks and days. Customers only choose a return **date**, not a time: the car is due back by **11:59 pm** on that date (`POLICY.returnByTime`). Days are counted by calendar date, so Monday to the next Monday is 7 days and a same-day return is 1 day. Maximum rental 90 days. Unlimited mileage. Prices include GST. |
| Payment | **Credit cards only** (Visa, Mastercard, Amex). No debit cards, cash or e-wallets. A card number alone can't show whether a card is credit or debit, because both pass the Luhn check. Real sites get this from their payment gateway, which looks up the card's BIN (first 6–8 digits). The site simulates this with a small list of known debit and prepaid BINs (Stripe's published test cards) and rejects them. |
| Deposit | A refundable **S$500 deposit** is held on the card at reservation. The rental itself is charged on the **final bill** after inspection, and the deposit is deducted from it. If the bill is less than the deposit, the difference is refunded. |
| Extras | Child seat S$10/day, additional driver S$15/day, portable charger S$8/day, each **capped at 7 days** per rental. |
| Insurance | Basic (included, damage liability up to S$3,000), Standard (S$20/day, up to S$1,000), Premium (S$35/day, S$0). Damage charges are capped at the tier's excess. |
| Damage | Charged from a fixed schedule by type (scratch, dent, glass, tyre/rim, interior stain, light/mirror) and severity (minor, moderate, severe). One damage entry per inspected area. |
| Late return | Cars are due by 11:59 pm on the return date. After a 30-minute grace period, **S$30 per started hour**, capped at 1.5 × the daily rate per 24 hours late. |
| Battery | Cars are handed over at 80% or more. Returning below **20%** adds a **S$50** recharging fee. |
| Cancellation | **Free** more than 48 hours before pick-up. Within 48 hours (or a no-show), one day's rental is charged. |
| Changes | Dates, extras, insurance and return car park can be changed up to **24 hours** before pick-up. To change the car or branch, cancel and rebook. |
| Vehicles | Each model has 2 vehicles at each branch. A booking is assigned a specific vehicle (number plate), and a model can't be booked if every vehicle is taken for those dates. |
| Check-out | Staff can check a car out from 24 hours before the booked pick-up time. The licence and credit card must be physically verified. |
| Data | **No real payment processing, emails or server.** All data is simulated in `localStorage` in the user's own browser. Only the card type, last 4 digits and expiry are stored – never the full number or CVV. A **saved card** works the same way real sites use a payment provider's *token*: the account keeps the type, last 4 digits, expiry, name, postal code and a simulated token, and the security code must be entered again for every booking. Passwords are stored in plain text in `localStorage` for demo purposes only (a real system would hash them on a server). |
| Branding | AZoom, its addresses, phone numbers and number plates are fictional. Car images are original SVG illustrations, not manufacturer photos. Specifications are approximate. |

---

## Brand style

| Token | Colour | Use |
|---|---|---|
| Volt green | `#0A7F5E` (brand `#0B8F6A`, darkened slightly for AA contrast) | buttons, main actions |
| Forest | `#065F46` | links, hover |
| Electric cyan | `#22D3EE` | highlights, charging |
| Midnight | `#0F172A` | text, dark mode |
| Mint white | `#F4FAF7` | page background |
| Amber / red | `#F59E0B` / `#DC2626` | warnings / errors and damage |

Fonts: **Manrope** (headings) and **Inter** (body) from Google Fonts.

---

## File structure

```
index.html            Home
fleet.html            Fleet with filters, sort, details modal, compare
branches.html         Branches, maps and return car parks
pricing.html          Rates and policies
faq.html              FAQ accordion
contact.html          Contact form
login.html            Customer / staff login
register.html         Customer registration
booking.html          6-step booking wizard
my-bookings.html      Customer dashboard
invoice.html          Printable booking summary / invoice + Pay now
staff-dashboard.html  Staff: check-out, returns queue, fleet board
inspection.html       Staff: inspection form
billing.html          Staff: final bill generator
css/styles.css        All styles (design tokens, components, responsive, print)
js/data.js            Cars, branches, car parks, prices, policies, demo data
js/pricing.js         All price calculations (cheapest rates, quote, bill)
js/core.js            Shared: storage, dates, login, header/footer, theme, modals, toasts
js/validation.js      Shared form validation (email, phone, password, Luhn, card type…)
js/cars.js            Car card + details modal with gallery
js/summary.js         Booking summary and bill HTML (shared)
js/home.js … js/billing.js   One script per page
images/               Logo icon, car illustrations (SVG), hero and gallery images
JS-GUIDE.md           Plain-English explanation of every JavaScript function
```

Every page loads `data.js → pricing.js → core.js → (validation.js / summary.js / cars.js) → page script`.

See **[JS-GUIDE.md](JS-GUIDE.md)** for what each function does.
