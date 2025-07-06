#include <iostream>
using namespace std;
int main() {
    double t_f, t_c; // 创建变量
    cout << "请输入华氏温度(°F): ";
    cin >> t_f;
    t_c = 5.0 / 9 * (t_f - 32); // 使用5.0防止整数除法的出现
    cout << "摄氏温度(°C): " << t_c << endl;
    return 0;
}