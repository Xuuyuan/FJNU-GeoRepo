import java.awt.*;
import java.awt.event.ActionEvent;
import javax.swing.*;

public class part3 {
    public static void main(String[] args) {
        JFrame frame = new JFrame("按钮清空"); // 创建窗口
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(230, 130); // 设置宽度，此处需要适应组件
        JPanel panel = new JPanel(); // 创建panel
        panel.setLayout(new FlowLayout(FlowLayout.CENTER)); // 创建layout

        JLabel l_name = new JLabel("用户名:"); // 用户名提示
        JLabel l_pwd = new JLabel("密码:  "); // 密码提示
        JTextField f_name = new JTextField(15); // 文本框
        JPasswordField f_pwd = new JPasswordField(15); // 密码框
        JButton bc_name = new JButton("清除用户名"); // 第一个按钮
        JButton bc_pwd = new JButton("清除密码"); // 第二个按钮
        bc_name.addActionListener((ActionEvent e) -> { // 监听第一个按钮
            f_name.setText(""); // 清除文本框的内容
        });
        bc_pwd.addActionListener((ActionEvent e) -> { // 监听第二个按钮
            f_pwd.setText(""); // 清除密码框的内容
        });
        // 按顺序添加组件到面板中、再添加面板到窗口中
        panel.add(l_name);
        panel.add(f_name);
        panel.add(l_pwd);
        panel.add(f_pwd);
        panel.add(bc_name);
        panel.add(bc_pwd);
        frame.add(panel);
        // 窗口居中并可视
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }
}
