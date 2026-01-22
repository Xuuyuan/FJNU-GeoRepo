// 图书馆子类
public class GL_Library extends GeoLocation {
    public GL_Library(long id, String name, String categoryString, double longitude, double latitude) {
        super(id, name, categoryString, longitude, latitude);
    }

    @Override
    public String displayInfo() { return String.format("[图书馆] %s - %s", getId(), getName()); }
}