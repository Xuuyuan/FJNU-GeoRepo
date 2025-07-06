#include <iostream>
using namespace std;
int main(){
    double x,y;
    cout << "请输入x的值: ";
    cin >> x;
    if (x<1) { // x<1
        y = x;
    } else if (x<10) { // x已经不小于1, 再判断x是否小于10
        y = 2 * x - 1;
    } else { // x不小于10
        y = 3 * x - 11;
    }
    cout << "y的值为: " << y;
}