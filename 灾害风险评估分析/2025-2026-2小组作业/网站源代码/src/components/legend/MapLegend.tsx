import type {
  HazardLegendItem,
  LayerSummaryItem,
} from "../../types/viewModels";

interface MapLegendProps {
  expanded: boolean;
  layerSummary: LayerSummaryItem[];
  hazardLegend: HazardLegendItem[];
  onExpandedChange: (expanded: boolean) => void;
}

export function MapLegend({
  expanded,
  layerSummary,
  hazardLegend,
  onExpandedChange,
}: MapLegendProps) {
  return (
    <div
      className={`legendCard legendDualCard ${
        expanded ? "isExpanded" : "isCollapsed"
      }`}
    >
      <div className="sectionHeader legendHeader">
        <span>图例说明</span>
        <button
          type="button"
          className="legendToggle"
          onClick={() => {
            onExpandedChange(!expanded);
          }}
        >
          {expanded ? "收起" : "展开"}
        </button>
      </div>

      {expanded ? (
        <>
          <div className="legendBlock">
            <p className="legendBlockTitle">风险等级</p>
            <div className="legendList">
              {layerSummary.map((item) => (
                <div className="legendRow legendRowShort" key={item.level}>
                  <span
                    className="legendSwatch"
                    style={{ backgroundColor: item.color }}
                  />
                  <strong>{item.label}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="legendBlock">
            <p className="legendBlockTitle">专题要素</p>
            <div className="legendList">
              {hazardLegend.map((item) => (
                <div className="legendRow legendRowShort" key={item.label}>
                  <span className={`legendSwatch ${item.className}`} />
                  <strong>{item.label}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="legendCollapsedHint">
          <span>风险等级</span>
          <span>专题要素</span>
        </div>
      )}
    </div>
  );
}
