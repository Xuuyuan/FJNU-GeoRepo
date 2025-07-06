// 输出所有的水仙花数, 水仙花数是指一个三位数, 其各位数字立方和等于该数本身
#include <iostream>
#include <cmath>
using namespace std;
int main(){
    for(int i=100; i<1000; i++){
        int i_g = i % 10;
        int i_s = i / 10 % 10;
        int i_b = i / 100;
        if(pow(i_g, 3) + pow(i_s, 3) + pow(i_b, 3) == i){
            cout << i << endl;
        }
    }
    return 0;
}