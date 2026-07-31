import { useEffect, useState } from "react";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import type { BuildingFeatureCollection } from "../types/building";
import type {
  HazardBufferFeatureCollection,
  HazardPointFeatureCollection,
  VillageDisputeFeatureCollection,
} from "../types/hazard";
import type { VillagePointFeatureCollection } from "../types/villagePoint";
import type { VillageRiskFeatureCollection } from "../types/villageRisk";

const layerRequests = [
  {
    key: "village",
    label: "村级综合风险层",
    url: "/data/village_polygon_web.geojson",
  },
  {
    key: "dispute",
    label: "争议地说明层",
    url: "/data/village_dispute_web.geojson",
  },
  {
    key: "hazardPoint",
    label: "隐患点图层",
    url: "/data/hazard_points_web.geojson",
  },
  {
    key: "hazardBuffer",
    label: "隐患缓冲区图层",
    url: "/data/haz_buffer_200m_web.geojson",
  },
  {
    key: "building",
    label: "建筑图层",
    url: "/data/building_poly_web.geojson",
  },
  {
    key: "villagePoint",
    label: "村委员会定位点",
    url: "/data/vill_pt_web.geojson",
  },
] as const;

export function useGeoJsonLayers() {
  const [villageData, setVillageData] =
    useState<VillageRiskFeatureCollection | null>(null);
  const [disputeData, setDisputeData] =
    useState<VillageDisputeFeatureCollection | null>(null);
  const [hazardPointData, setHazardPointData] =
    useState<HazardPointFeatureCollection | null>(null);
  const [hazardBufferData, setHazardBufferData] =
    useState<HazardBufferFeatureCollection | null>(null);
  const [buildingData, setBuildingData] =
    useState<BuildingFeatureCollection | null>(null);
  const [villagePointData, setVillagePointData] =
    useState<VillagePointFeatureCollection | null>(null);
  const [mapBounds, setMapBounds] = useState<L.LatLngBoundsExpression | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    async function loadLayers() {
      try {
        const settledResults = await Promise.allSettled(
          layerRequests.map(async (layer) => {
            const response = await fetch(layer.url);
            if (!response.ok) {
              throw new Error(`${layer.label}（${response.status}）`);
            }

            return {
              key: layer.key,
              data: await response.json(),
            };
          }),
        );

        if (disposed) {
          return;
        }

        const failedLayers: string[] = [];
        let hasVillageBounds = false;
        let loadedVillagePointData: VillagePointFeatureCollection | null = null;

        settledResults.forEach((result) => {
          if (result.status === "fulfilled") {
            const { key, data } = result.value;

            if (key === "village") {
              const villageLayer = data as VillageRiskFeatureCollection;
              setVillageData(villageLayer);
              const bounds = L.geoJSON(
                villageLayer as GeoJsonObject,
              ).getBounds();
              setMapBounds(bounds.isValid() ? bounds : null);
              hasVillageBounds = bounds.isValid();
              return;
            }

            if (key === "dispute") {
              setDisputeData(data as VillageDisputeFeatureCollection);
              return;
            }

            if (key === "hazardPoint") {
              setHazardPointData(data as HazardPointFeatureCollection);
              return;
            }

            if (key === "hazardBuffer") {
              setHazardBufferData(data as HazardBufferFeatureCollection);
              return;
            }

            if (key === "building") {
              setBuildingData(data as BuildingFeatureCollection);
              return;
            }

            if (key === "villagePoint") {
              const villagePointLayer = data as VillagePointFeatureCollection;
              loadedVillagePointData = villagePointLayer;
              setVillagePointData(villagePointLayer);
            }

            return;
          }

          const message =
            result.reason instanceof Error
              ? result.reason.message
              : "未知图层异常";
          failedLayers.push(message);
        });

        if (!hasVillageBounds && loadedVillagePointData) {
          const bounds = L.geoJSON(
            loadedVillagePointData as GeoJsonObject,
          ).getBounds();
          setMapBounds(bounds.isValid() ? bounds : null);
        }

        setLoadError(
          failedLayers.length > 0
            ? `以下图层加载失败：${failedLayers.join("；")}`
            : null,
        );
      } catch (error) {
        if (disposed) {
          return;
        }

        const message = error instanceof Error ? error.message : "图层读取失败";
        setLoadError(message);
      }
    }

    loadLayers();

    return () => {
      disposed = true;
    };
  }, []);

  return {
    villageData,
    disputeData,
    hazardPointData,
    hazardBufferData,
    buildingData,
    villagePointData,
    mapBounds,
    loadError,
  };
}
