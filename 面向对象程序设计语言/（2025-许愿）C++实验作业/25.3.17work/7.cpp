#include <iostream>
using namespace std;
bool prime(int n){ // 判断是否为素数
    for(int i=2;i<n;i++){ // 从2开始判断是否为素数
        if(n%i==0) return false; // 若不是素数则返回false
    }
    return true; // 遍历完成，是素数，返回true
}
void gotbaha(int n){ // 在这个函数中输出信息所以无需设置返回值
    for(int i=2;i<=n/2;i++){ // 从2开始遍历到n/2
        if(prime(i) && prime(n-i)){ // 若i和n-i都是素数
            cout << n << "=" << i << "+" << n-i << endl; // 输出结果
            break; // 只需要输出一条所以判断出结果后直接跳出即可
        }
    }
}
int main(){
    int n;
    while(true){ // 获取数字, 若数字不满足要求则重新获取
        cout << "请输入一个不小于6的偶数n: ";
        cin >> n;
        if(n>6 && n%2==0){
            break;
        };
        cout << "输入错误，请重新输入" << endl;
    }
    gotbaha(n); // 调用函数
    return 0;
}