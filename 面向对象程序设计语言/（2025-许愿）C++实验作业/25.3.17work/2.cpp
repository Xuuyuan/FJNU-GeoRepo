#include <iostream>
#include <cmath>
using namespace std;
int main(){
    double a,b,c;
    cout << "分别输入a b c三个数:";
    cin >> a >> b >> c;
    double pbs = b*b-4*a*c; // 计算判别式的值
    if(pbs>0){
        double x1 = (-b+sqrt(pbs))/(2*a);
        double x2 = (-b-sqrt(pbs))/(2*a);
        cout << "方程的两个根 x1=" << x1 << " x2=" << x2 << endl; // 求根公式
    }else if(pbs==0){
        double x = -b/(2*a);
        cout << "方程的根 x=" << x << endl; // 求根公式
    }else{
        cout << "方程没有实数根";
    }
    return 0;
}