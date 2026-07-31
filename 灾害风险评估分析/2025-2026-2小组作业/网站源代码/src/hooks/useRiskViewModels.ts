import { useMemo } from "react";
import { riskLegend } from "../config/riskTheme";
import type { BuildingFeatureCollection } from "../types/building";
import type {
  HazardBufferFeatureCollection,
  HazardPointFeatureCollection,
} from "../types/hazard";
import type {
  DashboardMetric,
  HazardLegendItem,
  LayerSummaryItem,
  VillageDetailViewModel,
} from "../types/viewModels";
import type { VillagePointFeature } from "../types/villagePoint";
import type { VillageRiskFeatureCollection } from "../types/villageRisk";
import {
  formatVillageName,
  getFeatureId,
  normalizeHazardId,
  normalizeHazardType,
} from "../utils/featureFormatters";
import type { BuildingFeature } from "../types/building";
import type { HazardPointFeature } from "../types/hazard";
import type { VillageRiskFeature } from "../types/villageRisk";

const hazardLegend: HazardLegendItem[] = [
  { label: "村委员会定位点", className: "legendSwatchVillagePoint" },
  { label: "隐患点", className: "legendSwatchPoint" },
  { label: "200 米缓冲区", className: "legendSwatchBuffer" },
  { label: "争议地说明层", className: "legendSwatchDispute" },
  { label: "普通建筑", className: "legendSwatchBuilding" },
  { label: "受威胁建筑", className: "legendSwatchThreatBuilding" },
];

interface UseRiskViewModelsOptions {
  villageData: VillageRiskFeatureCollection | null;
  hazardPointData: HazardPointFeatureCollection | null;
  hazardBufferData: HazardBufferFeatureCollection | null;
  buildingData: BuildingFeatureCollection | null;
  disputeCount: number;
  villageCount: number;
  villagePointCount: number;
  hazardCount: number;
  buildingCount: number;
  selectedVillage: VillageRiskFeature | null;
  selectedVillagePoint: VillagePointFeature | null;
  selectedHazard: HazardPointFeature | null;
  selectedBuilding: BuildingFeature | null;
  selectedHazardTypes: string[];
  visibleLayerCount: number;
}

