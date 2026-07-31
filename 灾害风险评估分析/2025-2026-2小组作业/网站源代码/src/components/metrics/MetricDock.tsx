import type { DashboardMetric } from "../../types/viewModels";

interface MetricDockProps {
  metrics: DashboardMetric[];
}

export function MetricDock({ metrics }: MetricDockProps) {
  return (
    <div className="metricDock">
      {metrics.map((metric) => (
        <div
          className={`metricCard metricCard-${metric.tone}`}
          key={metric.label}
        >
          <span>{metric.label}</span>
          <strong>
            {metric.value}
            <small>{metric.unit}</small>
          </strong>
        </div>
      ))}
    </div>
  );
}
