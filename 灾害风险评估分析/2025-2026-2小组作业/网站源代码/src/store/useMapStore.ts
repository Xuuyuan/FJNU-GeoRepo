import type { BuildingFeature } from '../types/building';
import { create } from 'zustand';
import type { HazardPointFeature } from '../types/hazard';
import type { VillagePointFeature } from '../types/villagePoint';
import type { VillageRiskFeature } from '../types/villageRisk';

type DetailMode = 'default' | 'village' | 'hazard' | 'building';

interface MapState {
  activeTheme: string;
  tiandituLayerVisible: boolean;
  villageLayerVisible: boolean;
  disputeLayerVisible: boolean;
  hazardLayerVisible: boolean;
  buildingLayerVisible: boolean;
  villagePointLayerVisible: boolean;
  selectedVillage: VillageRiskFeature | null;
  selectedVillagePoint: VillagePointFeature | null;
  selectedHazard: HazardPointFeature | null;
  selectedBuilding: BuildingFeature | null;
  activeHazardId: string | number | null;
  detailMode: DetailMode;
  setTiandituLayerVisible: (visible: boolean) => void;
  setVillageLayerVisible: (visible: boolean) => void;
  setDisputeLayerVisible: (visible: boolean) => void;
  setHazardLayerVisible: (visible: boolean) => void;
  setBuildingLayerVisible: (visible: boolean) => void;
  setVillagePointLayerVisible: (visible: boolean) => void;
  setSelectedVillage: (feature: VillageRiskFeature | null) => void;
  setSelectedHazard: (feature: HazardPointFeature | null) => void;
  setSelectedBuilding: (feature: BuildingFeature | null) => void;
  setSelectedVillagePoint: (
    feature: VillagePointFeature | null,
    matchedVillage?: VillageRiskFeature | null,
  ) => void;
  clearSelection: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  activeTheme: '综合风险分级',
  tiandituLayerVisible: true,
  villageLayerVisible: true,
  disputeLayerVisible: true,
  hazardLayerVisible: true,
  buildingLayerVisible: true,
  villagePointLayerVisible: true,
  selectedVillage: null,
  selectedVillagePoint: null,
  selectedHazard: null,
  selectedBuilding: null,
  activeHazardId: null,
  detailMode: 'default',
  setTiandituLayerVisible: (visible) => set({ tiandituLayerVisible: visible }),
  setVillageLayerVisible: (visible) => {
    set((state) => ({
      villageLayerVisible: visible,
      selectedVillage: visible ? state.selectedVillage : null,
      detailMode:
        !visible && state.detailMode === 'village'
          ? state.selectedVillagePoint && state.villagePointLayerVisible
            ? 'village'
            : state.selectedBuilding && state.buildingLayerVisible
              ? 'building'
              : state.selectedHazard && state.hazardLayerVisible
                ? 'hazard'
                : 'default'
          : state.detailMode,
    }));
  },
  setDisputeLayerVisible: (visible) => set({ disputeLayerVisible: visible }),
  setHazardLayerVisible: (visible) =>
    set((state) => ({
      hazardLayerVisible: visible,
      selectedHazard: visible ? state.selectedHazard : null,
      activeHazardId: visible ? state.activeHazardId : null,
      detailMode: visible
        ? state.detailMode
        : state.detailMode === 'hazard'
          ? state.selectedBuilding && state.buildingLayerVisible
            ? 'building'
            : state.selectedVillage && state.villageLayerVisible
              ? 'village'
              : 'default'
          : state.detailMode,
    })),
  setBuildingLayerVisible: (visible) =>
    set((state) => ({
      buildingLayerVisible: visible,
      selectedBuilding: visible ? state.selectedBuilding : null,
      detailMode: visible
        ? state.detailMode
        : state.detailMode === 'building'
          ? state.selectedHazard && state.hazardLayerVisible
            ? 'hazard'
            : state.selectedVillage && state.villageLayerVisible
              ? 'village'
              : 'default'
          : state.detailMode,
    })),
  setVillagePointLayerVisible: (visible) =>
    set((state) => ({
      villagePointLayerVisible: visible,
      selectedVillagePoint: visible ? state.selectedVillagePoint : null,
      detailMode: visible
        ? state.detailMode
        : state.detailMode === 'village' && !state.selectedVillage
          ? 'default'
          : state.detailMode,
    })),
  setSelectedVillage: (feature) =>
    set({
      selectedVillage: feature,
      selectedVillagePoint: null,
      selectedHazard: null,
      selectedBuilding: null,
      activeHazardId: null,
      detailMode: feature ? 'village' : 'default',
    }),
  setSelectedHazard: (feature) =>
    set({
      selectedHazard: feature,
      activeHazardId: feature?.properties.Haz_ID ?? null,
      selectedVillage: null,
      selectedVillagePoint: null,
      selectedBuilding: null,
      detailMode: feature ? 'hazard' : 'default',
    }),
  setSelectedBuilding: (feature) =>
    set((state) => ({
      selectedBuilding: feature,
      selectedVillage: null,
      selectedVillagePoint: null,
      detailMode: feature
        ? 'building'
        : state.selectedHazard
          ? 'hazard'
          : state.selectedVillage
            ? 'village'
          : 'default',
    })),
  setSelectedVillagePoint: (feature, matchedVillage = null) =>
    set({
      selectedVillagePoint: feature,
      selectedVillage: matchedVillage,
      selectedHazard: null,
      selectedBuilding: null,
      activeHazardId: null,
      detailMode: feature || matchedVillage ? 'village' : 'default',
    }),
  clearSelection: () =>
    set({
      selectedVillage: null,
      selectedVillagePoint: null,
      selectedHazard: null,
      selectedBuilding: null,
      activeHazardId: null,
      detailMode: 'default',
    }),
}));
