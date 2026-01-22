// 配送任务类
public class DeliveryTask {
    private final GeoLocation source;
    private final GeoLocation dest;
    private final String dangkouName;

    public DeliveryTask(GeoLocation source, GeoLocation dest, String dangkouName) {
        this.source = source;
        this.dest = dest;
        this.dangkouName = dangkouName;
    }

    // get方法
    public GeoLocation getSource() { return source; }
    public GeoLocation getDest() { return dest; }
    public String getDangkouName() { return dangkouName;}

    // 配送任务的toString方法
    @Override
    public String toString() { return "从 [" + source.getName() + " - " + dangkouName + "] -> 送至 [" + dest.getName() + "]"; }
}