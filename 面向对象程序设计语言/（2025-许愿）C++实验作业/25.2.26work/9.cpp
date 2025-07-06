#include <iostream>
using namespace std;
int main(){
    int a, b, c;
    cout << "请分别输入三个整数, 我们将输出其中的最大值。" << endl;
    cout << "a: ";
    cin >> a;
    cout << "b: ";
    cin >> b;
    cout << "c: ";
    cin >> c;
    cout << "最大值为: " << max(max(a,b),c) << endl; // max函数的实现
    // 以下为判断语句的实现
    cout << "最大值为: ";
    if (a > b) { // 此时需要判断a和c的大小
        if (a > c) {
            cout << a;
        } else {
            cout << c;
        }
    } else { // 此时需要判断b和c的大小
        if (b > c) {
            cout << b;
        } else {
            cout << c;
        }
    }
    return 0;
}