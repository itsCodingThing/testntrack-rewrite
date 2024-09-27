import rateLimit from "@fastify/rate-limit";
import type { FastifyPluginAsync } from "fastify";
import { type PipelineStage, Types } from "mongoose";

import { PaperModel } from "../../../../database/models/Paper.js";
import { SchoolModel } from "../../../../database/models/School.js";
import { EvaluatorModel } from "../../../../database/models/Evaluator.js";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";

export const anaylyticsRoutes: FastifyPluginAsync = async (fastify) => {
    await fastify.register(rateLimit, {
        max: 100,
        timeWindow: "1 minute",
    });

    /**
     * @route   GET "api/v1/analytics/schools"
     * @desc    use to get analytics of all schools
     */
    fastify.route({
        method: "GET",
        url: "/analytics/schools",
        handler: async (req, res) => {
            const result = await SchoolModel.aggregate([
                {
                    $project: {
                        name: 1,
                        email: 1,
                        status: 1,
                        code: 1,
                        created_at: 1,
                        no_of_batches: "$details.total_batches",
                        no_of_teachers: "$details.total_teachers",
                        no_of_papers: "$details.total_papers",
                        no_of_students: "$details.total_students",
                        year: {
                            $year: "$_id",
                        },
                        month: {
                            $month: "$created_at",
                        },
                        day: {
                            $dayOfMonth: "$created_at",
                        },
                        hour: {
                            $hour: "$created_at",
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: "$year",
                            month: "$month",
                        },
                        no_of_schools: {
                            $sum: 1,
                        },
                        no_of_active_schools: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: ["$$ROOT.status", "active"],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        no_of_inactive_schools: {
                            $sum: {
                                $cond: [
                                    {
                                        $ne: ["$$ROOT.status", "active"],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        no_of_batches: {
                            $sum: "$$ROOT.no_of_batches",
                        },
                        no_of_teachers: {
                            $sum: "$$ROOT.no_of_teachers",
                        },
                        no_of_papers: {
                            $sum: "$$ROOT.no_of_papers",
                        },
                        no_of_students: {
                            $sum: "$$ROOT.no_of_students",
                        },
                        schools: {
                            $push: "$$ROOT",
                        },
                    },
                },
                {
                    $group: {
                        _id: "$_id.year",
                        no_of_schools: {
                            $sum: "$$ROOT.no_of_schools",
                        },
                        no_of_batches: {
                            $sum: "$$ROOT.no_of_batches",
                        },
                        no_of_teachers: {
                            $sum: "$$ROOT.no_of_teachers",
                        },
                        no_of_papers: {
                            $sum: "$$ROOT.no_of_papers",
                        },
                        no_of_students: {
                            $sum: "$$ROOT.no_of_students",
                        },
                        no_of_inactive_schools: {
                            $sum: "$$ROOT.no_of_inactive_schools",
                        },
                        no_of_active_schools: {
                            $sum: "$$ROOT.no_of_active_schools",
                        },
                        schools: {
                            $push: "$$ROOT",
                        },
                    },
                },
                {
                    $project: {
                        _id: -1,
                        year: "$_id",
                        no_of_schools: 1,
                        no_of_active_schools: 1,
                        no_of_inactive_schools: 1,
                        no_of_students: 1,
                        no_of_papers: 1,
                        no_of_teachers: 1,
                        no_of_batches: 1,

                        months: {
                            $map: {
                                input: "$schools",
                                as: "school",
                                in: {
                                    month: "$$school._id.month",
                                    no_of_schools: "$$school.no_of_schools",
                                    no_of_inactive_schools: "$$school.no_of_inactive_schools",
                                    no_of_active_schools: "$$school.no_of_active_schools",
                                    no_of_students: "$$school.no_of_students",
                                    no_of_teachers: "$$school.no_of_teachers",
                                    no_of_batches: "$$school.no_of_batches",
                                    no_of_papers: "$$school.no_of_papers",
                                    schools: "$$school.schools",
                                },
                            },
                        },
                    },
                },
            ]);

            return sendSuccessResponse({
                response: res,
                data: result,
            });
        },
    });

    /**
     * @route   GET "api/v1/analytics/papers"
     * @desc    use to get analytics of all papers
     */
    fastify.route({
        method: "GET",
        url: "/analytics/papers",
        handler: async (req, res) => {
            const results = await PaperModel.aggregate([
                {
                    $project: {
                        created_at: "$created_at",
                        school: "$school",
                        students: {
                            $size: "$schedule_details.student_list",
                        },
                        year: {
                            $year: "$created_at",
                        },
                        month: {
                            $month: "$created_at",
                        },
                        day: {
                            $dayOfMonth: "$created_at",
                        },
                        type: "$type",
                    },
                },
                {
                    $group: {
                        _id: {
                            year: "$year",
                            month: "$month",
                        },
                        no_of_papers: {
                            $sum: 1,
                        },
                        no_of_objective_papers: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: ["$$ROOT.type", "Objective"],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        no_of_subjective_papers: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: ["$$ROOT.type", "Subjective"],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        papers: {
                            $push: "$$ROOT",
                        },
                    },
                },
                {
                    $group: {
                        _id: "$_id.year",
                        papers: {
                            $push: "$$ROOT",
                        },
                        no_of_objective_papers: {
                            $sum: "$$ROOT.no_of_objective_papers",
                        },
                        no_of_subjective_papers: {
                            $sum: "$$ROOT.no_of_subjective_papers",
                        },
                        no_of_papers: {
                            $sum: "$$ROOT.no_of_papers",
                        },
                    },
                },
                {
                    $project: {
                        _id: -1,
                        year: "$_id",
                        no_of_papers: 1,
                        no_of_objective_papers: 1,
                        no_of_subjective_papers: 1,

                        months: {
                            $map: {
                                input: "$papers",
                                as: "paper",
                                in: {
                                    month: "$$paper._id.month",
                                    no_of_papers: "$$paper.no_of_papers",
                                    no_of_objective_papers: "$$paper.no_of_objective_papers",
                                    no_of_subjective_papers: "$$paper.no_of_subjective_papers",
                                },
                            },
                        },
                    },
                },
            ]);

            return sendSuccessResponse({
                response: res,
                data: results,
            });
        },
    });

    /**
     * @route   GET "api/v1/analytics/evaluators"
     * @desc    use to get analytics of all evaluators
     */
    fastify.route({
        method: "GET",
        url: "/analytics/evaluators",
        handler: async (req, res) => {
            const results = await EvaluatorModel.aggregate([
                {
                    $project: {
                        created_at: "$created_at",
                        year: {
                            $year: "$created_at",
                        },
                        month: {
                            $month: "$created_at",
                        },
                        day: {
                            $dayOfMonth: "$created_at",
                        },
                        status: 1,
                    },
                },
                {
                    $group: {
                        _id: {
                            year: "$year",
                            month: "$month",
                        },
                        no_of_evaluators: {
                            $sum: 1,
                        },
                        no_of_active_evaluators: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: ["$$ROOT.status", "active"],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        no_of_inactive_evaluators: {
                            $sum: {
                                $cond: [
                                    {
                                        $ne: ["$$ROOT.status", "avtive"],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        evaluators: {
                            $push: "$$ROOT",
                        },
                    },
                },
                {
                    $group: {
                        _id: "$_id.year",
                        evaluators: {
                            $push: "$$ROOT",
                        },
                        no_of_active_evaluators: {
                            $sum: "$$ROOT.no_of_active_evaluators",
                        },
                        no_of_inactive_evaluators: {
                            $sum: "$$ROOT.no_of_inactive_evaluators",
                        },
                        no_of_evaluators: {
                            $sum: "$$ROOT.no_of_evaluators",
                        },
                    },
                },
                {
                    $project: {
                        _id: -1,
                        year: "$_id",
                        no_of_evaluators: 1,
                        no_of_inactive_evaluators: 1,
                        no_of_active_evaluators: 1,

                        months: {
                            $map: {
                                input: "$evaluators",
                                as: "evaluator",
                                in: {
                                    month: "$$evaluator._id.month",
                                    no_of_evaluators: "$$evaluator.no_of_evaluators",
                                    no_of_inactive_evaluators: "$$evaluator.no_of_inactive_evaluators",
                                    no_of_active_evaluators: "$$evaluator.no_of_active_evaluators",
                                },
                            },
                        },
                    },
                },
            ]);

            return sendSuccessResponse({
                response: res,
                data: results,
            });
        },
    });

    /**
     * @route   GET "api/v1/analytics/school/:school_id/papers"
     * @desc    use to get analytics of papers in a school by batch
     */
    fastify.route({
        method: "GET",
        url: "/analytics/school/:school_id/papers",
        handler: async (req, res) => {
            const query = req.params as { school_id: string };

            const pipeline: PipelineStage[] = [
                {
                    $match: {
                        school: new Types.ObjectId(query.school_id),
                    },
                },
                {
                    $project: {
                        created_at: "$created_at",
                        school: "$school",
                        students: {
                            $size: "$schedule_details.student_list",
                        },
                        year: {
                            $year: "$created_at",
                        },
                        month: {
                            $month: "$created_at",
                        },
                        day: {
                            $dayOfMonth: "$created_at",
                        },
                        type: "$type",
                    },
                },
                {
                    $group: {
                        _id: {
                            year: "$year",
                            month: "$month",
                        },
                        no_of_papers: {
                            $sum: 1,
                        },
                        no_of_objective_papers: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: ["$$ROOT.type", "Objective"],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        no_of_subjective_papers: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: ["$$ROOT.type", "Subjective"],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        papers: {
                            $push: "$$ROOT",
                        },
                    },
                },
                {
                    $group: {
                        _id: "$_id.year",
                        papers: {
                            $push: "$$ROOT",
                        },
                        no_of_objective_papers: {
                            $sum: "$$ROOT.no_of_objective_papers",
                        },
                        no_of_subjective_papers: {
                            $sum: "$$ROOT.no_of_subjective_papers",
                        },
                        no_of_papers: {
                            $sum: "$$ROOT.no_of_papers",
                        },
                    },
                },
                {
                    $project: {
                        _id: -1,
                        year: "$_id",
                        no_of_papers: 1,
                        no_of_objective_papers: 1,
                        no_of_subjective_papers: 1,

                        months: {
                            $map: {
                                input: "$papers",
                                as: "paper",
                                in: {
                                    month: "$$paper._id.month",
                                    no_of_papers: "$$paper.no_of_papers",
                                    no_of_objective_papers: "$$paper.no_of_objective_papers",
                                    no_of_subjective_papers: "$$paper.no_of_subjective_papers",
                                },
                            },
                        },
                    },
                },
            ];

            const result = await PaperModel.aggregate(pipeline);

            return sendSuccessResponse({
                response: res,
                data: result,
            });
        },
    });

    /**
     * @route   GET "api/v1/analytics/school/:school_id"
     * @desc   get analytics of school
     */
    fastify.route({
        method: "GET",
        url: "/analytics/school/:school_id",
        handler: async (req, res) => {
            const query = req.params as { school_id: string };

            const result = await SchoolModel.aggregate([
                {
                    $match: {
                        _id: new Types.ObjectId(query.school_id),
                    },
                },
                {
                    $project: {
                        name: 1,
                        email: 1,
                        status: 1,
                        code: 1,
                        created_at: 1,
                        no_of_batches: "$details.total_batches",
                        no_of_teachers: "$details.total_teachers",
                        no_of_papers: "$details.total_papers",
                        no_of_students: "$details.total_students",
                        year: {
                            $year: "$_id",
                        },
                        month: {
                            $month: "$created_at",
                        },
                        day: {
                            $dayOfMonth: "$created_at",
                        },
                        hour: {
                            $hour: "$created_at",
                        },
                    },
                },
            ]);

            return sendSuccessResponse({
                response: res,
                data: result[0],
            });
        },
    });
};
