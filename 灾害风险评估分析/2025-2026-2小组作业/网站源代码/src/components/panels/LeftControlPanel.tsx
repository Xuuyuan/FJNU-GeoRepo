import type { RiskLegendItem } from "../../config/riskTheme";

interface LeftControlPanelProps {
  riskLegendItems: RiskLegendItem[];
  selectedRiskLevels: number[];
  selectedHazardTypes: string[];
  hazardTypeOptions: string[];
  filteredHazardCount: number;
  hasAnyFilter: boolean;
  tiandituStatus: "idle" | "loading" | "ready" | "error";
  tiandituLayerVisible: boolean;
  villageLayerVisible: boolean;
  disputeLayerVisible: boolean;
  hazardLayerVisible: boolean;
  buildingLayerVisible: boolean;
  villagePointLayerVisible: boolean;
  villagePointCount: number;
  visibleLayerCount: number;
  onClearFilters: () => void;
  onSearchInputChange: (value: string) => void;
  onSearchPanelOpenChange: (open: boolean) => void;
  onSelectedSearchResultChange: (id: string | null) => void;
  onRiskLevelsChange: (updater: (current: number[]) => number[]) => void;
  onHazardTypesChange: (updater: (current: string[]) => string[]) => void;
  onTiandituLayerVisibleChange: (visible: boolean) => void;
  onVillageLayerVisibleChange: (visible: boolean) => void;
  onDisputeLayerVisibleChange: (visible: boolean) => void;
  onHazardLayerVisibleChange: (visible: boolean) => void;
  onBuildingLayerVisibleChange: (visible: boolean) => void;
  onVillagePointLayerVisibleChange: (visible: boolean) => void;
}

export function LeftControlPanel({
  riskLegendItems,
  selectedRiskLevels,
  selectedHazardTypes,
  hazardTypeOptions,
  filteredHazardCount,
  hasAnyFilter,
  tiandituStatus,
  tiandituLayerVisible,
  villageLayerVisible,
  disputeLayerVisible,
  hazardLayerVisible,
  buildingLayerVisible,
  villagePointLayerVisible,
  villagePointCount,
  visibleLayerCount,
  onClearFilters,
  onSearchInputChange,
  onSearchPanelOpenChange,
  onSelectedSearchResultChange,
  onRiskLevelsChange,
  onHazardTypesChange,
  onTiandituLayerVisibleChange,
  onVillageLayerVisibleChange,
  onDisputeLayerVisibleChange,
  onHazardLayerVisibleChange,
  onBuildingLayerVisibleChange,
  onVillagePointLayerVisibleChange,
}: LeftControlPanelProps) {
  const resetSearchState = () => {
    onSearchInputChange("");
    onSearchPanelOpenChange(false);
    onSelectedSearchResultChange(null);
  };

  return (
    <aside className="panel panelLeft">
      <section>
        <div className="sectionHeader">
          <span>专题筛选</span>
        </div>
        <div className="filterPanel">
          <div className="filterGroup">
            <div className="filterGroupHeader">
              <strong>综合风险等级</strong>
              <button
                type="button"
                className="filterClearButton"
                disabled={!hasAnyFilter}
                onClick={onClearFilters}
              >
                清除筛选
              </button>
            </div>
            <div className="filterChipList">
              {riskLegendItems.map((item) => (
                <button
                  type="button"
                  key={item.level}
                  className={`filterChip ${
                    selectedRiskLevels.includes(item.level) ? "isActive" : ""
                  }`}
                  onClick={() => {
                    resetSearchState();
                    onRiskLevelsChange((current) =>
                      current.includes(item.level)
                        ? current.filter((level) => level !== item.level)
                        : [...current, item.level],
                    );
                  }}
                >
                  <span
                    className="filterChipSwatch"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filterGroup">
            <div className="filterGroupHeader">
              <strong>隐患类型</strong>
              <small>{filteredHazardCount} 个隐患点</small>
            </div>
            <div className="filterChipList">
              {hazardTypeOptions.map((hazardType) => (
                <button
                  type="button"
                  key={hazardType}
                  className={`filterChip filterChipHazard ${
                    selectedHazardTypes.includes(hazardType) ? "isActive" : ""
                  }`}
                  onClick={() => {
                    resetSearchState();
                    onHazardTypesChange((current) =>
                      current.includes(hazardType)
                        ? current.filter((item) => item !== hazardType)
                        : [...current, hazardType],
                    );
                  }}
                >
                  {hazardType}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="sectionHeader">
          <span>图层控制</span>
        </div>
        <div className="controlCard">
          <label className="toggleRow">
            <div>
              <strong>天地图矢量底图</strong>
              {tiandituStatus === "ready" ? null : (
                <small>
                  {tiandituStatus === "loading"
                    ? "正在检测底图服务"
                    : tiandituStatus === "error"
                      ? "浏览器未成功加载天地图瓦片"
                      : "已关闭"}
                </small>
              )}
            </div>
            <input
              type="checkbox"
              checked={tiandituLayerVisible}
              onChange={(event) => {
                onTiandituLayerVisibleChange(event.target.checked);
              }}
            />
          </label>

          <label className="toggleRow">
            <div>
              <strong>综合风险结果层</strong>
            </div>
            <input
              type="checkbox"
              checked={villageLayerVisible}
              onChange={(event) => {
                onVillageLayerVisibleChange(event.target.checked);
              }}
            />
          </label>

          <label className="toggleRow">
            <div>
              <strong>争议地说明层</strong>
            </div>
            <input
              type="checkbox"
              checked={disputeLayerVisible}
              onChange={(event) => {
                onDisputeLayerVisibleChange(event.target.checked);
              }}
            />
          </label>

          <label className="toggleRow">
            <div>
              <strong>隐患点解释层</strong>
            </div>
            <input
              type="checkbox"
              checked={hazardLayerVisible}
              onChange={(event) => {
                onHazardLayerVisibleChange(event.target.checked);
              }}
            />
          </label>

          <label className="toggleRow">
            <div>
              <strong>建筑图斑表达层</strong>
            </div>
            <input
              type="checkbox"
              checked={buildingLayerVisible}
              onChange={(event) => {
                onBuildingLayerVisibleChange(event.target.checked);
              }}
            />
          </label>

          <label className="toggleRow">
            <div>
              <strong>村委员会定位点</strong>
            </div>
            <input
              type="checkbox"
              checked={villagePointLayerVisible}
              onChange={(event) => {
                onVillagePointLayerVisibleChange(event.target.checked);
              }}
            />
          </label>

          <div className="statRow">
            <span>村委员会定位点</span>
            <strong>{villagePointCount}</strong>
          </div>
          <div className="statRow">
            <span>当前开启图层</span>
            <strong>{visibleLayerCount}</strong>
          </div>
        </div>
      </section>
    </aside>
  );
}
