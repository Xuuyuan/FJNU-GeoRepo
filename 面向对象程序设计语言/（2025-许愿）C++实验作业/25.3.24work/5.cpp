#include <iostream>
using namespace std;

int main(){
    int a[9] = {8, 6, 7, 2, 1, 9, 3, 2, 1}; // 对数组初始化，这是要进行逆序的数组
    int i,t;
    const int a_length = sizeof(a)/sizeof(a[0]); // 数组长度
    int b[a_length]; // 用于存放逆序后的数组

    // 输出原数组
    cout << "原数组为：";
    for (int key : a){
        cout << key << " ";
    }
    cout << endl;

    
    // 逆序将a中的数存放到b中
    for (i = 0; i < a_length; i++){
        b[a_length - i - 1] = a[i];
    }

    cout << "逆序存放后的数组为："; // 输出逆序存放后的数组
    for (int key : b){
        cout << key << " ";
    }
    cout << endl;

    // 若需要将b中的数存放到a中时使用
    // for (i = 0; i < a_length; i++){
    //     a[i] = b[i];
    // }
    return 0;
}