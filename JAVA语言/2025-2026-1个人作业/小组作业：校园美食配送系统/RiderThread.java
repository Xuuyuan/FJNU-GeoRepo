import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import javax.swing.SwingUtilities;

// 骑手线程
public class RiderThread implements Runnable {
    private final String name;
    private final DeliveryTask task;
    private final S_SimulationGUI parentGui; 
    
    private final List<DeliveryResult> resultsList;
    private final AtomicInteger tasksRemaining;

    private static final double SPEEDH = 10.0; // 时速计为10km/h
    private static final double SPEEDM = SPEEDH / 60.0; // 分钟数
    private static final int EARTH_RADIUS = 6371; // 地球半径，用于简单的经纬度换算

    public RiderThread(String name, DeliveryTask task, 
                       S_SimulationGUI parentGui, 
                       List<DeliveryResult> resultsList, 
                       AtomicInteger tasksRemaining) {
        this.name = name;
        this.task = task;
        this.parentGui = parentGui; 
        this.resultsList = resultsList; 
        this.tasksRemaining = tasksRemaining; 
    }

    @Override
    public void run() {
        DeliveryResult result; 
        try {
            GeoLocation source = task.getSource(); // 起点
            GeoLocation dest = task.getDest(); // 终点
            String purposeForDest = "送餐";

            logMessage(" " + name + " 已接单！开始配送任务：" + task);

            // 模拟取餐
            logMessage(" " + name + " 正在 [" + source.getName() + " - " + task.getDangkouName() + "] 取餐...");
            Thread.sleep(500 + (long) (Math.random() * 1000)); // 模拟取餐的耗时
            dest.acquireService(name, purposeForDest, parentGui); // 获取 "派送点" 的锁
            
            // 模拟送餐
            logMessage(" " + name + " 正在从 [" + source.getName() + "] 送往 [" + dest.getName() + "]...");
            Thread.sleep(1000 + (long) (Math.random() * 1000)); // 在路上的耗时
            logMessage(" " + name + " [订单送达] 任务: " + task + " 已完成！");

            // 计算距离和时间
            double distance = haversine(source.getLatitude(), source.getLongitude(),
                                        dest.getLatitude(), dest.getLongitude());
            double roadTime = distance / SPEEDM;
            double totalTime = roadTime + 1.0; // 计算为取餐时间
            logMessage(String.format("  > 配送距离：%.2f km, 按 %.0fkm/h 速度, 预计骑行：%.1f 分钟，总计耗时：%.1f 分钟。", distance, SPEEDH, roadTime, totalTime));

            // 配送结果
            result = new DeliveryResult(name, task.getDangkouName(), dest.getName(), totalTime);
            resultsList.add(result);
            dest.releaseService(name, purposeForDest, parentGui); // 释放锁

        } catch (InterruptedException e) {
            logMessage(" " + name + " 的任务被中断了。");
            Thread.currentThread().interrupt(); 
        } finally {
            // 没有剩余任务了
            if (tasksRemaining.decrementAndGet() == 0) { printSummary(); }
        }
    }
    
    // 输出任务总结
    private void printSummary() {
        SwingUtilities.invokeLater(() -> {
            parentGui.logMessage("\n【任务总结】");
            for (DeliveryResult r : resultsList) {
                parentGui.logMessage(String.format(
                        "骑手: %s | 档口: %s | 目的地: %s | 预计用时: %.1f 分钟",
                        r.getRiderName(),
                        r.getDangkouName(),
                        r.getDestName(),
                        r.getTimeMinutes()
                ));
            }
        });
    }
    // 从经纬度计算距离，半正矢公式
    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        lat1 = Math.toRadians(lat1);
        lat2 = Math.toRadians(lat2);
        double a = Math.pow(Math.sin(dLat / 2), 2) +
                   Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
        double c = 2 * Math.asin(Math.sqrt(a));
        return EARTH_RADIUS * c;
    }
    // 提示框
    private void logMessage(String message) { parentGui.logMessage(message); }
}