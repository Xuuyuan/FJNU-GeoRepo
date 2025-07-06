#include <iostream>
using namespace std;
int map[3][3] = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};

void zhuanzhi(int map[3][3]){
    int temp[3][3] = {0};
    for (int i = 0; i < 3; i++){
        for (int j = 0; j < 3; j++){
            temp[j][i] = map[i][j];
        }
    }
    for (int i = 0; i < 3; i++){
        for (int j = 0; j < 3; j++){
            map[i][j] = temp[i][j];
        }
    }
}

int main(){
    cout << "原矩阵：" << endl;
    for (int i = 0; i < 3; i++){
        for (int j = 0; j < 3; j++){
            cout << map[i][j] << " ";
        }
        cout << endl;
    }
    zhuanzhi(map);
    cout << "转置后的矩阵：" << endl;
    for (int i = 0; i < 3; i++){
        for (int j = 0; j < 3; j++){
            cout << map[i][j] << " ";
        }
        cout << endl;
    }
    return 0;
}