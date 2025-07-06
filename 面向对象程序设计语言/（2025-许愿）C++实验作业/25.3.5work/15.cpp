// 输入两个正整数m和n, 求其最大公约数和最小公倍数。
#include <iostream>
using namespace std;
int main(){
    int m, n, a, b, t;
    cout << "请输入两个正整数m和n: ";
    cin >> m >> n;
    a = m;
    b = n;
    while (b != 0){
        t = a % b;
        a = b;
        b = t;
    }
    cout << "最大公约数是: " << a << endl;
    cout << "最小公倍数是: " << m * n / a << endl;
    return 0;
}