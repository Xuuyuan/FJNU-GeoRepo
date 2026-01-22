import java.util.Arrays;

public class work1_13_1s {
    public static void main(String[] args) throws Exception {
        int success_cnt = 0;
        for (int a = 1000; a <= 9999; a++) { // 遍历所有4位数
            if (a % 1111 == 0) { // 排除4个数字都相同的情况
                continue;
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
                success_cnt++;
            } else { // 只能是为0时
                System.out.println("经过若干次计算，最终会得到0（无法得到6174）");
            }
        }
        System.out.println("在所有4位数中，能得到6174的数字有" + success_cnt + "个");
    }
}
