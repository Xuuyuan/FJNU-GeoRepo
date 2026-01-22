// 教学楼子类
public class GL_TeachingBuilding extends GeoLocation {
    public GL_TeachingBuilding(long id, String name, String categoryString, double longitude, double latitude) {
        super(id, name, categoryString, longitude, latitude);
    }

    @Override
    public String displayInfo() { return String.format("[教学楼] %s - %s", getId(), getName()); }
}