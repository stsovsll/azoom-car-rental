const POLICY = {
  currency: "S$",
  weeklyMultiplier: 6,
  monthlyMultiplier: 22,
  weekDays: 7,
  monthDays: 30,
  deposit: 500,
  returnByTime: "23:59",
  lateGraceMins: 30,
  lateFeePerHour: 30,
  lateFeeCapFactor: 1.5,
  lowBatteryThreshold: 20,
  lowBatteryFee: 50,
  minAge: 19,
  minLicenceYears: 1,
  freeCancelHours: 48,
  modifyCutoffHours: 24,
  maxRentalDays: 90,
  extrasCapDays: 7
};

const CARS = [
  {
    id: "tesla-model-3",
    brand: "Tesla",
    model: "Model 3",
    type: "Sedan",
    seats: 5,
    range: 513,
    battery: 60,
    dcMins: 25,
    acHours: 6,
    acceleration: 6.1,
    boot: 594,
    daily: 168,
    featured: true,
    tag: "Best seller",
    colours: [
      ["Pearl white", "#F1F5F9"],
      ["Midnight silver", "#64748B"],
      ["Ultra red", "#B91C1C"]
    ],
    description:
      "Sleek, quick and packed with tech. The Model 3 is the go-to choice for comfortable city and island-wide driving, with access to Tesla Superchargers.",
    features: [
      "Autopilot",
      '15" touchscreen',
      "Glass roof",
      "Wireless phone charging"
    ]
  },
  {
    id: "tesla-model-y",
    brand: "Tesla",
    model: "Model Y",
    type: "SUV",
    seats: 5,
    range: 455,
    battery: 60,
    dcMins: 27,
    acHours: 6,
    acceleration: 6.9,
    boot: 854,
    daily: 198,
    featured: false,
    tag: "Family SUV",
    colours: [
      ["Pearl white", "#F1F5F9"],
      ["Deep blue", "#1E3A8A"],
      ["Solid black", "#1F2937"]
    ],
    description:
      "The practical SUV sibling of the Model 3 with a huge boot, higher seating position and plenty of space for families and luggage.",
    features: ["Autopilot", "Power tailgate", "Heated seats", "Panoramic roof"]
  },
  {
    id: "byd-atto-3",
    brand: "BYD",
    model: "Atto 3",
    type: "SUV",
    seats: 5,
    range: 420,
    battery: 60.5,
    dcMins: 45,
    acHours: 9,
    acceleration: 7.3,
    boot: 440,
    daily: 138,
    featured: true,
    tag: "Great value",
    colours: [
      ["Surf blue", "#0E7490"],
      ["Ski white", "#F1F5F9"],
      ["Boulder grey", "#6B7280"]
    ],
    description:
      "A roomy compact SUV with a fun, modern interior and a rotating touchscreen. Excellent value for daily errands and weekend trips.",
    features: [
      'Rotating 12.8" screen',
      "Apple CarPlay / Android Auto",
      "360° camera",
      "Vehicle-to-load (V2L)"
    ]
  },
  {
    id: "byd-dolphin",
    brand: "BYD",
    model: "Dolphin",
    type: "Hatchback",
    seats: 5,
    range: 427,
    battery: 60.4,
    dcMins: 40,
    acHours: 9,
    acceleration: 7.0,
    boot: 345,
    daily: 118,
    featured: false,
    tag: "City friendly",
    colours: [
      ["Coral pink", "#F472B6"],
      ["Atlantis grey", "#94A3B8"],
      ["Surf blue", "#0891B2"]
    ],
    description:
      "A compact hatchback that is easy to park and cheap to run – perfect for zipping around town.",
    features: [
      "Rotating touchscreen",
      "Adaptive cruise control",
      "Keyless entry",
      "V2L"
    ]
  },
  {
    id: "byd-seal",
    brand: "BYD",
    model: "Seal",
    type: "Sedan",
    seats: 5,
    range: 570,
    battery: 82.5,
    dcMins: 26,
    acHours: 8,
    acceleration: 5.9,
    boot: 400,
    daily: 188,
    featured: false,
    tag: "Longest range",
    colours: [
      ["Aurora white", "#F1F5F9"],
      ["Atlantis grey", "#475569"],
      ["Arctic blue", "#38BDF8"]
    ],
    description:
      "A stylish long-range sports sedan. With 570 km of range you can drive all week without thinking about charging.",
    features: [
      "Heads-up display",
      "Ventilated seats",
      "Dynaudio sound",
      "Glass roof"
    ]
  },
  {
    id: "hyundai-ioniq-5",
    brand: "Hyundai",
    model: "Ioniq 5",
    type: "SUV",
    seats: 5,
    range: 481,
    battery: 77.4,
    dcMins: 18,
    acHours: 7,
    acceleration: 7.4,
    boot: 527,
    daily: 178,
    featured: true,
    tag: "Fastest charging",
    colours: [
      ["Gravity gold", "#A8A29E"],
      ["Digital teal", "#0F766E"],
      ["Atlas white", "#F1F5F9"]
    ],
    description:
      "Retro-futuristic design with a flat floor and sliding centre console. Its 800-volt system charges from 10–80% in about 18 minutes.",
    features: [
      "Ultra-fast 800V charging",
      "Relaxation seats",
      "Sliding console",
      "V2L"
    ]
  },
  {
    id: "mg4",
    brand: "MG",
    model: "MG4",
    type: "Hatchback",
    seats: 5,
    range: 435,
    battery: 64,
    dcMins: 26,
    acHours: 9,
    acceleration: 7.7,
    boot: 363,
    daily: 108,
    featured: true,
    tag: "Lowest price",
    colours: [
      ["Volcano orange", "#EA580C"],
      ["Dover white", "#F1F5F9"],
      ["Holborn blue", "#1D4ED8"]
    ],
    description:
      "Our most affordable EV. The MG4 is fun to drive, surprisingly spacious and ideal for first-time EV drivers.",
    features: [
      "Rear-wheel drive",
      '10.25" touchscreen',
      "Lane keep assist",
      "Keyless entry"
    ]
  },
  {
    id: "kia-ev9",
    brand: "Kia",
    model: "EV9",
    type: "SUV",
    seats: 7,
    range: 505,
    battery: 99.8,
    dcMins: 24,
    acHours: 10,
    acceleration: 9.4,
    boot: 333,
    daily: 258,
    featured: false,
    tag: "7 seater",
    colours: [
      ["Snow white", "#F1F5F9"],
      ["Ocean blue", "#1E3A8A"],
      ["Panthera metal", "#57534E"]
    ],
    description:
      "A premium three-row SUV with seven full-size seats. Great for big families, group outings and airport runs.",
    features: [
      "7 seats",
      "Swivel second-row seats",
      'Dual 12.3" screens',
      "Highway driving assist"
    ]
  },
  {
    id: "byd-m6",
    brand: "BYD",
    model: "M6",
    type: "MPV",
    seats: 7,
    range: 530,
    battery: 71.8,
    dcMins: 33,
    acHours: 10,
    acceleration: 8.6,
    boot: 580,
    daily: 168,
    featured: false,
    tag: "Spacious MPV",
    colours: [
      ["Crystal white", "#F1F5F9"],
      ["Quartz blue", "#334155"],
      ["Harbour grey", "#9CA3AF"]
    ],
    description:
      "An electric people-mover with seven seats and a flexible cabin – the easy choice for group trips on a budget.",
    features: ["7 seats", 'Rotating 12.8" screen', "Rear AC vents", "V2L"]
  }
];

