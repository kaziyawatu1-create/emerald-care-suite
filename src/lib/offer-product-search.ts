export type OfferProductOption = {
  id: string;
  name: string;
  category?: string | null;
  price_kes: number;
  image_urls?: string[] | null;
};

export function filterOfferProducts(products: OfferProductOption[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return products.slice(0, 8);
  }

  return products.filter((product) => {
    const haystack = [product.name, product.category].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  }).slice(0, 8);
}
