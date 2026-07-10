import test from "node:test";
import assert from "node:assert/strict";

import { getOfferSelectColumns } from "./offer-query-columns.ts";

test("offer queries exclude the removed discount column", () => {
  const columns = getOfferSelectColumns();

  assert.match(columns, /discount_percent/);
  assert.doesNotMatch(columns, /\bdiscount\b/);
});
