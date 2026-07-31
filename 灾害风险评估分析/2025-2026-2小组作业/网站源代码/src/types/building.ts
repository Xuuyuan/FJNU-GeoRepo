import type { Feature, FeatureCollection, PolygonalGeometry } from './geojson';

export interface BuildingProperties {
  OBJECTID: number;
  Build_ID: number;
  Threat_Bld: number;
  Haz_ID: string | number;
  Vill_Name: string;
  Haz_Level: string;
  Haz_Type: string;
  Shape_Length: number;
  Shape_Area: number;
}

export type BuildingFeature = Feature<PolygonalGeometry, BuildingProperties>;
export type BuildingFeatureCollection = FeatureCollection<
  PolygonalGeometry,
  BuildingProperties
>;
