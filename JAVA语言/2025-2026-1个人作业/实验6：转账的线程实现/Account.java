import java.util.concurrent.*;

public class Account {
    private final String accountId; // 账户ID
    private double balance;

    public Account(String accountId, double initialBalance) {
        this.accountId = accountId;
        this.balance = initialBalance;
    }

    // 转账方法（从当前账户转出金额至目标账户）
    // target 目标账户; amount 转账金额
    public void transfer(Account target, double amount) {
        try {
            synchronized (this) {
                while (this.balance < amount) {
                    System.out.println(
                        Thread.currentThread().getName() + " 从 " + this.accountId + " 转账 " + amount + " 到 " + target.accountId +
                        " 失败，余额不足，等待..."
                    );
                    // 等待
                    this.wait();
                }
            }
        } catch (InterruptedException e) {
            System.err.println("线程 " + Thread.currentThread().getName() + " 在等待时被中断，转账取消。");
            Thread.currentThread().interrupt(); // 恢复中断状态
            return;
        }

        // 避免死锁，按账户ID的字典序来锁定账户
        Account lock1 = this;
        Account lock2 = target;

        // 交换锁的顺序
        if (this.accountId.compareTo(target.accountId) > 0) {
            lock1 = target;
            lock2 = this;
        }

        // 同步代码块，锁定当前账户对象
        synchronized (lock1) {
            synchronized (lock2) {
                // 执行转账操作
                this.balance -= amount;
                target.balance += amount;
                System.out.println(Thread.currentThread().getName() + " 转账成功: " + amount + " 从 " + this.accountId + " 到 " + target.accountId);
                
                // 通知所有线程
                target.notifyAll();
            }
        }
    }

    // 存款方法
    // amount 存款金额
    public synchronized void deposit(double amount) {
        // 增加账户余额
        this.balance += amount;
        System.out.println(Thread.currentThread().getName() + " 存款 " + amount + " 至 " + this.accountId + ", 当前余额: " + this.balance);
        // 通知所有线程
        this.notifyAll();
    }

    // 获取账户余额
    public synchronized double getBalance() {
        return this.balance;
    }
    // 获取账户ID
    public String getAccountId() {
        return accountId;
    }
}


class TransferThread implements Runnable {
    private final Account fromAccount;
    private final Account toAccount;
    private final double amount;

    public TransferThread(Account from, Account to, double amount) {
        this.fromAccount = from;
        this.toAccount = to;
        this.amount = amount;
    }

    @Override
    public void run() {
        fromAccount.transfer(toAccount, amount);
    }
}

class Test {
    public static void main(String[] args) {
        // 创建账户
        final Account a1 = new Account("A", 1000.0);
        final Account a2 = new Account("B", 1000.0);

        // 创建一个线程池
        ExecutorService executor = Executors.newFixedThreadPool(10);

        System.out.println("===转账前余额===");
        System.out.println("账户 " + a1.getAccountId() + ": " + a1.getBalance());
        System.out.println("账户 " + a2.getAccountId() + ": " + a2.getBalance());
        executor.submit(new TransferThread(a1, a2, 100));
        executor.submit(new TransferThread(a2, a1, 200));
        executor.submit(new TransferThread(a1, a2, 50));
        executor.submit(new TransferThread(a2, a1, 1200)); // 此时会余额不足，进入等待
        executor.submit(new TransferThread(a1, a2, 300)); // 此时会唤醒上面的线程

        
        executor.shutdown(); // 关闭线程池
        try {
            // 等待所有任务都执行完毕
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }

        System.out.println("===转账后余额===");
        System.out.println("账户 " + a1.getAccountId() + ": " + a1.getBalance());
        System.out.println("账户 " + a2.getAccountId() + ": " + a2.getBalance());
        System.out.println("总金额: " + (a1.getBalance() + a2.getBalance()));
    }
}