#!/usr/bin/env node
'use strict';
// Deterministic generator of messy bank/credit-card CSV exports + ground truth
// for evaluating a recurring-subscription detector. No dependencies.
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'data');

// ---------------------------------------------------------------- PRNG utils
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRng(seed) {
  const r = mulberry32(seed);
  const o = () => r();
  o.int = (a, b) => a + Math.floor(r() * (b - a + 1));
  o.pick = (arr) => arr[Math.floor(r() * arr.length)];
  o.chance = (p) => r() < p;
  o.norm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  o.logn = (med, sigma, lo, hi) =>
    Math.min(hi, Math.max(lo, Math.exp(Math.log(med) + sigma * o.norm())));
  const AL = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  o.alnum = (n) => { let s = ''; for (let i = 0; i < n; i++) s += AL[Math.floor(r() * AL.length)]; return s; };
  o.digits = (n) => { let s = ''; for (let i = 0; i < n; i++) s += Math.floor(r() * 10); return s; };
  o.weighted = (items) => {
    const tot = items.reduce((s, x) => s + x[0], 0);
    let x = r() * tot;
    for (const [w, v] of items) { if ((x -= w) < 0) return v; }
    return items[items.length - 1][1];
  };
  return o;
}

// ---------------------------------------------------------------- date utils
const DAY = 864e5;
const D = (y, m, d) => new Date(Date.UTC(y, m, d));
const addDays = (dt, n) => new Date(dt.getTime() + n * DAY);
const dim = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const pad = (n) => String(n).padStart(2, '0');
const fmtUS = (d) => `${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}/${d.getUTCFullYear()}`;
const fmtISO = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const fmtMD = (d) => `${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}`;
const daysBetween = (a, b) => Math.round((b - a) / DAY);

// Drift a nominal billing date by up to +-3 days, with weekend roll-forward.
function drift(rng, nom) {
  let off = 0;
  if (rng.chance(0.4)) off = rng.pick([-1, 1, 1, 2, -2, 3, -3, 2]);
  let d = addDays(nom, off);
  const dow = d.getUTCDay();
  if (dow === 6 && rng.chance(0.7)) d = addDays(d, 2);
  else if (dow === 0 && rng.chance(0.7)) d = addDays(d, 1);
  const diff = daysBetween(nom, d);
  if (Math.abs(diff) > 3) d = addDays(nom, Math.sign(diff) * 3);
  return d;
}

function monthSchedule(rng, win, anchor, step, firstIdx) {
  const out = [];
  const sy = win.start.getUTCFullYear(), sm = win.start.getUTCMonth();
  for (let k = firstIdx || 0; k < 60; k += step) {
    const y = sy + Math.floor((sm + k) / 12), mo = (sm + k) % 12;
    const nom = D(y, mo, Math.min(anchor, dim(y, mo)));
    if (nom > addDays(win.end, 3)) break;
    const dt = drift(rng, nom);
    if (dt < win.start || dt > win.end) continue;
    out.push(dt);
  }
  return out;
}
function annualSchedule(rng, win) {
  const t0 = addDays(win.start, rng.int(2, 20));
  const t1 = new Date(t0); t1.setUTCFullYear(t1.getUTCFullYear() + 1);
  return [t0, t1].map((n) => drift(rng, n)).filter((d) => d >= win.start && d <= win.end);
}
function weeklySchedule(rng, win) {
  const t = addDays(win.start, rng.int(0, 6));
  const out = [];
  for (let i = 0; ; i++) {
    const nom = addDays(t, 7 * i);
    if (nom > win.end) break;
    const d = rng.chance(0.12) ? addDays(nom, rng.pick([-1, 1])) : nom;
    if (d <= win.end) out.push(d);
  }
  return out;
}

