import java.util.Scanner;

public class work1_12_1 {
    public static void main(String[] args) throws Exception {
        System.out.print("请输入3个数，用空格隔开：");
        Scanner s = new Scanner(System.in);
        int a = s.nextInt();
        int b = s.nextInt();
        int c = s.nextInt();
        System.out.println("3个数中的最大值为：" + Math.max(a, Math.max(b, c)));
    }
}
