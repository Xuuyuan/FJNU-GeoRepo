#include <iostream>
using namespace std;
string n_to_string(int n){
    int n1 = n / 10; // n1为去除最末尾数字后的数字
    int n2 = n % 10; // n2为最末尾的数字
    if(n1 == 0){ // 已经到最后
        return string(1, '0' + n2); // 直接返回n2对应的数字的string形式
    }
    return n_to_string(n1) + string(1, '0' + n2); // 递归调用返回
}
int main(){
    int n;
    cout << "请输入数字n: ";
    cin >> n;
    cout << n_to_string(n) << endl;
    return 0;
}