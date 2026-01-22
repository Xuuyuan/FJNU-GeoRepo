interface Ink { // 墨盒，有颜色
    String getColor();
}

interface Paper { // 纸张，有尺寸
    String getSize();
}

class ColorInk implements Ink { // 彩色墨盒，从Ink墨盒类继承
    @Override
    public String getColor() { return "彩色"; }
}

class HeibaiInk implements Ink { // 黑白墨盒，从Ink墨盒类继承
    @Override
    public String getColor() { return "黑白"; }
}

class A4Paper implements Paper { // A4纸，从纸类继承
    @Override
    public String getSize() { return "A4"; }
}

class B5Paper implements Paper { // B5纸，从纸类继承
    @Override
    public String getSize() { return "B5"; }
}

class Printer {
    public void print(Ink ink, Paper paper) { // 打印机的打印类
        System.out.println("打印机工作开始");
        // 由于使用的方法是各个类再覆写过的，所以可以兼容不同类型的墨盒和纸张
        System.out.println("正在使用 " + ink.getColor() + " 墨盒在 " + paper.getSize() + " 纸张上进行打印。");
        System.out.println("打印机工作完成");
    }
}

public class work2_8 {
    public static void main(String[] args) {
        Printer printer = new Printer(); // 创建打印机
        Ink colorInk = new ColorInk(); // 彩色墨盒
        Ink heibaiInk = new HeibaiInk(); // 黑白墨盒
        Paper a4Paper = new A4Paper(); // A4纸
        Paper b5Paper = new B5Paper(); // B5纸

        printer.print(heibaiInk, a4Paper); // 黑白墨盒，A4纸
        printer.print(colorInk, a4Paper); // 彩色墨盒，A4纸
        printer.print(heibaiInk, b5Paper); // 黑白墨盒，B5纸
        printer.print(colorInk, b5Paper); // 彩色墨盒，B5纸
    }
}