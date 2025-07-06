// 求Sn=a+aa+aaa+...+a...a的值, 其中a是一个数字。例如: 2+22+222+2222+22222, 此时n=5。n由键盘输入。
#include <iostream>
using namespace std;
int main() {
    long long sum = 0; // 大数字必开long long
    int a, n, t = 0;
    cout << "请分别输入a和n的值: ";
    cin >> a >> n;
    for (int i = 0; i < n; i++) {
        t = t * 10 + a;
        sum += t;
    }
    cout << "计算出的值为: " << sum << endl;
    return 0;
}