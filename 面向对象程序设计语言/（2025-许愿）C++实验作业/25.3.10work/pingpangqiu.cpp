// 乒乓球从1米位置扔下去，每次反弹上次的一半，问到第十次总共运动多少米
#include <iostream>
using namespace std;
int main(){
    double l = 1, s = 0; // l为乒乓球高度, s为总运动路程
    for(int i=0; i<10; i++){
        s += l; // 下落的路程
        l /= 2; // 反弹
        s += l; // 反弹的路程
    }
    cout << "到第十次总共运动了 " << s << " 米。";
    return 0;
}