/* ══════════════════════════════════════════════════════════════
   DISCOUNT LOADER
   Reads /discounts.json and applies per-service discounts to any
   .sc card that has data-service-id + data-base-price set.

   Config format (discounts.json):
     { "some-service-id": 20, "other-service-id": 0, ... }
   Value is a discount percentage (0–100). 0 or missing = no discount.

   Failure behavior: if the fetch fails, or a value is missing/invalid,
   the card is left showing its normal price — never blank, never broken.
   ══════════════════════════════════════════════════════════════ */
(function () {
  const CONFIG_URL = 'discounts.json';

  function formatINR(n) {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  function applyDiscount(card, pct) {
    const basePrice = parseFloat(card.dataset.basePrice);
    if (!basePrice || isNaN(basePrice)) return; // no base price set, nothing to do
    if (!pct || isNaN(pct) || pct <= 0) return;  // no valid discount, leave price as-is

    const pctClamped = Math.min(Math.max(pct, 0), 100);
    const discounted = basePrice * (1 - pctClamped / 100);

    const priceVal = card.querySelector('.sc-price-val');
    if (!priceVal) return;

    // Avoid double-wrapping if this ever runs twice
    if (priceVal.dataset.discounted === 'true') return;

    priceVal.dataset.discounted = 'true';
    priceVal.innerHTML =
      '<span class="sc-price-strike">' + formatINR(basePrice) + '</span> ' +
      '<span class="sc-price-now">' + formatINR(discounted) + '</span>' +
      '<span class="sc-price-badge">' + pctClamped + '% OFF</span>';
  }

  async function init() {
    let discounts = {};
    try {
      const res = await fetch(CONFIG_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('discounts.json not reachable');
      discounts = await res.json();
    } catch (err) {
      // Fetch or parse failed — silently keep normal prices, log for the developer only
      console.warn('[discount-loader] could not load discounts.json, showing normal prices:', err);
      return;
    }

    document.querySelectorAll('.sc[data-service-id]').forEach(card => {
      const id = card.dataset.serviceId;
      const pct = Number(discounts[id]);
      applyDiscount(card, pct);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
