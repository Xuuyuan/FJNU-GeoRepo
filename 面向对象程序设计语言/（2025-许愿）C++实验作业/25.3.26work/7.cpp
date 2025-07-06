#include <iostream>
using namespace std;
int main(){
    const int n = 5, m = 5; // 行数和列数
    int a[n][m] = {{3,2,4,8,9},{1,2,3,4,5},{6,7,8,9,10},{11,12,13,14,15},{1,5,7,3,5}}; // 定义数组

    int i, j, k, l; // 列号存储
    int max, min;
    for(i = 0; i < n; i++){ // 行内
        max = a[i][0]; // 初始化最大值为第一列的值
        k = 0;
        for(j = 1; j < m; j++){ // 列内
            if(a[i][j] > max){ // 若有比当前最大值大的值
                max = a[i][j]; // 更新最大值
                k = j;
            }
        }
        // 最终得到本列最大值为max, 列号为k
        min = a[0][k];
        l = 0;
        for(j = 1; j < n; j++){
            if(a[j][k] < min){
                min = a[j][k];
                l = j;
            }
        }
        // 最终得到本行最小值为min, 行号为l

        // 判断是否为鞍点
        if(l == i){ // 同时满足最大和最小
            cout << "鞍点为：" << a[i][k] << "，位置为：" << i << "," << k << endl;
            return 0;
        }
    }
    cout << "没有鞍点" << endl; // 没有鞍点
    return 0;
}