#include <iostream>
using namespace std;
int gcd(int a, int b){ // 求最大公约数
    int t;
    while(b != 0){ // 辗转相除法
        t = a % b;
        a = b;
        b = t;
    }
    return a;
}

int lcm(int a, int b){ // 求最小公倍数
    return a * b / gcd(a, b);
}

int main(){
    int a, b;
    cout << "请分别输入a和b: ";
    cin >> a >> b;
    cout << "最大公约数: " << gcd(a, b) << endl;
    cout << "最小公倍数: " << lcm(a, b) << endl;
    return 0;
}