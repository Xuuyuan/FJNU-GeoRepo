// 餐厅子类
public class GL_Canteen extends GeoLocation {
    public GL_Canteen(long id, String name, String categoryString, double longitude, double latitude) {
        super(id, name, categoryString, longitude, latitude);
    }

    @Override
    public String displayInfo() { return String.format("[食堂] %s - %s", getId(), getName()); }
}