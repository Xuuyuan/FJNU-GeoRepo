#include <iostream>
using namespace std;
int getfx(int n){
    if(n==1){
        return 1;
    }
    return getfx(n-1)+n*n;
}
int main(){
    int n;
    cout << "请输入数字n: ";
    cin >> n;
    cout << "f(" << n << ")=" << getfx(n) << endl;
    return 0;
}