#include <iostream>
using namespace std;
int fac(int n){
    if(n==1){
        return 1;
    }
    return n*fac(n-1); // 递归调用
}
int main(){
    int a, b, c;
    cout << "请分别输入a, b, c: ";
    cin >> a >> b >> c;
    cout << "a!+b!+c!=" << fac(a) + fac(b) + fac(c) << endl;
    return 0;
}