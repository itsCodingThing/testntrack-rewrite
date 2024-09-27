import type { FastifyPluginAsync } from "fastify";

import { OTPService } from "../../../../services/index.js";
import { validate, yup } from "../../../../utils/validation.js";
import { sendErrorResponse, sendSuccessResponse } from "../../../../utils/serverResponse.js";

export const adminOTPROutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route   GET "/api/v1/admin/otp/getOTPList"
     * @desc    list of user otps
     */
    fastify.route({
        method: "GET",
        url: "/admin/otp/getOTPList",
        handler: async (_, res) => {
            const otpList = await OTPService.getAllAvailableOTPs();

            return sendSuccessResponse({
                response: res,
                data: otpList,
            });
        },
    });

    /**
     * @route   GET "/api/v1/admin/otp/default-otps"
     * @desc    list of default otp users
     */
    fastify.route({
        method: "GET",
        url: "/admin/otp/default-otps",
        handler: async (_, res) => {
            const defaultOtps = await OTPService.defaultOtpModel
                .find()
                .select("name contact otp created_at")
                .sort("-created_at")
                .lean();

            return sendSuccessResponse({
                response: res,
                data: defaultOtps,
            });
        },
    });

    /**
     * @route   POST "/api/v1/admin/otp/default-otp"
     * @desc    add default otp user
     */
    fastify.route({
        method: "POST",
        url: "/admin/otp/default-otp",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    name: yup.string().required(),
                    otp: yup.string().length(4).required(),
                    contact: yup.string().required(),
                }),
                req.body
            );

            const sameUserOtp = await OTPService.defaultOtpModel
                .findOne({ contact: body.contact })
                .select("name contact otp")
                .lean();

            if (sameUserOtp) {
                return sendErrorResponse({
                    response: res,
                    msg: "already exists contact with default otp",
                    data: sameUserOtp,
                });
            }

            const userDefaultOtp = await OTPService.defaultOtpModel.create({
                name: body.name,
                contact: body.contact,
                otp: body.otp,
            });

            return sendSuccessResponse({
                response: res,
                msg: "successfully added default otp",
                data: userDefaultOtp.toJSON(),
            });
        },
    });

    /**
     * @route   PUT "/api/v1/admin/otp/default-otp"
     * @desc    update default otp for user
     */
    fastify.route({
        method: "PUT",
        url: "/admin/otp/default-otp",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    id: yup.string().required(),
                    otp: yup.string().length(4).required(),
                }),
                req.body
            );

            const updatedDoc = await OTPService.defaultOtpModel
                .findByIdAndUpdate(body.id, { otp: body.otp }, { returnDocument: "after" })
                .select("name contact otp")
                .lean();

            if (!updatedDoc) {
                return sendErrorResponse({
                    response: res,
                    msg: "unable to update otp",
                });
            }

            return sendSuccessResponse({
                response: res,
                msg: "successfully updated default otp",
                data: updatedDoc,
            });
        },
    });

    /**
     * @route   DELETE "/api/v1/admin/otp/default-otp?id"
     * @desc    delete default otp for user
     */
    fastify.route({
        method: "DELETE",
        url: "/admin/otp/default-otp",
        handler: async (req, res) => {
            const query = await validate(
                yup.object({
                    id: yup.string().required(),
                }),
                req.query
            );

            await OTPService.defaultOtpModel.findByIdAndDelete(query.id);

            return sendSuccessResponse({
                response: res,
                msg: "successfully deleted otp",
            });
        },
    });
};
