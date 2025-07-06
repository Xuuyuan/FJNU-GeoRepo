#include <iostream>
#include <list>
using namespace std;
int main(){
    // 写法1
    list<int> l; // 好像用列表更方便
    for (int i=1; i<=4; i++) { // 初始化i为1，每次循环后自增，即1、2、3、4共获取4个数字
        cout << "请输入第" << i << "个数: ";
        int s; // s作为临时变量
        cin >> s;
        l.push_back(s); // 将得到的数字加入到列表中
    }
    l.sort();
    cout << "按照从小到大的顺序输出的值为: ";
    for (int i2: l) {
        cout << i2 << " ";
    };
    cout << endl;

    // 写法2 不断交换变量的swap写法
    int a,b,c,d;
    cout << "请输入第1个数: ";
    cin >> a;
    cout << "请输入第2个数: ";
    cin >> b;
    cout << "请输入第3个数: ";
    cin >> c;
    cout << "请输入第4个数: ";
    cin >> d;
    // 获得a,b,c,d
    while (!(a<b && b<c && c<d)) {
        if (a>b) swap(a,b);
        if (b>c) swap(b,c);
        if (c>d) swap(c,d);
    }
    cout << "按照从小到大的顺序输出的值为: " << a << " " << b << " " << c << " " << d << endl;
    return 0;
}