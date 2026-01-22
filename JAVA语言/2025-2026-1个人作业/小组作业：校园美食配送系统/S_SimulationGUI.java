import java.awt.*;
import java.io.*;
import java.util.Date;
import java.util.List;
import java.util.Queue;
import java.util.Vector;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger; 
import javax.swing.*;
import javax.swing.border.EmptyBorder;

// 模拟配送的GUI界面
public final class S_SimulationGUI extends JFrame { 
    private JTextArea logArea;
    private JButton saveLogBtn;
    private JButton clearLogBtn; 
    private JButton backBtn; 
    private JLabel taskQueueLabel;
    final private JFrame parentScreen; 

    final private Queue<DeliveryTask> taskQueue = new ConcurrentLinkedQueue<>();
    final private ExecutorService riderPool;
    private int riderCount = 0;

    final private List<DeliveryResult> resultsList = new Vector<>(); 
    final private AtomicInteger tasksRemaining; 

    public S_SimulationGUI(JFrame parentScreen, List<GeoLocation> allLocations, List<DeliveryTask> tasks) {
        this.parentScreen = parentScreen;
        this.tasksRemaining = new AtomicInteger(tasks.size());
        // 设置主要窗口信息
        setTitle("校园多线程物流配送模拟系统");
        setSize(800, 600);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); 
        setLocationRelativeTo(null);
        // 初始化
        logMessage("系统启动时间: " + new Date());
        initComponents(); 
        logMessage("成功加载 " + allLocations.size() + " 个地理目标。");
        logMessage(LocationLoader.getCategoryCounts(allLocations));
        // 线程池加载
        riderPool = Executors.newFixedThreadPool(10); 
        this.taskQueue.addAll(tasks);
        logMessage("已加载 " + tasks.size() + " 个配送任务。");
        updateTaskQueueLabel();
        startDispatch();
    }

    private void initComponents() { // 窗口内布局初始化
        Font logFont = new Font("SansSerif", Font.PLAIN, 14);
        Font buttonFont = new Font("SansSerif", Font.BOLD, 12);
        ((JPanel) getContentPane()).setBorder(new EmptyBorder(5, 5, 5, 5));
        setLayout(new BorderLayout(5, 5)); 
        logArea = new JTextArea();
        logArea.setEditable(false);
        logArea.setFont(logFont); 
        logArea.setMargin(new Insets(5, 5, 5, 5)); 
        JScrollPane scrollPane = new JScrollPane(logArea);
        add(scrollPane, BorderLayout.CENTER);
        JPanel controlPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 5, 5));
        controlPanel.setBorder(new EmptyBorder(5, 0, 0, 0)); 
        backBtn = new JButton("返回上一页");
        backBtn.setFont(buttonFont);
        backBtn.setForeground(Color.BLUE);
        saveLogBtn = new JButton("保存日志");
        saveLogBtn.setFont(buttonFont); 
        clearLogBtn = new JButton("清空日志");
        clearLogBtn.setFont(buttonFont); 
        clearLogBtn.setForeground(Color.RED); 
        taskQueueLabel = new JLabel("任务队列: 0");
        taskQueueLabel.setFont(buttonFont); 
        taskQueueLabel.setBorder(new EmptyBorder(0, 10, 0, 0)); 
        controlPanel.add(backBtn);
        controlPanel.add(saveLogBtn);
        controlPanel.add(clearLogBtn); 
        controlPanel.add(taskQueueLabel);
        add(controlPanel, BorderLayout.SOUTH);
        saveLogBtn.addActionListener(e -> saveLog());
        clearLogBtn.addActionListener(e -> {
            logArea.setText(""); 
            logMessage("日志已清空: " + new Date()); 
        });
        
        backBtn.addActionListener(e -> {
            handleShutdown();
        });
    }
    // 关闭按钮
    private void handleShutdown() {
        int choice = JOptionPane.showConfirmDialog(
            this,
            "返回上一页将终止所有正在运行的配送任务。",
            "确认返回",
            JOptionPane.YES_NO_OPTION,
            JOptionPane.WARNING_MESSAGE
        );
        
        if (choice == JOptionPane.YES_OPTION) {
            logMessage("系统关闭时间: " + new Date());
            riderPool.shutdownNow(); 
            parentScreen.setVisible(true); 
            this.dispose(); 
        }
    }
    // 开始派单
    private void startDispatch() {
        logMessage("开始派单...");
        while (!taskQueue.isEmpty()) {
            dispatchRider();
        }
        logMessage("所有任务均已派出。");
    }
    // 派出骑手
    private void dispatchRider() {
        DeliveryTask task = taskQueue.poll(); 
        if (task == null) {
            return;
        }
        String riderName = "骑手-" + (++riderCount); // 通过自增实现不同骑手名字
        RiderThread rider = new RiderThread(riderName, task, this, resultsList,  tasksRemaining);
        riderPool.submit(rider); 
        updateTaskQueueLabel();
    }
    // 保存日志文件
    private void saveLog() {
        JFileChooser fc = new JFileChooser();
        fc.setDialogTitle("保存日志文件");
        int us = fc.showSaveDialog(this);
        if (us == JFileChooser.APPROVE_OPTION) {
            File file = fc.getSelectedFile();
            if (!file.getAbsolutePath().endsWith(".txt")) {
                file = new File(file.getAbsolutePath() + ".txt");
            }
            try (FileWriter fw = new FileWriter(file)) {
                fw.write(logArea.getText());
                logMessage("日志已保存到: " + file.getAbsolutePath());
            } catch (IOException e) {
                logMessage("错误: 保存日志失败！" + e.getMessage());
            }
        }
    }

    public void logMessage(String message) { 
        SwingUtilities.invokeLater(() -> {
            logArea.append(message + "\n");
            logArea.setCaretPosition(logArea.getDocument().getLength());
        });
    }

    private void updateTaskQueueLabel() {
        SwingUtilities.invokeLater(() -> {
            taskQueueLabel.setText("任务队列: " + taskQueue.size());
        });
    }

    public List<DeliveryResult> getResultsList() { return resultsList; }
}