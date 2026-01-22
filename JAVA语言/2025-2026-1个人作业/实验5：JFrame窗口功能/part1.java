import java.awt.*;
import java.awt.event.ActionEvent;
import javax.swing.*;

public class part1 {
    public static void main(String[] args) {
        JFrame frame = new JFrame("109092023XXX许愿"); // 设置窗口标题
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(400, 100);
        JPanel panel = new JPanel(); // 创建面板
        FlowLayout layout = new FlowLayout(FlowLayout.CENTER); // 创建layout并居中
        panel.setLayout(layout);
        // 按钮
        JButton btn_l = new JButton("居左");
        JButton btn_c = new JButton("居中");
        JButton btn_r = new JButton("居右");
        btn_l.addActionListener((ActionEvent e) -> { // 事件监听，左对齐
            layout.setAlignment(FlowLayout.LEFT);
            panel.revalidate();
            System.out.println("按钮居左排列");
        });
        btn_c.addActionListener((ActionEvent e) -> { // 事件监听，居中对齐
            layout.setAlignment(FlowLayout.CENTER);
            panel.revalidate();
            System.out.println("按钮居中排列");
        });
        btn_r.addActionListener((ActionEvent e) -> { // 事件监听，右对齐
            layout.setAlignment(FlowLayout.RIGHT);
            panel.revalidate();
            System.out.println("按钮居右排列");
        });
        // 将按钮按顺序添加到面板
        panel.add(btn_l);
        panel.add(btn_c);
        panel.add(btn_r);
        frame.add(panel); // 面板添加到主窗口
        // 设置窗口相对于屏幕居中且可视
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }
}