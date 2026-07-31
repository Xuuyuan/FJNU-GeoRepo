import type L from "leaflet";

interface MapZoomControlsProps {
  bounds: L.LatLngBoundsExpression;
  map: L.Map | null;
}

export function MapZoomControls({ bounds, map }: MapZoomControlsProps) {
  return (
    <div className="zoomControls">
      <button
        type="button"
        className="zoomButton zoomButtonLabel"
        aria-label="回到全局范围"
        title="回到全局范围"
        disabled={!map}
        onClick={() => {
          map?.flyToBounds(bounds, {
            padding: [24, 24],
            duration: 0.65,
            easeLinearity: 0.25,
          });
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M6 6L16 15.8995"
            stroke="#f6f4f4"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 41.8995L16 32"
            stroke="#f6f4f4"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M42.0001 41.8995L32.1006 32"
            stroke="#f6f4f4"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M41.8995 6L32 15.8995"
            stroke="#f6f4f4"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M33 6H42V15"
            stroke="#f6f4f4"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M42 33V42H33"
            stroke="#f6f4f4"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 42H6V33"
            stroke="#f6f4f4"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 15V6H15"
            stroke="#f6f4f4"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        className="zoomButton"
        aria-label="放大地图"
        title="放大地图"
        disabled={!map}
        onClick={() => {
          map?.zoomIn();
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M24.0605 10L24.0239 38"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 24L38 24"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        className="zoomButton"
        aria-label="缩小地图"
        title="缩小地图"
        disabled={!map}
        onClick={() => {
          map?.zoomOut();
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10.5 24L38.5 24"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
