/**
 * Lookup table for Mexican city coordinates.
 * Used to place site markers on the map when backend
 * doesn't provide lat/lng values.
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  monterrey: { lat: 25.6866, lng: -100.3161 },
  "san pedro garza garcía": { lat: 25.6581, lng: -100.4023 },
  "san nicolás de los garza": { lat: 25.7441, lng: -100.2961 },
  guadalupe: { lat: 25.6775, lng: -100.2597 },
  apodaca: { lat: 25.7818, lng: -100.1884 },
  escobedo: { lat: 25.7976, lng: -100.3426 },
  "santa catarina": { lat: 25.6733, lng: -100.4583 },
  saltillo: { lat: 25.4232, lng: -100.9927 },
  "ciudad de méxico": { lat: 19.4326, lng: -99.1332 },
  cdmx: { lat: 19.4326, lng: -99.1332 },
  guadalajara: { lat: 20.6597, lng: -103.3496 },
  puebla: { lat: 19.0414, lng: -98.2063 },
  querétaro: { lat: 20.5888, lng: -100.3899 },
  león: { lat: 21.1221, lng: -101.6758 },
  chihuahua: { lat: 28.6353, lng: -106.0889 },
  "ciudad juárez": { lat: 31.6904, lng: -106.4245 },
  mérida: { lat: 20.9674, lng: -89.6259 },
  cancún: { lat: 21.1619, lng: -86.8515 },
  tijuana: { lat: 32.5149, lng: -117.0382 },
  hermosillo: { lat: 29.0729, lng: -110.9559 },
  tampico: { lat: 22.2331, lng: -97.8611 },
  "san luis potosí": { lat: 22.1565, lng: -100.9855 },
  aguascalientes: { lat: 21.8818, lng: -102.2916 },
  toluca: { lat: 19.2826, lng: -99.6557 },
  villahermosa: { lat: 17.9892, lng: -92.9475 },
  tuxtla: { lat: 16.7528, lng: -93.1152 },
  veracruz: { lat: 19.1738, lng: -96.1342 },
  morelia: { lat: 19.7060, lng: -101.1950 },
  durango: { lat: 24.0277, lng: -104.6532 },
  oaxaca: { lat: 17.0732, lng: -96.7266 },
};

const DEFAULT_CENTER = { lat: 24.5, lng: -102.0 };

export function getCityCoords(city?: string, state?: string): { lat: number; lng: number } | null {
  if (city) {
    const key = city.toLowerCase().trim();
    if (CITY_COORDINATES[key]) return CITY_COORDINATES[key];
  }
  if (state) {
    const key = state.toLowerCase().trim();
    if (CITY_COORDINATES[key]) return CITY_COORDINATES[key];
  }
  return null;
}

export function getDefaultCenter() {
  return DEFAULT_CENTER;
}
