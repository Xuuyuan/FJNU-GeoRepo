#include <iostream>
using namespace std;
int main(){
    int a[10], i, j, t, k; // 初始化

    cout << "请输入10个整数：";
    for (i = 0; i < 10; i++) // 将输入的整数存入数组
        cin >> a[i];

    for (i = 0; i < 9; i++) { // 进行选择排序
        k = i;
        for (j=i+1; j < 10; j++) {
            if (a[j] < a[k]) k = j;
        }
        t = a[k];
        a[k] = a[i];
        a[i] = t;
    }

    cout << "排序后的数组为："; // 输出排序后的数组
    for (int key : a) {
        cout << key << " ";
    }
    cout << endl;

    return 0;
}