#include <iostream>
using namespace std;
int main(){
    int a[15] = {99, 88, 77, 66, 55, 44, 33, 22, 11, 10, 9, 8, 7, 6, 5}; // 定义数组
    int num; // 输入的数
    cout << "请输入一个数：";
    cin >> num;

    int left = 0;
    int right = 14; // 15-1

    while(left <= right){ // 左边界小于等于右边界
        int mid = (left + right) / 2; // 取出中间位置
        if(a[mid] == num){ // 若找到数
            cout << "该数在数组中的位置为：" << mid + 1 << endl; // 输出数在数组中的位置
            return 0;
        } else if(a[mid] < num){ // 中间值小于输入的数，左半部分查找
            right = mid - 1;
        } else { // 中间值小于输入的数，右半部分查找
            left = mid + 1;
        }
    }
    cout << "无此数" << endl; // 没有找到
    return 0;
}