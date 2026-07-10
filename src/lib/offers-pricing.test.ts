import test from "node:test";
import assert from "node:assert/strict";

import { computeOfferPricing } from "./offers-pricing.ts";

test("computes offer pricing from the selected product price and discount percent", () => {
  const result = computeOfferPricing({
    productId: "prod_123",
    productPrice: 1000,
    discountPercent: 5,
  });

  assert.equal(result.original_price, 1000);
  assert.equal(result.sale_price, 950);
});
