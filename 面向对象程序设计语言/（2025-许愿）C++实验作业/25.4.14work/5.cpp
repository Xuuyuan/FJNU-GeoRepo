#include <iostream>
using namespace std;
int main(){
    const int length = 10; // 总人数
    int n = 10; // 当前人数
    // 初始化队列
    int loop[length] = {0};
    for(int i = 0; i < n; i++){
        loop[i] = i + 1;
    }
    // count为计数器，i为当前报数的人
    int count = 0;
    int i = 0;
    while (n > 1){ // 只要人数还大于1就一直循环
        if (loop[i] != 0){ // 这个人还存在
            count++;
            if (count == 3){
                loop[i] = 0; // 消除这个人
                count = 0; // 重新从0开始计数
                n--; // 剩余人数减1
            }
        }
        i++; // 当前报数的人增加
        if (i == length){ // 回环
            i = 0;
        }
    }
    // 搜索位置，不为0的就是剩下的人
    for (int j = 0; j < length; j++){
        if (loop[j] != 0){
            cout << "最后剩下的人原来排在第" << loop[j] << "号" << endl;
        }
    }
    return 0;
}