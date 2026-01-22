import java.util.Scanner;

public class part3 {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // 1
        System.out.print("请输入一个整数: ");
        int number = scanner.nextInt();

        if (number > 0) {
            System.out.println(number + " 是正数。");
        } else if (number < 0) {
            System.out.println(number + " 是负数。");
        } else {
            System.out.println(number + " 是零。");
        }
        
        if (number % 2 == 0) {
            System.out.println(number + " 是偶数。");
        } else {
            System.out.println(number + " 是奇数。");
        }

        // 2
        System.out.print("请输入一个 1-7 之间的数字: ");
        int day = scanner.nextInt();
        switch (day) {
            case 1:
                System.out.println("星期一");
                break;
            case 2:
                System.out.println("星期二");
                break;
            case 3:
                System.out.println("星期三");
                break;
            case 4:
                System.out.println("星期四");
                break;
            case 5:
                System.out.println("星期五");
                break;
            case 6:
                System.out.println("星期六");
                break;
            case 7:
                System.out.println("星期日");
                break;
            default:
                System.out.println("输入错误！");
        }

        // 3
        int sumFor = 0;
        for (int i = 1; i <= 100; i++) {
            sumFor += i;
        }
        System.out.println("1 到 100 的整数和 (for 循环): " + sumFor);

        // 4
        int sumWhile = 0;
        int j = 1;
        // 使用 while 循环计算 sumWhile
        while (j <= 100) {
            if (j % 2 == 0) {
                sumWhile += j;
            }
            j++;
        }
        System.out.println("100 以内所有偶数的和 (while 循环): " + sumWhile);

        // 5
        String correctPassword = "123456";
        String inputPassword;
        do {
            System.out.print("请输入密码: ");
            inputPassword = scanner.next();
            if (!inputPassword.equals(correctPassword)) {
                System.out.println("密码错误，请重新输入！");
            }
        } while (!inputPassword.equals(correctPassword));
        System.out.println("密码正确，登录成功！");

        scanner.close();
    }
}