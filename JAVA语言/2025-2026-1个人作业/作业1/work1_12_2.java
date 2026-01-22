import java.util.Scanner;

public class work1_12_2 {
    public static void main(String[] args) throws Exception {
        System.out.print("请输入一个字符：");
        Scanner s = new Scanner(System.in);
        char a = s.next().charAt(0);
        if (a >= 'a' && a <= 'z') {
            System.out.println(a + "是小写字母");
        } else if (a >= 'A' && a <= 'Z') {
            System.out.println(a + "是大写字母");
        } else {
            System.out.println(a + "是其他字符");
        }
    }
}
