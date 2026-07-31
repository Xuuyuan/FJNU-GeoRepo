import { Fragment, useMemo } from "react";
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import { GeoJSON, MapContainer, Marker, Pane, TileLayer } from "react-leaflet";
import { getRiskTheme } from "../../config/riskTheme";
import {
  fallbackBounds,
  fuzhouMaxBounds,
  maximumMapZoom,
  tiandituAnnotationUrl,
  tiandituLayerAvailable,
  tiandituTileSubdomains,
  tiandituVectorUrl,
} from "../../config/mapConfig";
import type {
  BuildingFeature,
  BuildingFeatureCollection,
} from "../../types/building";
import type {
  HazardBufferFeatureCollection,
  HazardPointFeature,
  HazardPointFeatureCollection,
  VillageDisputeFeatureCollection,
} from "../../types/hazard";
import type { MapFocusTarget } from "../../types/viewModels";
import type {
  VillagePointFeature,
  VillagePointFeatureCollection,
} from "../../types/villagePoint";
import type {
  VillageRiskFeature,
  VillageRiskFeatureCollection,
} from "../../types/villageRisk";
import {
  getFeatureId,
  normalizeHazardId,
  normalizeHazardType,
} from "../../utils/featureFormatters";
import {
  createHazardMarkerIcon,
  createVillagePointMarkerIcon,
} from "../../utils/mapIcons";
import {
  MapFocusController,
  MapInstanceBridge,
  MapInteractionController,
  MapViewportController,
} from "./MapControllers";

interface RiskMapProps {
  villageData: VillageRiskFeatureCollection | null;
  disputeData: VillageDisputeFeatureCollection | null;
  hazardPointData: HazardPointFeatureCollection | null;
  activeBuffer: HazardBufferFeatureCollection | null;
  buildingData: BuildingFeatureCollection | null;
  villagePointData: VillagePointFeatureCollection | null;
  mapBounds: L.LatLngBoundsExpression | null;
  mapFocusTarget: MapFocusTarget | null;
  tiandituLayerVisible: boolean;
  villageLayerVisible: boolean;
  disputeLayerVisible: boolean;
  hazardLayerVisible: boolean;
  buildingLayerVisible: boolean;
  villagePointLayerVisible: boolean;
  selectedRiskLevels: number[];
  selectedHazardTypes: string[];
  selectedHazardId: string | null;
  selectedVillage: VillageRiskFeature | null;
  selectedVillagePointId: string | null;
  selectedBuildingId: string | null;
  activeThreatBuildingIds: Set<string | null>;
  onMapReady: (map: L.Map) => void;
  onVillageFeature: (feature: VillageRiskFeature, layer: Layer) => void;
  onBuildingFeature: (feature: BuildingFeature, layer: Layer) => void;
  onVillagePointClick: (
    feature: VillagePointFeature,
    event: LeafletMouseEvent,
  ) => void;
  onVillagePointDoubleClick: (
    feature: VillagePointFeature,
    event: LeafletMouseEvent,
  ) => void;
  onHazardClick: (
    feature: HazardPointFeature,
    event: LeafletMouseEvent,
  ) => void;
  onHazardDoubleClick: (
    feature: HazardPointFeature,
    event: LeafletMouseEvent,
  ) => void;
}

