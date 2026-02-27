const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

// import { Resend } from 'resend';



const transporter = nodemailer.createTransport({

    service: 'gmail',

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS

    }

})



const sendMail = async (to, subject, html) => {

    const mailOptions = {

        from: `"MY app's Support"<${process.env.EMAIL_USER}>`,

        to,

        subject,

        html

    };



    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error);
        // Silent fail
    }

}
module.exports = sendMail