#include <iostream>
using namespace std;
int main() {
    int i = 1;
    float total = 0.0;
    while (i <= 10) { // 从1一直循环到10
        total += 1.0/i; // 使用float防止出现整数问题
        i++;
    }
    cout << "加和得到的值为: " << total << endl;
    return 0;
}