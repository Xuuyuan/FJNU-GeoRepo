#include <iostream>
using namespace std;
int main(){
    int a[5][5] = {1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25}; // 定义矩阵
    cout << "原矩阵为: " << endl;
    for(int i=0; i<5; i++){
        for(int j=0; j<5; j++){
            cout << a[i][j] << " ";
        }
        cout << endl;
    }
    int *p, temp, *max;
    max = &a[0][0];
    p = &a[0][0];
    for(int i=0; i<25; i++,p++){ // 找出数组中的最大值，并使max指针变量指向该值的地址
        if(*max<*p){
            max = p;
        }
    }
    temp = a[2][2]; // 利用临时变量使a[2][2]和数组中的最大值互换
    a[2][2] = *max;
    *max = temp;

    int *arr[4]; // 建立一个指针数组，用来存放数组中4个较小值的地址
    for(int i=0; i<4; i++){
        arr[i] = &a[2][2]; // 先将该指针数组都指向该数组中最大值的地址，方便后续遍历时的比较
    }
    int (*q)[5]; // 建立一个指向数组的指针，用于搜索数组中的4个最小值
    q = a;
    for(int i=0; i<5; i++){
        for(int j=0; j<5; j++){
            if(*arr[3] > *(*(q+i)+j)){
                arr[3] = *(q+i)+j;
                for(int a=3; a>0; a--){
                    if(*arr[a] < *arr[a-1]){ // 冒泡排序，将存放4个最小值地址的指针数组按照从小到大的顺序存储
                        int *k;
                        k = arr[a];
                        arr[a] = arr[a-1];
                        arr[a-1] = k;
                    }
                }
            }
        }
    }
    // 借用临时变量，将4个最小值按照要求放于合适的位置。
    int temp2;
    temp2=a[0][0];a[0][0]=*arr[0];*arr[0]=temp2;
    temp2=a[0][4];a[0][4]=*arr[1];*arr[1]=temp2;
    temp2=a[4][0];a[4][0]=*arr[2];*arr[2]=temp2;
    temp2=a[4][4];a[4][4]=*arr[3];*arr[3]=temp2;

    // 输出新矩阵
    cout << "新矩阵为: " << endl;
    for(int i=0; i<5; i++){
        for(int j=0; j<5; j++){
            cout << a[i][j] << " ";
        }
        cout << endl;
    }
    return 0;
}