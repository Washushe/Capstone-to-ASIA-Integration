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

public class Register {

	private JFrame frame;
	private JTextField textField_1;
	private JTextField textField;
	private JTextField textField_2;

	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					Register window = new Register();
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
	public Register() {
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
		lblCompostAcceleratorWith.setBounds(72, 178, 595, 112);
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
		
		JButton btnNewButton = new JButton("Continue");
		btnNewButton.setFont(new Font("Tahoma", Font.PLAIN, 13));
		btnNewButton.setBounds(66, 495, 105, 43);	
		panel.add(btnNewButton);
		
		JLabel lblNewLabel = new JLabel("Sign Up");
		lblNewLabel.setBounds(67, 138, 104, 57);
		panel.add(lblNewLabel);
		lblNewLabel.setBackground(new Color(255, 255, 255));
		lblNewLabel.setFont(new Font("Tahoma", Font.PLAIN, 21));
		
		JLabel lblNewLabel_1 = new JLabel("Please create an account to start managing smart compost bins.");
		lblNewLabel_1.setFont(new Font("Tahoma", Font.PLAIN, 14));
		lblNewLabel_1.setBounds(67, 205, 405, 29);
		panel.add(lblNewLabel_1);
		
		JLabel lblNewLabel_2 = new JLabel("Email");
		lblNewLabel_2.setFont(new Font("Tahoma", Font.PLAIN, 15));
		lblNewLabel_2.setBounds(67, 264, 89, 29);
		panel.add(lblNewLabel_2);
		
		JLabel lblNewLabel_2_1 = new JLabel("Password");
		lblNewLabel_2_1.setFont(new Font("Tahoma", Font.PLAIN, 15));
		lblNewLabel_2_1.setBounds(67, 409, 89, 29);
		panel.add(lblNewLabel_2_1);
		
		textField_1 = new JTextField();
		textField_1.setColumns(10);
		textField_1.setBounds(67, 291, 325, 35);
		panel.add(textField_1);
		
		textField = new JTextField();
		textField.setColumns(10);
		textField.setBounds(67, 437, 325, 35);
		panel.add(textField);
		
		JLabel lblNewLabel_3_1 = new JLabel("Or sign up with ");
		lblNewLabel_3_1.setFont(new Font("Tahoma", Font.PLAIN, 13));
		lblNewLabel_3_1.setBounds(67, 581, 119, 16);
		panel.add(lblNewLabel_3_1);
		
		JButton btnGoogle = new JButton("Google");
		btnGoogle.setFont(new Font("Tahoma", Font.PLAIN, 13));
		btnGoogle.setBounds(184, 568, 105, 43);
		panel.add(btnGoogle);
		
		JLabel lblNewLabel_3_2 = new JLabel("Already have an account? Log In");
		lblNewLabel_3_2.setFont(new Font("Tahoma", Font.PLAIN, 13));
		lblNewLabel_3_2.setBounds(67, 650, 189, 29);
		panel.add(lblNewLabel_3_2);
		
		textField_2 = new JTextField();
		textField_2.setColumns(10);
		textField_2.setBounds(67, 364, 325, 35);
		panel.add(textField_2);
		
		JLabel lblNewLabel_2_1_1 = new JLabel("Username");
		lblNewLabel_2_1_1.setFont(new Font("Tahoma", Font.PLAIN, 15));
		lblNewLabel_2_1_1.setBounds(67, 337, 89, 29);
		panel.add(lblNewLabel_2_1_1);
		btnNewButton.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
			}
		});
	}
}
