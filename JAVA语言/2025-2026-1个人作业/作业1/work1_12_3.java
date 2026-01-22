import java.util.Scanner;

public class work1_12_3 {
    public static void main(String[] args) throws Exception {
        System.out.print("请输入一个3位数：");
        Scanner s = new Scanner(System.in);
        int a = s.nextInt();
        if (a < 100 || a > 999) {
            System.out.println("输入错误，需要输入一个3位数");
            return;
        }
        // 个位即对10取余，十位即除10再对10取余，百位即除100
        if (Math.pow((a % 10),3) + Math.pow(((a / 10) % 10),3) + Math.pow((a / 100),3) == a) {
            System.out.println(a + "是水仙花数");
        } else {
            System.out.println(a + "不是水仙花数");
        }
    }
}
