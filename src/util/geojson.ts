const append = (dest: GeoJSON.Position[], src: GeoJSON.Position[]) => {
  src.forEach((coord) => {
    dest.push(coord);
  });
};

// return array of all coordinates in a feature
export const getCoords = (feature: GeoJSON.Feature): GeoJSON.Position[] => {
  const coordinates: GeoJSON.Position[] = [];

  const geometry = feature.geometry;
  switch (geometry.type) {
    case 'Point':
      coordinates.push(geometry.coordinates);
      break;
    case 'MultiPoint':
    case 'LineString':
      append(coordinates, geometry.coordinates);
      break;
    case 'MultiLineString':
    case 'Polygon':
      geometry.coordinates.forEach(coords => append(coordinates, coords));
      break;
    case 'MultiPolygon':
      geometry.coordinates.forEach(polygon => {
        polygon.forEach(coords => append(coordinates, coords));
      });
      break;
    default:
      return coordinates;
  }
  return coordinates;
};

// return all coordinates from a list of feature
export const getAllCoords = (features: GeoJSON.Feature[]): GeoJSON.Position[] => {
  const coordinates: GeoJSON.Position[] = [];
  (features || []).forEach((feature) => {
    const coords = getCoords(feature);
    coords.forEach((coord) => {
      coordinates.push(coord);
    });
  });
  return coordinates;
};