export function useRiskViewModels({
  villageData,
  hazardPointData,
  hazardBufferData,
  buildingData,
  disputeCount,
  villageCount,
  villagePointCount,
  hazardCount,
  buildingCount,
  selectedVillage,
  selectedVillagePoint,
  selectedHazard,
  selectedBuilding,
  selectedHazardTypes,
  visibleLayerCount,
}: UseRiskViewModelsOptions) {
  const selectedVillageProperties = selectedVillage?.properties ?? null;
  const selectedVillagePointProperties =
    selectedVillagePoint?.properties ?? null;
  const selectedHazardProperties = selectedHazard?.properties ?? null;
  const selectedBuildingProperties = selectedBuilding?.properties ?? null;
  const selectedHazardId = normalizeHazardId(selectedHazard?.properties.Haz_ID);
  const selectedVillagePointId = getFeatureId(
    selectedVillagePoint?.id ?? selectedVillagePoint?.properties.OBJECTID,
  );
  const selectedBuildingId = getFeatureId(
    selectedBuilding?.id ?? selectedBuilding?.properties.Build_ID,
  );

  const villageDetailView = useMemo((): VillageDetailViewModel | null => {
    if (selectedVillagePointProperties) {
      return {
        pointName: selectedVillagePointProperties.NAME,
        villageName: formatVillageName(
          selectedVillagePointProperties.Vill_Name,
        ),
        township: "\u5ef7\u576a\u4e61",
        riskLevel: selectedVillagePointProperties.Risk_Level || "\u672a\u63d0\u4f9b",
        exposureLevel:
          selectedVillagePointProperties.Exp_Level || "\u672a\u63d0\u4f9b",
        capacityLevel:
          selectedVillagePointProperties.Cap_Level || "\u672a\u63d0\u4f9b",
        riskClass:
          selectedVillagePointProperties.Risk_Cls4 === 0
            ? "\u672a\u63d0\u4f9b"
            : selectedVillagePointProperties.Risk_Cls4,
        hazardIntensity: "\u672a\u63d0\u4f9b",
        riskValue:
          selectedVillagePointProperties.Risk_A === 0
            ? "0.000"
            : selectedVillagePointProperties.Risk_A.toFixed(3),
      };
    }

    if (selectedVillageProperties) {
      return {
        villageName: selectedVillageProperties.villageNam,
        township: selectedVillageProperties.streetName,
        riskLevel: selectedVillageProperties.Risk_Level,
        exposureLevel: selectedVillageProperties.Exp_Level,
        capacityLevel: selectedVillageProperties.Cap_Level,
        riskClass: selectedVillageProperties.Risk_Cls4,
        hazardIntensity: selectedVillageProperties.Haz_Vill.toFixed(3),
        riskValue: selectedVillageProperties.Risk_A.toFixed(3),
      };
    }


    return null;
  }, [selectedVillagePointProperties, selectedVillageProperties]);

  const allThreatBuildings = useMemo(() => {
    if (!buildingData) {
      return [];
    }

    return buildingData.features.filter(
      (feature) => Number(feature.properties.Threat_Bld) === 1,
    );
  }, [buildingData]);

  const activeThreatBuildings = useMemo(() => {
    if (!buildingData || selectedHazardId === null) {
      return [];
    }

    return buildingData.features.filter(
      (feature) =>
        Number(feature.properties.Threat_Bld) === 1 &&
        normalizeHazardId(feature.properties.Haz_ID) === selectedHazardId,
    );
  }, [buildingData, selectedHazardId]);

  const activeThreatBuildingIds = useMemo(
    () =>
      new Set(
        activeThreatBuildings.map((feature) =>
          getFeatureId(feature.id ?? feature.properties.Build_ID),
        ),
      ),
    [activeThreatBuildings],
  );

  const activeBuffer = useMemo(() => {
    if (!hazardBufferData || selectedHazardId === null) {
      return null;
    }

    return {
      type: "FeatureCollection",
      features: hazardBufferData.features.filter(
        (feature) =>
          normalizeHazardId(feature.properties.Haz_ID) === selectedHazardId,
      ),
    } as HazardBufferFeatureCollection;
  }, [hazardBufferData, selectedHazardId]);

  const activeBufferProperties = activeBuffer?.features[0]?.properties ?? null;

  const layerSummary = useMemo((): LayerSummaryItem[] => {
    if (!villageData) {
      return [];
    }

    return riskLegend.map((item) => {
      const count = villageData.features.filter(
        (feature) => feature.properties.Risk_Cls4 === item.level,
      ).length;

      return {
        ...item,
        count,
      };
    });
  }, [villageData]);

  const hazardTypeOptions = useMemo(() => {
    if (!hazardPointData) {
      return [];
    }

    return [
      ...new Set(
        hazardPointData.features.map((feature) =>
          normalizeHazardType(feature.properties.Haz_Type),
        ),
      ),
    ]
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right, "zh-CN"));
  }, [hazardPointData]);

  const filteredHazardCount = useMemo(() => {
    if (!hazardPointData) {
      return 0;
    }

    if (selectedHazardTypes.length === 0) {
      return hazardPointData.features.length;
    }

    return hazardPointData.features.filter((feature) =>
      selectedHazardTypes.includes(
        normalizeHazardType(feature.properties.Haz_Type),
      ),
    ).length;
  }, [hazardPointData, selectedHazardTypes]);

  const selectedBuildingIsThreat =
    selectedBuildingProperties !== null &&
    Number(selectedBuildingProperties.Threat_Bld) === 1;
  const selectedBuildingVillage = formatVillageName(
    selectedBuildingProperties?.Vill_Name,
  );

  const dashboardMetrics: DashboardMetric[] = [
    {
      label: "村级单元",
      value: villageCount,
      unit: "个",
      tone: "cyan",
    },
    {
      label: "隐患点",
      value: hazardCount,
      unit: "处",
      tone: "orange",
    },
    {
      label: "建筑图斑",
      value: buildingCount,
      unit: "栋",
      tone: "blue",
    },
    {
      label: "受威胁建筑",
      value: allThreatBuildings.length,
      unit: "栋",
      tone: "red",
    },
    {
      label: "争议地区块",
      value: disputeCount,
      unit: "片",
      tone: "slate",
    },
    {
      label: "开启图层",
      value: visibleLayerCount,
      unit: "层",
      tone: "green",
    },
  ];

  return {
    selectedVillageProperties,
    selectedHazardProperties,
    selectedBuildingProperties,
    selectedHazardId,
    selectedVillagePointId,
    selectedBuildingId,
    villageDetailView,
    activeThreatBuildingIds,
    activeBuffer,
    activeBufferProperties,
    layerSummary,
    hazardTypeOptions,
    filteredHazardCount,
    hazardLegend,
    selectedBuildingIsThreat,
    selectedBuildingVillage,
    dashboardMetrics,
    villagePointCount,
  };
}