const BRANCHES = [
  {
    id: "amk",
    name: "Ang Mo Kio",
    address: "Blk 712 Ang Mo Kio Ave 6, #01-4050, Singapore 560712",
    phone: "+65 6555 0110",
    email: "amk@azoom.sg",
    mrt: "Ang Mo Kio MRT (NS16) – 5 min walk",
    hours: [
      ["Mon – Fri", "8:00 am – 9:00 pm"],
      ["Saturday", "8:00 am – 6:00 pm"],
      ["Sunday & PH", "9:00 am – 5:00 pm"]
    ],
    mapQuery: "Ang+Mo+Kio+Avenue+6+Singapore"
  },
  {
    id: "je",
    name: "Jurong East",
    address: "2 Jurong East Street 21, #01-12, Singapore 609601",
    phone: "+65 6555 0220",
    email: "je@azoom.sg",
    mrt: "Jurong East MRT (NS1/EW24) – 6 min walk",
    hours: [
      ["Mon – Fri", "8:00 am – 9:00 pm"],
      ["Saturday", "8:00 am – 6:00 pm"],
      ["Sunday & PH", "9:00 am – 5:00 pm"]
    ],
    mapQuery: "Jurong+East+Street+21+Singapore"
  }
];

const CARPARKS = [
  {
    id: "amk-hub",
    branchId: "amk",
    name: "AMK Central Car Park – Level B2",
    lots: "EV lots B2-01 to B2-12",
    address: "Ang Mo Kio Ave 3, Singapore",
    hours: "24 hours",
    chargers: 6
  },
  {
    id: "amk-712",
    branchId: "amk",
    name: "Blk 712 Multi-storey Car Park – Deck 3",
    lots: "Lots 3-20 to 3-30",
    address: "Ang Mo Kio Ave 6, Singapore",
    hours: "24 hours",
    chargers: 4
  },
  {
    id: "je-gateway",
    branchId: "je",
    name: "Jurong Gateway Car Park – Basement 3",
    lots: "EV lots B3-40 to B3-55",
    address: "Jurong Gateway Road, Singapore",
    hours: "24 hours",
    chargers: 8
  },
  {
    id: "je-21",
    branchId: "je",
    name: "JE Street 21 Open-air Car Park",
    lots: "Lots 101 to 110 (green bays)",
    address: "Jurong East Street 21, Singapore",
    hours: "24 hours",
    chargers: 2
  }
];

