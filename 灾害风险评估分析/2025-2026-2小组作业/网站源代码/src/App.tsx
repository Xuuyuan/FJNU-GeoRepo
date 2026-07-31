import { type FormEvent, useEffect, useRef, useState } from "react";
import type { Layer, LeafletMouseEvent } from "leaflet";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import { MapLegend } from "./components/legend/MapLegend";
import { RiskMap } from "./components/map/RiskMap";
import { MapZoomControls } from "./components/map/MapZoomControls";
import { MetricDock } from "./components/metrics/MetricDock";
import { DetailPanel } from "./components/panels/DetailPanel";
import { InfoPanel } from "./components/panels/InfoPanel";
import { LeftControlPanel } from "./components/panels/LeftControlPanel";
import { SearchDock } from "./components/search/SearchDock";
import {
  fallbackBounds,
  maximumMapZoom,
  pointFlyToDuration,
  tiandituLayerAvailable,
  tiandituProbeUrl,
  tiandituToken,
  useTiandituCdn,
} from "./config/mapConfig";
import { riskLegend } from "./config/riskTheme";
import { useGeoJsonLayers } from "./hooks/useGeoJsonLayers";
import { useRiskViewModels } from "./hooks/useRiskViewModels";
import { useSearchResults } from "./hooks/useSearchResults";
import { useMapStore } from "./store/useMapStore";
import type { BuildingFeature } from "./types/building";
import type { HazardPointFeature } from "./types/hazard";
import type { MapFocusTarget, SearchResult } from "./types/viewModels";
import type { VillagePointFeature } from "./types/villagePoint";
import type { VillageRiskFeature } from "./types/villageRisk";
import {
  getFeatureId,
  normalizeHazardId,
  normalizeVillageName,
} from "./utils/featureFormatters";

type MobilePanel = "layers" | "detail" | "info" | "metrics" | null;

