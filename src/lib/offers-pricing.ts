export type OfferPricingInput = {
  productId?: string | null;
  productPrice?: number | null;
  originalPrice?: number | null;
  salePrice?: number | null;
  discountPercent?: number | null;
};

export function computeOfferPricing({
  productId,
  productPrice,
  originalPrice,
  salePrice,
  discountPercent,
}: OfferPricingInput) {
  const normalizedDiscountPercent = typeof discountPercent === "number" && Number.isFinite(discountPercent)
    ? Math.max(0, Math.min(100, discountPercent))
    : null;

  const normalizedProductPrice = typeof productPrice === "number" && Number.isFinite(productPrice)
    ? productPrice
    : null;

  const normalizedOriginalPrice = typeof originalPrice === "number" && Number.isFinite(originalPrice)
    ? originalPrice
    : null;

  const resolvedOriginalPrice = normalizedOriginalPrice ?? normalizedProductPrice ?? null;
  const shouldUseProductBasedPricing = productId != null || normalizedProductPrice != null;

  let resolvedSalePrice = typeof salePrice === "number" && Number.isFinite(salePrice) ? salePrice : null;

  if (resolvedOriginalPrice != null && normalizedDiscountPercent != null && shouldUseProductBasedPricing) {
    resolvedSalePrice = Math.max(0, Math.round(resolvedOriginalPrice * (100 - normalizedDiscountPercent) / 100));
  }

  return {
    original_price: resolvedOriginalPrice,
    sale_price: resolvedSalePrice,
  };
}
