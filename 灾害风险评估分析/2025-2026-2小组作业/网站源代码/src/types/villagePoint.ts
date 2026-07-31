import type { Feature, FeatureCollection, PointGeometry } from './geojson';

export interface VillagePointProperties {
  OBJECTID: number;
  NAME: string;
  Threat_Vil: number;
  Vill_Name: string;
  Risk_Cls4: number;
  Risk_Level: string;
  Exp_Cls4: number;
  Exp_Level: string;
  Cap_Cls4: number;
  Cap_Level: string;
  Risk_A: number;
}

export type VillagePointFeature = Feature<PointGeometry, VillagePointProperties>;
export type VillagePointFeatureCollection = FeatureCollection<
  PointGeometry,
  VillagePointProperties
>;
