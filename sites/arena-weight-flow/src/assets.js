// Catalog paths are preserved as source evidence; resolve them inside this app.
export const assetUrl = path => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
