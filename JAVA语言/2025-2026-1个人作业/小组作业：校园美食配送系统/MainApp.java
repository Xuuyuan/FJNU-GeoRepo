import java.io.IOException;
import java.util.*;
import javax.swing.*;

public class MainApp {
    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (ClassNotFoundException | IllegalAccessException | InstantiationException | UnsupportedLookAndFeelException e) {
            System.err.println("设置UI时遇到错误：" + e.getMessage());
        }

        // 加载所有数据
        List<GeoLocation> allLocations;
        Map<String, GeoLocation> essLocations = new HashMap<>();

        try {
            allLocations = LocationLoader.loadLocations("小组成员地理目标.txt");
            if (allLocations.isEmpty()) {
                showError("未能加载到任何地理目标。");
                return;
            }

            // 从配置文件中寻找所需的地点（翠竹、桃李、地科楼、图书馆、致广，作为配送点位）
            essLocations.put("翠竹园", findLocation(allLocations, "翠竹园"));
            essLocations.put("桃李园", findLocation(allLocations, "桃李园"));
            essLocations.put("地科楼", findLocation(allLocations, "地理科学学院"));
            essLocations.put("又玄图书馆", findLocation(allLocations, "又玄图书馆"));
            essLocations.put("致广楼", findLocation(allLocations, "致广楼"));

            // 检查地点
            for (Map.Entry<String, GeoLocation> entry : essLocations.entrySet()) {
                if (entry.getValue() == null) {
                    showError("未能在配置文件中找到所需地点【" + entry.getKey() + "】");
                    return;
                }
            }

        } catch (IOException e) {
            showError("启动失败：无法读取文件 " + e.getMessage());
            return;
        }

        // 打开餐厅选择页面
        SwingUtilities.invokeLater(() -> {
            S_CanteenSelect screen1 = new S_CanteenSelect(essLocations, allLocations);
            screen1.setVisible(true);
        });
    }

    // 根据名称查找全名中包含该部分的地点
    private static GeoLocation findLocation(List<GeoLocation> locations, String nameKey) {
        for (GeoLocation loc : locations) { if (loc.getName().contains(nameKey)) { return loc; } }
        return null;
    }

    // 错误弹窗，比控制台输出更直观
    private static void showError(String message) {
        JOptionPane.showMessageDialog(null, message, "错误", JOptionPane.ERROR_MESSAGE);
    }
}