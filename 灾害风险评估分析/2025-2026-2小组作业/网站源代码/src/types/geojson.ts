export type Position = number[];

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: Position[][];
}

export interface MultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: Position[][][];
}

export interface PointGeometry {
  type: 'Point';
  coordinates: [number, number];
}

export type PolygonalGeometry = PolygonGeometry | MultiPolygonGeometry;
export type VillageGeometry = PolygonalGeometry;

export interface FeatureCollection<G, P> {
  type: 'FeatureCollection';
  features: Feature<G, P>[];
}

export interface Feature<G, P> {
  type: 'Feature';
  id?: string | number;
  geometry: G;
  properties: P;
}
