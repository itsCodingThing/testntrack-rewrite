import ejs from "ejs";
import path from "node:path";
import nodemailer from "nodemailer";

import logger from "../utils/logger.js";
import config from "../config/config.js";
// import { findPaperById } from "./db/paper.js";
// import { findStudentById } from "./db/student.js";
// import { evaluatorModel } from "./db/evaluator.js";

const mailerConfig = {
  host: config.mail_server.host,
  port: config.mail_server.port,
  secure: true, // true for 465, false for other ports
  auth: {
    user: config.mail_server.username,
    pass: config.mail_server.password,
  },
  sendingRate: 1,
};

if (process.env.NODE_ENV === "development") {
  const testAccount = await nodemailer.createTestAccount();

  logger.info(testAccount, "email testing account details");

  mailerConfig.host = testAccount.smtp.host;
  mailerConfig.port = testAccount.smtp.port.toString();
  mailerConfig.secure = testAccount.smtp.secure;
  mailerConfig.auth = {
    user: testAccount.user,
    pass: testAccount.pass,
  };
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const transporter = nodemailer.createTransport(mailerConfig);

interface IRatingInfo {
  student: string;
  paper: string;
  teacher: string;
  rating: string;
  reason: string;
}

export async function sendStudentRatingMail(studentRating: IRatingInfo) {
  // try {
  //     const [student, paper, evaluator] = await Promise.all([
  //         findStudentById(studentRating.student),
  //         findPaperById(studentRating.paper),
  //         evaluatorModel.findById(studentRating.teacher).lean(),
  //     ]);
  //
  //     const ratingTemplate = `
  //         <p>School: ${student?.school.name}</p>
  //         <p>Student: ${student?.name}</p>
  //         <p>Paper: ${paper?.name}</p>
  //         <p>Teacher: ${evaluator?.name}</p>
  //         <p>Rating: ${studentRating.rating}</p>
  //         <p>Reason: ${studentRating.reason}</p>
  //     `;
  //
  //     const result = await transporter.sendMail({
  //         from: "developers@testntrack.com",
  //         to: "arti.yadav@testntrack.com",
  //         subject: "Student Rating Notification",
  //         html: ratingTemplate,
  //     });
  //
  //     return { ...result, preview: nodemailer.getTestMessageUrl(result) };
  // } catch (error) {
  //     logger.error(error, "unable send student rating mail");
  // }
}

export async function sendSchoolCredentialMail(
  mail: { to: string; subject: string; text: string },
  body = { userLoginId: " ", userPassword: "" }
) {
  try {
    const HTMLString = await ejs.renderFile(path.join(__dirname, "../views/schoolMailFormat.ejs"), {
      userLoginId: body.userLoginId,
      userPassword: body.userPassword,
    });

    await transporter.sendMail({
      from: "developers@testntrack.com",
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: HTMLString,
    });
  } catch (error) {
    logger.error(error, "unable send school credential mail");
  }
}

export async function sendErrorMail(error: Error) {
  try {
    await transporter.sendMail({
      from: "developers@testntrack.com",
      to: "developers@testntrack.com",
      subject: "Unknown Error",
      html: JSON.stringify({ error: error.toString(), stack: error.stack }, null, 4),
    });
  } catch (error) {
    logger.error(error, "unable send error mail");
  }
}
