import type { FastifyPluginAsync } from "fastify";

import { compareHashPassword, encryptPassword } from "project/utils/encrypt.js";
import { generateJWT } from "project/utils/jwt.js";
import { sendErrorResponse, sendSuccessResponse } from "project/utils/serverResponse.js";
import { parseAsync, zod } from "project/utils/validation.js";
import { prisma } from "project/database/db.connection.js";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * @rotue   POST "/api/v1/auth/register"
   * @desc    Register admin user
   */
  fastify.route({
    method: "POST",
    url: "/auth/register",
    handler: async (req, res) => {
      const body = await parseAsync(
        zod.object({
          email: zod.string(),
          password: zod.string(),
          name: zod.string().optional(),
          contact: zod.string().optional(),
        }),
        req.body
      );

      const user = await prisma.adminUser.findUnique({ where: { email: body.email } });
      if (user) {
        return sendErrorResponse({ msg: "Email already register with us", response: res });
      }

      return sendSuccessResponse({
        data: await prisma.adminUser.create({
          data: {
            email: body.email,
            password: encryptPassword(body.password),
            name: body.name ?? "admin",
            contact: "9876543210",
          },
        }),
        response: res,
      });
    },
  });

  /**
   * @rotue   POST "/api/v1/auth/login
   * @desc    Login admin user
   */
  fastify.route({
    method: "POST",
    url: "/auth/login",
    handler: async (req, res) => {
      const body = await parseAsync(
        zod.discriminatedUnion(
          "type",
          [
            zod.object({
              type: zod.literal("admin"),
              email: zod.string().email("enter a valid email"),
              password: zod.string().min(8, "please enter password min 8 charactor long"),
            }),
            zod.object({
              type: zod.literal("school"),
              email: zod.string().email("enter a valid email"),
              password: zod.string().min(8, "please enter password min 8 charactor long"),
              code: zod.string().min(3, "code must atleast be 3 charactor long"),
            }),
          ],
          {
            errorMap: () => ({ message: "invalid user type" }),
          }
        ),
        req.body
      );

      if (body.type === "admin") {
        const admin = await prisma.adminUser.findFirst({ where: { email: body.email } });
        if (!admin) {
          return sendErrorResponse({ msg: "Admin does not exists", response: res });
        }

        if (!compareHashPassword(body.password, admin.password)) {
          return sendErrorResponse({
            msg: "Invalid password. Please enter correct password and try again",
            response: res,
          });
        }

        const token = generateJWT({ id: admin.id.toString(), type: body.type, school: "" });
        return sendSuccessResponse({ data: { token, id: admin.id, name: admin.name }, response: res });
      }

      if (body.type === "school") {
        const school = await prisma.school.findFirst({ where: { code: body.code } });

        if (!school) {
          return sendErrorResponse({ msg: "School does not exists", response: res });
        }

        const schoolAdmin = await prisma.schoolAdminUser.findFirst({ where: { email: body.email } });
        if (!schoolAdmin) {
          return sendErrorResponse({ msg: "Admin does not exists", response: res });
        }

        if (!compareHashPassword(body.password, schoolAdmin.password)) {
          return sendErrorResponse({
            msg: "Invalid password. Please enter correct password and try again",
            response: res,
          });
        }

        const token = generateJWT({
          id: schoolAdmin.id.toString(),
          school: school.id.toString(),
          type: body.type,
        });
        return sendSuccessResponse({
          data: { token, id: schoolAdmin.id, name: schoolAdmin.name, schoolName: school.id, schoolId: school.id },
          response: res,
        });
      }

      return sendErrorResponse({ msg: "user type is invalid", response: res });
    },
  });

  /**
   * @route  POST "/api/v1/auth/app/login"
   * @desc   App user login
   */
  // fastify.route({
  //   method: "POST",
  //   url: "/auth/app/login",
  //   handler: async (req, res) => {
  //     const { code, contact, type } = await validate(
  //       yup.object({
  //         code: yup.string().required(),
  //         type: yup.string().oneOf(["teacher", "student", "evaluator", "parent"]).required(),
  //         contact: yup.string().required(),
  //       }),
  //       req.body
  //     );
  //
  //     const otp = await OTPService.gen4DigitOTP(contact);
  //
  //     const responseData = {
  //       school: "",
  //       id: "",
  //       otp: otp,
  //       contact: contact,
  //     };
  //
  //     if (type === "parent" || type === "evaluator") {
  //       if (type === "evaluator") {
  //         const user = await EvaluatorService.findEvaluatorByContact(contact);
  //         if (!user) {
  //           return sendErrorResponse({
  //             response: res,
  //             msg: "User does not exists",
  //           });
  //         }
  //
  //         await EvaluatorService.updateEvaluatorOtp({ id: user._id.toString(), otp });
  //
  //         responseData.id = user._id.toString();
  //         responseData.otp = otp;
  //       }
  //
  //       if (type === "parent") {
  //         const user = await ParentService.findParentByContact(contact);
  //         if (!user) {
  //           return sendErrorResponse({
  //             response: res,
  //             msg: "User does not exists",
  //           });
  //         }
  //
  //         await ParentService.updateParentOtp({ id: user._id.toString(), otp });
  //
  //         responseData.id = user._id.toString();
  //         responseData.otp = otp;
  //       }
  //     }
  //
  //     if (type === "student" || type === "teacher") {
  //       const school = await SchoolService.findSchoolByCode(code);
  //       if (!school) {
  //         return sendErrorResponse({
  //           response: res,
  //           msg: "no school with this code",
  //         });
  //       }
  //
  //       if (type === "student") {
  //         const user = await StudentService.getStudentBySchoolIdAndContact({
  //           contact,
  //           schoolId: school._id.toString(),
  //         });
  //         if (!user) {
  //           return sendErrorResponse({
  //             response: res,
  //             msg: "User does not exists",
  //           });
  //         }
  //
  //         await StudentService.updateStudentOtp({ id: user._id.toString(), otp });
  //
  //         responseData.id = user._id.toString();
  //         responseData.otp = otp;
  //       }
  //
  //       if (type === "teacher") {
  //         const user = await TeacherService.findTeacherBySchoolIdAndContact({
  //           contact,
  //           schoolId: school._id.toString(),
  //         });
  //         if (!user) {
  //           return sendErrorResponse({
  //             response: res,
  //             msg: "User does not exists",
  //           });
  //         }
  //
  //         await TeacherService.updateTeacherOtp({ id: user._id.toString(), otp });
  //
  //         responseData.id = user._id.toString();
  //         responseData.otp = otp;
  //       }
  //     }
  //
  //     await OTPService.sendOTP(responseData.contact, responseData.otp);
  //
  //     return sendSuccessResponse({
  //       response: res,
  //       data: responseData,
  //     });
  //   },
  // });
  //
  /**
   * @route  POST "/api/v1/auth/app/verify"
   * @desc   App user otp verify
   */
  // // fastify.route({
  //   method: "POST",
  //   url: "/auth/app/verify",
  //   handler: async (req, res) => {
  //     const body = await validate(
  //       yup.object({
  //         otp: yup.string().required(),
  //         id: yup.string().required(),
  //         type: yup.string().oneOf(["teacher", "student", "evaluator", "parent"]).required(),
  //       }),
  //       req.body
  //     );
  //
  //     if (body.type === "teacher") {
  //       const otp = await TeacherService.getTeacherOtpById(body.id);
  //
  //       if (!otp) {
  //         return sendErrorResponse({
  //           response: res,
  //           msg: "Invalid OTP. Please enter correct OTP and try again",
  //         });
  //       }
  //
  //       if (otp !== body.otp) {
  //         return sendErrorResponse({
  //           response: res,
  //           msg: "Invalid OTP. Please enter correct OTP and try again",
  //         });
  //       }
  //
  //       const user = await TeacherService.updateTeacherOtp({ id: body.id, otp: "" });
  //       const token = generateJWT({
  //         id: user?._id.toString() ?? "",
  //         school: user?.school?._id.toString() ?? "",
  //         type: body.type,
  //       });
  //
  //       return sendSuccessResponse({
  //         msg: "Login successfully",
  //         data: { user, token },
  //         response: res,
  //       });
  //     }
  //
  //     if (body.type === "student") {
  //       const otp = await StudentService.getStudentOtpById(body.id);
  //
  //       if (!otp) {
  //         return sendErrorResponse({
  //           response: res,
  //           msg: "Invalid OTP. Please enter correct OTP and try again",
  //         });
  //       }
  //
  //       if (otp !== body.otp) {
  //         return sendErrorResponse({
  //           response: res,
  //           msg: "Invalid OTP. Please enter correct OTP and try again",
  //         });
  //       }
  //
  //       const user = await StudentService.updateStudentOtp({ id: body.id, otp: "" });
  //       const token = generateJWT({
  //         id: user?._id.toString() ?? "",
  //         school: user?.school?._id.toString() ?? "",
  //         type: body.type,
  //       });
  //
  //       return sendSuccessResponse({
  //         msg: "Login successfully",
  //         data: { user, token },
  //         response: res,
  //       });
  //     }
  //
  //     if (body.type === "evaluator") {
  //       const otp = await EvaluatorService.getEvaluatorOtpById(body.id);
  //
  //       if (!otp) {
  //         return sendErrorResponse({
  //           response: res,
  //           msg: "Invalid OTP. Please enter correct OTP and try again",
  //         });
  //       }
  //
  //       if (otp !== body.otp) {
  //         return sendErrorResponse({
  //           response: res,
  //           msg: "Invalid OTP. Please enter correct OTP and try again",
  //         });
  //       }
  //
  //       const user = await EvaluatorService.updateEvaluatorOtp({ id: body.id, otp: "" });
  //       const token = generateJWT({ id: user?._id.toString() ?? "", school: "", type: body.type });
  //
  //       return sendSuccessResponse({
  //         msg: "Login successfully",
  //         data: { user, token },
  //         response: res,
  //       });
  //     }
  //
  //     if (body.type === "parent") {
  //       const otp = await ParentService.getParentOtpById(body.id);
  //
  //       if (!otp) {
  //         return sendErrorResponse({
  //           response: res,
  //           msg: "Invalid OTP. Please enter correct OTP and try again",
  //         });
  //       }
  //
  //       if (otp !== body.otp) {
  //         return sendErrorResponse({
  //           response: res,
  //           msg: "Invalid OTP. Please enter correct OTP and try again",
  //         });
  //       }
  //
  //       const user = await ParentService.updateParentOtp({ id: body.id, otp: "" });
  //       const token = generateJWT({ id: user?._id.toString() ?? "", school: "", type: body.type });
  //
  //       return sendSuccessResponse({
  //         msg: "Login successfully",
  //         data: { user, token },
  //         response: res,
  //       });
  //     }
  //   },
  // });

  /**
   * @route  POST "/api/v1/auth/app/refresh"
   * @desc   App user refresh token
   */
  // fastify.route({
  //   method: "POST",
  //   url: "/auth/app/refresh",
  //   handler: async (req, res) => {
  //     const { user_id, device_id, school_id, type } = await validate(
  //       yup.object({
  //         school_id: yup.string().required(),
  //         user_id: yup.string().required(),
  //         device_id: yup.string().required(),
  //         type: yup.string().oneOf(["teacher", "student", "evaluator", "parent"]).required(),
  //       }),
  //       req.body
  //     );
  //
  //     const device = await DeviceService.deviceModel.findOne({ user_id, device_id, deleted: false }).lean();
  //     if (!device) {
  //       return sendErrorResponse({
  //         code: 400,
  //         msg: "User device not found",
  //         response: res,
  //       });
  //     }
  //
  //     const token = generateJWT({ id: user_id, school: school_id, type: type });
  //
  //     return sendSuccessResponse({
  //       data: { token },
  //       response: res,
  //     });
  //   },
  // });

  /**
   * @route  POST "/api/v1/auth/app/studentSignupB2C"
   * @desc   B2C student signup
   */
  // fastify.route({
  //   method: "POST",
  //   url: "/auth/app/studentSignupB2C",
  //   handler: async (req, res) => {
  //     const { name, contact, email, address, school, ...restBody } = req.body as IDBStudent;
  //
  //     const found = await StudentService.studentModel
  //       .findOne({ contact, school, deleted: false })
  //       .populate("school")
  //       .populate("batch")
  //       .lean();
  //
  //     if (!found) {
  //       const student = await StudentService.addStudent({
  //         ...restBody,
  //         school: school,
  //         name: name,
  //         contact: contact,
  //         email: email,
  //         address: address,
  //       });
  //       return sendSuccessResponse({ response: res, msg: "successfully created", data: student });
  //     } else {
  //       return sendSuccessResponse({ response: res, msg: "successfully created", data: found });
  //     }
  //   },
  // });
};
