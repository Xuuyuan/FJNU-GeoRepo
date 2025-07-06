// 生成金字塔
#include <iostream>
using namespace std;
int main(){
    int l = 0;
    cout << "请输入行数: ";
    cin >> l;
    cout << "倒金字塔" << endl;
    for(int i=0; i<l; i++){
        for(int j=0; j<i; j++){
            cout << " ";
        }
        for(int j=0; j<2*(l-i)-1; j++){
            cout << "*";
        }
        cout << endl;
    }

    cout << "正金字塔" << endl;
    for(int i=0; i<l; i++){
        for(int j=0; j<(l-i)-1; j++){
            cout << " ";
        }
        for(int j=0; j<2*i+1; j++){
            cout << "*";
        }
        for(int j=0; j<2*(l-i)-1; j++){
            cout << " ";
        }
        cout << endl;
    }

    cout << "菱形" << endl;
    for(int i=0; i<l; i++){
        for(int j=0; j<(l-i)-1; j++){
            cout << " ";
        }
        for(int j=0; j<2*i+1; j++){
            cout << "*";
        }
        for(int j=0; j<2*(l-i)-1; j++){
            cout << " ";
        }
        cout << endl;
    }
    for(int i=1; i<l; i++){
        for(int j=0; j<i; j++){
            cout << " ";
        }
        for(int j=0; j<2*(l-i)-1; j++){
            cout << "*";
        }
        cout << endl;
    }
    return 0;
}