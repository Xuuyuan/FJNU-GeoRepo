#include <iostream>
using namespace std;
double niudundiedaifa(double a, double b, double c, double d){
	double x = 1, x0; // 初始化x值为1
	do
	{
		x0 = x;
		x = x0-(((a*x0+b)*x0+c)*x0+d)/((3*a*x0+2*b)*x0+c);
	} while (abs(x - x0) >= 1e-3); // 若求得的x值和1的差值大于1e-3则继续迭代

	return x;
}

int main(){
    double a, b, c, d;
    cout << "请输入a,b,c,d的值：";
    cin >> a >> b >> c >> d;
    double x = niudundiedaifa(a, b, c, d);
    cout << "x = " << x << endl;
    return 0;
}