export function RiskMap({
  villageData,
  disputeData,
  hazardPointData,
  activeBuffer,
  buildingData,
  villagePointData,
  mapBounds,
  mapFocusTarget,
  tiandituLayerVisible,
  villageLayerVisible,
  disputeLayerVisible,
  hazardLayerVisible,
  buildingLayerVisible,
  villagePointLayerVisible,
  selectedRiskLevels,
  selectedHazardTypes,
  selectedHazardId,
  selectedVillage,
  selectedVillagePointId,
  selectedBuildingId,
  activeThreatBuildingIds,
  onMapReady,
  onVillageFeature,
  onBuildingFeature,
  onVillagePointClick,
  onVillagePointDoubleClick,
  onHazardClick,
  onHazardDoubleClick,
}: RiskMapProps) {
  const villageRiskRenderer = useMemo(
    () =>
      L.canvas({
        padding: 0.5,
      }),
    [],
  );

  const villageStyle = (feature?: GeoJSON.Feature) => {
    const properties = feature?.properties as VillageRiskFeature["properties"];
    const theme = getRiskTheme(properties.Risk_Cls4);
    const featureId = getFeatureId(feature?.id ?? properties.villageNam);
    const isSelected =
      featureId !== null &&
      featureId ===
        getFeatureId(
          selectedVillage?.id ?? selectedVillage?.properties.villageNam,
        );
    const matchesRiskFilter =
      selectedRiskLevels.length === 0 ||
      selectedRiskLevels.includes(properties.Risk_Cls4);

    return {
      color: isSelected
        ? "#f5f7fb"
        : !matchesRiskFilter
          ? "#5a6977"
          : selectedRiskLevels.length > 0
            ? "#fff2d3"
            : theme.stroke,
      fillColor: !matchesRiskFilter ? "#566977" : theme.color,
      fillOpacity: isSelected
        ? 0.9
        : !matchesRiskFilter
          ? 0.14
          : selectedRiskLevels.length > 0
            ? 0.84
            : 0.72,
      weight: isSelected
        ? 2.6
        : !matchesRiskFilter
          ? 0.8
          : selectedRiskLevels.length > 0
            ? 1.8
            : 1.2,
      renderer: villageRiskRenderer,
    } satisfies PathOptions;
  };

  const disputeStyle: PathOptions = {
    color: "#9ea8b3",
    fillColor: "#8f96a0",
    fillOpacity: 0.1,
    weight: 1.1,
    dashArray: "5 4",
    renderer: villageRiskRenderer,
  };

  const bufferStyle: PathOptions = {
    color: "#8dd5f7",
    fillColor: "#4a9ec7",
    fillOpacity: 0.18,
    weight: 1.5,
    renderer: villageRiskRenderer,
  };

  const buildingStyle = (feature?: GeoJSON.Feature) => {
    const properties = feature?.properties as BuildingFeature["properties"];
    const featureId = getFeatureId(feature?.id ?? properties.Build_ID);
    const isSelected =
      selectedBuildingId !== null && featureId === selectedBuildingId;
    const isThreat = Number(properties.Threat_Bld) === 1;
    const isLinkedThreat =
      featureId !== null && activeThreatBuildingIds.has(featureId);
    const hasActiveHazard = selectedHazardId !== null;

    if (isSelected) {
      return {
        color: "#f5f7fb",
        fillColor: isThreat ? "#7fd7ff" : "#d9e3ee",
        fillOpacity: 0.88,
        weight: 1.8,
      } satisfies PathOptions;
    }

    if (isLinkedThreat) {
      return {
        color: "#eef9ff",
        fillColor: "#1f8fff",
        fillOpacity: 0.78,
        weight: 1.5,
      } satisfies PathOptions;
    }

    if (isThreat) {
      return {
        color: "#58b8e6",
        fillColor: "#69d2ff",
        fillOpacity: hasActiveHazard ? 0.24 : 0.38,
        weight: hasActiveHazard ? 0.95 : 1.1,
      } satisfies PathOptions;
    }

    return {
      color: "#8aa5bc",
      fillColor: "#eef4f9",
      fillOpacity: hasActiveHazard ? 0.12 : 0.22,
      weight: 0.78,
    } satisfies PathOptions;
  };

  return (
    <MapContainer
      bounds={fallbackBounds}
      className="mapCanvas"
      maxBounds={fuzhouMaxBounds}
      maxBoundsViscosity={1}
      minZoom={12}
      maxZoom={maximumMapZoom}
    >
      <MapInstanceBridge onReady={onMapReady} />
      <MapInteractionController />
      <MapViewportController bounds={mapBounds} />
      <MapFocusController target={mapFocusTarget} />

      <Pane name="tdt-base" style={{ zIndex: 200 }} />
      <Pane name="tdt-labels" style={{ zIndex: 430 }} />

      {tiandituLayerVisible && tiandituLayerAvailable ? (
        <>
          <TileLayer
            pane="tdt-base"
            url={tiandituVectorUrl}
            subdomains={tiandituTileSubdomains}
            tileSize={256}
            maxNativeZoom={18}
            noWrap
            attribution="&copy; 天地图"
            zIndex={120}
            opacity={0.95}
            eventHandlers={{
              tileerror: () => {
                console.warn("天地图矢量底图瓦片加载失败。");
              },
            }}
          />
          <TileLayer
            pane="tdt-labels"
            url={tiandituAnnotationUrl}
            subdomains={tiandituTileSubdomains}
            tileSize={256}
            maxNativeZoom={18}
            noWrap
            attribution="&copy; 天地图"
            zIndex={130}
            opacity={0.92}
            eventHandlers={{
              tileerror: () => {
                console.warn("天地图矢量注记瓦片加载失败。");
              },
            }}
          />
        </>
      ) : null}

      <Pane name="risk-polygons" style={{ zIndex: 410 }}>
        {villageData && villageLayerVisible ? (
          <GeoJSON
            pane="risk-polygons"
            data={villageData as GeoJsonObject}
            style={villageStyle}
            onEachFeature={(feature, layer) => {
              onVillageFeature(feature as VillageRiskFeature, layer);
            }}
          />
        ) : null}
      </Pane>

      <Pane name="dispute-polygons" style={{ zIndex: 450 }}>
        {disputeData && disputeLayerVisible ? (
          <GeoJSON
            pane="dispute-polygons"
            data={disputeData as GeoJsonObject}
            style={disputeStyle}
          />
        ) : null}
      </Pane>

      <Pane name="hazard-buffers" style={{ zIndex: 500 }}>
        {hazardLayerVisible &&
        activeBuffer &&
        activeBuffer.features.length > 0 ? (
          <GeoJSON
            key={`hazard-buffer-${selectedHazardId}`}
            pane="hazard-buffers"
            data={activeBuffer as GeoJsonObject}
            style={bufferStyle}
          />
        ) : null}
      </Pane>

      <Pane name="village-points" style={{ zIndex: 540 }}>
        {villagePointLayerVisible && villagePointData
          ? villagePointData.features.map((feature) => {
              const [lng, lat] = feature.geometry.coordinates;
              const pointId = getFeatureId(
                feature.id ?? feature.properties.OBJECTID,
              );
              const isSelected =
                selectedVillagePointId !== null &&
                pointId === selectedVillagePointId;

              return (
                <Fragment key={`village-point-${feature.properties.OBJECTID}`}>
                  <Marker
                    position={[lat, lng]}
                    icon={createVillagePointMarkerIcon(
                      feature,
                      isSelected,
                      selectedRiskLevels,
                    )}
                    bubblingMouseEvents={false}
                    eventHandlers={{
                      click: (event) => {
                        onVillagePointClick(feature, event);
                      },
                      dblclick: (event) => {
                        onVillagePointDoubleClick(feature, event);
                      },
                    }}
                  />
                </Fragment>
              );
            })
          : null}
      </Pane>

      <Pane name="building-polygons" style={{ zIndex: 560 }}>
        {buildingData && buildingLayerVisible ? (
          <GeoJSON
            pane="building-polygons"
            data={buildingData as GeoJsonObject}
            style={buildingStyle}
            onEachFeature={(feature, layer) => {
              onBuildingFeature(feature as BuildingFeature, layer);
            }}
          />
        ) : null}
      </Pane>

      <Pane name="hazard-points" style={{ zIndex: 650 }}>
        {hazardLayerVisible && hazardPointData
          ? hazardPointData.features.map((feature) => {
              const [lng, lat] = feature.geometry.coordinates;
              const isSelected =
                selectedHazardId ===
                normalizeHazardId(feature.properties.Haz_ID);
              const matchesHazardType =
                selectedHazardTypes.length === 0 ||
                selectedHazardTypes.includes(
                  normalizeHazardType(feature.properties.Haz_Type),
                );

              return (
                <Fragment key={`hazard-${feature.properties.Haz_ID}`}>
                  <Marker
                    position={[lat, lng]}
                    icon={createHazardMarkerIcon(isSelected, matchesHazardType)}
                    bubblingMouseEvents={false}
                    eventHandlers={{
                      click: (event) => {
                        onHazardClick(feature, event);
                      },
                      dblclick: (event) => {
                        onHazardDoubleClick(feature, event);
                      },
                    }}
                  />
                </Fragment>
              );
            })
          : null}
      </Pane>
    </MapContainer>
  );
}
