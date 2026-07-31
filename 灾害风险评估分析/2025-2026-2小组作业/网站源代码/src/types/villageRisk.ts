import type { Feature, FeatureCollection, VillageGeometry } from './geojson';

export interface VillageRiskProperties {
  villageNam: string;
  streetName: string;
  Haz_Vill: number;
  Risk_A: number;
  Cap_Cls4: number;
  Cap_Level: string;
  Risk_Cls4: number;
  Risk_Level: string;
  Exp_Cls4: number;
  Exp_Level: string;
}

export type VillageRiskFeature = Feature<VillageGeometry, VillageRiskProperties>;
export type VillageRiskFeatureCollection = FeatureCollection<
  VillageGeometry,
  VillageRiskProperties
>;
