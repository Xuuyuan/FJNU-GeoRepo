import { useMemo } from "react";
import {
  getFeatureId,
  normalizeHazardType,
  normalizeVillageName,
} from "../utils/featureFormatters";
import type { HazardPointFeatureCollection } from "../types/hazard";
import type { SearchResult } from "../types/viewModels";
import type { VillagePointFeatureCollection } from "../types/villagePoint";
import type {
  VillageRiskFeature,
  VillageRiskFeatureCollection,
} from "../types/villageRisk";

interface UseSearchResultsOptions {
  searchInput: string;
  villageData: VillageRiskFeatureCollection | null;
  villagePointData: VillagePointFeatureCollection | null;
  hazardPointData: HazardPointFeatureCollection | null;
}

export function useSearchResults({
  searchInput,
  villageData,
  villagePointData,
  hazardPointData,
}: UseSearchResultsOptions) {
  const villageFeatureByName = useMemo(() => {
    if (!villageData) {
      return new Map<string, VillageRiskFeature>();
    }

    return new Map(
      villageData.features.map((feature) => [
        normalizeVillageName(feature.properties.villageNam),
        feature,
      ]),
    );
  }, [villageData]);

  const searchQuery = normalizeVillageName(searchInput);
  const searchResults = useMemo(() => {
    if (!searchQuery) {
      return [];
    }

    const results: SearchResult[] = [];
    const matchedVillageNames = new Set<string>();

    villageData?.features.forEach((feature) => {
      const villageName = normalizeVillageName(feature.properties.villageNam);
      if (!villageName.includes(searchQuery)) {
        return;
      }

      matchedVillageNames.add(villageName);
      results.push({
        id: `village-${getFeatureId(feature.id) ?? villageName}`,
        type: "village",
        label: villageName,
        meta: feature.properties.Risk_Level,
        feature,
      });
    });

    villagePointData?.features.forEach((feature) => {
      const villageName = normalizeVillageName(feature.properties.Vill_Name);
      if (
        !villageName.includes(searchQuery) ||
        matchedVillageNames.has(villageName)
      ) {
        return;
      }

      results.push({
        id: `village-point-${
          getFeatureId(feature.id ?? feature.properties.OBJECTID) ?? villageName
        }`,
        type: "villagePoint",
        label: villageName,
        meta: "村委员会定位点",
        feature,
      });
    });

    hazardPointData?.features.forEach((feature) => {
      const hazardName = normalizeVillageName(feature.properties.Haz_Name);
      if (!hazardName.includes(searchQuery)) {
        return;
      }

      results.push({
        id: `hazard-${getFeatureId(feature.id ?? feature.properties.Haz_ID) ?? hazardName}`,
        type: "hazard",
        label: hazardName,
        meta: normalizeHazardType(feature.properties.Haz_Type),
        feature,
      });
    });

    return results.slice(0, 6);
  }, [hazardPointData, searchQuery, villageData, villagePointData]);

  return {
    villageFeatureByName,
    searchQuery,
    searchResults,
  };
}
