#include <iostream>
using namespace std;
int main(){
    int n = 0;
    cout << "请输入字符串个数: ";
    cin >> n;
    string* str = new string[n]; // 生成字符串数组
    for(int i = 0; i < n; i++){
        cout << "请输入第" << i + 1 << "个字符串: ";
        cin >> str[i]; // 输入字符串
    }

    cout << "A开头的字符串有: " << endl;
    for(int i = 0; i < n; i++){
        if(str[i][0] == 'A' || str[i][0] == 'a'){ // 首字母开头为A或a
            cout << str[i] << endl;
        }
    }
    return 0;
}