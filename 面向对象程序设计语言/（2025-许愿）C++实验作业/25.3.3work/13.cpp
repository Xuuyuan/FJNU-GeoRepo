#include <iostream>
using namespace std;
int main() {
    int i, temp_i;
    cout << "请输入当月利润i(元): ";
    cin >> i;
    temp_i = i; // 本变量留给写法4使用
    // 写法1 直接加和
    double total_salary;
    if (i <= 100000) {
        total_salary = i * 0.1;
    } else if (i <= 200000) {
        total_salary = 10000 + (i - 100000) * 0.075;
    } else if (i <= 400000) {
        total_salary = 10000 + 7500 + (i - 200000) * 0.05;
    } else if (i <= 600000) {
        total_salary = 10000 + 7500 + 10000 + (i - 400000) * 0.03;
    } else if (i <= 1000000) {
        total_salary = 10000 + 7500 + 10000 + 6000 + (i - 600000) * 0.015;
    } else {
        total_salary = 10000 + 7500 + 10000 + 6000 + 6000 + (i - 1000000) * 0.01;
    }
    cout << "应发奖金总数为: " << total_salary << endl;

    // 写法2 使用switch直接加和
    double total_salary_switch;
    switch (i / 100000) {
        case 0: total_salary_switch = i * 0.1; break;
        case 1: total_salary_switch = 10000 + (i - 100000) * 0.075; break;
        case 2:
        case 3: total_salary_switch = 10000 + 7500 + (i - 200000) * 0.05; break;
        case 4:
        case 5: total_salary_switch = 10000 + 7500 + 10000 + (i - 400000) * 0.03; break;
        case 6:
        case 7:
        case 8:
        case 9: total_salary_switch = 10000 + 7500 + 10000 + 6000 + (i - 600000) * 0.015; break;
        default: total_salary_switch = 10000 + 7500 + 10000 + 6000 + 6000 + (i - 1000000) * 0.01; break;

    }
    cout << "应发奖金总数为: " << total_salary_switch << endl;

    // 写法3 将每个部分的奖金单独计算
    double total_salary_3;
    if (i > 1000000) {
        total_salary_3 += (i - 1000000) * 0.01;
        i = 1000000;
    }
    if (i > 600000) {
        total_salary_3 += (i - 600000) * 0.015;
        i = 600000;
    }
    if (i > 400000) {
        total_salary_3 += (i - 400000) * 0.03;
        i = 400000;
    }
    if (i > 200000) {
        total_salary_3 += (i - 200000) * 0.05;
        i = 200000;
    }
    if (i > 100000) {
        total_salary_3 += (i - 100000) * 0.075;
        i = 100000;
    }
    total_salary_3 += i * 0.1;
    cout << "应发奖金总数为: " << total_salary_3 << endl;

    // 写法4 将每个部分的奖金单独计算的优化写法，使用二维数组
    double total_salary_4;
    double bonus[6][2] = {
        {1000000, 0.01},
        {600000, 0.015},
        {400000, 0.03},
        {200000, 0.05},
        {100000, 0.075},
        {0, 0.1}
    };
    for(int it = 0; it < 6; it++) {
        if (temp_i > bonus[it][0]) {
            total_salary_4 += (temp_i - bonus[it][0]) * bonus[it][1];
            temp_i = bonus[it][0];
        }
    }
    cout << "应发奖金总数为: " << total_salary_4 << endl;
    return 0;
}