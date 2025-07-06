#include <iostream>
#include <cmath>
using namespace std;
double get_e_x(double x){
    return exp(x); // cmath库内置的计算e的x次方的值的函数
}

int main(){
    double x;
    cout << "请输入x的值：";
    cin >> x;
    cout << "sinh(" << x << ")=" << (get_e_x(x) - get_e_x(-x)) / 2 << endl;
    return 0;
}