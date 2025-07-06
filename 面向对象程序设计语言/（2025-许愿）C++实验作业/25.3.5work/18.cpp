// 1!+2!+3!+...+20!
#include <iostream>
using namespace std;
int main() {
    int sum = 0;
    int fac = 1;
    for (int i = 1; i <= 20; i++) {
        fac *= i;
        sum += fac;
    } // 时间复杂度O(n)
    cout << "计算出的值为: " << sum << endl;
    return 0;
}