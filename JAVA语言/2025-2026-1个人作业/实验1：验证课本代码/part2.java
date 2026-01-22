import java.util.Scanner;

public class part2 {
    public static void main(String[] args) {
        // 1
        int a = 10;
        int b = 3;
        int sum = a + b;
        int difference = a - b;
        int product = a * b;
        // 填写代码
        System.out.println("a / b = " + (a / b));
        System.out.println("a % b = " + (a % b));
        // 2
        System.out.println("a > b: " + (a > b));
        System.out.println("a == b: " + (a == b));
        System.out.println("a != b: " + (a != b));
        // 3
        boolean x = true;
        boolean y = true;
        System.out.println("x && y: " + (x && y));
        System.out.println("x || y: " + (x || y));
        System.out.println("!x: " + (!x));
        // 4 综合应用
        Scanner s = new Scanner(System.in);
        System.out.println("请输入一个整数:");
        int num = s.nextInt();
        boolean isEven = (num % 2 == 0);
        System.out.println("是偶数吗? " + isEven);
        s.close();
    }
}
