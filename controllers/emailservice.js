const nodemailer = require('nodemailer');
const logger = require('../startup/logger'); // Adjust the path as needed

exports.sendEmail = async (email,code) => {
     // Create a Nodemailer transporter object
     const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
               user: 'trabajos24panama@gmail.com',
               pass: 'Trabajos23ya0102',
          },
     });

     // Email data
     const mailOptions = {
          from: 'trabajos24panama@gmail.com',
          to: email, // Replace with the recipient's email address
          subject: "Verification code", // Subject line
          text: "Your Tarabojos app otp code is " + code, // Plain text body
     };

     // Send the email
     transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
               logger.error('Error sending email: ', error);
          } else {
               logger.info('Email sent: ' + info.response);
          }
     });
}
