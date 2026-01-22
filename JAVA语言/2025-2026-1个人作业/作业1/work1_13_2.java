import java.util.Arrays;
import java.util.Scanner;

public class work1_13_2 {
    public static void main(String[] args) throws Exception {
        System.out.print("请输入菱形字符数：");
        Scanner s = new Scanner(System.in);
        int a = s.nextInt();
        if (a <= 0 || a % 2 == 0) {
            System.out.println("菱形字符数必须是正的奇数。");
            return;
        }
        
        char[][] d = new char[a][a];
        for (int i = 0; i < a; i++) {
            Arrays.fill(d[i], ' '); // 先用空格填充
        }
        
        // 遍历每一行
        for (int i = 0; i < a; i++) {
            // 需要填充的星号数量
            int scnt = a - 2 * Math.abs(i - a/2);
            // 开始填充的位置
            int ss = Math.abs(i - a/2);
            // 填充星号
            for (int j = 0; j < scnt; j++) d[i][ss + j] = '*';
        }

        for (int i = 0; i < a; i++) {
            for (int j = 0; j < a; j++) {
                System.out.print(d[i][j]);
            }
            System.out.println();
        }
    }
}
