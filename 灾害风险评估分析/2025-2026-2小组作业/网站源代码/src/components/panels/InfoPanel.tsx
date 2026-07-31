interface InfoPanelProps {
  loadError: string | null;
}

export function InfoPanel({ loadError }: InfoPanelProps) {
  return (
    <aside className="panel panelRightSecondary">
      <section>
        <div className="sectionHeader">
          <span>网页介绍</span>
        </div>
        <p className="lead">
          本网页以廷坪乡地质灾害风险评估成果为核心，集中呈现村级综合风险分区、隐患点与
          200
          米缓冲区、受威胁建筑以及村委员会定位点等专题信息。用户可以通过地图点击、
          专题检索与专题筛选，快速查看村庄风险等级、隐患来源及其影响对象。
        </p>
      </section>

      {loadError ? (
        <section>
          <div className="sectionHeader">
            <span>加载状态</span>
            <small>异常</small>
          </div>
          <p className="lead errorText">{loadError}</p>
        </section>
      ) : null}
    </aside>
  );
}
