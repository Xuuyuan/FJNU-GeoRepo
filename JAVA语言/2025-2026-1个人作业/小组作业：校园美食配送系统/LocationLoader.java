import java.io.*;
import java.util.*;

// 加载地点类
public class LocationLoader {
    // 从文本文件加载地理目标
    public static List<GeoLocation> loadLocations(String filePath) throws IOException {
        List<GeoLocation> locations = new ArrayList<>();
        // 读取文件
        try (BufferedReader r = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = r.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                // 以制表符进行分割
                String[] parts = line.split("\t"); 
                if (parts.length < 6) {
                    System.err.println("有参数不足的行，执行跳过：" + line);
                    continue;
                }

                try {
                    long id = Long.parseLong(parts[0]); // 学号
                    String categoryString = parts[2]; // 地物类型
                    double longitude = Double.parseDouble(parts[3]); // 精度
                    double latitude = Double.parseDouble(parts[4]); // 纬度
                    String name = parts[5]; // 地点名称
                    String mainCategory = categoryString.split(";")[0]; // 主要类型

                    // 根据类型创建不同子类对象
                    switch (mainCategory) {
                        case "餐饮服务" -> locations.add(new GL_Canteen(id, name, categoryString, longitude, latitude));
                        case "科教文化服务" -> {
                            if (name.contains("图书馆")) {
                                locations.add(new GL_Library(id, name, categoryString, longitude, latitude));
                            } else if (name.contains("学院")) {
                                locations.add(new GL_College(id, name, categoryString, longitude, latitude));
                            } else { // 教学楼
                                locations.add(new GL_TeachingBuilding(id, name, categoryString, longitude, latitude));
                            }
                        }
                        case "地名地址信息" -> // 计为教学楼
                            locations.add(new GL_TeachingBuilding(id, name, categoryString, longitude, latitude));
                        default -> System.err.println("未知地点类型【" + mainCategory + "】：" + line);
                    }
                } catch (NumberFormatException e) {
                    System.err.println("有数据格式错误的行，执行跳过：" + line);
                }
            }
        }
        return locations;
    }

    // 统计类别及数量
    public static String getCategoryCounts(List<GeoLocation> locations) {
        Map<String, Integer> counts = new HashMap<>();
        for (GeoLocation loc : locations) {
            String category = loc.getMainCategory();
            counts.put(category, counts.getOrDefault(category, 0) + 1);
        }

        StringBuilder sb = new StringBuilder("【地点统计】\n");
        for (Map.Entry<String, Integer> entry : counts.entrySet()) {
            sb.append(entry.getKey()).append(": ").append(entry.getValue()).append(" 个\n");
        }
        return sb.toString();
    }
}