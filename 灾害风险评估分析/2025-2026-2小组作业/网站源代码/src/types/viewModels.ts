import type L from "leaflet";
import type { HazardPointFeature } from "./hazard";
import type { VillagePointFeature } from "./villagePoint";
import type { VillageRiskFeature } from "./villageRisk";

export interface VillageDetailViewModel {
  pointName?: string;
  villageName: string;
  township: string;
  riskLevel: string;
  exposureLevel: string;
  capacityLevel: string;
  riskClass: string | number;
  hazardIntensity: string;
  riskValue: string;
}

export type SearchResult =
  | {
      id: string;
      type: "village";
      label: string;
      meta: string;
      feature: VillageRiskFeature;
    }
  | {
      id: string;
      type: "villagePoint";
      label: string;
      meta: string;
      feature: VillagePointFeature;
    }
  | {
      id: string;
      type: "hazard";
      label: string;
      meta: string;
      feature: HazardPointFeature;
    };

export type MapFocusTarget =
  | {
      id: string;
      type: "bounds";
      bounds: L.LatLngBoundsExpression;
    }
  | {
      id: string;
      type: "point";
      center: L.LatLngExpression;
      zoom: number;
      animation?: "fly";
      duration?: number;
    };

export interface LayerSummaryItem {
  level: number;
  label: string;
  color: string;
  stroke: string;
  count: number;
}

export interface HazardLegendItem {
  label: string;
  className: string;
}

export interface DashboardMetric {
  label: string;
  value: number;
  unit: string;
  tone: "cyan" | "orange" | "blue" | "red" | "slate" | "green";
}
