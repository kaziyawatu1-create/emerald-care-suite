import test from "node:test";
import assert from "node:assert/strict";

import { filterOfferProducts } from "./offer-product-search.ts";

test("filters products by name and category", () => {
  const products = [
    { id: "1", name: "Vitamin C", category: "Supplements", price_kes: 1200, image_urls: [] },
    { id: "2", name: "Face Cream", category: "Skincare", price_kes: 1800, image_urls: [] },
    { id: "3", name: "Blood Test", category: "Laboratory", price_kes: 2500, image_urls: [] },
  ];

  const results = filterOfferProducts(products, "vit");

  assert.deepEqual(results.map((product) => product.id), ["1"]);
});
