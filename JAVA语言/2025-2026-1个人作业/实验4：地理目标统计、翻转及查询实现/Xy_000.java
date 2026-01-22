import java.io.*;
import java.util.*;
import java.util.stream.Collectors;

public class Xy_000 {
    public static void main(String[] args) {
        List<String[]> ls = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader("地理目标-集合.txt"))) {
            br.readLine(); // 第一行为表头，直接跳过
            String l;
            while ((l = br.readLine()) != null) { // 行内读取并判断是否为空
                ls.add(l.split("\t")); // 所使用的分隔符为制表符
            }
        } catch (IOException e) {
            System.err.println("读取文件时发生错误：" + e.getMessage());
            return;
        }
        // 查找所有记录中存在字段为空或NULL的记录，并显示在屏幕上；将空字段或NULL替换为null，记录替换的次数。默认在末尾添加缺失字段。
        System.out.println("任务 1");
        t_find_and_replace(ls);

        // 根据”编号“字段顺序排序，并将编号作为第一列，保存为"地理目标顺序排序.txt"。
        System.out.println("\n任务 2");
        t_sort_and_save(ls, "地理目标顺序排序.txt");

        // 统计大类的类别和各自的目标数量。
        System.out.println("\n任务 3");
        t_count(ls);

        // 统计大类为“科教文化服务”的目标数量，按“编号”排序显示该大类的所有目标。
        System.out.println("\n任务 4");
        t_kejiao_display(ls, "科教文化服务");
    }

    private static void t_find_and_replace(List<String[]> ls) {
        int replace_cnt = 0;
        // 遍历记录
        for (String[] l : ls) {
            boolean find = false;
            // 遍历字段
            for (int i = 0; i < l.length; i++) {
                if (l[i].isEmpty() || "NULL".equals(l[i])) { // 字段为空或为NULL
                    find = true;
                    break;
                }
            }
            if (find) {
                System.out.println(String.join("\t", l)); // 将有空的记录显示在屏幕上
                // 遍历以记录替换的次数
                for (int i = 0; i < l.length; i++) {
                     if (l[i].isEmpty() || "NULL".equals(l[i])) {
                        l[i] = "null"; // 替换为null
                        replace_cnt++; // 记录的次数+1
                    }
                }
            }
        }
        System.out.println("将空字段或NULL替换为null，总计替换次数：" + replace_cnt);
    }
    
    private static void t_sort_and_save(List<String[]> ls, String save_path) {
        // 使用Collections对列表排序，将字符串强制为整数以进行比较。编号为r[0]。
        Collections.sort(ls, Comparator.comparingInt(r -> Integer.parseInt(r[0])));

        try (BufferedWriter w = new BufferedWriter(new FileWriter(save_path))) {
            w.write("编号\t学号\t姓名\t类型\t经度\t纬度\t名称\t分配\n"); // 表头
            for (String[] l : ls) {
                w.write(String.join("\t", l) + "\n");
            }
            System.out.println("数据已排序并保存为 " + save_path);
        } catch (IOException e) {
            System.err.println("写入文件时发生错误：" + e.getMessage());
        }
    }

    private static void t_count(List<String[]> ls) {
        // 使用Map来存储对各个大类的计数
        Map<String, Integer> type_cnt = new HashMap<>();
        for (String[] l : ls) {
            String type = l[3]; // 类型字段，第四个
            String main_type = type.split(";")[0].trim(); // 取分割出的第一个
            int type_time = type_cnt.getOrDefault(main_type, 0); // 取出类别的计数
            type_cnt.put(main_type, type_time + 1); // 加1之后再存入
        }

        System.out.println("大类的类别和各自的目标数量如下：");
        for (Map.Entry<String, Integer> i : type_cnt.entrySet()) {
            System.out.println(i.getKey() + "：" + i.getValue() + "个");
        }
    }

    private static void t_kejiao_display(List<String[]> ls, String target) {
        List<String[]> target_ls = ls.stream()
                .filter(r -> r[3].split(";")[0].trim().equals(target)) // 对每条记录筛选，选出大类为target的记录
                .collect(Collectors.toList()); // 收集为列表
        
        target_ls.sort(Comparator.comparingInt(r -> Integer.parseInt(r[0]))); // 按编号排序

        System.out.println("大类为 " + target + " 的目标共有 " + target_ls.size() + " 个：");
        System.out.println("编号\t学号\t姓名\t类型\t经度\t纬度\t名称\t分配");
        for (String[] l : target_ls) {
            System.out.println(String.join("\t", l));
        }
    }
}