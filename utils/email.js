import path from 'node:path';
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename).slice(1);
import nodemailer from 'nodemailer';
import pug from 'pug';
import Transport from 'nodemailer-brevo-transport';
import { htmlToText } from 'html-to-text';

export class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `admin <${process.env.EMAIL_FROM}>`;
  }


  newTransport() {
    if (process.env.NODE_ENV === 'production') {

      return nodemailer.createTransport({
        host: process.env.BREVO_SEND_SERVER,
        port: process.env.BREVO_SEND_PORT,
        logger: true,
        auth: {
          user: process.env.BREVO_SEND_USER,
          pass: process.env.BREVO_SEND_PASSWORD,
        },
      });
    } else {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        logger: true,
        secure: false,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  }

  async send(template, subject) {
    // render template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );
    // define options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };
    // create transport and send email
    this.newTransport();
    await this.newTransport().sendMail(mailOptions);
  }
  async sendWelcome() {
    await this.send('welcome', 'Welcome to natours');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Reset Your Password (valid for only 10 min)',
    );
  }
}
