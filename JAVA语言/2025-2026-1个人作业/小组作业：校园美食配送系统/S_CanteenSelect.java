import java.awt.*;
import java.util.List;
import java.util.Map;
import javax.swing.*;
import javax.swing.border.EmptyBorder;

// 食堂选择界面
public class S_CanteenSelect extends JFrame {
    final private Map<String, GeoLocation> essLocations;
    final private List<GeoLocation> allLocations;

    public S_CanteenSelect(Map<String, GeoLocation> essLocations, List<GeoLocation> allLocations) {
        this.essLocations = essLocations;
        this.allLocations = allLocations;

        // 设置页面基本布局
        setTitle("校园美食配送");
        setSize(400, 300);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout());

        JLabel titleLabel = new JLabel("校园美食配送", SwingConstants.CENTER);
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 24));
        titleLabel.setBorder(new EmptyBorder(20, 0, 20, 0));
        add(titleLabel, BorderLayout.NORTH);

        JPanel buttonPanel = new JPanel();
        buttonPanel.setLayout(new FlowLayout(FlowLayout.CENTER, 40, 20)); 
        
        // 对应两个食堂的按钮
        JButton cuizhuBtn = new JButton("翠竹园");
        cuizhuBtn.setFont(new Font("SansSerif", Font.PLAIN, 18));
        cuizhuBtn.setPreferredSize(new Dimension(120, 50));
        
        JButton taoliBtn = new JButton("桃李园");
        taoliBtn.setFont(new Font("SansSerif", Font.PLAIN, 18));
        taoliBtn.setPreferredSize(new Dimension(120, 50));
        
        buttonPanel.add(cuizhuBtn);
        buttonPanel.add(taoliBtn);
        add(buttonPanel, BorderLayout.CENTER);

        JLabel hintLabel = new JLabel("点击按钮开始配送", SwingConstants.CENTER);
        hintLabel.setFont(new Font("SansSerif", Font.PLAIN, 14));
        hintLabel.setBorder(new EmptyBorder(20, 0, 20, 0));
        add(hintLabel, BorderLayout.SOUTH);

        cuizhuBtn.addActionListener(e -> {
            // 翠竹园的档口，共20个
            String[] dks = new String[]{
                "塔斯汀中国汉堡", "蜜雪冰城", "老上海肠粉馄饨", "爱米渔粗粮·渔粉",
                "正宗隆江猪脚饭", "蒸佰味", "西安大碗面", "回洋號沙茶面",
                "麺大厨蜀味记", "沙小二醉沙县", "小哥瓦罐", "小湘菜精品套餐",
                "张记港式烧腊", "美而美原切牛排", "小厨扒饭", "江西牛骨粉",
                "好又饱·食尚快餐", "临榆炸鸡腿", "田阿婆麻辣烫", "果汁源鲜榨果汁"
            };
            GeoLocation canteenLoc = essLocations.get("翠竹园");
            openTaskGenerator("翠竹园", canteenLoc, dks);
        });

        taoliBtn.addActionListener(e -> {
            // 桃李园的档口
            String[] dks = new String[]{
                "金将军恩情拌饭", "豫味北方烤饼", "赣味田园自选大餐", "缘味先石锅饭",
                "虾仁捞饭", "叁餐台式黑金卤肉饭", "林记牛羊双粉铺", "国燕现蒸凉皮",
                "沙县小吃", "泼金记爆炒浇头面", "五谷渔粉", "巢南之", "首尔炸鸡"
            };
            GeoLocation canteenLoc = essLocations.get("桃李园");
            openTaskGenerator("桃李园", canteenLoc, dks);
        });
    }
    
    // 打开任务生成界面
    private void openTaskGenerator(String canteenName, GeoLocation canteenLoc, String[] dks) {
        S_TaskGenerator screen2 = new S_TaskGenerator(
                this, 
                allLocations,
                essLocations,
                canteenLoc, 
                canteenName,
                dks
        );
        screen2.setVisible(true);
        this.setVisible(false); 
    }
}