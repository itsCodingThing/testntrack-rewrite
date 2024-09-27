/* eslint-disable @typescript-eslint/ban-ts-comment */
import got from "got";
import lodash from "lodash";

import ParentModel from "../database/models/Parent.js";
import TeacherModel from "../database/models/Teacher.js";
import StudentModel from "../database/models/Student.js";
import EvaluatorModel from "../database/models/Evaluator.js";
import UserDefaultOtpModel from "../database/models/DefaultOtp.js";

import { ServiceError } from "../utils/error.js";
import { config, genRandom4DigitInt } from "../utils/utils.js";

const { bulksms } = config;

export const defaultOtpModel = UserDefaultOtpModel;

export async function getAllAvailableOTPs() {
    const teacherOTP = await TeacherModel.find(
        { otp: { $ne: "" }, deleted: { $ne: true } },
        { _id: 0, name: 1, contact: 1, otp: 1, school: 1 }
    ).lean({ autopopulate: true });
    const tempTeacher = teacherOTP.map((data) => {
        // @ts-ignore
        return { type: "Teacher", ...lodash.omit(data, "batch"), school: data.school.name };
    });

    const studentOTP = await StudentModel.find(
        { otp: { $ne: "" }, deleted: { $ne: true } },
        { _id: 0, name: 1, contact: 1, otp: 1, school: 1 }
    ).lean({ autopopulate: true });
    const tempStudent = studentOTP.map((data) => {
        // @ts-ignore
        return { type: "Student", ...lodash.omit(data, "batch"), school: data.school.name };
    });

    const evaluatorOTP = await EvaluatorModel.find(
        { otp: { $ne: "" }, deleted: { $ne: true } },
        { _id: 0, name: 1, contact: 1, otp: 1 }
    ).lean({ autopopulate: true });
    const tempEvaluator = evaluatorOTP.map((data) => {
        return { type: "Evaluator", ...data };
    });

    const parentOTP = await ParentModel.find(
        { otp: { $ne: "" }, deleted: { $ne: true } },
        { _id: 0, name: 1, contact: 1, otp: 1 }
    ).lean({ autopopulate: true });
    const tempParent = parentOTP.map((data) => {
        return { type: "Parent", ...data };
    });

    return {
        evaluator_otp: { tempEvaluator },
        teacher_otp: { tempTeacher },
        student_otp: { tempStudent },
        parent_otp: { tempParent },
    };
}

export async function findDefaultOtpByContact(contact: string) {
    const user = await UserDefaultOtpModel.findOne({ contact }).lean();

    if (!user) {
        return null;
    }

    return user.otp;
}

export async function gen4DigitOTP(contact?: string) {
    let otp = "1234";

    try {
        if (!contact) {
            if (process.env.NODE_ENV === "production") {
                otp = genRandom4DigitInt().toString();
            }

            return otp;
        }

        if (process.env.NODE_ENV === "production") {
            const userOtp = await findDefaultOtpByContact(contact);

            if (userOtp) {
                otp = userOtp;
            } else {
                otp = genRandom4DigitInt().toString();
            }

            // if (config.demo_users.includes(contact)) {
            //     otp = "1234";
            // } else if (config.demo_users2.includes(contact)) {
            //     otp = "1729";
            // } else {
            //     otp = genRandom4DigitInt().toString();
            // }
        }

        return otp;
    } catch {
        return otp;
    }
}

export async function sendOTP(mobile: string, otp: string) {
    if (process.env.NODE_ENV === "development") return;

    try {
        await got
            .post(bulksms.url, {
                json: {
                    userid: bulksms.user_id,
                    password: bulksms.password,
                    senderid: bulksms.sender_id_2,
                    msgType: "text",
                    sendMethod: "single",
                    //  duplicateCheck: "true",
                    // testMessage: "true",
                    // dltEntityId: "1323",
                    // dltTemplateId: "1707165701188754284",
                    // dltTemplateId: "1707163948200110185",
                    trackLink: "true",
                    sms: [
                        {
                            mobile: [mobile],
                            msg: `Your One Time Password is ${otp} 9qq8uQJ+4HR Only valid for 10 minutes.Testntrack`,
                        },
                    ],
                },
            })
            .json();
    } catch {
        throw new ServiceError({ msg: "Unable send otp" });
    }
}
