package com.group11.compostsystem.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String appPassword;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        if (fromEmail == null || fromEmail.isBlank() || appPassword == null || appPassword.isBlank()) {
            throw new IllegalStateException("Gmail SMTP credentials are not configured.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Reset your IoT Compost Accelerator password");
        message.setText("""
                Hello,

                We received a request to reset your IoT Compost Accelerator account password.

                Open this link to set a new password:
                %s

                This link expires soon and can be used only once. If you did not request this, you can ignore this email.
                """.formatted(resetLink));

        mailSender.send(message);
    }
}
