#include <iostream>
using namespace std;
void hannuota(int n, char a, char b, char c){ // 后三个参数为盘的名字
    if(n == 1){
        cout << "将盘子" << n << "从" << a << "移动到" << c << endl;
    }else{ // 分治思想
        hannuota(n-1, a, c, b);
        cout << "将盘子" << n << "从" << a << "移动到" << c << endl;
        hannuota(n-1, b, a, c);
    }
}
int main(){
    hannuota(64, 'A', 'B', 'C');
    return 0;
}
