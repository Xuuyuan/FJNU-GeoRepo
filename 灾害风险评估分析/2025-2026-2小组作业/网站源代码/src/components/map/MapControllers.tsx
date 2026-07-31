import { useEffect } from "react";
import type L from "leaflet";
import { useMap } from "react-leaflet";
import { pointFlyToDuration } from "../../config/mapConfig";
import type { MapFocusTarget } from "../../types/viewModels";

export function MapViewportController({
  bounds,
}: {
  bounds: L.LatLngBoundsExpression | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!bounds) {
      return;
    }

    map.fitBounds(bounds, {
      padding: [24, 24],
    });
  }, [bounds, map]);

  return null;
}

export function MapFocusController({
  target,
}: {
  target: MapFocusTarget | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!target) {
      return;
    }

    if (target.type === "bounds") {
      map.fitBounds(target.bounds, {
        padding: [30, 30],
      });
      return;
    }

    if (target.animation === "fly") {
      map.flyTo(target.center, target.zoom, {
        animate: true,
        duration: target.duration ?? pointFlyToDuration,
        easeLinearity: 0.25,
      });
      return;
    }

    map.setView(target.center, target.zoom, {
      animate: true,
    });
  }, [map, target]);

  return null;
}

export function MapInteractionController() {
  const map = useMap();

  useEffect(() => {
    map.scrollWheelZoom.enable();
    return undefined;
  }, [map]);

  return null;
}

export function MapInstanceBridge({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
  }, [map, onReady]);

  return null;
}
