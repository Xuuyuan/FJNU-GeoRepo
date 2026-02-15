import tkinter as tk
from tkinter import ttk, messagebox
# 绘图
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import matplotlib.pyplot as plt

# 中文显示问题
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'SimSun', 'Arial Unicode MS', 'Songti SC']
plt.rcParams['axes.unicode_minus'] = False

# 数学模型
class LAModel:
    def __init__(self):
        self.beta = [] # 回归系数
        self.r_squared = 0.0

    def tp(self, matrix):
        """ 矩阵转置 (X.T) """
        if not matrix: return []
        rows = len(matrix)
        cols = len(matrix[0])
        # 创建一个 cols x rows 的新矩阵
        transposed = [[0.0] * rows for _ in range(cols)]
        for r in range(rows):
            for c in range(cols):
                transposed[c][r] = matrix[r][c]
        return transposed

    def mat(self, A, B):
        """ 矩阵乘法 A @ B """
        rows_A = len(A)
        cols_A = len(A[0])
        rows_B = len(B)
        cols_B = len(B[0])
        if cols_A != rows_B:
            raise ValueError("矩阵维度不匹配，无法相乘")
        # 结果矩阵维度 rows_A x cols_B
        result = [[0.0] * cols_B for _ in range(rows_A)]
        for i in range(rows_A):
            for j in range(cols_B):
                sum_val = 0.0
                for k in range(cols_A):
                    sum_val += A[i][k] * B[k][j]
                result[i][j] = sum_val
        return result

    def gaussian_solve(self, A, b):
        """ 高斯消元法求解线性方程组 Ax = b """
        n = len(A)
        # 构造增广矩阵 [A | b]
        M = [row[:] + [val[0]] for row, val in zip(A, b)]

        # 前向消元
        for i in range(n):
            # 选主元
            max_row = i
            for k in range(i + 1, n):
                if abs(M[k][i]) > abs(M[max_row][i]):
                    max_row = k
            M[i], M[max_row] = M[max_row], M[i]
            # 检查奇异性
            if abs(M[i][i]) < 1e-10:
                raise ValueError("矩阵奇异，无法求解 (可能存在多重共线性)")
            # 消元
            for j in range(i + 1, n):
                # 计算消元因子
                factor = M[j][i] / M[i][i]
                for k in range(i, n + 1):
                    # 行变换
                    M[j][k] -= factor * M[i][k]
        # 回代
        x = [0.0] * n
        for i in range(n - 1, -1, -1):
            sum_ax = sum(M[i][j] * x[j] for j in range(i + 1, n))
            # x[i] = (常数项 - 已求出的未知数贡献) / 主元系数
            x[i] = (M[i][n] - sum_ax) / M[i][i]
        return x

    def mean(self, values):
        return sum(values) / len(values)

    def fit(self, X_raw, Y_raw):
        """ 训练模型 """
        X = [[1.0] + row for row in X_raw] # 给X添加一列1
        Y = [[y] for y in Y_raw] # 将 Y 转换为列向量格式
        XT = self.tp(X) # 计算 X.T
        XTX = self.mat(XT, X) # 计算正规方程的左边部分: XT * X
        XTY = self.mat(XT, Y) # 计算正规方程的右边部分: XT * Y
        self.beta = self.gaussian_solve(XTX, XTY) # 使用高斯消元法求解
        # 计算 R^2
        y_pred = self.predict(X_raw)
        y_mean = self.mean(Y_raw)
        ss_tot = sum((y - y_mean)**2 for y in Y_raw)
        ss_res = sum((y - y_hat)**2 for y, y_hat in zip(Y_raw, y_pred))
        # 防止除零
        if ss_tot == 0:
            self.r_squared = 0.0
        else:
            self.r_squared = 1 - (ss_res / ss_tot)

    def predict(self, X_raw):
        """ 预测函数: y = beta0 + beta1*x1 + ... """
        predictions = []
        for row in X_raw:
            val = self.beta[0] 
            for i, x_val in enumerate(row):
                val += self.beta[i+1] * x_val
            predictions.append(val)
        return predictions

