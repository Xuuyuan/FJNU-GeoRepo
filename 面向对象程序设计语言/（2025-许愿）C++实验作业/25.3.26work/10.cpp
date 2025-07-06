#include <iostream>
using namespace std;
int main(){
    string data = "BdOFkx*)KicbHD#XS$cCUML$B~B+cXe  BZ*NO}%FArptY/U/ujiWQdaK%t &XwwHZ?w_Z=[=/%YFQ,V\n<RO)LnK/|fNblSjyezxDN.cze{G+l<qET,G@X%?CwS&Eoh@N/MbiurTiab:!+eNk-,{W[pibZ!Ldt+>E\n--FrZkHPrTJ^I~v?AdmFVg@B/Wls~<;yl@T/{W/Ia(v#|UoVUnApxU:mhh}/&GkTj^VFYo|/)a?wKK^v";
    int cnt_dxzm, cnt_xxzm, cnt_sz, cnt_gk, cnt_qtzf = 0;
    for(int i = 0; i < data.length(); i++){
        if(data[i] >= 'A' && data[i] <= 'Z'){ // 大写字母
            cnt_dxzm++;
        } else if(data[i] >= 'a' && data[i] <= 'z'){ // 小写字母
            cnt_xxzm++;
        } else if(data[i] >= '0' && data[i] <= '9'){ // 数字
            cnt_sz++;
        } else if(data[i] == ' '){ // 空格
            cnt_gk++;
        } else { // 其他字符
            cnt_qtzf++;
        }
    }
    cout << "大写字母个数：" << cnt_dxzm << endl;
    cout << "小写字母个数：" << cnt_xxzm << endl;
    cout << "数字个数：" << cnt_sz << endl;
    cout << "空格个数：" << cnt_gk << endl;
    cout << "其他字符个数：" << cnt_qtzf << endl;
    return 0;
}