#include <iostream>
using namespace std;
double get_p(int n,double x){
    if(n==0){
        return 1;
    }else if(n==1){
        return x;
    }else{
        return ((2*n-1)*x*get_p(n-1,x)-(n-1)*get_p(n-2,x))/n;
    }
}
int main(){
    int n;
    double x;
    cout << "请输入n和x:";
    cin >> n >> x;
    cout << "P" << n << "(" << x << ")=" << get_p(n,x) << endl;
    return 0;
}