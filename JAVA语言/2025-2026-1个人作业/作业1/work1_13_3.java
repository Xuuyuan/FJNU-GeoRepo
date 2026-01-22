public class work1_13_3 {
    public static void main(String[] args) {
        int i = 2; // 开始的数字
        int cnt = 0; // 计数
        while (cnt < 100) {
            boolean p = true;
            for (int j = 2; j <= Math.sqrt(i); j++) {
                if (i % j == 0) {
                    p = false;
                    break;
                }
            }
            if (p) {
                System.out.print(i + " ");
                cnt += 1;
                if (cnt % 10 == 0) System.out.println();
            }
            i += 1;
        }
    }
}
