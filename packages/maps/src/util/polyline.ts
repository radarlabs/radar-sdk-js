/**
 * https://github.com/mapbox/polyline
 *
 * Decodes to a [longitude, latitude] coordinates array.
 *
 * This is adapted from the implementation in Project-OSRM.
 *
 * see https://github.com/Project-OSRM/osrm-frontend/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
 *
 */
export const decodePolyline = (str: string, precision: number = 6): number[][] => {
  let index = 0;
  let lat = 0;
  let lng = 0;
  let coordinates: number[][] = [];
  let shift = 0;
  let result = 0;
  let byte: number | null = null;
  let latitudeChange: number;
  let longitudeChange: number;
  let factor = Math.pow(10, precision || 6);

  // Coordinates have variable length when encoded, so just keep
  // track of whether we've hit the end of the string. In each
  // loop iteration, a single coordinate is decoded.
  while (index < str.length) {
    // Reset shift, result, and byte
    byte = null;
    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitudeChange = result & 1 ? ~(result >> 1) : result >> 1;

    shift = result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitudeChange = result & 1 ? ~(result >> 1) : result >> 1;

    lat += latitudeChange;
    lng += longitudeChange;

    coordinates.push([lng / factor, lat / factor]);
  }

  return coordinates;
}
