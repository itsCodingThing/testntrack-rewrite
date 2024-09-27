import mongoose, { type PipelineStage } from "mongoose";
const { Types } = mongoose;

export function getStudentListByContactOrIds({
    parent,
    contact,
    ids,
}: {
    parent: any;
    contact: string;
    ids: string[];
}) {
    let match: PipelineStage.Match = {
        $match: {},
    };

    if (contact) {
        match = {
            $match: {
                contact: contact,
                deleted: false,
            },
        };
    }

    if (ids) {
        match = {
            $match: {
                deleted: false,
                $expr: { $in: ["$_id", ids] },
            },
        };
    }

    const pipeline: PipelineStage[] = [
        match,
        {
            $lookup: {
                from: "batches",
                let: { batchList: "$batch" },
                as: "batch",
                pipeline: [{ $match: { $expr: { $in: ["$_id", "$$batchList"] } } }],
            },
        },
        {
            $project: {
                name: 1,
                already_added: { $in: ["$_id", parent.students] },
                school: 1,
                contact: 1,
                email: 1,
                image: 1,
                batch: {
                    $map: {
                        input: "$batch",
                        as: "batch",
                        in: "$$batch.name",
                    },
                },
            },
        },
        {
            $lookup: {
                from: "schools",

                let: { schoolId: "$school" },
                as: "school",
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$$schoolId", "$_id"] },
                        },
                    },
                    {
                        $project: {
                            name: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$school",
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        "$$ROOT",
                        {
                            school: "$school.name",
                        },
                    ],
                },
            },
        },
    ];

    return pipeline;
}

export function getGroupedResultByVariantByStudentId(studentId: string) {
    const match: PipelineStage.Match = {
        $match: {
            student: new Types.ObjectId(studentId),
            // $expr: {$eq: ['$student', student]}
        },
    };

    const group: PipelineStage.Group = {
        $group: {
            _id: "$submission_details.variant_type",
            results: {
                $push: "$_id",
            },
            count: {
                $sum: 1,
            },
            obtained_marks: {
                $sum: "$submission_details.obtained_marks",
            },
            total_marks: {
                $sum: "$submission_details.total_marks",
            },
        },
    };

    const pipeline: PipelineStage[] = [
        match,
        {
            $sort: {
                created_at: -1,
            },
        },
        group,
    ];

    return pipeline;
}

export function getGroupedResultBySubjectByResultIds(resultIds: string[]) {
    const ids = resultIds.map((e) => new Types.ObjectId(e)).flat();

    const match: PipelineStage.Match = {
        $match: {
            _id: { $in: ids },
        },
    };

    const group: PipelineStage.Group = {
        $group: {
            _id: {
                $arrayElemAt: ["$submission_details.subject", 0],
            },

            results: {
                $push: "$_id",
            },
            count: {
                $sum: 1,
            },
            obtained_marks: {
                $sum: "$submission_details.obtained_marks",
            },
            total_marks: {
                $sum: "$submission_details.total_marks",
            },
            graph_data: {
                $push: {
                    total_marks: "$submission_details.total_marks",
                    obtained_marks: "$submission_details.obtained_marks",
                    paper_type: "$submission_details.paper_type",
                    date: "$submission_details.submission_time",
                    paper_id: "$paper",
                    result_id: "$_id",
                },
            },
        },
    };

    const pipeline: PipelineStage[] = [
        match,
        {
            $sort: {
                created_at: 1,
            },
        },
        group,
    ];

    return pipeline;
}

export function getStudentRankByResultIds(resultIds: string[]) {
    const ids = resultIds.map((e) => new Types.ObjectId(e)).flat();

    const pipeline: PipelineStage[] = [
        {
            $match: {
                _id: { $in: ids },
            },
        },
        {
            $group: {
                _id: "$student",
                score: {
                    $sum: {
                        $divide: ["$submission_details.obtained_marks", "$submission_details.total_marks"],
                    },
                },
            },
        },
        {
            $sort: {
                score: -1,
            },
        },
    ];

    return pipeline;
}

export function getStudentReportCardDataByResultIds(resultIds: string[]) {
    const ids = resultIds.map((e) => new Types.ObjectId(e)).flat();
    const pipeline: PipelineStage[] = [
        {
            $match: {
                _id: { $in: ids },
            },
        },
        {
            $group: {
                _id: {
                    $arrayElemAt: ["$submission_details.subject", 0],
                },
                obtained_marks: {
                    $sum: "$submission_details.obtained_marks",
                },
                total_marks: {
                    $sum: "$submission_details.total_marks",
                },
                no_of_exams: {
                    $sum: 1,
                },
                exam_dates: {
                    $push: "$submission_details.submission_time",
                },
            },
        },
        {
            $sort: {
                _id: 1,
            },
        },
    ];
    return pipeline;
}
