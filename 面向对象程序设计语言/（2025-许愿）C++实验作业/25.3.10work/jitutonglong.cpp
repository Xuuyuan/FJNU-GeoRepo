// 鸡兔同笼，鸡和兔在一个笼子里，共有100个头和300条腿，求鸡的数量和兔的数量
// 鸡个数=x，兔个数=y，x+y=100，2x+4y=300
#include <iostream>
using namespace std;
int main(){
    for(int x=0; x<=100; x++){ // 从0到100遍历鸡的数量
        int y=100-x; // 兔的数量就是100-鸡的数量
        if(2*x+4*y == 300){ // 若加起来共有300条腿，则得到答案
            cout << "鸡的数量：" << x << "，兔的数量：" << y << endl;
            break;
        }
    }
    return 0;
}