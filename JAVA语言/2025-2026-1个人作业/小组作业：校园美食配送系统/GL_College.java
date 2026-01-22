// 学院楼子类
public class GL_College extends GeoLocation {
    public GL_College(long id, String name, String categoryString, double longitude, double latitude) {
        super(id, name, categoryString, longitude, latitude);
    }

    @Override
    public String displayInfo() { return String.format("[学院楼] %s - %s", getId(), getName()); }
}