const EXTRAS = [
  {
    id: "childSeat",
    name: "Child seat",
    perDay: 10,
    icon: "baby",
    desc: "ISOFIX seat for children 9 months – 4 years."
  },
  {
    id: "extraDriver",
    name: "Additional driver",
    perDay: 15,
    icon: "users",
    desc: "Add a second named driver (same age and licence rules apply)."
  },
  {
    id: "charger",
    name: "Portable charger",
    perDay: 8,
    icon: "plug",
    desc: "3-pin home charging cable – top up anywhere with a power socket."
  }
];

const INSURANCE = [
  {
    id: "basic",
    name: "Basic",
    perDay: 0,
    excess: 3000,
    desc: "Included. You pay damages up to S$3,000."
  },
  {
    id: "standard",
    name: "Standard",
    perDay: 20,
    excess: 1000,
    desc: "Damage liability reduced to S$1,000."
  },
  {
    id: "premium",
    name: "Premium",
    perDay: 35,
    excess: 0,
    desc: "Zero excess – no damage charges at all."
  }
];

const INSPECTION_AREAS = [
  { id: "front", name: "Front" },
  { id: "rear", name: "Rear" },
  { id: "left", name: "Left side" },
  { id: "right", name: "Right side" },
  { id: "interior", name: "Interior" },
  { id: "tyres", name: "Tyres & rims" }
];

const SEVERITIES = [
  { id: "minor", name: "Minor" },
  { id: "moderate", name: "Moderate" },
  { id: "severe", name: "Severe" }
];

const DAMAGE_TYPES = [
  { id: "scratch", name: "Scratch / scuff", charges: [80, 200, 450] },
  { id: "dent", name: "Dent", charges: [150, 400, 900] },
  { id: "glass", name: "Glass chip / crack", charges: [120, 350, 800] },
  { id: "tyre", name: "Tyre / rim damage", charges: [100, 250, 600] },
  { id: "stain", name: "Interior stain / burn", charges: [60, 180, 400] },
  { id: "light", name: "Broken light / mirror", charges: [150, 300, 650] }
];

const NON_CREDIT_BINS = [
  { prefix: "40000566", funding: "debit", label: "Visa debit" },
  { prefix: "52008282", funding: "debit", label: "Mastercard debit" },
  { prefix: "51051051", funding: "prepaid", label: "Mastercard prepaid" }
];

