import type { BuildingFeature } from "../../types/building";
import type {
  HazardBufferProperties,
  HazardPointFeature,
} from "../../types/hazard";
import type { VillageDetailViewModel } from "../../types/viewModels";
import { normalizeHazardId } from "../../utils/featureFormatters";

type DetailMode = "default" | "village" | "hazard" | "building";

interface DetailPanelProps {
  detailMode: DetailMode;
  selectedHazardProperties: HazardPointFeature["properties"] | null;
  selectedBuildingProperties: BuildingFeature["properties"] | null;
  selectedHazardId: string | null;
  activeBufferProperties: HazardBufferProperties | null;
  villageDetailView: VillageDetailViewModel | null;
  selectedBuildingIsThreat: boolean;
  selectedBuildingVillage: string;
}

export function DetailPanel({
  detailMode,
  selectedHazardProperties,
  selectedBuildingProperties,
  selectedHazardId,
  activeBufferProperties,
  villageDetailView,
  selectedBuildingIsThreat,
  selectedBuildingVillage,
}: DetailPanelProps) {
  return (
    <aside className="panel panelRight">
      <section className="detailSection">
        <div className="sectionHeader">
          <span>
            {detailMode === "hazard"
              ? "隐患解释"
              : detailMode === "village"
                ? "村级详情"
                : detailMode === "building"
                  ? "建筑查看"
                  : "查看说明"}
          </span>
          <small>
            {detailMode === "hazard"
              ? "风险来源"
              : detailMode === "village"
                ? "村级信息"
                : detailMode === "building"
                  ? "建筑信息"
                  : ""}
          </small>
        </div>

        <div className="detailScroll">
          {detailMode === "hazard" && selectedHazardProperties ? (
            <dl className="detailGrid">
              <div>
                <dt>所在村名</dt>
                <dd>{selectedHazardProperties.Vill_Name}</dd>
              </div>
              <div>
                <dt>隐患编号</dt>
                <dd>{selectedHazardProperties.Haz_ID}</dd>
              </div>
              <div>
                <dt>隐患名称</dt>
                <dd>{selectedHazardProperties.Haz_Name}</dd>
              </div>
              <div>
                <dt>隐患类型</dt>
                <dd>{selectedHazardProperties.Haz_Type}</dd>
              </div>
              <div>
                <dt>隐患等级</dt>
                <dd>{selectedHazardProperties.Haz_Level}</dd>
              </div>
              <div>
                <dt>缓冲范围</dt>
                <dd>
                  {activeBufferProperties
                    ? `${activeBufferProperties.Buffer_m} 米`
                    : "未联动"}
                </dd>
              </div>
              <div>
                <dt>缓冲区统计建筑数</dt>
                <dd>{activeBufferProperties?.Bld_Cnt ?? "无"}</dd>
              </div>
            </dl>
          ) : detailMode === "building" && selectedBuildingProperties ? (
            <dl className="detailGrid">
              <div>
                <dt>所属村庄</dt>
                <dd>{selectedBuildingVillage}</dd>
              </div>
              <div>
                <dt>建筑编号</dt>
                <dd>{selectedBuildingProperties.Build_ID}</dd>
              </div>
              <div>
                <dt>威胁状态</dt>
                <dd>{selectedBuildingIsThreat ? "受威胁建筑" : "普通建筑"}</dd>
              </div>
              {selectedBuildingIsThreat ? (
                <>
                  <div>
                    <dt>关联隐患编号</dt>
                    <dd>{selectedBuildingProperties.Haz_ID}</dd>
                  </div>
                  <div>
                    <dt>隐患类型</dt>
                    <dd>{selectedBuildingProperties.Haz_Type || "未标注"}</dd>
                  </div>
                  <div>
                    <dt>隐患等级</dt>
                    <dd>{selectedBuildingProperties.Haz_Level || "未标注"}</dd>
                  </div>
                  <div>
                    <dt>当前联动状态</dt>
                    <dd>
                      {selectedHazardId !== null &&
                      normalizeHazardId(selectedBuildingProperties.Haz_ID) ===
                        selectedHazardId
                        ? "已纳入当前隐患高亮"
                        : "未被当前隐患点高亮"}
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
          ) : detailMode === "village" && villageDetailView ? (
            <dl className="detailGrid">
              {villageDetailView.pointName ? (
                <div>
                  <dt>定位点名称</dt>
                  <dd>{villageDetailView.pointName}</dd>
                </div>
              ) : null}
              <div>
                <dt>村名</dt>
                <dd>{villageDetailView.villageName}</dd>
              </div>
              <div>
                <dt>乡镇</dt>
                <dd>{villageDetailView.township}</dd>
              </div>
              <div>
                <dt>综合风险等级</dt>
                <dd>{villageDetailView.riskLevel}</dd>
              </div>
              <div>
                <dt>暴露度等级</dt>
                <dd>{villageDetailView.exposureLevel}</dd>
              </div>
              <div>
                <dt>承灾能力等级</dt>
                <dd>{villageDetailView.capacityLevel}</dd>
              </div>
              <div>
                <dt>风险分级值</dt>
                <dd>{villageDetailView.riskClass}</dd>
              </div>
              <div>
                <dt>隐患强度</dt>
                <dd>{villageDetailView.hazardIntensity}</dd>
              </div>
              <div>
                <dt>综合风险值</dt>
                <dd>{villageDetailView.riskValue}</dd>
              </div>
            </dl>
          ) : (
            <p className="lead">
              点击村级面查看风险结果，点击隐患点查看风险来源解释，点击建筑图斑查看建筑信息。
              选中隐患点后，会同步高亮对应的 200 米缓冲区与受威胁建筑。
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}
