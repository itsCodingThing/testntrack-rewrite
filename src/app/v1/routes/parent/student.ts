import type { FastifyPluginAsync } from "fastify";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";
import { OTPService, StudentService, PaperService, ParentService, ResultService } from "../../../../services/index.js";

export const studentRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   POST "/parent/student/sendOtp"
     * @desc    Send OTP for student
     */
    fastify.route({
        method: "POST",
        url: "/parent/student/sendOtp",
        handler: async (req, res) => {
            const { contact } = req.body as { contact: string };

            if (!contact) {
                return sendErrorResponse({ code: 400, msg: "Invalid mobile number", response: res });
            }

            const otp = await OTPService.gen4DigitOTP();
            await OTPService.sendOTP(contact, otp);

            return sendSuccessResponse({
                msg: "OTP succcessfully send",
                data: {
                    otp: otp,
                },
                response: res,
            });
        },
    });

    /**
     * @rotue   GET "/parent/student/list?contact"
     * @desc    get students from mobile number
     */
    fastify.route({
        method: "GET",
        url: "/parent/student/list",
        handler: async (req, res) => {
            const { contact } = req.query as $TSFixMe;
            const parentId = req.payload.id;

            const result = await ParentService.getStudentToAddByContact(parentId, contact);
            return sendSuccessResponse({ data: result, response: res });
        },
    });

    /**
     * @rotue   GET "/parent/students"
     * @desc    get students for parents
     */
    fastify.route({
        method: "GET",
        url: "/parent/students",
        handler: async (req, res) => {
            const parentId = req.payload.id;
            const result = await ParentService.getStudentListByParent(parentId);

            return sendSuccessResponse({ data: result, response: res });
        },
    });

    /**
     * @rotue   GET "/parent/student-details"
     * @desc    get students for parents
     */
    fastify.route({
        method: "GET",
        url: "/parent/student-details",
        handler: async (req, res) => {
            const { student } = req.query as { student: string };
            const detail = await StudentService.findStudentById(student);

            return sendSuccessResponse({ data: detail, response: res });
        },
    });

    /**
     * @rotue   GET "/parent/performance/variant-list?student"
     * @desc    get variant list for student performance
     */
    fastify.route({
        method: "GET",
        url: "/parent/performance/variant-list",
        handler: async (req, res) => {
            const { student } = req.query as { student: string };
            const result = await ParentService.getPerformanceVariantList(student);

            return sendSuccessResponse({ data: result, response: res });
        },
    });

    /**
     * @rotue   POST "/parent/performance/subject-list"
     * @desc    get variant list for student performance
     */
    fastify.route({
        method: "POST",
        url: "/parent/performance/subject-list",
        handler: async (req, res) => {
            const { ids, student } = req.body as { student: string; ids: string[] };
            const result = await ParentService.getPerformanceSubjectList(student, ids);

            return sendSuccessResponse({ data: result, response: res });
        },
    });

    /**
     * @rotue   POST "/parent/report-card"
     * @desc    get report card list for student
     */
    fastify.route({
        method: "POST",
        url: "/parent/report-card-detail",
        handler: async (req, res) => {
            const { student, ids } = req.body as { student: string; ids: string[] };
            const result = await ParentService.getReportCardDetails(student, ids);

            return sendSuccessResponse({ data: result, response: res });
        },
    });

    /**
     * @rotue   GET "/parent/report-card-list?=student"
     * @desc    get report card list for student
     */
    fastify.route({
        method: "GET",
        url: "/parent/report-card-list",
        handler: async (req, res) => {
            const { student } = req.query as { student: string };
            const result = await ParentService.getReportCardListByStudent(student);

            return sendSuccessResponse({ data: result, response: res });
        },
    });

    /**
     * @rotue   POST "/parent/performance/result-details"
     * @desc    get result details list for student
     */
    fastify.route({
        method: "POST",
        url: "/parent/performance/result-details",
        handler: async (req, res) => {
            const { ids: resultIds } = req.body as { ids: string[] };
            const results = await ResultService.resultModel
                .find({ _id: { $in: resultIds } })
                .populate("student")
                .populate("paper")
                .lean();

            return sendSuccessResponse({ data: results, response: res });
        },
    });

    /**
     * @rotue   GET "/parent/exam/:type/:student"
     * @desc    get student exam list by type {active,upcoming,past} details list for student
     */
    fastify.route({
        method: "GET",
        url: "/parent/exam/:type/:student",
        handler: async (req, res) => {
            const { type, student } = req.params as { type: string; student: string };
            const results = await PaperService.getPaperListByStudent(student, type);

            return sendSuccessResponse({ data: results, response: res });
        },
    });

    /**
     * @rotue   GET "/parent/result/recent-result-topper-list/:student"
     * @desc    get student exam list by type {active,upcoming,past} details list for student
     */
    fastify.route({
        method: "GET",
        url: "/parent/result/recent-result-topper-list/:student",
        handler: async (req, res) => {
            const { student } = req.params as { student: string };
            const result = await ResultService.getResultsRankByStudent(student);

            return sendSuccessResponse({ data: result, response: res });
        },
    });
};
