public class work2_7 {
    private static class Student {
        private String no;
        private String name;
        private int age;

        public Student() { // 无参构造
            System.out.println("无参构造方法被调用");
        }

        public Student(String no, String name, int age) { // 含参构造
            System.out.println("含参构造方法被调用");
            this.no = no;
            this.name = name;
            this.age = age;
        }

        public String getNo() {
            return no;
        }

        public void setNo(String no) {
            this.no = no;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getAge() {
            return age;
        }

        public void setAge(int age) {
            this.age = age;
        }

        public void display() { // 显示学生信息
            System.out.println("该学生的学号为" + no + "，姓名为" + name + "，年龄为" + age);
        }
    }
    public static void main(String[] args) {
        // 无参数构造
        Student student1 = new Student();
        student1.setNo("109092023001");
        student1.setName("一号同学");
        student1.setAge(20);
        student1.display();
        System.out.println("该同学的学号为: " + student1.getNo());
        System.out.println("该同学的姓名为: " + student1.getName());
        System.out.println("该同学的年龄为: " + student1.getAge());

        // 带参数构造
        Student student2 = new Student("109092023002", "二号同学", 27);
        student2.display();
    }
}