const REVIEWS = [
  {
    name: "Rachel Ong",
    carId: "hyundai-ioniq-5",
    branchId: "je",
    rating: 5,
    daysAgo: 12,
    text: "Charged from 10% to 80% in under 20 minutes during lunch. Pick-up took five minutes and returning to the car park was so easy."
  },
  {
    name: "Darren Koh",
    carId: "mg4",
    branchId: "amk",
    rating: 5,
    daysAgo: 20,
    text: "First time driving an EV and the MG4 was a great start. Booking online was simple, and the price for 9 days was cheaper than I expected."
  },
  {
    name: "Nurul Huda",
    carId: "kia-ev9",
    branchId: "amk",
    rating: 5,
    daysAgo: 34,
    text: "We needed seven seats for a family weekend and the EV9 was perfect. The child seat was already fitted when we arrived."
  },
  {
    name: "Wei Jie Lim",
    carId: "tesla-model-3",
    branchId: "je",
    rating: 4,
    daysAgo: 41,
    text: "Smooth, quiet and quick. The only thing I would change is longer Sunday hours at Jurong East, but the staff were very helpful."
  },
  {
    name: "Priya Menon",
    carId: "byd-atto-3",
    branchId: "amk",
    rating: 5,
    daysAgo: 55,
    text: "The final bill was clear and itemised, with no surprises. My deposit was refunded the same week. Will rent again."
  },
  {
    name: "Marcus Tan",
    carId: "byd-seal",
    branchId: "je",
    rating: 4,
    daysAgo: 68,
    text: "Took the Seal for a month. The monthly rate saved a lot compared with daily prices, and the range easily lasted all week."
  }
];

// Country codes for mobile numbers. min and max are the digits after the code
const PHONE_CODES = [
  { code: "+65", name: "Singapore", min: 8, max: 8 },
  { code: "+60", name: "Malaysia", min: 9, max: 10 },
  { code: "+62", name: "Indonesia", min: 9, max: 12 },
  { code: "+66", name: "Thailand", min: 8, max: 9 },
  { code: "+63", name: "Philippines", min: 10, max: 10 },
  { code: "+84", name: "Vietnam", min: 9, max: 10 },
  { code: "+86", name: "China", min: 11, max: 11 },
  { code: "+852", name: "Hong Kong", min: 8, max: 8 },
  { code: "+91", name: "India", min: 10, max: 10 },
  { code: "+81", name: "Japan", min: 9, max: 10 },
  { code: "+82", name: "South Korea", min: 9, max: 10 },
  { code: "+61", name: "Australia", min: 9, max: 9 },
  { code: "+44", name: "United Kingdom", min: 10, max: 10 },
  { code: "+1", name: "USA / Canada", min: 10, max: 10 }
];

const DEMO_USERS = [
  {
    name: "Alex Tan",
    email: "demo@azoom.sg",
    password: "Demo@1234",
    role: "customer",
    phone: "91234567",
    dob: "1995-04-18",
    licenceNo: "S9512345D",
    licenceIssued: "2015-06-01"
  },
  {
    name: "Jordan Lee",
    email: "staff@azoom.sg",
    password: "Staff@1234",
    role: "staff",
    phone: "65550110",
    branchId: "amk"
  }
];

function buildFleet() {
  const fleet = [];
  const letters = [
    "SNA",
    "SNB",
    "SNC",
    "SND",
    "SNE",
    "SNF",
    "SNG",
    "SNH",
    "SNJ"
  ];
  const suffix = "ABCDEGHJKLMPRSTUXYZ";
  CARS.forEach((car, i) => {
    BRANCHES.forEach((branch, b) => {
      for (let n = 0; n < 2; n++) {
        const num = 1000 + i * 731 + b * 211 + n * 97;
        fleet.push({
          plate: `${letters[i]}${num}${suffix[(i * 4 + b * 2 + n) % suffix.length]}`,
          carId: car.id,
          branchId: branch.id,
          mileage: 8000 + (((i + 1) * 3137 + b * 1500 + n * 820) % 30000),
          battery: 80 + (((i + b + n) * 7) % 21),
          maintenance: false,
          note: ""
        });
      }
    });
  });
  return fleet;
}

function seedPlate(fleet, carId, branchId, n = 0) {
  return fleet.filter(v => v.carId === carId && v.branchId === branchId)[n]
    .plate;
}

