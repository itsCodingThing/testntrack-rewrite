/// fetches the market place copies by replace name of batch and school with their ids
exports.getAdminMarketPlaceCopiesPipeline = (is_result_declared = false) => [
    {
        $match: {
            is_result_declared: is_result_declared,
            "associate_teacher.is_evaluator": true,
            "submission_details.paper_type": "Subjective",
        },
    },
    {
        $lookup: {
            from: "paper",
            let: { paperId: "$paper" },
            as: "paper",
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ["$$paperId", "$_id"] },
                    },
                },
                {
                    $lookup: {
                        from: "batches",

                        let: { batchId: "$batch" },
                        as: "batch",
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$$batchId", "$_id"] },
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
                    $unwind: "$batch",
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                "$$ROOT",
                                {
                                    batch: "$batch.name",
                                },
                            ],
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
            ],
        },
    },
    {
        $unwind: {
            path: "$paper",
        },
    },
];
