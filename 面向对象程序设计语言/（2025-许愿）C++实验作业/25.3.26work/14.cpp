#include <iostream>
using namespace std;
int main(){
    int n;
    cout << "请输入要输入的字符串数量: ";
    cin >> n;
    string* str = new string[n];
    for(int i = 0; i < n; i++){
        cout << "请输入第" << i + 1 << "个字符串: ";
        cin >> str[i];
    }
    // 排序
    for(int i = 0; i < n - 1; i++){
        for(int j = 0; j < n - i - 1; j++){
            if(str[j] > str[j + 1]){
                string temp = str[j];
                str[j] = str[j + 1];
                str[j + 1] = temp;
            }
        }
    }
    // 输出
    cout << "排序后的字符串为: " << endl;
    for(int i = 0; i < n; i++){
        cout << str[i] << endl;
    }
    return 0;
}