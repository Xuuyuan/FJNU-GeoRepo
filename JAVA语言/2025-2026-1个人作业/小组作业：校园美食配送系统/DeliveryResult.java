// 完成任务的总结类
public class DeliveryResult {
    final private String riderName;
    final private String dangkouName;
    final private String destName;
    final private double timeMinutes;

    public DeliveryResult(String riderName, String dangkouName, String destName, double timeMinutes) {
        this.riderName = riderName;
        this.dangkouName = dangkouName;
        this.destName = destName;
        this.timeMinutes = timeMinutes;
    }
    // get方法
    public String getRiderName() { return riderName; }
    public String getDangkouName() { return dangkouName; }
    public String getDestName() { return destName; }
    public double getTimeMinutes() { return timeMinutes; }
}