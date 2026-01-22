import java.util.regex.Pattern;

class InvalidEmailException extends Exception { // 从异常类中引入无效异常类
    public InvalidEmailException(String message) {
        super(message);
    }
}

class EmailValidator { // 验证类

    public static void validate(String email) throws InvalidEmailException { // 如果错误则抛出异常
        // 总长度要求
        if (email.length() > 254) { // 总长度通常不超过254，仅进行提示
            System.out.println("提示：地址总长度通常不超过254个字符");
        }
        // @符号要求
        String[] parts = email.split("@"); // 用@分割地址
        if (parts.length != 2) { // 如果分割地址不为2，表示没有@或有多个@
            throw new InvalidEmailException("邮件地址必须仅有一个@符号");
        }
        // 若有大写则进行提示，但不抛出错误
        if (!email.equals(email.toLowerCase())) { // 对小写及原文对比，得出是否有大写字母
            System.out.println("提示：邮件地址建议统一使用小写");
        }
        // 分割出本地部分和域部分
        String localPart = parts[0];
        String domainPart = parts[1];

        // 本地部分要求
        validateLocalPart(localPart);

        // 域部分要求
        validateDomainPart(domainPart);
    }

    private static void validateLocalPart(String localPart) throws InvalidEmailException { // 本地部分验证
        if (localPart.isEmpty()) {
            throw new InvalidEmailException("本地部分不能为空");
        }
        if (localPart.length() > 64) { // 一般不超过，弹出提醒但不报错
            System.out.println("提示：本地部分长度一般不超过64个字符");
        }
        if (localPart.startsWith(".") || localPart.endsWith(".")) {
            throw new InvalidEmailException("本地部分不能以点.开头或结尾");
        }
        if (localPart.startsWith("-") || localPart.endsWith("-")) {
            throw new InvalidEmailException("本地部分不能以连字符-开头或结尾");
        }
        if (localPart.contains("..")) { // 包含两个连续的点即说明有多个连续点
            throw new InvalidEmailException("本地部分不能有连续的点");
        }
        if (!Pattern.matches("^[a-zA-Z0-9._-]+$", localPart)) { // 检查字符匹配，使用正则表达式
            throw new InvalidEmailException("本地部分仅可包含：字母(a-z, A-Z)、数字(0-9)、点(.)、下划线(_)、连字符(-)。");
        }
    }

    private static void validateDomainPart(String domainPart) throws InvalidEmailException { // 域部分验证
        if (domainPart.isEmpty()) {
            throw new InvalidEmailException("域部分不能为空");
        }
        if (domainPart.length() > 253) {
            System.out.println("提示：域部分长度一般不超过253个字符");
        }
        if (!domainPart.contains(".")) {
            throw new InvalidEmailException("域部分必须包含点.");
        }

        String[] labels = domainPart.split("\\."); // 多级标签切割
        if (labels.length < 2) { // 若只有一个标签，说明域部分不合法
            throw new InvalidEmailException("标签不能仅有一级");
        }

        for (String label : labels) { // 对每个标签判定
            if (label.isEmpty()) { // 标签为空
                throw new InvalidEmailException("标签不能为空");
            }
            if (label.startsWith("-") || label.endsWith("-")) {
                throw new InvalidEmailException("标签不能以连字符-开头或结尾");
            }
            if (!Pattern.matches("^[a-zA-Z0-9-]+$", label)) { // 检查字符匹配，使用正则表达式
                throw new InvalidEmailException("标签仅可由字母、数字、连字符(-)组成。");
            }
        }
    }
}

public class part2 {
    public static void main(String[] args) {
        // 测试用例数组
        String[] testEmails = {
            // 正确示例
            "username@example.com",
            "user.name@example.com",
            "user_name@example.com",
            "user-name@example.com",
            "u@example.com",
            "u@sub.example.org",
            // 错误示例
            "username.example.com",
            "user@",
            "user..name@example.com",
            "user-@example.com",
            "u@@example.com",
            "u @example.com",
            "u@example",
            "u@-example.com",
            "u@example.-com",
            "USER@EXAMPLE.COM"
        };

        // 遍历所有测试用例
        for (String email : testEmails) {
            try {
                EmailValidator.validate(email);
                System.out.println(email + "是一个合法的邮件地址");
            } catch (InvalidEmailException e) {
                System.out.println(email + "是一个非法的邮件地址：" + e.getMessage());
            }
        }
    }
}