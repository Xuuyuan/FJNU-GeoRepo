#include <iostream>
using namespace std;
int main(){
    int year, month, day; // 年、月、日
    cout << "请输入年、月、日：";
    cin >> year >> month >> day;

    int days = 0; // 初始化天数

    for(int i = 1; i < month; i++){ // 遍历月份
        switch(i){ // 判断月份
            case 1: case 3: case 5: case 7: case 8: case 10: case 12: // 大月
                days += 31;
                break;
            case 4: case 6: case 9: case 11: // 小月
                days += 30;
                break;
            case 2: // 2月特殊判断
                if((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)){ // 闰年的2月为29天
                    days += 29;
                } else { // 否则为2月28天
                    days += 28;
                }
                break;
        }
    }
    days += day; // 加上当前月已过的天数

    cout << "该日是该年的第" << days << "天" << endl; // 输出结果
    return 0;
}