function App() {
  const [legendExpanded, setLegendExpanded] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const isMobileLayoutRef = useRef(false);
  const [tiandituStatus, setTiandituStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >(tiandituToken ? "loading" : "idle");
  const [searchInput, setSearchInput] = useState("");
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [selectedSearchResultId, setSelectedSearchResultId] = useState<
    string | null
  >(null);
  const [mapFocusTarget, setMapFocusTarget] = useState<MapFocusTarget | null>(
    null,
  );
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<number[]>([]);
  const [selectedHazardTypes, setSelectedHazardTypes] = useState<string[]>([]);

  const {
    buildingLayerVisible,
    detailMode,
    disputeLayerVisible,
    hazardLayerVisible,
    tiandituLayerVisible,
    villagePointLayerVisible,
    selectedBuilding,
    selectedHazard,
    selectedVillage,
    selectedVillagePoint,
    setBuildingLayerVisible,
    setDisputeLayerVisible,
    setHazardLayerVisible,
    setTiandituLayerVisible,
    setSelectedBuilding,
    setSelectedHazard,
    setSelectedVillage,
    setSelectedVillagePoint,
    setVillagePointLayerVisible,
    villageLayerVisible,
    setVillageLayerVisible,
  } = useMapStore();

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 1320px)");
    const syncMobileLayout = () => {
      isMobileLayoutRef.current = mobileQuery.matches;
      if (!mobileQuery.matches) {
        setMobilePanel(null);
      }
    };

    syncMobileLayout();
    mobileQuery.addEventListener("change", syncMobileLayout);

    return () => {
      mobileQuery.removeEventListener("change", syncMobileLayout);
    };
  }, []);

  const {
    villageData,
    disputeData,
    hazardPointData,
    hazardBufferData,
    buildingData,
    villagePointData,
    mapBounds,
    loadError,
  } = useGeoJsonLayers();

  const { villageFeatureByName, searchQuery, searchResults } = useSearchResults(
    {
      searchInput,
      villageData,
      villagePointData,
      hazardPointData,
    },
  );

  useEffect(() => {
    if (!tiandituLayerVisible || tiandituLayerAvailable) {
      return;
    }

    if (useTiandituCdn) {
      console.warn(
        "天地图底图未加载：CDN 模式缺少 VITE_TDT_CDN_BASE_URL 环境变量。",
      );
      return;
    }

    console.warn("天地图底图未加载：缺少 VITE_TDT_TOKEN 环境变量。");
  }, [tiandituLayerVisible]);

  useEffect(() => {
    if (!tiandituLayerVisible || !tiandituLayerAvailable) {
      setTiandituStatus("idle");
      return;
    }

    setTiandituStatus("loading");

    const probeImage = new Image();
    probeImage.onload = () => {
      setTiandituStatus("ready");
    };
    probeImage.onerror = () => {
      console.warn("浏览器端天地图探测瓦片加载失败。");
      setTiandituStatus("error");
    };
    probeImage.src = `${tiandituProbeUrl}&_=${Date.now()}`;

    return () => {
      probeImage.onload = null;
      probeImage.onerror = null;
    };
  }, [tiandituLayerVisible]);

  const villageCount = villageData?.features.length ?? 0;
  const villagePointCount = villagePointData?.features.length ?? 0;
  const disputeCount = disputeData?.features.length ?? 0;
  const hazardCount = hazardPointData?.features.length ?? 0;
  const buildingCount = buildingData?.features.length ?? 0;
  const visibleLayerCount = [
    tiandituLayerVisible,
    villageLayerVisible,
    disputeLayerVisible,
    hazardLayerVisible,
    buildingLayerVisible,
    villagePointLayerVisible,
  ].filter(Boolean).length;

  const {
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
  } = useRiskViewModels({
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
  });

  const hasAnyFilter =
    selectedRiskLevels.length > 0 || selectedHazardTypes.length > 0;

  const clearFilters = () => {
    setSelectedRiskLevels([]);
    setSelectedHazardTypes([]);
  };

  const openMobileDetailPanel = () => {
    if (isMobileLayoutRef.current) {
      setMobilePanel("detail");
    }
  };

  const handleEachVillage = (feature: VillageRiskFeature, layer: Layer) => {
    layer.on({
      click: () => {
        const nextVillageId = getFeatureId(
          feature.id ?? feature.properties.villageNam,
        );
        const currentVillageId = getFeatureId(
          useMapStore.getState().selectedVillage?.id ??
            useMapStore.getState().selectedVillage?.properties.villageNam,
        );

        if (nextVillageId !== null && nextVillageId === currentVillageId) {
          setSelectedSearchResultId(null);
          setSelectedVillage(null);
          return;
        }

        setSelectedSearchResultId(null);
        setSelectedVillage(feature);
        openMobileDetailPanel();
      },
    });
  };

  const handleVillagePointClick = (
    feature: VillagePointFeature,
    event: LeafletMouseEvent,
  ) => {
    event.originalEvent.stopPropagation();
    event.originalEvent.preventDefault();

    if (event.originalEvent.detail > 1) {
      handleVillagePointDoubleClick(feature, event);
      return;
    }

    const pointId = getFeatureId(feature.id ?? feature.properties.OBJECTID);
    if (pointId !== null && pointId === selectedVillagePointId) {
      setSelectedSearchResultId(null);
      setSelectedVillagePoint(null, null);
      return;
    }

    const matchedVillage =
      villageFeatureByName.get(
        normalizeVillageName(feature.properties.Vill_Name),
      ) ?? null;

    setSelectedSearchResultId(null);
    setSelectedVillagePoint(feature, matchedVillage);
    openMobileDetailPanel();
  };

  const handleVillagePointDoubleClick = (
    feature: VillagePointFeature,
    event: LeafletMouseEvent,
  ) => {
    event.originalEvent.stopPropagation();
    event.originalEvent.preventDefault();

    const matchedVillage =
      villageFeatureByName.get(
        normalizeVillageName(feature.properties.Vill_Name),
      ) ?? null;

    setSelectedSearchResultId(null);
    setSelectedVillagePoint(feature, matchedVillage);
    openMobileDetailPanel();

    const target = {
      id: `village-point-dblclick-${feature.properties.OBJECTID}-${Date.now()}`,
      type: "point",
      center: event.latlng,
      zoom: maximumMapZoom,
      animation: "fly",
      duration: pointFlyToDuration,
    } satisfies MapFocusTarget;

    setMapFocusTarget(target);
    mapInstance?.flyTo(target.center, target.zoom, {
      animate: true,
      duration: target.duration,
      easeLinearity: 0.25,
    });
  };

  const handleEachBuilding = (feature: BuildingFeature, layer: Layer) => {
    layer.on({
      click: (event: LeafletMouseEvent) => {
        event.originalEvent.stopPropagation();
        event.originalEvent.preventDefault();

        const nextBuildingId = getFeatureId(
          feature.id ?? feature.properties.Build_ID,
        );
        const currentBuildingId = getFeatureId(
          useMapStore.getState().selectedBuilding?.id ??
            useMapStore.getState().selectedBuilding?.properties.Build_ID,
        );

        if (nextBuildingId !== null && nextBuildingId === currentBuildingId) {
          setSelectedSearchResultId(null);
          setSelectedBuilding(null);
          return;
        }

        setSelectedSearchResultId(null);
        setSelectedBuilding(feature);
        openMobileDetailPanel();
      },
    });
  };

  const handleHazardClick = (
    feature: HazardPointFeature,
    event: LeafletMouseEvent,
  ) => {
    event.originalEvent.stopPropagation();
    event.originalEvent.preventDefault();

    if (event.originalEvent.detail > 1) {
      handleHazardDoubleClick(feature, event);
      return;
    }

    const nextHazardId = normalizeHazardId(feature.properties.Haz_ID);
    if (nextHazardId === selectedHazardId) {
      setSelectedSearchResultId(null);
      setSelectedHazard(null);
      return;
    }

    setSelectedSearchResultId(null);
    setSelectedHazard(feature);
    openMobileDetailPanel();
  };

  const handleHazardDoubleClick = (
    feature: HazardPointFeature,
    event: LeafletMouseEvent,
  ) => {
    event.originalEvent.stopPropagation();
    event.originalEvent.preventDefault();

    setSelectedSearchResultId(null);
    setSelectedHazard(feature);
    openMobileDetailPanel();

    const target = {
      id: `hazard-dblclick-${feature.properties.Haz_ID}-${Date.now()}`,
      type: "point",
      center: event.latlng,
      zoom: maximumMapZoom,
      animation: "fly",
      duration: pointFlyToDuration,
    } satisfies MapFocusTarget;

    setMapFocusTarget(target);
    mapInstance?.flyTo(target.center, target.zoom, {
      animate: true,
      duration: target.duration,
      easeLinearity: 0.25,
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedSearchResultId(null);
    setSearchPanelOpen(Boolean(searchQuery));
  };

  const handleSearchResultClick = (result: SearchResult) => {
    setSelectedSearchResultId(result.id);
    setSearchInput(result.label);
    setSearchPanelOpen(false);
    clearFilters();

    if (result.type === "village") {
      if (!villageLayerVisible) {
        setVillageLayerVisible(true);
      }
      setSelectedVillage(result.feature);
      const bounds = L.geoJSON(result.feature as GeoJsonObject).getBounds();
      if (bounds.isValid()) {
        setMapFocusTarget({
          id: `${result.id}-${Date.now()}`,
          type: "bounds",
          bounds,
        });
      }
      openMobileDetailPanel();
      return;
    }

    if (result.type === "villagePoint") {
      if (!villagePointLayerVisible) {
        setVillagePointLayerVisible(true);
      }
      const matchedVillage =
        villageFeatureByName.get(
          normalizeVillageName(result.feature.properties.Vill_Name),
        ) ?? null;
      if (matchedVillage && !villageLayerVisible) {
        setVillageLayerVisible(true);
      }
      setSelectedVillagePoint(result.feature, matchedVillage);

      if (matchedVillage) {
        const bounds = L.geoJSON(matchedVillage as GeoJsonObject).getBounds();
        if (bounds.isValid()) {
          setMapFocusTarget({
            id: `${result.id}-${Date.now()}`,
            type: "bounds",
            bounds,
          });
        }
        openMobileDetailPanel();
        return;
      }

      const [lng, lat] = result.feature.geometry.coordinates;
      setMapFocusTarget({
        id: `${result.id}-${Date.now()}`,
        type: "point",
        center: [lat, lng],
        zoom: 14,
      });
      openMobileDetailPanel();
      return;
    }

    if (!hazardLayerVisible) {
      setHazardLayerVisible(true);
    }
    setSelectedHazard(result.feature);
    const [lng, lat] = result.feature.geometry.coordinates;
    setMapFocusTarget({
      id: `${result.id}-${Date.now()}`,
      type: "point",
      center: [lat, lng],
      zoom: 17,
    });
    openMobileDetailPanel();
  };

  const leftControlPanel = (
    <LeftControlPanel
      riskLegendItems={riskLegend}
      selectedRiskLevels={selectedRiskLevels}
      selectedHazardTypes={selectedHazardTypes}
      hazardTypeOptions={hazardTypeOptions}
      filteredHazardCount={filteredHazardCount}
      hasAnyFilter={hasAnyFilter}
      tiandituStatus={tiandituStatus}
      tiandituLayerVisible={tiandituLayerVisible}
      villageLayerVisible={villageLayerVisible}
      disputeLayerVisible={disputeLayerVisible}
      hazardLayerVisible={hazardLayerVisible}
      buildingLayerVisible={buildingLayerVisible}
      villagePointLayerVisible={villagePointLayerVisible}
      villagePointCount={villagePointCount}
      visibleLayerCount={visibleLayerCount}
      onClearFilters={clearFilters}
      onSearchInputChange={setSearchInput}
      onSearchPanelOpenChange={setSearchPanelOpen}
      onSelectedSearchResultChange={setSelectedSearchResultId}
      onRiskLevelsChange={(updater) => {
        setSelectedRiskLevels(updater);
      }}
      onHazardTypesChange={(updater) => {
        setSelectedHazardTypes(updater);
      }}
      onTiandituLayerVisibleChange={setTiandituLayerVisible}
      onVillageLayerVisibleChange={setVillageLayerVisible}
      onDisputeLayerVisibleChange={setDisputeLayerVisible}
      onHazardLayerVisibleChange={setHazardLayerVisible}
      onBuildingLayerVisibleChange={setBuildingLayerVisible}
      onVillagePointLayerVisibleChange={setVillagePointLayerVisible}
    />
  );

  const detailPanel = (
    <DetailPanel
      detailMode={detailMode}
      selectedHazardProperties={selectedHazardProperties}
      selectedBuildingProperties={selectedBuildingProperties}
      selectedHazardId={selectedHazardId}
      activeBufferProperties={activeBufferProperties}
      villageDetailView={villageDetailView}
      selectedBuildingIsThreat={selectedBuildingIsThreat}
      selectedBuildingVillage={selectedBuildingVillage}
    />
  );

  const infoPanel = <InfoPanel loadError={loadError} />;

  const mobilePanelTitle =
    mobilePanel === "layers"
      ? "图层与筛选"
      : mobilePanel === "detail"
        ? "要素详情"
        : mobilePanel === "metrics"
          ? "风险统计"
          : mobilePanel === "info"
            ? "网页介绍"
            : "";

  const mobilePanelContent =
    mobilePanel === "layers" ? (
      leftControlPanel
    ) : mobilePanel === "detail" ? (
      detailPanel
    ) : mobilePanel === "metrics" ? (
      <div className="mobileMetricPanel">
        <MetricDock metrics={dashboardMetrics} />
      </div>
    ) : mobilePanel === "info" ? (
      infoPanel
    ) : null;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topLine topLineLeft" aria-hidden="true" />
        <div className="titleBox">
          <p className="eyebrow">福建省福州市闽侯县</p>
          <h1>
            <span className="titlePrefix">廷坪乡</span>
            地质灾害风险评估地图
          </h1>
          <div className="titleDecoration" aria-hidden="true" />
        </div>
        <div className="topLine topLineRight" aria-hidden="true" />
        <div className="topbarFilters">
          <SearchDock
            searchInput={searchInput}
            searchQuery={searchQuery}
            searchPanelOpen={searchPanelOpen}
            searchResults={searchResults}
            selectedSearchResultId={selectedSearchResultId}
            onInputChange={setSearchInput}
            onPanelOpenChange={setSearchPanelOpen}
            onSelectedSearchResultChange={setSelectedSearchResultId}
            onSubmit={handleSearchSubmit}
            onResultClick={handleSearchResultClick}
          />
        </div>
      </header>

      <main className="workspace">
        <div className="desktopPanelSlot desktopLeftPanel">
          {leftControlPanel}
        </div>

        <section className="mapStage">
          <div className="mapFrame">
            <div className="mapFrameOverlay">
              <div className="mapOverlayLeft">
                <MapZoomControls
                  bounds={mapBounds ?? fallbackBounds}
                  map={mapInstance}
                />
              </div>

              <div className="mapOverlayRight">
                <MapLegend
                  expanded={legendExpanded}
                  layerSummary={layerSummary}
                  hazardLegend={hazardLegend}
                  onExpandedChange={setLegendExpanded}
                />
              </div>
            </div>

            <RiskMap
              villageData={villageData}
              disputeData={disputeData}
              hazardPointData={hazardPointData}
              activeBuffer={activeBuffer}
              buildingData={buildingData}
              villagePointData={villagePointData}
              mapBounds={mapBounds}
              mapFocusTarget={mapFocusTarget}
              tiandituLayerVisible={tiandituLayerVisible}
              villageLayerVisible={villageLayerVisible}
              disputeLayerVisible={disputeLayerVisible}
              hazardLayerVisible={hazardLayerVisible}
              buildingLayerVisible={buildingLayerVisible}
              villagePointLayerVisible={villagePointLayerVisible}
              selectedRiskLevels={selectedRiskLevels}
              selectedHazardTypes={selectedHazardTypes}
              selectedHazardId={selectedHazardId}
              selectedVillage={selectedVillage}
              selectedVillagePointId={selectedVillagePointId}
              selectedBuildingId={selectedBuildingId}
              activeThreatBuildingIds={activeThreatBuildingIds}
              onMapReady={setMapInstance}
              onVillageFeature={handleEachVillage}
              onBuildingFeature={handleEachBuilding}
              onVillagePointClick={handleVillagePointClick}
              onVillagePointDoubleClick={handleVillagePointDoubleClick}
              onHazardClick={handleHazardClick}
              onHazardDoubleClick={handleHazardDoubleClick}
            />
          </div>
          <MetricDock metrics={dashboardMetrics} />
        </section>

        <div className="rightRail">
          {detailPanel}
          {infoPanel}
        </div>

        <nav className="mobileActionBar" aria-label="移动端地图工具">
          <button
            type="button"
            className={mobilePanel === "layers" ? "isActive" : ""}
            onClick={() => {
              setMobilePanel((current) =>
                current === "layers" ? null : "layers",
              );
            }}
          >
            筛选
          </button>
          <button
            type="button"
            className={mobilePanel === "detail" ? "isActive" : ""}
            onClick={() => {
              setMobilePanel((current) =>
                current === "detail" ? null : "detail",
              );
            }}
          >
            详情
          </button>
          <button
            type="button"
            className={mobilePanel === "metrics" ? "isActive" : ""}
            onClick={() => {
              setMobilePanel((current) =>
                current === "metrics" ? null : "metrics",
              );
            }}
          >
            统计
          </button>
          <button
            type="button"
            className={mobilePanel === "info" ? "isActive" : ""}
            onClick={() => {
              setMobilePanel((current) => (current === "info" ? null : "info"));
            }}
          >
            介绍
          </button>
        </nav>

        <div
          className={`mobileDrawerLayer ${mobilePanel ? "isOpen" : ""}`}
          aria-hidden={!mobilePanel}
        >
          {mobilePanel ? (
            <>
              <button
                type="button"
                className="mobileDrawerBackdrop"
                aria-label="关闭面板"
                onClick={() => {
                  setMobilePanel(null);
                }}
              />
              <section className="mobileDrawer" aria-label={mobilePanelTitle}>
                <div className="mobileDrawerHeader">
                  <strong>{mobilePanelTitle}</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setMobilePanel(null);
                    }}
                  >
                    关闭
                  </button>
                </div>
                <div className="mobileDrawerBody">{mobilePanelContent}</div>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default App;
