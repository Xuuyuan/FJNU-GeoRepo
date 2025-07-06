#include <iostream>
using namespace std;
int main(){
    const int n = 10; // 总共10名学生
    string* name = new string[n]; // 姓名
    string* id = new string[n]; // 学号
    int* score = new int[n]; // 成绩

    for(int i = 0; i < n; i++){
        cout << "请输入第" << i + 1 << "个学生的姓名: ";
        cin >> name[i]; // 输入姓名
        cout << "请输入第" << i + 1 << "个学生的学号: ";
        cin >> id[i]; // 输入学号
        cout << "请输入第" << i + 1 << "个学生的成绩: ";
        cin >> score[i]; // 输入成绩
    }

    cout << "不及格的学生有: " << endl;
    for(int i = 0; i < n; i++){
        if(score[i] < 60){ // 成绩不及格
            cout << "姓名: " << name[i] << ", 学号: " << id[i] << ", 成绩: " << score[i] << endl;
        }
    }
    return 0;
}