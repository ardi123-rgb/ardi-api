const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "ardi-sc-ice-blue-secret-2025";
const JWT_TTL = "7d";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDigits(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += randomInt(0, 9);
  return s;
}

const RARITY_WEIGHTS = [
  { score: 0, weight: 40 },
  { score: 4, weight: 25 },
  { score: 5, weight: 12 },
  { score: 6, weight: 8 },
  { score: 7, weight: 7 },
  { score: 8, weight: 4 },
  { score: 9, weight: 2 },
  { score: 10, weight: 1 },
  { score: 11, weight: 1 },
];

function rollRarity() {
  const total = RARITY_WEIGHTS.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;
  for (const rw of RARITY_WEIGHTS) {
    r -= rw.weight;
    if (r <= 0) return rw.score;
  }
  return 0;
}

function makeRepeatedDigitId(score, length = 10) {
  const digit = randomInt(0, 9);
  const others = length - score;
  let arr = [];
  for (let i = 0; i < score; i++) arr.push(String(digit));
  for (let i = 0; i < others; i++) {
    let d;
    do {
      d = randomInt(0, 9);
    } while (d === digit);
    arr.push(String(d));
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (arr[0] === "0") {
    const swapIdx = arr.findIndex((x) => x !== "0");
    if (swapIdx > 0) [arr[0], arr[swapIdx]] = [arr[swapIdx], arr[0]];
  }
  return arr.join("");
}

function makeUniqueBlockId() {
  const blockLen = randomInt(2, 3);
  let block = "";
  for (let i = 0; i < blockLen; i++) block += randomInt(0, 9);
  if (new Set(block).size === 1) block = "1" + block.slice(1);
  const repeat = randomInt(3, 4);
  const id = block.repeat(repeat);
  return id[0] === "0" ? "1" + id.slice(1) : id;
}

function makeCommonId(length = 10) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const id = randomDigits(length);
    const freq = {};
    for (const c of id) freq[c] = (freq[c] || 0) + 1;
    const maxRep = Math.max(...Object.values(freq));
    if (maxRep < 4) return id[0] === "0" ? "1" + id.slice(1) : id;
  }
  return randomDigits(length);
}

function generateAccountId() {
  const score = rollRarity();
  if (score === 0) {
    if (Math.random() < 0.15) return makeUniqueBlockId();
    return makeCommonId();
  }
  if (score >= 11) {
    const digit = randomInt(0, 9);
    return String(digit).repeat(10);
  }
  return makeRepeatedDigitId(score);
}

const FIRST_NAMES = [
  "Budi", "Siti", "Agus", "Dewi", "Rian", "Maya", "Fajar", "Nadia",
  "Arif", "Lina", "Reza", "Putri", "Bagas", "Sari", "Yoga", "Indah",
  "Hendra", "Ayu", "Dimas", "Ratna",
];
const LAST_NAMES = [
  "Pratama", "Sari", "Wijaya", "Lestari", "Kurniawan", "Anggraini",
  "Saputra", "Maharani", "Nugroho", "Permata",
];

function generateName(prefix) {
  const fn = pick(FIRST_NAMES);
  const ln = pick(LAST_NAMES);
  return `${prefix || "ARDI"}${fn}${ln}${randomInt(1, 999)}`;
}

function generateUid() {
  return (
    randomInt(100000000, 999999999).toString() +
    randomInt(100, 999).toString()
  );
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function generateJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_TTL });
}

function generateAccount(prefix, region) {
  const account_id = generateAccountId();
  const uid = generateUid();
  const name = generateName(prefix);
  const password = generatePassword();

  const jwt_token = generateJwt({
    uid,
    account_id,
    name,
    region,
    iat: Math.floor(Date.now() / 1000),
  });

  return { uid, name, password, account_id, jwt_token };
}

function generateBatch(count, prefix, region) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(generateAccount(prefix, region));
  return out;
}

module.exports = { generateBatch, generateAccount };
