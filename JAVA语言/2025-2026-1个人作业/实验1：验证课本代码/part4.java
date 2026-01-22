import java.util.Arrays;
import java.util.Random;
import java.util.Scanner;

public class part4 {
    public static void main(String[] args) {
        // 1
        int[] array = new int[10];
        Random random = new Random();
        for (int i = 0; i < array.length; i++) {
            array[i] = random.nextInt(100) + 1;
        }

        // 2
        System.out.println("原始数组:");
        for (int i = 0; i < array.length; i++) {
            System.out.print(array[i] + " ");
        }
        System.out.println();

        // 3
        int max = array[0];
        int min = array[0];
        for (int i = 1; i < array.length; i++) {
            if (array[i] > max) {
                max = array[i];
            }
            if (array[i] < min) {
                min = array[i];
            }
        }
        System.out.println("最大值: " + max);
        System.out.println("最小值: " + min);

        // 4
        for (int i = 0; i < array.length - 1; i++) {
            for (int j = 0; j < array.length - 1 - i; j++) {
                if (array[j] > array[j + 1]) {
                    // 交换元素
                    int temp = array[j];
                    array[j] = array[j + 1];
                    array[j + 1] = temp;
                }
            }
        }
        System.out.println("排序后的数组:");
        System.out.println(Arrays.toString(array));

        // 5
        Scanner scanner = new Scanner(System.in);
        System.out.print("请输入要在数组中查找的数字: ");
        int target = scanner.nextInt();
        int low = 0;
        int high = array.length - 1;
        int index = -1;
        // 算法部分
        while (low <= high) {
            int mid = (low + high) / 2;
            if (array[mid] == target) {
                index = mid;
                break;
            } else if (array[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        if (index != -1) {
            System.out.println("找到元素 " + target + "，其在数组中的索引为: " + index);
        } else {
            System.out.println("数组中未找到元素 " + target);
        }
        
        scanner.close();
    }
}