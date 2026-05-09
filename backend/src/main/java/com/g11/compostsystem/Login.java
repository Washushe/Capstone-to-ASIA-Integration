package com.g11.compostsystem;

import java.awt.EventQueue;

import javax.swing.JFrame;
import javax.swing.JLabel;
import java.awt.Font;
import java.awt.Color;
import javax.swing.JButton;
import javax.swing.JPanel;
import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;
import javax.swing.JTextField;

public class Login {

	private JFrame frame;
	private JTextField textField_1;
	private JTextField textField;

	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					Login window = new Login();
					window.frame.setVisible(true);
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		});
	}

	/**
	 * Create the application.
	 */
	public Login() {
		initialize();
	}

	/**
	 * Initialize the contents of the frame.
	 */
	private void initialize() {
		frame = new JFrame();
		frame.getContentPane().setBackground(new Color(255, 255, 255));
		frame.setBounds(100, 100, 1258, 808);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		frame.getContentPane().setLayout(null);
		
		JLabel lblCompostAcceleratorWith = new JLabel("Compost Accelerator with Spray and Fan Control");
		lblCompostAcceleratorWith.setFont(new Font("Tahoma", Font.PLAIN, 26));
		lblCompostAcceleratorWith.setBounds(71, 218, 595, 112);
		frame.getContentPane().add(lblCompostAcceleratorWith);
		
		JPanel panel = new JPanel();
		panel.setBackground(new Color(0, 128, 192));
		panel.setBounds(696, 0, 548, 845);
		frame.getContentPane().add(panel);
		panel.setLayout(null);
		
		JButton btnNewButton_1 = new JButton("Go Back");
		btnNewButton_1.setFont(new Font("Tahoma", Font.PLAIN, 13));
		btnNewButton_1.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
			}
		});
		btnNewButton_1.setBounds(52, 62, 89, 43);
		panel.add(btnNewButton_1);
		
		JButton btnNewButton = new JButton("Login");
		btnNewButton.setFont(new Font("Tahoma", Font.PLAIN, 13));
		btnNewButton.setBounds(67, 478, 105, 43);
		panel.add(btnNewButton);
		
		JLabel lblNewLabel = new JLabel("Welcome!");
		lblNewLabel.setBounds(67, 138, 104, 57);
		panel.add(lblNewLabel);
		lblNewLabel.setBackground(new Color(255, 255, 255));
		lblNewLabel.setFont(new Font("Tahoma", Font.PLAIN, 21));
		
		JLabel lblNewLabel_1 = new JLabel("Please login to your account");
		lblNewLabel_1.setFont(new Font("Tahoma", Font.PLAIN, 14));
		lblNewLabel_1.setBounds(67, 205, 189, 29);
		panel.add(lblNewLabel_1);
		
		JLabel lblNewLabel_2 = new JLabel("Username");
		lblNewLabel_2.setFont(new Font("Tahoma", Font.PLAIN, 15));
		lblNewLabel_2.setBounds(67, 264, 89, 29);
		panel.add(lblNewLabel_2);
		
		JLabel lblNewLabel_2_1 = new JLabel("Password");
		lblNewLabel_2_1.setFont(new Font("Tahoma", Font.PLAIN, 15));
		lblNewLabel_2_1.setBounds(67, 357, 89, 29);
		panel.add(lblNewLabel_2_1);
		
		textField_1 = new JTextField();
		textField_1.setColumns(10);
		textField_1.setBounds(67, 301, 325, 35);
		panel.add(textField_1);
		
		textField = new JTextField();
		textField.setColumns(10);
		textField.setBounds(67, 396, 325, 35);
		panel.add(textField);
		
		JLabel lblNewLabel_3 = new JLabel("Reset Password");
		lblNewLabel_3.setFont(new Font("Tahoma", Font.PLAIN, 13));
		lblNewLabel_3.setBounds(295, 441, 97, 16);
		panel.add(lblNewLabel_3);
		
		JLabel lblNewLabel_3_1 = new JLabel("Or continue with ");
		lblNewLabel_3_1.setFont(new Font("Tahoma", Font.PLAIN, 13));
		lblNewLabel_3_1.setBounds(67, 581, 119, 16);
		panel.add(lblNewLabel_3_1);
		
		JButton btnGoogle = new JButton("Google");
		btnGoogle.setFont(new Font("Tahoma", Font.PLAIN, 13));
		btnGoogle.setBounds(184, 568, 105, 43);
		panel.add(btnGoogle);
		
		JLabel lblNewLabel_3_2 = new JLabel("Don't have an account? Sign-up");
		lblNewLabel_3_2.setFont(new Font("Tahoma", Font.PLAIN, 13));
		lblNewLabel_3_2.setBounds(67, 650, 189, 29);
		panel.add(lblNewLabel_3_2);
		btnNewButton.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
			}
		});
	}
}
