/** Farbpaletten des Avatar-Schemas (16 Gesichter/Hautfarben, 16 Frisuren, 10 Haarfarben, 16 Oberteile, 16 Hosen). Port aus legacy/v22/avatar.js. */
export const HAIR_COLORS = ['#18191f', '#3a2a25', '#6a4631', '#9d5737', '#d79b52', '#e6d4b8', '#d8dbe6', '#31bdd7', '#7356c9', '#d742a7'];
export const SKIN_TONES = ['#f6d3bd', '#efc5ad', '#e9b896', '#dda47f', '#cc8d68', '#b97855', '#a96849', '#8f583d', '#7b4934', '#6a3f2f', '#5b372b', '#4b3029', '#e2af8d', '#bd7b5a', '#956047', '#704632'];
export const TOP_COLORS = ['#1a2838', '#263747', '#30495a', '#25333d', '#4b2f32', '#684135', '#32473f', '#4d3b60', '#283d63', '#3d5368', '#5f676f', '#1e5961', '#6a5130', '#5c293f', '#284a33', '#343642'];
export const PANTS_COLORS = ['#17202a', '#232b34', '#2c3640', '#34383f', '#2f3340', '#29394a', '#3e3a39', '#453f36', '#1f3440', '#28323c', '#35303d', '#2e4040', '#3b4550', '#22262c', '#4a423c', '#30343a'];
export const TOP_NAMES = ['Urban Jacket', 'Layer Hoodie', 'Field Overshirt', 'Light Shell', 'Signal Jacket', 'Workshop Coat', 'Park Utility', 'Violet Layer', 'Night Runner', 'City Denim', 'Graphite Vest', 'Harbor Shell', 'Amber Utility', 'Magenta Layer', 'Green Field', 'Classic Dark'];

export const hex = (css: string): number => parseInt(css.replace('#', ''), 16);

/** Farbe abdunkeln (0–1). */
export const darken = (color: number, factor: number): number => {
  const r = Math.round(((color >> 16) & 255) * factor);
  const g = Math.round(((color >> 8) & 255) * factor);
  const b = Math.round((color & 255) * factor);
  return (r << 16) | (g << 8) | b;
};
