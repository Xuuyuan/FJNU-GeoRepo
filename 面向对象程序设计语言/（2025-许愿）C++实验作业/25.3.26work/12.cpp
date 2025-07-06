#include <iostream>
using namespace std;
int main(){
    string dwmm = "wfdaujfvgaYWGDADydgawesuydhQQSDYAwyhuixdahuicha283164r2fcgvy8xd8swacy7";
    string dw = "";

    for(int i = 0; i < dwmm.length(); i++){
        if(dwmm[i] >= 'A' && dwmm[i] <= 'Z'){ // 大写字母
            dw += 'A' + ('Z' - dwmm[i]);
        } else if(dwmm[i] >= 'a' && dwmm[i] <= 'z'){ // 小写字母
            dw += 'a' + ('z' - dwmm[i]);
        } else { // 非字母字符
            dw += dwmm[i];
        }
    }
    cout << "密码是：" << dwmm << endl;
    cout << "原文是：" << dw << endl;
    return 0;
}