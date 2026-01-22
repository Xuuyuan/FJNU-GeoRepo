import java.awt.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.TitledBorder;
// util 只使用到需要的类
// 任务生成界面
public class S_TaskGenerator extends JFrame {
    private JFrame parentScreen; 
    private List<GeoLocation> allLocations;
    private Map<String, GeoLocation> essLocations;
    private GeoLocation canteenSource; 
    private List<JCheckBox> dangkouCheckBoxes = new ArrayList<>();
    private List<JCheckBox> destCheckBoxes = new ArrayList<>();
    private Map<String, GeoLocation> destMap = new HashMap<>();

    public S_TaskGenerator(JFrame parentScreen, List<GeoLocation> allLocations,
                                 Map<String, GeoLocation> essLocations,
                                 GeoLocation canteenSource, String canteenName, String[] dks) {
        this.parentScreen = parentScreen;
        this.allLocations = allLocations;
        this.essLocations = essLocations;
        this.canteenSource = canteenSource;

        setTitle(canteenName + " 档口选择");
        setSize(500, 600);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout(10, 10));
        ((JPanel) getContentPane()).setBorder(new EmptyBorder(10, 10, 10, 10));

        // 档口选择GUI
        JPanel dangkouPanel = new JPanel();
        dangkouPanel.setLayout(new BoxLayout(dangkouPanel, BoxLayout.Y_AXIS));
        dangkouPanel.setBorder(new TitledBorder("档口选择 (至少2个)"));
        for (String dangkouName : dks) {
            JCheckBox cb = new JCheckBox(dangkouName);
            cb.setFont(new Font("SansSerif", Font.PLAIN, 16));
            dangkouCheckBoxes.add(cb);
            dangkouPanel.add(cb);
        }
        add(new JScrollPane(dangkouPanel), BorderLayout.CENTER);

        // 派送地点GUI
        JPanel destPanel = new JPanel();
        destPanel.setLayout(new BoxLayout(destPanel, BoxLayout.Y_AXIS));
        destPanel.setBorder(new TitledBorder("派送地点 (至少2个)"));
        String[] destNames = new String[]{"地科楼", "又玄图书馆", "致广楼"};
        for (String name : destNames) {
            JCheckBox cb = new JCheckBox(name);
            cb.setFont(new Font("SansSerif", Font.PLAIN, 16));
            destCheckBoxes.add(cb);
            destPanel.add(cb);
            destMap.put(name, essLocations.get(name));
        }
        // 底部GUI
        JPanel bottomPanel = new JPanel(new BorderLayout(10, 10));
        bottomPanel.add(destPanel, BorderLayout.NORTH);
        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 20, 5));
        JButton backBtn = new JButton("返回");
        JButton startBtn = new JButton("开始配送");
        startBtn.setFont(new Font("SansSerif", Font.BOLD, 18));
        buttonPanel.add(backBtn);
        buttonPanel.add(startBtn);
        bottomPanel.add(buttonPanel, BorderLayout.SOUTH);
        add(bottomPanel, BorderLayout.SOUTH);

        // 返回按钮
        backBtn.addActionListener(e -> {
            parentScreen.setVisible(true);
            this.dispose(); 
        });

        // 开始配送按钮
        startBtn.addActionListener(e -> {
            // 获取所有勾选的项
            List<String> selectedDangkou = new ArrayList<>();
            for (JCheckBox cb : dangkouCheckBoxes) {
                if (cb.isSelected()) { selectedDangkou.add(cb.getText()); }
            }
            List<GeoLocation> selectedDests = new ArrayList<>();
            for (JCheckBox cb : destCheckBoxes) {
                if (cb.isSelected()) { selectedDests.add(destMap.get(cb.getText())); }
            }
            // 对输入的内容进行验证
            if (selectedDangkou.size() < 2) {
                showError("必须至少选择2个档口！");
                return;
            } else if (selectedDests.size() < 2) {
                showError("必须至少选择2个派送地点！");
                return;
            } else if (selectedDests.size() > selectedDangkou.size()) {
                showError("派送地点数量不能超过档口数量！");
                return;
            }

            // 生成任务列表
            List<DeliveryTask> tasksToRun = new ArrayList<>();
            for (int i = 0; i < selectedDangkou.size(); i++) {
                String dangkouName = selectedDangkou.get(i); 
                GeoLocation dest = selectedDests.get(i % selectedDests.size());
                tasksToRun.add(new DeliveryTask(canteenSource, dest, dangkouName));
            }

            // 启动模拟界面
            S_SimulationGUI screen3 = new S_SimulationGUI(this, allLocations, tasksToRun);
            screen3.setVisible(true);
            this.setVisible(false);
        });
    }
    
    private void showError(String message) {
        JOptionPane.showMessageDialog(this, message, "输入错误", JOptionPane.WARNING_MESSAGE);
    }
}