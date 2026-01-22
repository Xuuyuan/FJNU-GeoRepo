import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class part1 {
    // GeoTarget作为数据模型类，存储单条地理目标信息
    static class GeoTarget implements Comparable<GeoTarget> {
        int id; // 编号
        String xuehao; // 学号
        String name; // 姓名
        String lname; // 名称
        String bigType; // 大类
        String midType; // 中类
        String smallType; // 小类
        double lon; // 经度
        double lat; // 纬度
        String fenpei; // 分配位置
        String address; // 地址

        // 构造每一行
        public GeoTarget(String line) {
            String[] parts = line.trim().split("\\s+"); // 用一个或多个空格分割一整行，增加兼容性
            this.xuehao = parts[0];
            this.name = parts[1];
            this.id = Integer.parseInt(parts[2]); // 强制转化为整数
            this.lname = parts[3];
            
            // 5、原类型字段用”；“隔开，将其分为大类、中类、小类三列；
            String[] typeParts = parts[4].split(";");
            this.bigType = typeParts.length > 0 ? typeParts[0] : "";
            this.midType = typeParts.length > 1 ? typeParts[1] : "";
            this.smallType = typeParts.length > 2 ? typeParts[2] : "";

            this.lon = Double.parseDouble(parts[5]);
            this.lat = Double.parseDouble(parts[6]);

            // 部分人没有分配和地址，这里需要做个判断
            this.fenpei = parts.length > 7 ? parts[7] : "";
            
            // 地址可能包含空格，需要特殊处理
            if (parts.length > 8) {
                StringBuilder addressBuilder = new StringBuilder();
                for (int i = 8; i < parts.length; i++) {
                    addressBuilder.append(parts[i]).append(" ");
                }
                this.address = addressBuilder.toString().trim();
            } else {
                this.address = "";
            }
        }

        // 用于排序
        @Override
        public int compareTo(GeoTarget other) {
            return Integer.compare(this.id, other.id);
        }
        
        // 将编号列提前至第一列的格式化
        public String toFString() {
            return String.join(" ",
                    String.valueOf(id),
                    xuehao,
                    name,
                    lname,
                    bigType,
                    midType,
                    smallType,
                    String.valueOf(lon),
                    String.valueOf(lat),
                    fenpei,
                    address);
        }

        // 重写toString，在打印时显示单行的详细信息
        @Override
        public String toString() {
            return "-----------------------------------\n" +
                   "编号: " + id + "\n" +
                   "学号: " + xuehao + "\n" +
                   "姓名: " + name + "\n" +
                   "建筑物名称: " + lname + "\n" +
                   "大类: " + bigType + "\n" +
                   "中类: " + midType + "\n" +
                   "小类: " + smallType + "\n" +
                   "经度: " + lon + "\n" +
                   "纬度: " + lat + "\n" +
                   "分配: " + fenpei + "\n" +
                   "地址: " + address + "\n" +
                   "-----------------------------------";
        }
    }

    // 创建GeoTarget类的列表
    private final List<GeoTarget> targets = new ArrayList<>();
    private String processedContent; // 用于存储处理后的字符串内容
    private byte[] bytes; // 用于存储字节内容

    public static void main(String[] args) {
        // 1、启动和退出程序时都在屏幕显示当前时间；
        // 启动时时间
        System.out.println("程序启动时间: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        // 调用动态方法需要在动态类里，所以另外运行
        part1 p = new part1();
        p.run();
        // 退出时时间，写在此处能防止报错等退出时不报时
        System.out.println("程序退出时间: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
    }

    public void run() {
        // 加载文件
        try (BufferedReader reader = new BufferedReader(new FileReader("地理目标.txt", StandardCharsets.UTF_8))) {
            reader.readLine(); 
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.trim().isEmpty()) { // 行不为空时就将地理目标加入targets列表
                    targets.add(new GeoTarget(line));
                }
            }
        } catch (IOException e) {
            System.err.println("读取文件时发生错误: " + e.getMessage());
            return;
        }

        if (targets.isEmpty()) { // 没有加载到数据
            System.out.println("文件为空，未加载到任何数据");
            return;
        }
        
        // 2、按编号从小到大排序，并将编号列提前至第一列；
        Collections.sort(targets);
        
        // 5、原类型字段用”；“隔开，将其分为大类、中类、小类三列；
        StringBuilder sb = new StringBuilder();
        sb.append("编号 学号 姓名 名称 大类 中类 小类 经度 纬度 分配 地址\n");
        for (GeoTarget target : targets) {
            sb.append(target.toFString()).append("\n"); // toFString方法将编号提前
        }
        processedContent = sb.toString();
        
        Scanner s = new Scanner(System.in);
        while (true) { // 显示菜单，让用户选择
            System.out.println("========== 功能菜单 ==========");
            System.out.println("1. 输出地理目标总数");
            System.out.println("2. 通过姓名和学号查询地理目标");
            System.out.println("3. 将类型分为三列");
            System.out.println("4. 将文件转换为字节型");
            System.out.println("5. 保存为新文件");
            System.out.println("6. 退出程序");
            System.out.println("==============================");

            System.out.print("请输入选择: ");
            String choice = s.nextLine();
            switch (choice) {
                case "1": // 3、输出总地理目标数；
                    System.out.println("总地理目标数共有: " + targets.size() + " 条");
                    break;
                case "2": // 查询目标
                    findTarget(s);
                    break;
                case "3": // 将类型进行分列，实则前面updateProcessedContent()方法中已经进行过
                    System.out.println("类型字段已分割为大、中、小类，显示如下：");
                    System.out.println("【排序并提前列后的所有地理目标信息】");
                    System.out.println(processedContent);
                    break;
                case "4": // 将文件转换为字节型
                    // 6、将文件转换为字节型；
                    if (processedContent == null) {
                        System.out.println("错误: 没有可转换的数据");
                        continue;
                    }
                    bytes = processedContent.getBytes(StandardCharsets.UTF_8);
                    System.out.println("成功，数据已转换为字节形式");
                    break;
                case "5": // 保存文件
                    // 7、让用户为保存文件命名。
                    if (bytes == null) {
                        System.out.println("请先将数据转换为字节形式，然后再进行保存。");
                        continue;
                    }
                    System.out.print("请输入想要保存为的文件名: ");
                    String saveName = s.nextLine();
                    
                    if (saveName.trim().isEmpty()) {
                        System.out.println("文件名不能为空");
                        continue;
                    }
                    
                    try (FileOutputStream fos = new FileOutputStream(saveName)) {
                        fos.write(bytes);
                        System.out.println("文件已成功保存为: " + saveName);
                    } catch (IOException e) {
                        System.err.println("保存文件时发生错误: " + e.getMessage());
                    }
                    break;
                case "6": // 退出程序
                    s.close();
                    return;
                default: // 没匹配到任何信息
                    System.out.println("输入的选项无效，请重新输入");
                    break;
            }
        }
    }

    private void findTarget(Scanner s) {
        // 4、输入本人的姓名和学号，即可输出对应的地理目标所有信息，否则提示具体输入错误；
        System.out.print("请输入要查询的姓名: ");
        String inputName = s.nextLine();
        System.out.print("请输入要查询的学号: ");
        String inputXuehao = s.nextLine();

        boolean findResult = false;
        boolean findXuehao = false;
        boolean findName = false;
        for (GeoTarget target : targets) {
            if (target.xuehao.equals(inputXuehao)) {
                findXuehao = true;
            }
            if (target.name.equals(inputName)) {
                findName = true;
            }
            if (target.xuehao.equals(inputXuehao) && target.name.equals(inputName)) {
                System.out.println("【查询到的地理目标信息】");
                System.out.println(target);
                findResult = true;
                break;
            }
        }

        if (!findResult) { // 未找到结果
            if (findXuehao && !findName) {
                System.out.println("查询失败: 输入的姓名无法匹配");
            } else if (!findXuehao && findName) {
                System.out.println("查询失败: 输入的学号无法匹配");
            } else {
             System.out.println("查询失败: 输入的姓名或学号无法匹配");
            }
        }
    }
}