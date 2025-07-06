#include <iostream>
using namespace std;
int main(){
    int a[11] = {1, 3, 5, 7, 9, 11, 13, 15, 17, 19}, i, j, t, k; // 数组容量要比使用的实际数量大，空出空间插入

    cout << "原数组为："; // 输出原数组
    for (int key : a)
        cout << key << " ";
    cout << endl;

    cout << "请输入一个整数：";
    cin >> t; // 输入整数
    int a_length = sizeof(a)/sizeof(a[0]); // 求a的长度
    bool is_charu = false;
    for (i = 0; i < a_length-1; i++) { // 求数组长度，对数组进行遍历
        if (t < a[i]) { // 若找到应插入t的位置
            for (j=a_length-2; j >= i; j--) { // 将t位置之后的所有元素进行移动
                a[j + 1] = a[j];
            }
            a[i] = t; // 插入t
            is_charu = true;
            break;
        }
    }

    if (!is_charu) { // t在最末尾插入
        a[a_length-1] = t;
    }

    cout << "插入后的数组为：";
    for (int key : a) { // 输出插入后的数组
        cout << key << " ";
    }
    cout << endl;
    return 0;
}