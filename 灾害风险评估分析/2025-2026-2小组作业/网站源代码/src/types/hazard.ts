import type {
  Feature,
  FeatureCollection,
  PointGeometry,
  PolygonalGeometry,
} from './geojson';

export interface HazardPointProperties {
  '县': string;
  Vill_Name: string;
  Haz_ID: string | number;
  Haz_Name: string;
  Haz_Type: string;
  Haz_Level: string;
}

export interface HazardBufferProperties {
  Bld_Cnt: number;
  Vill_Name: string;
  Haz_ID: string | number;
  Buffer_m: number;
  Haz_Name: string;
  Haz_Type: string;
  Haz_Level: string;
}

export interface VillageDisputeProperties {
  villageNam: string;
  streetName: string;
  flag: string | number;
}

export type HazardPointFeature = Feature<PointGeometry, HazardPointProperties>;
export type HazardPointFeatureCollection = FeatureCollection<
  PointGeometry,
  HazardPointProperties
>;

export type HazardBufferFeature = Feature<
  PolygonalGeometry,
  HazardBufferProperties
>;
export type HazardBufferFeatureCollection = FeatureCollection<
  PolygonalGeometry,
  HazardBufferProperties
>;

export type VillageDisputeFeature = Feature<
  PolygonalGeometry,
  VillageDisputeProperties
>;
export type VillageDisputeFeatureCollection = FeatureCollection<
  PolygonalGeometry,
  VillageDisputeProperties
>;
