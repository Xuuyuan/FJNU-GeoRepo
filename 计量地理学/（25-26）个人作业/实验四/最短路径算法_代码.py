import tkinter as tk
from tkinter import messagebox, simpledialog, scrolledtext
import math

NODE_RADIUS = 15
COLOR_BG = "#f0f0f0"
COLOR_NODE_DEFAULT = "#cccccc"  # 初始 T标号
COLOR_NODE_P = "#4caf50"        # P标号 (永久)
COLOR_NODE_T_ACTIVE = "#ffeb3b" # 当前正在处理的 T标号
COLOR_NODE_T_UPDATED = "#2196f3" # 被更新过的 T标号
COLOR_PATH = "#e91e63"          # 最终最短路径
INFINITY = float('inf')

class GraphNode:
    def __init__(self, canvas_id, x, y, label_id):
        self.canvas_id = canvas_id
        self.x = x
        self.y = y
        self.id = label_id
        # 算法状态
        self.dist = INFINITY
        self.parent = None
        self.is_permanent = False  # True=P标号, False=T标号

class DijApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Dijkstra 最短路径算法")
        self.root.geometry("1000x700")

        # 数据存储
        self.nodes = []      # 存储 GraphNode 对象
        self.edges = {}      # 邻接表: {u_id: {v_id: weight, ...}}
        self.node_counter = 0
        self.start_node = None
        self.end_node = None
        # 交互状态
        self.temp_line = None
        self.start_x = 0
        self.start_y = 0
        self.current_start_node_id = None
        # 算法生成器
        self.algo_generator = None
        self.is_finished = False
        self._setup_ui()

    def _setup_ui(self):
        # 主布局
        paned = tk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        paned.pack(fill=tk.BOTH, expand=True)
        # 左侧绘图区
        self.canvas_frame = tk.Frame(paned, bg="white")
        self.canvas = tk.Canvas(self.canvas_frame, bg="white", cursor="cross")
        self.canvas.pack(fill=tk.BOTH, expand=True)
        # 绑定事件
        self.canvas.bind("<Button-1>", self.on_canvas_click)
        self.canvas.bind("<B1-Motion>", self.on_canvas_drag)
        self.canvas.bind("<ButtonRelease-1>", self.on_canvas_release)
        self.canvas.bind("<Button-3>", self.on_right_click) # 右键设起点终点
        # 说明标签
        instruction = tk.Label(self.canvas_frame, text="左键点击: 添加节点 | 拖拽: 连线 | 右键节点: 设为起点/终点", bg="white", fg="gray")
        instruction.pack(side=tk.BOTTOM, fill=tk.X)
        paned.add(self.canvas_frame, width=700)
        # 右侧控制区
        self.control_frame = tk.Frame(paned, bg=COLOR_BG)
        paned.add(self.control_frame, width=300)
        # 标题
        tk.Label(self.control_frame, text="控制面板", font=("Arial", 14, "bold"), bg=COLOR_BG).pack(pady=10)
        # 按钮组
        btn_frame = tk.Frame(self.control_frame, bg=COLOR_BG)
        btn_frame.pack(fill=tk.X, padx=10)
        tk.Button(btn_frame, text="初始化/重置算法", command=self.reset_algorithm, bg="#607d8b", fg="white").pack(fill=tk.X, pady=5)
        self.btn_step = tk.Button(btn_frame, text="下一步 (Step)", command=self.run_step, state=tk.DISABLED, bg="#2196f3", fg="white")
        self.btn_step.pack(fill=tk.X, pady=5)
        tk.Button(btn_frame, text="清空画布", command=self.clear_canvas, bg="#f44336", fg="white").pack(fill=tk.X, pady=5)
        # 状态显示
        self.lbl_status = tk.Label(self.control_frame, text="状态: 准备就绪", bg=COLOR_BG, fg="blue")
        self.lbl_status.pack(pady=10)
        # P/T 集合展示
        tk.Label(self.control_frame, text="日志输出:", bg=COLOR_BG, anchor="w").pack(fill=tk.X, padx=10)
        self.log_text = scrolledtext.ScrolledText(self.control_frame, height=20, font=("Consolas", 9))
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

    # 绘图逻辑
    def get_node_at(self, x, y):
        # 简单的碰撞检测
        for node in self.nodes:
            if math.hypot(node.x - x, node.y - y) <= NODE_RADIUS:
                return node
        return None

    def on_canvas_click(self, event):
        clicked_node = self.get_node_at(event.x, event.y)
        if clicked_node:
            # 开始拖拽连线
            self.current_start_node_id = clicked_node.id
            self.start_x, self.start_y = clicked_node.x, clicked_node.y
            self.temp_line = self.canvas.create_line(self.start_x, self.start_y, event.x, event.y, dash=(4, 2))
        else:
            # 创建新节点
            self.create_node(event.x, event.y)

    def create_node(self, x, y):
        node_id = self.node_counter
        # 绘制圆形
        canvas_id = self.canvas.create_oval(x-NODE_RADIUS, y-NODE_RADIUS, x+NODE_RADIUS, y+NODE_RADIUS, 
                                            fill=COLOR_NODE_DEFAULT, outline="black", width=2, tags=f"node_{node_id}")
        # 绘制ID文本
        self.canvas.create_text(x, y, text=str(node_id), font=("Arial", 10, "bold"), tags=f"text_{node_id}")
        
        node = GraphNode(canvas_id, x, y, node_id)
        self.nodes.append(node)
        self.edges[node_id] = {}
        self.node_counter += 1
        self.log(f"添加节点 {node_id}")

    def on_canvas_drag(self, event):
        if self.temp_line:
            self.canvas.coords(self.temp_line, self.start_x, self.start_y, event.x, event.y)

    def on_canvas_release(self, event):
        if self.temp_line:
            self.canvas.delete(self.temp_line)
            self.temp_line = None
            
            end_node = self.get_node_at(event.x, event.y)
            if end_node and self.current_start_node_id is not None and end_node.id != self.current_start_node_id:
                # 连线成功，输入权重
                self.create_edge(self.current_start_node_id, end_node.id)
            
            self.current_start_node_id = None

    def create_edge(self, u_id, v_id):
        # 检查是否已存在
        if v_id in self.edges[u_id]:
            self.log(f"边 {u_id}-{v_id} 已存在")
            return
        # 弹出输入框
        weight = simpledialog.askinteger("输入权重", f"请输入边 {u_id} - {v_id} 的权重:", minvalue=1, parent=self.root)
        if weight is None: return
        # 存储边
        self.edges[u_id][v_id] = weight
        self.edges[v_id][u_id] = weight
        # 绘图
        u_node = next(n for n in self.nodes if n.id == u_id)
        v_node = next(n for n in self.nodes if n.id == v_id)
        # 线条放在节点下方
        line_id = self.canvas.create_line(u_node.x, u_node.y, v_node.x, v_node.y, width=2, tags="edge")
        self.canvas.tag_lower(line_id) # 放在最底层
        # 绘制权重文字
        mid_x = (u_node.x + v_node.x) / 2
        mid_y = (u_node.y + v_node.y) / 2
        # 白色背景矩形
        self.canvas.create_rectangle(mid_x-10, mid_y-8, mid_x+10, mid_y+8, fill="white", outline="", tags="edge_label")
        self.canvas.create_text(mid_x, mid_y, text=str(weight), fill="blue", font=("Arial", 9), tags="edge_label")
        self.log(f"添加边: {u_id} <-> {v_id} (权重: {weight})")

    def on_right_click(self, event):
        node = self.get_node_at(event.x, event.y)
        if not node: return
        
        # 简单的轮换逻辑：无 -> 起点 -> 终点 -> 无
        if self.start_node == node:
            self.start_node = None
            self.canvas.itemconfig(node.canvas_id, outline="black", width=2)
            self.log(f"取消节点 {node.id} 为起点")
        elif self.end_node == node:
            self.end_node = None
            self.canvas.itemconfig(node.canvas_id, outline="black", width=2)
            self.log(f"取消节点 {node.id} 为终点")
        else:
            if self.start_node is None:
                self.start_node = node
                self.canvas.itemconfig(node.canvas_id, outline="green", width=4)
                self.log(f"设置节点 {node.id} 为【起点】")
            elif self.end_node is None:
                self.end_node = node
                self.canvas.itemconfig(node.canvas_id, outline="red", width=4)
                self.log(f"设置节点 {node.id} 为【终点】")
            else:
                self.log("起点和终点已设定，请先取消一个。")

    def reset_algorithm(self):
        if not self.start_node or not self.end_node:
            messagebox.showwarning("提示", "请先在图中设置起点和终点 (右键点击节点)。")
            return
        
        # 重置所有节点状态
        for node in self.nodes:
            node.dist = INFINITY
            node.parent = None
            node.is_permanent = False
            # 恢复颜色
            self.canvas.itemconfig(node.canvas_id, fill=COLOR_NODE_DEFAULT)
        
        # 清除之前的路径高亮
        self.canvas.delete("path_line")

        # 初始化生成器
        self.algo_generator = self.dij_gen()
        self.btn_step.config(state=tk.NORMAL)
        self.is_finished = False
        self.log_text.delete(1.0, tk.END)
        self.log("=== 算法初始化 ===")
        self.log(f"P标号集合: {{}}")
        self.log(f"T标号集合: 所有节点")
        self.log("点击 '下一步' 开始...")

    def dij_gen(self):
        start_id = self.start_node.id
        end_id = self.end_node.id
        
        # 初始化起点
        self.start_node.dist = 0
        # 更新显示
        self.update_node_visual(self.start_node, COLOR_NODE_T_UPDATED)
        self.log(f"初始化: 起点 {start_id} 的 T标号 = 0")
        # T集合 是 is_permanent = False 的节点
        # P集合 是 is_permanent = True 的节点
        while True:
            # 在 T标号集合中寻找 dist 最小的节点
            min_dist = INFINITY
            u_node = None
            t_nodes = [n for n in self.nodes if not n.is_permanent]
            if not t_nodes:
                self.log("T集合为空，算法结束。")
                break
            # 找最小
            for node in t_nodes:
                if node.dist < min_dist:
                    min_dist = node.dist
                    u_node = node
            # 如果找不到可达节点，说明不连通
            if u_node is None or min_dist == INFINITY:
                self.log("错误: 无法到达终点 (T集合中剩余节点均不可达)")
                self.finish_algorithm(success=False)
                yield
                return

            # 将u移入P标号集合
            u_node.is_permanent = True
            self.update_node_visual(u_node, COLOR_NODE_P)
            self.log(f"-> 选定节点 {u_node.id} (dist={u_node.dist}) 加入 P标号集合")
            # 高亮当前正在处理的节点
            self.canvas.itemconfig(u_node.canvas_id, fill=COLOR_NODE_T_ACTIVE)
            yield # 暂停，展示选中的节点
            # 恢复P标号颜色
            self.update_node_visual(u_node, COLOR_NODE_P)
            
            # 找到终点，算法提前结束
            if u_node.id == end_id:
                self.log(f"已到达终点 {end_id}！开始回溯路径...")
                self.finish_algorithm(success=True)
                yield
                return

            # 更新T标号
            neighbors = self.edges.get(u_node.id, {})
            updated_any = False
            
            for v_id, weight in neighbors.items():
                v_node = next(n for n in self.nodes if n.id == v_id)
                # 只处理T标号的点
                if not v_node.is_permanent:
                    new_dist = u_node.dist + weight
                    if new_dist < v_node.dist:
                        old_dist_str = "∞" if v_node.dist == INFINITY else str(v_node.dist)
                        v_node.dist = new_dist
                        v_node.parent = u_node
                        self.update_node_visual(v_node, COLOR_NODE_T_UPDATED)
                        self.log(f"   更新节点 {v_id}: T标号 {old_dist_str} -> {new_dist} (来自 {u_node.id})")
                        updated_any = True
            
            if not updated_any:
                self.log(f"   节点 {u_node.id} 无需更新任何 T标号邻居")
            yield

    def run_step(self):
        if not self.algo_generator:
            return
        
        try:
            next(self.algo_generator)
        except StopIteration:
            self.log("算法执行完毕。")
            self.btn_step.config(state=tk.DISABLED)

    def update_node_visual(self, node, color):
        self.canvas.itemconfig(node.canvas_id, fill=color)
        tag = f"dist_text_{node.id}"
        self.canvas.delete(tag)
        text = "∞" if node.dist == INFINITY else str(node.dist)
        self.canvas.create_text(node.x, node.y - 25, text=f"d={text}", fill="blue", font=("Arial", 8), tags=tag)

    def finish_algorithm(self, success):
        self.is_finished = True
        self.btn_step.config(state=tk.DISABLED)
        
        if success:
            # 回溯路径
            path = []
            curr = self.end_node
            total_dist = self.end_node.dist
            
            while curr:
                path.append(curr)
                curr = curr.parent
            
            path.reverse()
            path_str = " -> ".join([str(n.id) for n in path])
            self.log(f"=== 找到最短路径 ===")
            self.log(f"路径: {path_str}")
            self.log(f"总权重: {total_dist}")
            messagebox.showinfo("成功", f"最短路径长度: {total_dist}\n路径: {path_str}")
            # 绘制粗线条路径
            if len(path) > 1:
                for i in range(len(path) - 1):
                    u, v = path[i], path[i+1]
                    self.canvas.create_line(u.x, u.y, v.x, v.y, fill=COLOR_PATH, width=5, tags="path_line")
                    self.canvas.tag_raise(f"node_{u.id}") # 保持节点在最上层
                    self.canvas.tag_raise(f"text_{u.id}")
                self.canvas.tag_raise(f"node_{path[-1].id}")
                self.canvas.tag_raise(f"text_{path[-1].id}")
    
    # 辅助功能
    def log(self, message):
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)

    def clear_canvas(self):
        self.canvas.delete("all")
        self.nodes = []
        self.edges = {}
        self.node_counter = 0
        self.start_node = None
        self.end_node = None
        self.log_text.delete(1.0, tk.END)
        self.btn_step.config(state=tk.DISABLED)
        self.algo_generator = None

if __name__ == "__main__":
    root = tk.Tk()
    app = DijApp(root)
    root.mainloop()