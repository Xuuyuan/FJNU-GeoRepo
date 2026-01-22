import java.util.Arrays;
import java.util.Scanner;

public class work1_13_1 {
    public static void main(String[] args) throws Exception {
        System.out.print("请输入一个4位数：");
        Scanner s = new Scanner(System.in);
        int a = s.nextInt();
        if (a < 1000 || a > 9999) {
            System.out.println("输入错误，需要输入一个4位数");
            return;
        }
        int num = a;
        while (num != 6174 && num != 0) {
            char[] d = Integer.toString(num).toCharArray();
            // d不一定为四位数，补足到四位
            while (d.length < 4) {
                d = ("0" + new String(d)).toCharArray();
            }
            Arrays.sort(d);
            String asc = new String(d);
            String desc = new StringBuilder(asc).reverse().toString();
            int small = Integer.parseInt(asc);
            int big = Integer.parseInt(desc);
            num = big - small;
            System.out.println(big + " - " + small + " = " + num);
        }
        if (num == 6174) {
            System.out.println("经过若干次计算，最终会得到6174");
        } else { // 只能是为0时
            System.out.println("经过若干次计算，最终会得到0（无法得到6174）");
        }
    }
}
