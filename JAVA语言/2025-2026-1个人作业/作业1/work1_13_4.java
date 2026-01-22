import java.util.Scanner;

public class work1_13_4 {
    public static void main(String[] args) {
        System.out.print("请输入长度：");
        Scanner s = new Scanner(System.in);
        int a = s.nextInt();
        if (a <= 0) {
            System.out.println("长度必须是正数。");
            return;
        }
        for (int i=1; i < a+1; i++) {
            for (int j=0; j < i; j++) {
                System.out.print("*");
            }
            System.out.println();
        }
    }
}
