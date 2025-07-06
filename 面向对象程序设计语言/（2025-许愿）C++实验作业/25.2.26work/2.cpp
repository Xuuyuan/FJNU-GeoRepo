#include <iostream>
#include <cmath> // 使用派的值和次方函数
#include <iomanip> // 使用小数点修复
using namespace std;
int main() {
    double r, h;
    cout << "请输入圆的半径: ";
    cin >> r;
    cout << "请输入圆柱的高: ";
    cin >> h;
    double yuanzhouchang = 2 * M_PI * r; // 计算圆周长, M_PI是cmath库自带的常量, 表示派的值
    double yuanmianji = M_PI * pow(r, 2); // 计算圆面积
    double yuanqiubiaomianji = 2 * M_PI * pow(r, 2); // 计算圆球表面积
    double yuanqiutiji = 4.0 / 3 * M_PI * pow(r, 3); // 计算圆球体积
    double yuanzhutiji = yuanmianji * h; // 计算圆柱体积
    // 输出结果, 此处尝试使用setprecision但只能控制出现的数字数量, 无法控制小数点后的位数
    // 经过尝试, 发现使用fixed加setprecision可以控制小数点后的位数
    cout << "圆周长: " << fixed << setprecision(2) << yuanzhouchang << endl;
    cout << "圆面积: " << yuanmianji << endl;
    cout << "圆球表面积: " << yuanqiubiaomianji << endl;
    cout << "圆球体积: " << yuanqiutiji << endl;
    cout << "圆柱体积: " << yuanzhutiji << endl;
    return 0;
}