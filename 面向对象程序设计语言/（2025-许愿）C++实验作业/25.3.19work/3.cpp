#include <iostream>
using namespace std;
bool is_prime(int a){ // 返回布尔值，真或假
    for(int i=2;i<a;i++){ // 从2开始判断是否整除，若整除则不是素数
        if(a%i==0) return false;
    }
    return true; // 否则是素数
}
int main(){
    int a;
    cout << "输入一个整数: ";
    cin >> a;
    if(is_prime(a)){
        cout << a << "是素数" << endl;
    }else{
        cout << a << "不是素数" << endl;
    }
    return 0;
}