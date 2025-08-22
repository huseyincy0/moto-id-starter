// Generate a 6-digit numeric string (100000..999999)
function generateStickerId() {
  const min = 100000;
  const max = 999999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

module.exports = { generateStickerId };