function seedDemoData() {
  const fleet = buildFleet();
  const inShop = fleet.find(
    v => v.carId === "byd-dolphin" && v.branchId === "je"
  );
  inShop.maintenance = true;
  inShop.note = "Scheduled service + tyre rotation";

  const at = (days, time) => localDateTime(addDays(new Date(), days), time);

  const make = b => {
    const booking = Object.assign(
      {
        extras: { childSeat: false, extraDriver: false, charger: false },
        insurance: "basic",
        card: {
          type: "Visa",
          last4: "4242",
          expiry: "12/28",
          name: b.driver.name.toUpperCase()
        },
        createdAt: at(-14, "12:00"),
        history: []
      },
      b
    );
    booking.quote = calculateQuote(
      booking.carId,
      booking.pickupAt,
      booking.returnAt,
      booking.extras,
      booking.insurance
    );
    return booking;
  };

  const alex = {
    name: "Alex Tan",
    email: "demo@azoom.sg",
    phone: "91234567",
    dob: "1995-04-18",
    licenceNo: "S9512345D",
    licenceIssued: "2015-06-01"
  };

  const bookings = [
    make({
      ref: "AZ-7Q4K2M",
      userEmail: alex.email,
      carId: "tesla-model-3",
      branchId: "amk",
      returnCarparkId: "amk-hub",
      pickupAt: at(3, "10:00"),
      returnAt: at(12, "23:59"),
      plate: seedPlate(fleet, "tesla-model-3", "amk", 0),
      extras: { childSeat: true, extraDriver: false, charger: false },
      insurance: "standard",
      status: "upcoming",
      driver: alex,
      createdAt: at(-2, "20:15")
    }),
    make({
      ref: "AZ-5T8R1N",
      userEmail: alex.email,
      carId: "byd-atto-3",
      branchId: "je",
      returnCarparkId: "je-gateway",
      pickupAt: at(-2, "09:00"),
      returnAt: at(3, "23:59"),
      plate: seedPlate(fleet, "byd-atto-3", "je", 0),
      extras: { childSeat: false, extraDriver: false, charger: true },
      status: "active",
      driver: alex,
      checkout: {
        at: at(-2, "09:12"),
        mileage: 18234,
        battery: 96,
        staff: "Jordan Lee",
        licenceChecked: true,
        cardChecked: true
      }
    }),
    make({
      ref: "AZ-3H6W9D",
      userEmail: alex.email,
      carId: "mg4",
      branchId: "amk",
      returnCarparkId: "amk-712",
      pickupAt: at(-10, "09:00"),
      returnAt: at(-5, "23:59"),
      plate: seedPlate(fleet, "mg4", "amk", 1),
      status: "inspected",
      driver: alex,
      checkout: {
        at: at(-10, "09:05"),
        mileage: 22410,
        battery: 100,
        staff: "Jordan Lee",
        licenceChecked: true,
        cardChecked: true
      },
      returned: { at: at(-4, "01:39"), carparkId: "amk-712" },
      inspection: {
        at: at(-4, "10:30"),
        staff: "Jordan Lee",
        mileage: 22871,
        battery: 14,
        notes: "Light scratch on rear bumper, left of number plate.",
        areas: {
          front: { ok: true },
          rear: { ok: false, type: "scratch", severity: "minor", photos: [] },
          left: { ok: true },
          right: { ok: true },
          interior: { ok: true },
          tyres: { ok: true }
        }
      }
    }),
    make({
      ref: "AZ-2B7C4X",
      userEmail: alex.email,
      carId: "hyundai-ioniq-5",
      branchId: "je",
      returnCarparkId: "je-21",
      pickupAt: at(-45, "10:00"),
      returnAt: at(-42, "23:59"),
      plate: seedPlate(fleet, "hyundai-ioniq-5", "je", 0),
      status: "completed",
      driver: alex,
      insurance: "premium",
      checkout: {
        at: at(-45, "10:02"),
        mileage: 15120,
        battery: 98,
        staff: "Jordan Lee",
        licenceChecked: true,
        cardChecked: true
      },
      returned: { at: at(-42, "09:40"), carparkId: "je-21" },
      inspection: {
        at: at(-42, "11:00"),
        staff: "Jordan Lee",
        mileage: 15388,
        battery: 62,
        notes: "No issues.",
        areas: {
          front: { ok: true },
          rear: { ok: true },
          left: { ok: true },
          right: { ok: true },
          interior: { ok: true },
          tyres: { ok: true }
        }
      }
    }),
    make({
      ref: "AZ-8F3K2Q",
      userEmail: "priya.nair@example.com",
      carId: "byd-dolphin",
      branchId: "amk",
      returnCarparkId: "amk-hub",
      pickupAt: at(0, "14:00"),
      returnAt: at(7, "23:59"),
      plate: seedPlate(fleet, "byd-dolphin", "amk", 0),
      status: "upcoming",
      driver: {
        name: "Priya Nair",
        email: "priya.nair@example.com",
        phone: "98765432",
        dob: "1990-09-02",
        licenceNo: "S9098765H",
        licenceIssued: "2011-03-15"
      },
      card: {
        type: "Mastercard",
        last4: "5100",
        expiry: "08/27",
        name: "PRIYA NAIR"
      }
    }),
    make({
      ref: "AZ-6J1L5V",
      userEmail: "marcus.lim@example.com",
      carId: "tesla-model-y",
      branchId: "je",
      returnCarparkId: "je-gateway",
      pickupAt: at(-4, "10:00"),
      returnAt: at(-1, "23:59"),
      plate: seedPlate(fleet, "tesla-model-y", "je", 1),
      status: "returned",
      driver: {
        name: "Marcus Lim",
        email: "marcus.lim@example.com",
        phone: "87654321",
        dob: "1988-01-20",
        licenceNo: "S8812345A",
        licenceIssued: "2008-07-01"
      },
      card: {
        type: "Amex",
        last4: "0005",
        expiry: "03/29",
        name: "MARCUS LIM"
      },
      checkout: {
        at: at(-4, "10:05"),
        mileage: 30550,
        battery: 92,
        staff: "Jordan Lee",
        licenceChecked: true,
        cardChecked: true
      },
      returned: { at: at(0, "01:25"), carparkId: "je-gateway" }
    }),
    make({
      ref: "AZ-4D9P7S",
      userEmail: "siti.rahman@example.com",
      carId: "kia-ev9",
      branchId: "amk",
      returnCarparkId: "amk-hub",
      pickupAt: at(-8, "09:00"),
      returnAt: at(-1, "23:59"),
      plate: seedPlate(fleet, "kia-ev9", "amk", 0),
      status: "returned",
      extras: { childSeat: true, extraDriver: true, charger: false },
      insurance: "standard",
      driver: {
        name: "Siti Rahman",
        email: "siti.rahman@example.com",
        phone: "81239876",
        dob: "1985-11-11",
        licenceNo: "S8554321F",
        licenceIssued: "2006-02-10"
      },
      checkout: {
        at: at(-8, "09:10"),
        mileage: 12040,
        battery: 97,
        staff: "Jordan Lee",
        licenceChecked: true,
        cardChecked: true
      },
      returned: { at: at(-1, "08:45"), carparkId: "amk-hub" }
    }),
    make({
      ref: "AZ-9M2N6T",
      userEmail: "daniel.wong@example.com",
      carId: "byd-seal",
      branchId: "je",
      returnCarparkId: "je-21",
      pickupAt: at(-1, "15:00"),
      returnAt: at(29, "23:59"),
      plate: seedPlate(fleet, "byd-seal", "je", 0),
      status: "active",
      driver: {
        name: "Daniel Wong",
        email: "daniel.wong@example.com",
        phone: "90001234",
        dob: "1992-06-30",
        licenceNo: "S9234567B",
        licenceIssued: "2013-12-01"
      },
      checkout: {
        at: at(-1, "15:10"),
        mileage: 9870,
        battery: 99,
        staff: "Jordan Lee",
        licenceChecked: true,
        cardChecked: true
      }
    })
  ];

  bookings.forEach(b => {
    if (b.inspection) {
      b.bill = calculateBill(b);
      if (b.status === "completed") {
        b.bill.generatedAt = at(-42, "10:30");
        b.bill.paid = true;
        b.bill.paidAt = at(-42, "11:30");
        b.bill.paidBy = "Card ending " + b.card.last4;
      }
    }
  });

  saveData("users", DEMO_USERS.slice());
  saveData("fleet", fleet);
  saveData("bookings", bookings);
  saveData("seedVersion", SEED_VERSION);
}

const SEED_VERSION = 3;
