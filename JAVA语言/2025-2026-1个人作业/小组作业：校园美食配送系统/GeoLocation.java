import java.util.Objects;

// 抽象地理位置类
public abstract class GeoLocation {
    protected long id; 
    protected String name; 
    protected double longitude; 
    protected double latitude; 
    protected String mainCategory; 
    protected String subCategory; 
    protected String detailCategory; 
    // 锁实现
    private boolean isBusy = false;
    private final Object lock = new Object(); 

    public GeoLocation(long id, String name, String categoryString, double longitude, double latitude) {
        this.id = id;
        this.name = name;
        this.longitude = longitude;
        this.latitude = latitude;
        String[] categories = categoryString.split(";");
        this.mainCategory = categories.length > 0 ? categories[0] : "未知";
        this.subCategory = categories.length > 1 ? categories[1] : "未知";
        this.detailCategory = categories.length > 2 ? categories[2] : "未知";
    }

    public abstract String displayInfo();

    // 取餐逻辑
    public void acquireService(String riderName, String purpose, S_SimulationGUI parentGui) throws InterruptedException {
        synchronized (lock) {
            while (isBusy) {
                logMessage(parentGui, "！ " + riderName + " 到达 [" + this.name + "] 准备" + purpose + "... 繁忙，正在排队。");
                lock.wait();
            }
            this.isBusy = true;
            logMessage(parentGui, "√ " + riderName + " 正在 [" + this.name + "] " + purpose + "。");
        }
    }

    // 取餐完毕
    public void releaseService(String riderName, String purpose, S_SimulationGUI parentGui) {
        synchronized (lock) {
            this.isBusy = false;
            logMessage(parentGui, " " + riderName + " 已在 [" + this.name + "] " + purpose + "完毕，准备离开。");
            lock.notifyAll();
        }
    }
    // 调用GUI的消息方法
    protected void logMessage(S_SimulationGUI parentGui, String message) {
        parentGui.logMessage(message);
    }

    public long getId() { return id; }
    public String getName() { return name; }
    public String getMainCategory() { return mainCategory; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    
    @Override
    public String toString() { return name + " (ID: " + id + ")"; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GeoLocation that = (GeoLocation) o;
        return id == that.id;
    }
    
    @Override
    public int hashCode() { return Objects.hash(id); }
}