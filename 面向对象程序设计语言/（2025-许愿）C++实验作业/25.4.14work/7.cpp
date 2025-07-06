#include <iostream>
using namespace std;
void copyString(char *str, char *copy, int m){
    int i = 0;
    while (str[m] != '\0'){ // 不为结束
        copy[i] = str[m];
        i++;
        m++;
    }
    copy[i] = '\0'; // 结束
}
int main(){
    const int string_length = 100000; // 长度
    char str[string_length], copy[string_length];
    cout << "请输入字符串：";
    cin.getline(str, 100); // 输入字符串

    int m;
    cout << "请输入开始复制的字符位置：";
    cin >> m;

    copyString(str, copy, m);
    cout << "复制后的字符串为：" << copy << endl;
    return 0;
}