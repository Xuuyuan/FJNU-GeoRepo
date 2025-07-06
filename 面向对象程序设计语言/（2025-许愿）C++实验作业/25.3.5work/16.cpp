// 输入一行字符, 分别统计出其中英文字母、空格、数字和其他字符的个数。
#include <iostream>
#include <string>
using namespace std;
int main(){
    string c;
    int ywzm = 0, kg = 0, sz = 0, qt = 0;
    cout << "请输入一行字符: ";
    cin >> c;
    for(int i = 0; i < c.length(); i++){
        if ((c[i] >= 'a' && c[i] <= 'z') || (c[i] >= 'A' && c[i] <= 'Z')){
            ywzm++;
        } else if (c[i] == ' '){
            kg++;
        } else if (c[i] >= '0' && c[i] <= '9'){
            sz++;
        } else {
            qt++;
        }
    };
    cout << "英文字母个数: " << ywzm << endl;
    cout << "空格个数: " << kg << endl;
    cout << "数字个数: " << sz << endl;
    cout << "其他字符个数: " << qt << endl;
    return 0;
}