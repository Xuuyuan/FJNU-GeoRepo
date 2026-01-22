import java.io.*;
import java.util.*;

public class Generic_Xy000 {
    private static final List<Map<String, String>> ls = new ArrayList<>(); // 存储地理目标
    private static final String[] headers = {"编号", "学号", "姓名", "类型", "经度", "纬度", "名称", "分配"}; // 表头
    public static void main(String[] args) {
        try (BufferedReader br = new BufferedReader(new FileReader("地理目标顺序排序.txt"))) { // 加载数据
            br.readLine(); // 跳过表头
            String l;
            while ((l = br.readLine()) != null) { // 行内读取并判断是否为空
                String[] v = l.split("\t");
                java.util.Map<String, String> map = new java.util.HashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    map.put(headers[i], v[i]); // 一一对应读入数据
                }
                ls.add(map); // 将数据存入存储地理目标的列表
            }
        } catch (IOException e) {
            System.err.println("读取文件时发生错误：" + e.getMessage());
            return;
        }
        // 读取生成的顺序排序的地理目标文本，按编号进行反转和洗牌，结果输出到屏幕。
        System.out.println("任务 1");
        System.out.println("原始排序数据：");
        print_list(ls);
        
        // 反转，Collections类内置实现
        Collections.reverse(ls);
        System.out.println("反转后数据：");
        print_list(ls);
        
        // 洗牌，Collections类内置实现
        Collections.shuffle(ls);
        System.out.println("洗牌后数据：");
        print_list(ls);

        // 提供目标查询功能。
        System.out.println("\n任务 2");
        target_search();
    }

    private static void print_list(List<java.util.Map<String, String>> ls) {
        System.out.println(String.join("\t", headers)); // 输出表头
        ls.stream().forEach(l -> {
            for (String h : headers) {
                System.out.print(l.get(h) + "\t"); // 逐个输出数据
            }
            System.out.println(); // 末尾换行
        });
    }

    private static void target_search() {
        Scanner s = new Scanner(System.in);
        while (true) {
            System.out.print("\n请输入要查询的地理目标名称（例如：又玄图书馆），输入e退出：");
            String command = s.nextLine();

            if ("e".equals(command)) {
                System.out.println("查询完毕，程序退出！");
                break;
            }

            List<Map<String, String>> result = new ArrayList<>(); // 存储查询结果
            for (Map<String, String> l : ls) {
                if (l.get("名称").contains(command)) { // 如果名称包含则加入查询结果列表
                    result.add(l);
                }
            }
            if (result.isEmpty()) {
                System.out.println("未找到与“" + command + "”相关的地理目标。");
            } 
            else if (result.size() == 1) { // 如果只找到一个结果，直接显示
                System.out.println("找到1个目标，信息如下：");
                display_target(result.get(0), s);
            } 
            else { // 如果找到多个结果，需要进行选择
                System.out.println("找到" + result.size() + "个目标，请选择要查看的目标：");
                for (int i = 0; i < result.size(); i++) { // 遍历
                    Map<String, String> item = result.get(i);
                    System.out.println("(" + (i+1) + ") " + item.get("名称") + "(分配: " + item.get("分配") + ")"); // 打印序号、名称和分配信息
                }

                System.out.print("\n请输入序号进行详细查询 (输入其它信息返回查询界面): ");
                String choice = s.nextLine();
                try {
                    int choice_int = Integer.parseInt(choice);
                    if (choice_int > 0 && choice_int <= result.size()) { // 检查输入
                        // 对输入的结果查询
                        display_target(result.get(choice_int - 1), s);
                    } else {
                        System.out.println("输入的序号超出范围，返回查询页面。");
                    }
                } catch (NumberFormatException e) {
                    System.out.println("输入的序号无效，返回查询页面。");
                }
            }
        }
        s.close();
    }

    private static void display_target(java.util.Map<String, String> target, Scanner scanner) {
        System.out.println("=====");
        System.out.println("名称：" + target.get("名称"));
        System.out.println(" - 类型：" + target.get("类型"));
        System.out.println(" - 经纬度：(" + target.get("经度") + ", " + target.get("纬度") + ")");

        String target_name = target.get("名称"); // 获取地理目标的具体名称 
        java.util.Map<String, String> data = new java.util.LinkedHashMap<>(); // 存储目标的元素

        // 根据地理目标名称中的关键词来确定其具体类型和可查询属性
        // 此处大致进行录入，暂时无法反应实际情况
        if (target_name.contains("图书馆") || target_name.contains("书房")) {
            data.put("座位数", "2500");
            data.put("门禁时间", "8:00-22:00");
            data.put("藏书量", "300万册");

        } else if (target_name.contains("餐厅") || target_name.contains("美食")) {
            data.put("营业时间", "6:00-19:00");
            data.put("营业档口", "伊乐拉面、云南小锅米线、古茗、肯德基");
            data.put("座位数", "800个");
            // 还可以根据不同食堂数据再细分

        } else if (target_name.contains("学院")) {
            data.put("主要用途", "提供给学院的教学、科研及办公场所");
            data.put("开放时间", "0:00-23:59");
            data.put("办公室分布", "1楼为实验室，6楼为辅导员办公室或会议室");

        } else if (target_name.contains("楼")) { // 兜底策略，公共教学楼
            data.put("主要用途", "公共课教学、自习教室");
            data.put("教室容量", "50、100、200");
            data.put("开放时间", "7:00-22:30");

        } else if (target_name.contains("广场")) {
            data.put("形状", "圆形");
            data.put("功能", "休闲漫步及学校文化体现");
            data.put("面积", "10000平方米");

        } else if (target_name.contains("田径场")) {
            data.put("设施", "400米标准跑道、足球场、看台、单杠");
            data.put("开放时间", "6:00-22:00");
            
        } else {
            System.out.println("该地理目标无可查询的属性。"); // 不匹配任何类型
            System.out.println("=====");
            return;
        }

        while (true) {
            System.out.println("可查询的元素如下： " + String.join(", ", data.keySet()));
            // 输入需要查询的元素
            System.out.print("请输入您想查询的元素(输入q可退出对当前目标的查询)：");
            String command = scanner.nextLine();

            if ("q".equals(command)) { // 退出当前目标的查询
                break;
            }

            String r = data.get(command);
            if (r != null) {
                System.out.println(" = 查询结果：" + command + ": " + r);
            } else {
                System.out.println(" = 输入无效，请重新输入。");
            }
        }
        System.out.println("=====");
    }
}