// ---------------------------------------------------------------- misc fmt
const money = (n) => { const v = Math.round(n * 100) / 100; return v === 0 ? 0 : v; };
const csv = (s) => (/[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s);
function fmtAmt(n, thousands) {
  const neg = n < 0;
  const [i, f] = Math.abs(n).toFixed(2).split('.');
  const ii = thousands ? i.replace(/\B(?=(\d{3})+$)/g, ',') : i;
  return (neg ? '-' : '') + ii + '.' + f;
}

// ---------------------------------------------------------------- brands (all fictional)
const BRANDS = {
  nimbusflix: ['Nimbusflix', 'NIMBUSFLIX', 'Entertainment'],
  tunewave: ['Tunewave', 'TUNEWAVE', 'Entertainment'],
  pixelpod: ['PixelPod', 'PIXELPOD', 'Shopping'],
  kestrel: ['Kestrel News', 'KESTREL NEWS', 'Entertainment'],
  bluefern: ['BlueFern Cloud', 'BLUEFERN CLOUD', 'Shopping'],
  ironhouse: ['Ironhouse Fitness', 'IRONHOUSE FITNESS', 'Health & Wellness'],
  summit: ['SummitClimb Gym', 'SUMMITCLIMB GYM', 'Health & Wellness'],
  quillpad: ['Quillpad', 'QUILLPAD', 'Shopping'],
  orchard: ['Orchard Audio', 'ORCHARD AUDIO', 'Entertainment'],
  vaultly: ['Vaultly VPN', 'VAULTLY VPN', 'Shopping'],
  cobalt: ['Cobalt Games Pass', 'COBALT GAMES', 'Entertainment'],
  pawbox: ['PawBox', 'PAWBOX', 'Shopping'],
  clearview: ['ClearView Security', 'CLEARVIEW SECURITY', 'Shopping'],
  stackwell: ['StackWell', 'STACKWELL', 'Professional Services'],
  marigold: ['Marigold Meditation', 'MARIGOLD MEDITATION', 'Health & Wellness'],
  thistle: ['Thistle Reads', 'THISTLE READS', 'Entertainment'],
  skylark: ['Skylark Storage', 'SKYLARK STORAGE', 'Shopping'],
  fernway: ['Fernway Razor Club', 'FERNWAY RAZOR', 'Shopping'],
  cinder: ['Cinder Coffee Club', 'CINDER COFFEE', 'Food & Drink'],
  beacon: ['Beacon Credit Watch', 'BEACON CREDIT', 'Professional Services'],
  tandem: ['Tandem Translate', 'TANDEM TRANSLATE', 'Shopping'],
  driftwood: ['Driftwood Podcasts+', 'DRIFTWOOD PODCASTS', 'Entertainment'],
  pinecone: ['Pinecone Learning', 'PINECONE LEARNING', 'Education'],
  overland: ['Overland Maps Premium', 'OVERLAND MAPS', 'Travel'],
  brightpath: ['BrightPath Languages', 'BRIGHTPATH', 'Education'],
};
const CITIES = [['SEATTLE', 'WA'], ['SAN FRANCISCO', 'CA'], ['AUSTIN', 'TX'], ['NEW YORK', 'NY'],
  ['PORTLAND', 'OR'], ['DENVER', 'CO'], ['BOSTON', 'MA'], ['CHICAGO', 'IL'], ['ATLANTA', 'GA'],
  ['MIAMI', 'FL'], ['SALT LAKE CITY', 'UT'], ['MINNEAPOLIS', 'MN'], ['LOS GATOS', 'CA'], ['MENLO PARK', 'CA']];

function mkBrand(rng, key, ctx) {
  const [canon, tok, cat] = BRANDS[key];
  const [city, st] = rng.pick(CITIES);
  return {
    canon, tok, cat, city, st,
    phone: { a: rng.pick(['800', '888', '866', '877', '855', '844']), b: '555', c: '01' + rng.digits(2) },
    ppPhone: '402935' + rng.digits(4),
    card: ctx.card4,
  };
}

const STYLES_BANK = ['dotcom', 'starref', 'sq', 'paypal', 'tst', 'recur', 'pos', 'debit', 'ach', 'sp', 'www'];
const STYLES_CARD = ['dotcom', 'starref', 'sq', 'paypal', 'tst', 'recur', 'sp', 'www'];
const GYM_BANK = ['recur', 'ach', 'debit', 'sq', 'starref'];
const GYM_CARD = ['recur', 'sq', 'starref', 'tst'];

function mkDesc(rng, b, style, date) {
  const T = b.tok, C = T.replace(/ /g, '');
  const ph = () => { const p = b.phone; return rng.pick([p.a + p.b + p.c, p.a + '-' + p.b + '-' + p.c]); };
  const sp = () => (rng.chance(0.25) ? '  ' : ' ');
  switch (style) {
    case 'dotcom': {
      const p = [C + '.COM'];
      if (rng.chance(0.7)) p.push(ph());
      if (rng.chance(0.75)) p.push(b.st);
      return p.join(sp());
    }
    case 'starref': {
      let s = C + '*' + rng.alnum(rng.int(7, 10));
      if (rng.chance(0.55)) s += ' ' + b.city + ' ' + b.st;
      else if (rng.chance(0.5)) s += ' ' + ph();
      return s;
    }
    case 'sq': {
      let s = 'SQ *' + T.slice(0, 20);
      if (rng.chance(0.7)) s += ' ' + b.city;
      if (rng.chance(0.3)) s += ' ' + b.st;
      return s;
    }
    case 'paypal':
      return 'PAYPAL *' + C.slice(0, rng.int(7, 10)) + (rng.chance(0.85) ? ' ' + b.ppPhone : '');
    case 'tst': {
      let s = 'TST* ' + T;
      if (rng.chance(0.5)) s += ' - ' + b.city;
      else if (rng.chance(0.5)) s += ' ' + rng.digits(4);
      return s;
    }
    case 'recur':
      return T + ' RECURRING PMT' + (rng.chance(0.5) ? ' #' + rng.digits(6) : '') + (rng.chance(0.3) ? ' ' + b.st : '');
    case 'pos': {
      const p = b.phone;
      return `PURCHASE AUTHORIZED ON ${fmtMD(addDays(date, -rng.int(1, 2)))} ${C}.COM ${p.a}-${p.b}-${p.c} ${b.st} S${rng.digits(15)} CARD ${b.card}`;
    }
    case 'debit':
      return (rng.chance(0.5) ? 'DEBIT CARD PURCHASE ' : 'POS DEBIT - ') + T + ' ' + b.city + ' ' + b.st;
    case 'ach':
      return 'ACH DEBIT ' + T + ' INC ' + rng.digits(8);
    case 'sp':
      return 'SP ' + T + (rng.chance(0.5) ? ' ' + rng.digits(5) : '');
    case 'www':
      return 'WWW.' + C + '.COM ' + b.city + ' ' + b.st + (rng.chance(0.3) ? ' ' + rng.alnum(6) : '');
    default:
      throw new Error('style ' + style);
  }
}

// Build one billing stream for a subscription.
function mkStream(rng, win, b, cfg, pool) {
  let dates;
  if (cfg.cad === 'monthly') dates = monthSchedule(rng, win, cfg.anchor, 1, cfg.firstIdx || 0);
  else if (cfg.cad === 'quarterly') dates = monthSchedule(rng, win, cfg.anchor, 3, 0);
  else if (cfg.cad === 'annual') dates = annualSchedule(rng, win);
  else if (cfg.cad === 'weekly') dates = weeklySchedule(rng, win);
  else throw new Error('cad');
  if (cfg.trial === 'none') dates = dates.slice(1);
  let amts = dates.map(() => cfg.price);
  if (cfg.trial === 'zero') amts[0] = 0;
  if (cfg.cancelAfter) { dates = dates.slice(0, cfg.cancelAfter); amts = amts.slice(0, cfg.cancelAfter); }
  if (cfg.inc) {
    if (cfg.inc.idx < 1 || cfg.inc.idx >= dates.length) throw new Error('bad inc idx for ' + b.canon + ' len ' + dates.length);
    for (let i = cfg.inc.idx; i < amts.length; i++) amts[i] = cfg.inc.price;
  }
  const primary = cfg.forbidStyle ? rng.pick(pool.filter((s) => s !== cfg.forbidStyle)) : (cfg.style || rng.pick(pool));
  const others = pool.filter((s) => s !== primary);
  const secondary = rng.chance(0.35) ? rng.pick(others) : null;
  let migrateAt = null, migrateTo = null;
  if (cfg.migrate) { migrateAt = rng.int(4, 8); migrateTo = rng.pick(others); }
  const rows = dates.map((d, i) => {
    let style = migrateAt !== null && i >= migrateAt ? migrateTo : primary;
    if (secondary && rng.chance(0.2)) style = secondary;
    return { date: d, desc: mkDesc(rng, b, style, d), amount: money(-amts[i]), cat: b.cat };
  });
  return { rows, primary };
}

// ---------------------------------------------------------------- recurring bills
const RENTS = [
  { canon: 'Harborview Apartments', t: (r) => r.pick(['HARBORVIEW APTS RENT PMT', 'HARBORVIEW APARTMENTS ONLINE PMT ' + r.digits(6), 'ACH HARBORVIEW PROP MGMT RENT']) },
  { canon: 'Maple Court Property Management', t: (r) => r.pick(['MAPLECOURT PM RENT ACH ' + r.digits(7), 'MAPLE COURT PROPERTY MGMT PPD ID ' + r.digits(10)]) },
  { canon: 'Rent to D. Okafor (Zelle)', t: (r) => 'ZELLE PAYMENT TO D OKAFOR RENT ' + r.alnum(10) },
];

function billRows(rng, win, ctx, bc) {
  const rows = [];
  let canon, anchor, step = 1, amtFn, descFn, varies = false, inc = null;
  switch (bc.k) {
    case 'rent': {
      const v = RENTS[bc.variant || 0];
      canon = v.canon; anchor = bc.anchor || 1; descFn = v.t;
      amtFn = (i) => (bc.inc && i >= bc.inc.idx ? bc.inc.amt : bc.amt);
      inc = bc.inc;
      break;
    }
    case 'electric': {
      canon = 'CityLight Electric'; anchor = rng.int(8, 25); varies = true;
      const base = rng.int(55, 85), amp = rng.int(25, 55), peak = rng.pick([0, 6, 7]);
      descFn = (r) => r.weighted([[4, 'CITYLIGHT ELECTRIC AUTOPAY'], [3, 'CITYLIGHT ELECTRIC BILL PAY ' + r.digits(8)], [2, 'CITYLIGHT ELEC PMT ' + r.alnum(6)]]);
      amtFn = (i, d) => Math.max(28, base + amp * (0.5 + 0.5 * Math.cos(2 * Math.PI * (d.getUTCMonth() - peak) / 12)) + rng.norm() * 6);
      break;
    }
    case 'internet': {
      canon = 'Skywire Broadband'; anchor = rng.int(5, 25);
      descFn = (r) => r.pick(['SKYWIRE BROADBAND AUTOPAY', 'SKYWIRE INTERNET ' + r.digits(9), 'SKYWIRE*BROADBAND 800-555-01' + r.digits(2)]);
      amtFn = (i) => (bc.inc && i >= bc.inc.idx ? bc.inc.amt : 64.99);
      inc = bc.inc;
      break;
    }
    case 'phone': {
      canon = 'Northstar Wireless'; anchor = rng.int(3, 27); varies = true;
      descFn = (r) => r.pick(['NORTHSTAR WIRELESS AUTOPAY', 'NORTHSTAR WIRELESS ' + r.digits(10), 'NORTHSTAR WLS PMT ' + r.alnum(5)]);
      amtFn = () => rng.pick([58.43, 58.43, 59.12, 61.07]);
      break;
    }
    case 'insurance': {
      canon = 'Heartland Mutual Auto Insurance'; anchor = rng.int(10, 24);
      descFn = (r) => 'HEARTLAND MUTUAL AUTO INS PREM ' + r.digits(8);
      amtFn = () => 112.40;
      break;
    }
    case 'water': {
      canon = 'Riverbend Water & Sewer'; anchor = rng.int(10, 24); step = 3; varies = true;
      descFn = (r) => r.pick(['RIVERBEND WATER & SEWER', 'RIVERBEND WATER UTIL ' + r.digits(7)]);
      amtFn = () => rng.logn(92, 0.2, 60, 140);
      break;
    }
    default: throw new Error('bill ' + bc.k);
  }
  const dates = monthSchedule(rng, win, anchor, step, bc.k === 'water' ? rng.int(0, 2) : 0);
  dates.forEach((d, i) => {
    rows.push({ date: d, desc: descFn(rng), amount: money(-amtFn(i, d)), cat: 'Bills & Utilities' });
  });
  return {
    rows,
    entry: {
      merchant: canon, kind: 'recurring_bill', cadence: step === 3 ? 'quarterly' : 'monthly',
      price_increase: !!inc, duplicate: false, amount_varies: varies,
    },
  };
}

// ---------------------------------------------------------------- installments
function installmentRows(rng, win, ic) {
  const ey = win.end.getUTCFullYear(), em = win.end.getUTCMonth();
  const baseDay = rng.int(3, 26);
  const ref = rng.digits(5);
  const rows = [];
  for (let i = 0; i < ic.n; i++) {
    const k = em - ic.mb + i;
    const y = ey + Math.floor(k / 12), mo = ((k % 12) + 12) % 12;
    const d = drift(rng, D(y, mo, baseDay));
    if (d < win.start || d > win.end) continue;
    const n = i + 1;
    let desc;
    if (ic.form === 'plain') desc = `PAYLATER INSTALLMENT ${n} OF ${ic.n}` + (rng.chance(0.6) ? ' ORDER ' + ref + rng.digits(2) : '');
    else desc = `PAYLATER*${ic.merchant} INSTALLMENT ${n} OF ${ic.n}` + (rng.chance(0.4) ? ' ' + rng.alnum(6) : '');
    const amt = i === ic.n - 1 ? ic.amount + 0.02 : ic.amount;
    rows.push({ date: d, desc, amount: money(-amt), cat: 'Shopping', ord: n });
  }
  return {
    rows,
    entry: {
      merchant: ic.form === 'plain' ? 'PayLater installment plan (ZoomArt order)' : `PayLater installment plan (${ic.merchant})`,
      kind: 'installment', cadence: 'monthly',
      active: rows.length > 0 && rows[rows.length - 1].ord < ic.n,
      price_increase: false, duplicate: false, plan_length: ic.n,
    },
  };
}

// ---------------------------------------------------------------- background (non-recurring) generators
const GROCERY = ['GREENBASKET MARKET', 'FRESHWAY SUPERSTORE', 'CORNERSTONE FOODS', 'HARVEST CO-OP'];
function groceryRows(rng, win, ctx, gap) {
  const main = rng.pick(GROCERY), mainNo = rng.digits(4), [city, st] = rng.pick(CITIES);
  const rows = [];
  let d = addDays(win.start, rng.int(0, 4));
  while (d <= win.end) {
    let desc;
    if (rng.chance(0.6)) {
      desc = rng.pick([`${main} #${mainNo} ${city} ${st}`, `${main} #${mainNo.replace(/^0+/, '')}`, `POS DEBIT ${main} ${city}`, `${main} ${mainNo}`]);
    } else {
      const o = rng.pick(GROCERY);
      desc = `${o} #${rng.digits(4)} ${rng.pick(CITIES)[1]}`;
    }
    rows.push({ date: d, desc, amount: money(-rng.logn(78, 0.45, 14, 230)), cat: 'Groceries' });
    d = addDays(d, rng.int(gap[0], gap[1]));
  }
  return rows;
}
function coffeeRows(rng, win, p) {
  const rows = [];
  const amts = [4.25, 4.5, 4.75, 4.75, 5.25, 5.5, 5.5, 5.75, 6.25];
  for (let d = win.start; d <= win.end; d = addDays(d, 1)) {
    const wk = d.getUTCDay() % 6 === 0;
    if (!rng.chance(wk ? p * 0.5 : p * 1.3)) continue;
    const desc = rng.weighted([
      [3, 'SQ *BEANBOX COFFEE'], [2, 'SQ *BEANBOX COFFEE SEATTLE'], [2, 'TST* BEANBOX COFFEE #' + rng.digits(4)], [1, 'BEANBOX COFFEE ROASTERS 0231'],
    ]);
    rows.push({ date: d, desc, amount: money(-rng.pick(amts)), cat: 'Food & Drink' });
  }
  return rows;
}
function nextDow(d, dow) { let x = d; while (x.getUTCDay() !== dow) x = addDays(x, 1); return x; }
function payrollRows(rng, win, pc) {
  const rows = [];
  const id = rng.digits(10), E = pc.employer;
  const descFn = () => rng.pick([`${E} PAYROLL DIRECT DEP`, `${E} DIRECT DEP PPD ID ${id}`, `DIRECT DEPOSIT ${E} ${rng.digits(6)}`]);
  const amt = () => money(pc.net + rng.int(-25, 25) + (rng.chance(0.06) ? rng.int(200, 900) : 0));
  if (pc.mode === 'biweekly') {
    for (let d = nextDow(addDays(win.start, rng.int(0, 6)), 5); d <= win.end; d = addDays(d, 14))
      rows.push({ date: d, desc: descFn(), amount: amt(), cat: 'Income' });
  } else {
    const sy = win.start.getUTCFullYear(), sm = win.start.getUTCMonth();
    for (let k = 0; k < 15; k++) {
      const y = sy + Math.floor((sm + k) / 12), mo = (sm + k) % 12;
      for (const day of [15, dim(y, mo)]) {
        let d = D(y, mo, day);
        if (d.getUTCDay() === 6) d = addDays(d, -1); else if (d.getUTCDay() === 0) d = addDays(d, -2);
        if (d >= win.start && d <= win.end) rows.push({ date: d, desc: descFn(), amount: amt(), cat: 'Income' });
      }
    }
  }
  return rows;
}

const RESTS = ['SQ *TACO LUNA', 'TST* RAMEN HOUSE KAI', 'CHEZ MILO BISTRO', 'PIZZA PORT #2231', 'DASHDINE*BURGER YARD',
  'DASHDINE*THAI ORCHID', 'SMOKEHOUSE 22 BBQ', 'LITTLE ITALY TRATTORIA', 'SQ *FRESH BOWL', 'SUSHI GARDEN #4', 'TST* THE HOPPY PINT', 'DINER 99'];
const GAS = ['FUELSTOP #3321', 'ROADRUNNER GAS 884', 'QUIKFILL 0127', 'CIRCLE PEAK FUEL #55'];
const MISC = ['HOMEHARBOR HARDWARE #77', 'THREADBARE APPAREL 112', 'PAGEMARK BOOKS', 'PETPAL SUPPLY #38', 'CINEPLEX 12 TICKETS', 'LAUNDRY LOUNGE'];
const NAMES = ['JORDAN LEE', 'PRIYA SHAH', 'MIGUEL TORRES', 'AMY CHEN', 'SAM OKAFOR', 'DANA REYES'];
const W_BANK = [[26, 'rest'], [13, 'gas'], [9, 'ride'], [17, 'mkt'], [6, 'pharm'], [9, 'misc'], [6, 'atm'], [9, 'xfer'], [5, 'refund']];
const W_CARD = [[30, 'rest'], [14, 'gas'], [11, 'ride'], [20, 'mkt'], [7, 'pharm'], [12, 'misc'], [6, 'refund']];

function fillerRows(rng, ctx, date) {
  const k = rng.weighted(ctx.isCard ? W_CARD : W_BANK);
  const [city, st] = rng.pick(CITIES);
  switch (k) {
    case 'rest':
      return [{ date, desc: rng.pick(RESTS) + (rng.chance(0.4) ? ' ' + city : ''), amount: money(-rng.logn(34, 0.55, 8, 140)), cat: 'Food & Drink' }];
    case 'gas':
      return [{ date, desc: rng.pick(GAS) + (rng.chance(0.5) ? ' ' + city + ' ' + st : ''), amount: money(-rng.logn(41, 0.3, 20, 72)), cat: 'Gas' }];
    case 'ride':
      return [{ date, desc: rng.pick(['RIDEO *TRIP HELP.RIDEO.COM CA', 'RIDEO *TRIP', 'ZIPCAB*TRIP ' + rng.digits(4)]), amount: money(-rng.logn(17, 0.5, 6, 52)), cat: 'Travel' }];
    case 'mkt':
      return [{
        date, amount: money(-rng.logn(32, 0.8, 5, 190)), cat: 'Shopping',
        desc: rng.pick(['ZOOMART MKTPLACE*' + rng.alnum(9), 'ZOOMART.COM*' + rng.alnum(8) + ' WA', 'SHOPNEST.COM ORDER ' + rng.digits(8), 'ZOOMART MKTPLACE PMTS ' + rng.alnum(9)]),
      }];
    case 'pharm':
      return [{ date, desc: rng.pick(['GREENCROSS PHARMACY #0912', 'GREENCROSS PHARMACY, INC #0' + rng.digits(3), 'RX CARE DRUG 0044']), amount: money(-rng.logn(16, 0.6, 3, 75)), cat: 'Health & Wellness' }];
    case 'misc':
      return [{ date, desc: rng.pick(MISC), amount: money(-rng.logn(34, 0.6, 7, 140)), cat: 'Shopping' }];
    case 'atm': {
      const out = [{ date, desc: 'ATM WITHDRAWAL FIRSTRIVER ' + rng.digits(4), amount: -rng.pick([20, 40, 60, 80, 100, 200]), cat: 'Cash' }];
      if (rng.chance(0.4)) out.push({ date, desc: 'NON-NETWORK ATM FEE', amount: -3.00, cat: 'Fees & Adjustments', type: 'Fee' });
      return out;
    }
    case 'xfer': {
      const r = rng.int(0, 4);
      if (r === 0) return [{ date, desc: 'ONLINE TRANSFER TO SAVINGS XXXXX4412', amount: -25 * rng.int(4, 24), cat: 'Transfer' }];
      if (r === 1) return [{ date, desc: 'ONLINE TRANSFER FROM SAVINGS XXXXX4412', amount: 25 * rng.int(4, 20), cat: 'Transfer' }];
      if (r === 2) return [{ date, desc: 'ZELLE PAYMENT FROM ' + rng.pick(NAMES) + ' ' + rng.alnum(10), amount: money(rng.int(15, 180)), cat: 'Transfer' }];
      if (r === 3) return [{ date, desc: 'ZELLE PAYMENT TO ' + rng.pick(NAMES) + ' ' + rng.alnum(10), amount: money(-rng.int(15, 150)), cat: 'Transfer' }];
      return [{ date, desc: 'VENMO CASHOUT ' + rng.digits(10), amount: money(rng.int(20, 140)), cat: 'Transfer' }];
    }
    case 'refund':
      return [{
        date, amount: money(rng.logn(24, 0.7, 4, 90)), cat: 'Shopping', type: 'Return',
        desc: rng.pick(['REFUND ZOOMART.COM*' + rng.alnum(8), 'RETURN THREADBARE APPAREL 112', 'REFUND SHOPNEST.COM ' + rng.digits(8), 'RETURN HOMEHARBOR HARDWARE #77']),
      }];
    default: throw new Error(k);
  }
}

// ---------------------------------------------------------------- account configs
const ACCTS = [
  { // standard 3 column, US dates, newest first
    file: 'acct1.csv', seed: 710101, layout: 'basic', dateFmt: 'us', order: 'desc', card: false, offset: 3,
    payroll: { mode: 'biweekly', employer: 'ACME ROBOTICS', net: 2140 },
    bills: [{ k: 'rent', variant: 0, amt: 1475, inc: { idx: 6, amt: 1525 } }, { k: 'electric' }, { k: 'internet', inc: { idx: 8, amt: 69.99 } }],
    installments: [{ n: 4, amount: 37.25, mb: 9, form: 'plain' }],
    target: 285, gap: [5, 9], coffeeP: 0.09,
    subs: [
      { brand: 'nimbusflix', cad: 'monthly', price: 15.49, inc: { idx: 6, price: 17.99 } },
      { brand: 'tunewave', cad: 'monthly', price: 10.99, dup: true },
      { brand: 'ironhouse', cad: 'monthly', price: 39.95, gym: true },
      { brand: 'bluefern', cad: 'monthly', price: 2.99, migrate: true },
      { brand: 'quillpad', cad: 'annual', price: 47.99 },
      { brand: 'cobalt', cad: 'monthly', price: 9.99, cancelAfter: 7 },
      { brand: 'fernway', cad: 'quarterly', price: 24.00 },
      { brand: 'orchard', cad: 'monthly', price: 14.95, trial: 'zero' },
    ],
  },
  { // credit card, Transaction Date/Post Date/Description/Category/Type/Amount
    file: 'acct2.csv', seed: 820202, layout: 'chase', dateFmt: 'us', order: 'desc', card: true, offset: 9,
    payroll: null,
    bills: [{ k: 'electric' }, { k: 'phone' }],
    installments: [{ n: 6, amount: 68.33, mb: 4, form: 'merchant', merchant: 'SKYLINE FURNITURE' }],
    target: 300, gap: [5, 9], coffeeP: 0.09,
    subs: [
      { brand: 'kestrel', cad: 'monthly', price: 4.00, inc: { idx: 5, price: 6.00 } },
      { brand: 'skylark', cad: 'monthly', price: 1.99 },
      { brand: 'marigold', cad: 'annual', price: 69.99, inc: { idx: 1, price: 79.99 } },
      { brand: 'thistle', cad: 'monthly', price: 9.99, cancelAfter: 8 },
      { brand: 'summit', cad: 'monthly', price: 62.00, gym: true },
      { brand: 'driftwood', cad: 'monthly', price: 5.99, trial: 'none' },
      { brand: 'vaultly', cad: 'annual', price: 59.99 },
      { brand: 'beacon', cad: 'monthly', price: 19.99, migrate: true },
    ],
  },
  { // ISO dates, oldest first
    file: 'acct3.csv', seed: 930303, layout: 'basic', dateFmt: 'iso', order: 'asc', card: false, offset: 12,
    payroll: { mode: 'semimonthly', employer: 'CASCADE UNIVERSITY', net: 1685 },
    bills: [{ k: 'rent', variant: 1, amt: 1320, anchor: 3 }, { k: 'electric' }, { k: 'water' }],
    installments: [{ n: 4, amount: 52.50, mb: 6, form: 'plain' }],
    target: 255, gap: [5, 9], coffeeP: 0.12,
    subs: [
      { brand: 'tunewave', cad: 'monthly', price: 10.99, inc: { idx: 7, price: 11.99 } },
      { brand: 'pawbox', cad: 'quarterly', price: 29.95 },
      { brand: 'pinecone', cad: 'monthly', price: 29.99, trial: 'zero' },
      { brand: 'cinder', cad: 'monthly', price: 18.00, cancelAfter: 6 },
      { brand: 'overland', cad: 'annual', price: 19.99 },
      { brand: 'summit', cad: 'monthly', price: 45.00, gym: true },
      { brand: 'skylark', cad: 'monthly', price: 2.99, dup: true },
      { brand: 'tandem', cad: 'monthly', price: 7.99 },
    ],
  },
  { // Date,Payee,Debit,Credit
    file: 'acct4.csv', seed: 140404, layout: 'split', dateFmt: 'us', order: 'desc', card: false, offset: 0,
    payroll: { mode: 'biweekly', employer: 'LUMEN HEALTH SYSTEMS', net: 2415 },
    bills: [{ k: 'rent', variant: 2, amt: 1650, anchor: 1 }, { k: 'electric' }, { k: 'insurance' }],
    installments: [{ n: 6, amount: 41.00, mb: 3, form: 'plain' }],
    target: 330, gap: [5, 9], coffeeP: 0.08,
    subs: [
      { brand: 'orchard', cad: 'monthly', price: 14.95 },
      { brand: 'nimbusflix', cad: 'monthly', price: 8.99, inc: { idx: 5, price: 9.99 } },
      { brand: 'vaultly', cad: 'annual', price: 59.99 },
      { brand: 'clearview', cad: 'annual', price: 39.99 },
      { brand: 'ironhouse', cad: 'monthly', price: 24.99, gym: true, inc: { idx: 7, price: 29.99 } },
      { brand: 'beacon', cad: 'monthly', price: 19.99, cancelAfter: 9 },
      { brand: 'quillpad', cad: 'monthly', price: 3.99 },
      { brand: 'brightpath', cad: 'weekly', price: 4.99 },
    ],
  },
  { // many subs, thousands separators, oldest first
    file: 'acct5.csv', seed: 550505, layout: 'basic', dateFmt: 'us', order: 'asc', card: false, offset: 7, thousands: true,
    payroll: { mode: 'semimonthly', employer: 'NORTHBEAM LOGISTICS', net: 2290 },
    bills: [{ k: 'rent', variant: 0, amt: 1890 }, { k: 'electric' }, { k: 'phone' }],
    installments: [{ n: 4, amount: 29.75, mb: 10, form: 'plain' }, { n: 6, amount: 84.17, mb: 3, form: 'merchant', merchant: 'TRAILHEAD OUTDOORS' }],
    target: 340, gap: [6, 10], coffeeP: 0.07,
    subs: [
      { brand: 'nimbusflix', cad: 'monthly', price: 15.49 },
      { brand: 'tunewave', cad: 'monthly', price: 10.99, dup: true },
      { brand: 'thistle', cad: 'monthly', price: 9.99 },
      { brand: 'cobalt', cad: 'monthly', price: 9.99, inc: { idx: 7, price: 11.99 } },
      { brand: 'stackwell', cad: 'monthly', price: 4.00 },
      { brand: 'pixelpod', cad: 'monthly', price: 2.99, cancelAfter: 5 },
      { brand: 'ironhouse', cad: 'monthly', price: 39.95, gym: true },
      { brand: 'driftwood', cad: 'monthly', price: 5.99, trial: 'zero' },
      { brand: 'kestrel', cad: 'annual', price: 89.00 },
      { brand: 'fernway', cad: 'quarterly', price: 24.00 },
      { brand: 'tandem', cad: 'monthly', price: 7.99 },
    ],
  },
];

// ---------------------------------------------------------------- build one account
function pickExamples(rows) {
  const seen = [];
  for (const r of rows) if (!seen.includes(r.desc)) seen.push(r.desc);
  if (seen.length <= 4) return seen;
  return [0, 1, 2, 3].map((i) => seen[Math.floor(i * (seen.length - 1) / 3)]);
}
function activeByDate(cad, rows, win) {
  const last = rows.reduce((m, r) => (r.date > m ? r.date : m), rows[0].date);
  const thr = { weekly: 21, monthly: 55, quarterly: 120, annual: 400 }[cad];
  return daysBetween(last, win.end) <= thr;
}
const iso = fmtISO;

function buildAccount(cfg) {
  const rng = makeRng(cfg.seed);
  const start = D(2025, 8, 1 + cfg.offset);
  const e = new Date(start); e.setUTCMonth(e.getUTCMonth() + 13);
  const win = { start, end: addDays(e, -1) };
  const ctx = { card4: rng.digits(4), isCard: cfg.card };
  const rows = [];
  const truth = [];

  // subscriptions
  for (const sc of cfg.subs) {
    const b = mkBrand(rng, sc.brand, ctx);
    const pool = sc.gym ? (cfg.card ? GYM_CARD : GYM_BANK) : (cfg.card ? STYLES_CARD : STYLES_BANK);
    const anchor = sc.anchor || rng.int(1, 31);
    const s1 = mkStream(rng, win, b, { ...sc, anchor }, pool);
    let all = s1.rows.slice();
    const groups = [pickExamples(s1.rows)];
    if (sc.dup) {
      const a2 = anchor + 12 <= 28 ? anchor + rng.int(10, 14) : anchor - rng.int(10, 14);
      const s2 = mkStream(rng, win, b, { cad: sc.cad, price: sc.price, anchor: Math.max(1, Math.min(28, a2)), forbidStyle: s1.primary }, pool);
      all = all.concat(s2.rows);
      groups.push(pickExamples(s2.rows));
    }
    all.sort((x, y) => x.date - y.date);
    rows.push(...all);
    const nz = [...new Set(all.map((r) => -r.amount).filter((x) => x > 0))];
    const active = activeByDate(sc.cad, all, win);
    if (sc.cancelAfter && active) throw new Error('cancelled sub still active: ' + b.canon);
    if (!sc.cancelAfter && !active) throw new Error('active sub looks inactive: ' + b.canon + ' ' + cfg.file);
    if (!!sc.inc !== (nz.length > 1)) throw new Error('price increase mismatch ' + b.canon);
    const entry = {
      merchant: b.canon, kind: 'subscription', cadence: sc.cad, active,
      price_increase: nz.length > 1, duplicate: !!sc.dup, occurrences: all.length,
      descriptor_examples: sc.dup ? groups.flat() : groups[0],
    };
    if (sc.dup) entry.descriptor_groups = groups;
    entry.trial = sc.trial === 'zero' ? 'zero_dollar_row' : sc.trial === 'none' ? 'no_charge_before_first_paid' : null;
    entry.is_gym = !!sc.gym;
    entry.first_date = iso(all[0].date);
    entry.last_date = iso(all[all.length - 1].date);
    entry.amounts = nz.sort((a, b2) => a - b2);
    truth.push(entry);
  }

  // recurring bills
  for (const bc of cfg.bills) {
    const r = billRows(rng, win, ctx, bc);
    rows.push(...r.rows);
    truth.push({
      merchant: r.entry.merchant, kind: 'recurring_bill', cadence: r.entry.cadence, active: true,
      price_increase: r.entry.price_increase, duplicate: false, occurrences: r.rows.length,
      descriptor_examples: pickExamples(r.rows), amount_varies: r.entry.amount_varies,
      first_date: iso(r.rows[0].date), last_date: iso(r.rows[r.rows.length - 1].date),
    });
  }

  // installments
  for (const ic of cfg.installments) {
    const r = installmentRows(rng, win, ic);
    if (r.rows.length < 3) throw new Error('installment too short');
    rows.push(...r.rows);
    truth.push({
      ...r.entry, occurrences: r.rows.length, descriptor_examples: pickExamples(r.rows),
      first_date: iso(r.rows[0].date), last_date: iso(r.rows[r.rows.length - 1].date),
    });
  }

  // income / card payments
  if (cfg.payroll) rows.push(...payrollRows(rng, win, cfg.payroll));
  if (cfg.card) {
    for (const d of monthSchedule(rng, win, 21, 1, 0))
      rows.push({ date: d, desc: rng.pick(['AUTOMATIC PAYMENT - THANK YOU', 'PAYMENT THANK YOU - WEB']), amount: money(rng.int(80000, 150000) / 100), cat: '', type: 'Payment' });
  }

  // hard negatives: groceries (weekly-ish, varying) and coffee (frequent, irregular)
  rows.push(...groceryRows(rng, win, ctx, cfg.gap));
  rows.push(...coffeeRows(rng, win, cfg.coffeeP));

  // filler
  const nFill = Math.max(25, cfg.target - rows.length);
  const span = daysBetween(win.start, win.end);
  for (let i = 0; i < nFill; i++) rows.push(...fillerRows(rng, ctx, addDays(win.start, rng.int(0, span))));

  // order
  rows.forEach((r, i) => { r._i = i; });
  rows.sort((a, b) => a.date - b.date || a._i - b._i);
  if (cfg.order === 'desc') rows.reverse();

  // serialise
  const fd = cfg.dateFmt === 'iso' ? fmtISO : fmtUS;
  const lines = [];
  if (cfg.layout === 'basic') {
    lines.push('Date,Description,Amount');
    for (const r of rows) lines.push([fd(r.date), csv(r.desc), csv(fmtAmt(r.amount, cfg.thousands))].join(','));
  } else if (cfg.layout === 'chase') {
    lines.push('Transaction Date,Post Date,Description,Category,Type,Amount');
    for (const r of rows) {
      let pd = addDays(r.date, rng.int(0, 2));
      if (pd.getUTCDay() === 6) pd = addDays(pd, 2); else if (pd.getUTCDay() === 0) pd = addDays(pd, 1);
      const type = r.type || (r.amount < 0 ? 'Sale' : 'Return');
      lines.push([fd(r.date), fd(pd), csv(r.desc), csv(r.cat), type, fmtAmt(r.amount)].join(','));
    }
  } else if (cfg.layout === 'split') {
    lines.push('Date,Payee,Debit,Credit');
    for (const r of rows) {
      const a = Math.abs(r.amount).toFixed(2);
      lines.push([fd(r.date), csv(r.desc), r.amount <= 0 ? a : '', r.amount > 0 ? a : ''].join(','));
    }
  }
  return { csvText: lines.join('\n') + '\n', nRows: rows.length, truth };
}

// ---------------------------------------------------------------- main
function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const truthAll = {};
  for (const cfg of ACCTS) {
    const res = buildAccount(cfg);
    const nSubs = res.truth.filter((t) => t.kind === 'subscription').length;
    if (res.nRows < 150 || res.nRows > 400) throw new Error(`${cfg.file}: ${res.nRows} rows out of range`);
    if (nSubs < 4 || nSubs > 12) throw new Error(`${cfg.file}: ${nSubs} subs out of range`);
    fs.writeFileSync(path.join(OUT, cfg.file), res.csvText);
    truthAll[cfg.file] = res.truth;
    console.log(`${cfg.file}: ${res.nRows} rows, ${res.truth.length} truth entries (${nSubs} subscriptions)`);
  }
  fs.writeFileSync(path.join(OUT, 'truth.json'), JSON.stringify(truthAll, null, 2) + '\n');
}
main();
