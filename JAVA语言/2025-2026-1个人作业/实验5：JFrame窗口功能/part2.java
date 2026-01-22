import java.awt.*;
import javax.swing.*;

public class part2 {
    public static void main(String[] args) {
        JFrame frame = new JFrame("109092023XXX许愿");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(500, 350);
        frame.setLayout(new GridLayout(3, 1)); // 创建网格布局

        // 第一组
        JPanel panel1 = new JPanel(new FlowLayout(FlowLayout.LEFT));
        panel1.setBorder(BorderFactory.createTitledBorder("第一组（可多选）")); // 第一组文字
        for (int i = 1; i <= 7; i++) {
            panel1.add(new JRadioButton("选项" + i));
        }
        JScrollPane sPane = new JScrollPane(panel1); // 滚动条实现
        frame.add(sPane); // 将滚动条包裹后的panel1加入主窗口中

        // 第二组
        JPanel panel2 = new JPanel(new FlowLayout(FlowLayout.LEFT));
        panel2.setBorder(BorderFactory.createTitledBorder("第二组（单选按钮）")); // 第二组文字
        ButtonGroup btn_group = new ButtonGroup(); // 用按钮组来管理按钮
        for (int i = 1; i <= 3; i++) {
            JRadioButton radioButton = new JRadioButton("选择" + i);
            btn_group.add(radioButton); // 将按钮添加到按钮组中
            panel2.add(radioButton); // 将按钮添加到面板中
        }
        frame.add(panel2);

        // 第三组
        JPanel panel3 = new JPanel(new FlowLayout(FlowLayout.LEFT));
        panel3.setBorder(BorderFactory.createTitledBorder("第三组（复选按钮）"));
        JCheckBox checkBox1 = new JCheckBox("项目1");
        JCheckBox checkBox2 = new JCheckBox("项目2");
        JCheckBox checkBox3 = new JCheckBox("项目3");
        JCheckBox checkBox4 = new JCheckBox("项目4");
        // 默认选中前两个复选框
        checkBox1.setSelected(true);
        checkBox2.setSelected(true);
        // 依次添加元素
        panel3.add(checkBox1);
        panel3.add(checkBox2);
        panel3.add(checkBox3);
        panel3.add(checkBox4);
        frame.add(panel3);

        // 窗口居中并可视
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }
}