# GUI
class App:
    def __init__(self, root):
        self.root = root
        self.root.title("多元线性回归")
        self.root.geometry("1000x700")
        self.model = LAModel()
        self._setup_ui()
        self._load_default_data()

    def _setup_ui(self):
        # 左侧控制面板
        control_frame = ttk.Frame(self.root, padding="10")
        control_frame.pack(side=tk.LEFT, fill=tk.Y)
        # 标题
        ttk.Label(control_frame, text="数据输入", font=("Arial", 12, "bold")).pack(anchor=tk.W)
        ttk.Label(control_frame, text="X (多列用逗号分隔):").pack(anchor=tk.W, pady=(5,0))
        self.text_x = tk.Text(control_frame, height=10, width=30)
        self.text_x.pack(pady=5)
        ttk.Label(control_frame, text="Y (单列):").pack(anchor=tk.W)
        self.text_y = tk.Text(control_frame, height=10, width=30)
        self.text_y.pack(pady=5)
        # 按钮
        btn_calc = ttk.Button(control_frame, text="执行计算", command=self.on_calculate)
        btn_calc.pack(pady=10, fill=tk.X)
        # 结果
        ttk.Label(control_frame, text="回归结果:", font=("Arial", 11, "bold")).pack(anchor=tk.W, pady=(10,0))
        self.lbl_equation = ttk.Label(control_frame, text="方程: 待计算", wraplength=250)
        self.lbl_equation.pack(anchor=tk.W)
        self.lbl_r2 = ttk.Label(control_frame, text="R²: 待计算")
        self.lbl_r2.pack(anchor=tk.W)
        self.text_coeffs = tk.Text(control_frame, height=5, width=30, bg="#f0f0f0", state=tk.DISABLED)
        self.text_coeffs.pack(pady=5)
        # 右侧绘图区域
        plot_frame = ttk.Frame(self.root)
        plot_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        self.fig = Figure(figsize=(5, 4), dpi=100)
        self.ax = self.fig.add_subplot(111)
        self.canvas = FigureCanvasTkAgg(self.fig, master=plot_frame)
        self.canvas.get_tk_widget().pack(side=tk.TOP, fill=tk.BOTH, expand=True)

    def _load_default_data(self):
        """ 用于演示的默认数据 """
        default_x = "50\n60\n70\n80\n90\n100\n110\n120"
        default_y = "150\n180\n205\n240\n260\n300\n320\n350"
        self.text_x.insert(tk.END, default_x)
        self.text_y.insert(tk.END, default_y)

    def on_calculate(self):
        try:
            # 解析数据
            x_str = self.text_x.get("1.0", tk.END).strip().split('\n')
            y_str = self.text_y.get("1.0", tk.END).strip().split('\n')
            if not x_str or not y_str or len(x_str) != len(y_str):
                messagebox.showerror("错误", "数据行数不匹配或为空")
                return
            X_data = []
            for line in x_str:
                if not line.strip(): continue
                # 多元：逗号分隔
                cols = [float(val) for val in line.split(',')]
                X_data.append(cols)
            Y_data = [float(val) for val in y_str if val.strip()]
            # 调用模型计算
            self.model.fit(X_data, Y_data)
            # 更新界面文本结果
            self.update_results_text(len(X_data[0]))
            # 绘图
            self.plot_results(X_data, Y_data)

        except ValueError as e:
            messagebox.showerror("数学错误", str(e))
        except Exception as e:
            messagebox.showerror("系统错误", f"发生未知错误: {e}")

    def update_results_text(self, num_features):
        betas = self.model.beta
        r2 = self.model.r_squared
        # 构建方程字符串
        eq_str = f"y = {betas[0]:.4f}"
        for i in range(1, len(betas)):
            sign = "+" if betas[i] >= 0 else ""
            eq_str += f" {sign} {betas[i]:.4f}*x{i}"
        self.lbl_equation.config(text=f"方程:\n{eq_str}")
        self.lbl_r2.config(text=f"R² = {r2:.4f}")
        # 显示详细系数
        self.text_coeffs.config(state=tk.NORMAL)
        self.text_coeffs.delete("1.0", tk.END)
        self.text_coeffs.insert(tk.END, f"截距 b0: {betas[0]:.4f}\n")
        for i in range(1, len(betas)):
            self.text_coeffs.insert(tk.END, f"斜率 {i}: {betas[i]:.4f}\n")
        self.text_coeffs.config(state=tk.DISABLED)

    def plot_results(self, X, Y):
        self.ax.clear()
        y_pred = self.model.predict(X)
        num_features = len(X[0])
        if num_features == 1: # 一元线性回归
            flat_x = [row[0] for row in X]
            # 绘制散点
            self.ax.scatter(flat_x, Y, color='blue', label='实测数据')
            # 绘制拟合线
            min_x, max_x = min(flat_x), max(flat_x)
            # 重新计算端点的预测值用于画线
            line_x = [min_x, max_x]
            line_y = [self.model.predict([[x]])[0] for x in line_x]
            self.ax.plot(line_x, line_y, color='red', linewidth=2, label='数据点')
            self.ax.set_xlabel("X")
            self.ax.set_ylabel("Y")
        else: # 多元线性回归
            self.ax.scatter(Y, y_pred, color='green', label='')
            # 绘制 y=x 的参考线（理想预测线）
            min_val = min(min(Y), min(y_pred))
            max_val = max(max(Y), max(y_pred))
            self.ax.plot([min_val, max_val], [min_val, max_val], 'k--', label='理想预测 y=x')
            self.ax.set_xlabel("实测值 x")
            self.ax.set_ylabel("预测值 y")
            self.ax.set_title(f"多元回归效果 n={num_features}")

        self.ax.legend()
        self.ax.grid(True, linestyle=':', alpha=0.6)
        self.canvas.draw()

if __name__ == "__main__":
    root = tk.Tk()
    app = App(root)
    root.mainloop()