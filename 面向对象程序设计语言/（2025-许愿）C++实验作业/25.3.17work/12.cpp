#include <iostream>
#include <cmath>
using namespace std;
double get_s(double a,double b,double c){
    return (a+b+c)/2;
}
double get_area(double a,double b,double c){
    double s=get_s(a,b,c);
    return sqrt(s*(s-a)*(s-b)*(s-c)); // 调用cmath库的内置函数求平方根
}
int main(){
    double a,b,c;
    cout << "请分别输入三角形的三边a,b,c: ";
    cin >> a >> b >> c;
    cout << "三角形的面积为: " << get_area(a,b,c) << endl;
    return 0;
}