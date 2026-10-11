const { generateBatch } = require("../lib/generator");

const ALLOWED_REGIONS = [
  "ME", "IND", "ID", "VN", "TH", "BD", "PK", "TW", "CIS", "SAC", "GHOST",
];

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const params = req.method === "GET" ? req.query : req.body || {};

  const rawCount = parseInt(params.count, 10);
  const count = Math.min(Math.max(Number.isFinite(rawCount) ? rawCount : 1, 1), 100);

  const name = (params.name || "ARDI").toString().slice(0, 32);
  const region = (params.region || "ID").toString().toUpperCase();

  if (!ALLOWED_REGIONS.includes(region)) {
    res.status(400).json({ success: false, message: "Invalid region" });
    return;
  }

  try {
    const accounts = generateBatch(count, name, region);
    res.status(200).json({
      success: true,
      count: accounts.length,
      region,
      accounts,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Generation failed" });
  }
};
