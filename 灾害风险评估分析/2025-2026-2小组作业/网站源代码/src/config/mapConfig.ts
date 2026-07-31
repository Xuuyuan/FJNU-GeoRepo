export const fallbackBounds: [[number, number], [number, number]] = [
  [26.44, 118.98],
  [26.59, 119.21],
];

export const fuzhouMaxBounds: [[number, number], [number, number]] = [
  [26.35, 119.2],
  [26.64, 118.94],
];

export const maximumMapZoom = 18;
export const pointFlyToDuration = 0.55;

export const useTiandituCdn =
  import.meta.env.VITE_USE_TDT_CDN?.trim().toLowerCase() === "true";
export const tiandituCdnBaseUrl = (
  import.meta.env.VITE_TDT_CDN_BASE_URL?.trim() ?? ""
).replace(/\/+$/, "");
export const tiandituToken = import.meta.env.VITE_TDT_TOKEN?.trim() ?? "";

const tiandituProtocol = "https";
const tiandituSubdomains = ["0", "1", "2", "3", "4", "5", "6", "7"];
const tiandituDirectBaseUrl = `${tiandituProtocol}://t{s}.tianditu.gov.cn`;
const tiandituProbeBaseUrl = useTiandituCdn
  ? tiandituCdnBaseUrl
  : `${tiandituProtocol}://t0.tianditu.gov.cn`;
const tiandituWmtsBaseUrl = useTiandituCdn
  ? tiandituCdnBaseUrl
  : tiandituDirectBaseUrl;
const tiandituRequestSuffix = useTiandituCdn ? "" : `&tk=${tiandituToken}`;

export const tiandituTileSubdomains = useTiandituCdn
  ? ["0"]
  : tiandituSubdomains;
export const tiandituLayerAvailable = useTiandituCdn
  ? Boolean(tiandituCdnBaseUrl)
  : Boolean(tiandituToken);
export const tiandituVectorUrl = `${tiandituWmtsBaseUrl}/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&layer=vec&style=default&tilematrixset=w&format=tiles&tilematrix={z}&tilerow={y}&tilecol={x}${tiandituRequestSuffix}`;
export const tiandituAnnotationUrl = `${tiandituWmtsBaseUrl}/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&layer=cva&style=default&tilematrixset=w&format=tiles&tilematrix={z}&tilerow={y}&tilecol={x}${tiandituRequestSuffix}`;
export const tiandituProbeUrl = `${tiandituProbeBaseUrl}/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&layer=vec&style=default&tilematrixset=w&format=tiles&tilematrix=11&tilerow=841&tilecol=1701${tiandituRequestSuffix}`;
