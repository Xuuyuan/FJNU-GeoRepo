public class part1 {
    public static void main(String[] args) {
        // 1
        byte byteVar = 100;
        short shortVar = 200;
        int intVar = 1000;
        long longVar = 100000L;
        float floatVar = 3.14F;
        double doubleVar = 3.1415926;
        char charVar = 'A';
        boolean booleanVar = true;
        // 2
        System.out.println(byteVar);
        System.out.println(shortVar);
        System.out.println(intVar);
        System.out.println(longVar);
        System.out.println(floatVar);
        System.out.println(doubleVar);
        System.out.println(charVar);
        System.out.println(booleanVar);
        // 3 自动类型转换 将int赋值给long, 将float赋值给double
        long longConverted = intVar;
        double doubleConverted = floatVar;
        System.out.println("longConverted: " + longConverted);
        System.out.println("doubleConverted: " + doubleConverted);
        // 3 强制类型转换
        int intforcedConverted = (int) longVar;
        float floatforcedConverted = (float) doubleVar;
        System.out.println("intforcedConverted: " + intforcedConverted);
        System.out.println("floatforcedConverted: " + floatforcedConverted);
        // 4 将较大long值转换
        long largeLong = 1000000000L;
        short convertedShort = (short) largeLong;
        System.out.println("convertedShort: " + convertedShort);
        
    }
}