abstract class Construction { // 建筑用地基类
    protected String name; // 名称
    protected String location; // 位置描述
    protected double area; // 占地面积
    protected double width; // 宽度
    protected double length; // 长度
    protected double lat;  // 纬度
    protected double lon; // 经度

    public Construction(String name, String location, double area, double width, double length, double lat, double lon) { // 构造方法
        this.name = name;
        this.location = location;
        this.area = area;
        this.width = width;
        this.length = length;
        this.lat = lat;
        this.lon = lon;
    }

    // 外部访问方法
    public String getName() { return name; }
    public String getLocation() { return location; }
    public double getArea() { return area; }
    public double getLat() { return lat; }
    public double getLon() { return lon; }

    public abstract void displayInfo(); // 抽象方法，由子类具体实现

    /** 圆周率 */
    private static final double PI = Math.PI;
    /** 克拉索夫斯基椭球长半轴 */
    private static final double A = 6378245.0;
    /** 克拉索夫斯基椭球第一偏心率平方 */
    private static final double EE = 0.00669342162296594323;
    /** 百度坐标系转换专用常量 */
    private static final double X_PI = PI * 3000.0 / 180.0;

    // 坐标对象，封装精度和纬度
    public static class LatLng {
        private final double latitude;
        private final double longitude;

        public LatLng(double latitude, double longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
        }

        public double getLatitude() { return latitude; }
        public double getLongitude() { return longitude; }

        @Override // 此处需要对对象的toString方法做覆写
        public String toString() {
            return String.format("LatLng{latitude=%.6f, longitude=%.6f}", latitude, longitude);
        }
    }

    // gcj02和wgs84的经纬度转换方法
    protected static LatLng gcj02ToWGS84(double lat, double lon) { // lat，lon为高德纬度、经度
        double dLat = transformLat(lon - 105.0, lat - 35.0); // transformLat为计算纬度偏移方法
        double dLon = transformLon(lon - 105.0, lat - 35.0); // transformLon为计算经度偏移方法
        double radLat = lat / 180.0 * PI;
        double magic = Math.sin(radLat);
        magic = 1 - EE * magic * magic;
        double sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
        dLon = (dLon * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
        // 计算加密后的坐标
        double mgLat = lat + dLat;
        double mgLon = lon + dLon;
        // 取原始坐标与转换后坐标的差值，得到近似 WGS-84 值
        return new LatLng(lat * 2 - mgLat, lon * 2 - mgLon); // LatLng为封装经纬度方法
    }

    // gcj02和wgs84的经纬度偏移计算
    private static double transformLat(double x, double y) {
        double ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    // 计算精度偏移
    private static double transformLon(double x, double y) {
        double ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
        return ret;
    }
}

// 教学楼子类
class TeachingBuilding extends Construction {
    private int classroomCount; // 教室数量

    public TeachingBuilding(String name, String location, double area, double width, double length, double lat, double lon, int classroomCount) {
        super(name, location, area, width, length, lat, lon); // 调用父类的构造方法
        this.classroomCount = classroomCount;
    }

    @Override
    public void displayInfo() {
        System.out.println("【教学楼】");
        System.out.println("名称: " + getName());
        System.out.println("位置: " + getLocation());
        System.out.println("面积: " + getArea() + " 平方米");
        System.out.println("教室数量: " + this.classroomCount + " 间");
        System.out.println("高德坐标: Lat=" + getLat() + ", Lon=" + getLon());
        LatLng wgs84Coords = gcj02ToWGS84(getLat(), getLon());
        System.out.println("转换坐标: " + wgs84Coords);
    }
}

// 学院楼子类
class AcademicBuilding extends Construction {
    private String department; // 所属学院

    public AcademicBuilding(String name, String location, double area, double width, double length, double lat, double lon, String department) {
        super(name, location, area, width, length, lat, lon);
        this.department = department;
    }

    @Override
    public void displayInfo() {
        System.out.println("【学院楼】");
        System.out.println("名称: " + getName());
        System.out.println("位置: " + getLocation());
        System.out.println("面积: " + getArea() + " 平方米");
        System.out.println("所属学院: " + this.department);
        System.out.println("高德坐标: Lat=" + getLat() + ", Lon=" + getLon());
        LatLng wgs84Coords = gcj02ToWGS84(getLat(), getLon());
        System.out.println("转换坐标: " + wgs84Coords);
    }
}

// 食堂子类
class Canteen extends Construction {
    private int capacity; // 可容纳人数

    public Canteen(String name, String location, double area, double width, double length, double lat, double lon, int capacity) {
        super(name, location, area, width, length, lat, lon);
        this.capacity = capacity;
    }

    // 子类特有方法
    public void serveFood() {
        System.out.println(getName() + " 正在营业并供应食物中..");
    }

    @Override
    public void displayInfo() {
        System.out.println("【食堂】");
        System.out.println("名称: " + getName());
        System.out.println("位置: " + getLocation());
        System.out.println("面积: " + getArea() + " 平方米");
        System.out.println("可容纳人数: " + this.capacity + " 人");
        System.out.println("高德坐标: Lat=" + getLat() + ", Lon=" + getLon());
        LatLng wgs84Coords = gcj02ToWGS84(getLat(), getLon());
        System.out.println("转换坐标: " + wgs84Coords);
    }
}

// 广场子类
class Ground extends Construction {
    private String form; // 广场的形状

    public Ground(String name, String location, double area, double width, double length, double lat, double lon, String form) {
        super(name, location, area, width, length, lat, lon);
        this.form = form;
    }

    @Override
    public void displayInfo() {
        System.out.println("【广场】");
        System.out.println("名称: " + getName());
        System.out.println("位置: " + getLocation());
        System.out.println("面积: " + getArea() + " 平方米");
        System.out.println("形状: " + this.form);
        System.out.println("高德坐标: Lat=" + getLat() + ", Lon=" + getLon());
        LatLng wgs84Coords = gcj02ToWGS84(getLat(), getLon());
        System.out.println("转换坐标: " + wgs84Coords);
    }
}

public class part1 {
    public static void main(String[] args) {
        // 致广楼
        TeachingBuilding zhiGuangLou = new TeachingBuilding(
            "致广楼",
            "福建师范大学旗山校区",
            4858.63, // 数据由校园地图得到，较粗略测量，含教室、走廊、连廊
            90.77, // 数据由校园地图得到，顶端为1-116-1男卫生间，底端为1-114-7楼梯
            110.0, // 数据由校园地图得到，左端为1-117，右端为1-119-1室外平台
            26.026182,
            119.2104,
            170
        );

        // 以下作为示例，数据较为粗略
        // 食堂
        Canteen qianyeYuan = new Canteen(
            "千叶园食堂",
            "旗山校区东区",
            4000.0, 80.0, 50.0,
            26.02811, 119.21255,
            2000
        );
        // 学院楼
        AcademicBuilding dikeLou = new AcademicBuilding(
            "16#科研楼",
            "旗山校区北区东区田径场旁",
            9000.0, 120.0, 75.0,
            26.0275, 119.211,
            "地理科学学院"
        );
        // 广场
        Ground baochenSquare = new Ground(
            "宝琛广场",
            "旗山校区教学楼群",
            15000.0, 150.0, 100.0,
            26.026, 119.210,
            "圆形"
        );

        // 创建数组并遍历
        Construction[] buildings = {zhiGuangLou, qianyeYuan, dikeLou, baochenSquare};
        for (Construction building : buildings) {
            building.displayInfo();

            // 子类特有的方法
            if (building instanceof Canteen canteen) {
                canteen.serveFood();
            }
        }
    }
}