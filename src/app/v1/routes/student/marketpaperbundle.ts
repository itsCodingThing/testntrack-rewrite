import lodash from "lodash";
import moment from "moment";
import type { FastifyPluginAsync } from "fastify";

import { yup, validate } from "../../../../utils/validation.js";
import NotificationService from "../../../../services/fcm.js";
import { getActions } from "../../../../services/db/b2c/actions.js";
import { findStudentById } from "../../../../services/db/student.js";
import { findParentsByStudentId } from "../../../../services/db/parent/parent.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";
import * as MarketPaperBundleService from "../../../../services/db/b2c/marketpaperbundle.js";
import * as PurchaseBundleService from "../../../../services/db/b2c/purchasepaperbundle.js";
import { updateRejectionStatus, findEvaluationCopyById } from "../../../../services/db/evaluationCopy.js";

export const marketPaperBundleRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     *  @rotue   GET "/api/v1/student/marketpaperbundle?student={student_id}&batch={batch_id}"
     *  @desc    get all market place bundles for student by batch
     */
    fastify.route({
        method: "GET",
        url: "/student/marketpaperbundle",
        handler: async (req, res) => {
            const { batch, student } = req.query as { batch: string; student: string };

            const result = await MarketPaperBundleService.marketPaperBundleModel
                .find({
                    "batch_details._id": batch,
                    purchased_students: { $ne: student },
                    bundle_type: "paid",
                    deleted: false,
                })
                .lean();

            return sendSuccessResponse({
                data: result,
                response: res,
            });
        },
    });

    /**
     *  @rotue   POST "/api/v1/student/marketpaperbundle/popular"
     *  @desc    use to get all popular market paper bundles by student batches
     */
    fastify.route({
        method: "POST",
        url: "/student/marketpaperbundle/popular",
        handler: async (req, res) => {
            const { student_id, batch } = req.body as { student_id: string; batch: string[] };

            if (student_id && batch) {
                const bundles = await MarketPaperBundleService.getPopularMarketPaperBundle(batch, student_id);

                return sendSuccessResponse({
                    response: res,
                    data: bundles,
                });
            } else {
                return sendErrorResponse({
                    response: res,
                    msg: "check json body",
                });
            }
        },
    });

    /**
     *  @rotue   POST "/api/v1/student/marketpaperbundle/new"
     *  @desc    use to get all new paper bundles by student
     */
    fastify.route({
        method: "POST",
        url: "/student/marketpaperbundle/new",
        handler: async (req, res) => {
            const { student_id, batch } = req.body as { student_id: string; batch: string[] };

            if (student_id && batch) {
                const bundles = await MarketPaperBundleService.getNewMarketPaperBundle(batch, student_id);

                return sendSuccessResponse({
                    response: res,
                    data: bundles,
                });
            } else {
                return sendErrorResponse({
                    response: res,
                    msg: "check json body",
                });
            }
        },
    });

    /**
     *  @rotue   POST "/api/v1/student/marketpaperbundle/demo"
     *  @desc    use to get all demo paper bundles by student
     */
    fastify.route({
        method: "POST",
        url: "/student/marketpaperbundle/demo",
        handler: async (req, res) => {
            const { student_id, batch } = req.body as { student_id: string; batch: string[] };

            if (student_id && batch) {
                const bundles = await MarketPaperBundleService.getDemoMarketPaperBundle(batch, student_id);

                return sendSuccessResponse({
                    response: res,
                    data: bundles,
                });
            } else {
                return sendErrorResponse({
                    response: res,
                    msg: "check json body",
                });
            }
        },
    });

    /**
     * @route POST "/api/v1/student/marketpaperbundle/singleCategory"
     * @desc use to get bundles that having single category type papers
     */
    fastify.route({
        method: "POST",
        url: "/student/marketpaperbundle/singleCategory",
        handler: async (req, res) => {
            const { student_id, batch } = req.body as { student_id: string; batch: string[] };

            if (student_id && batch) {
                const bundles = await MarketPaperBundleService.getSingleBundleDetailsBundles(batch, student_id);

                return sendSuccessResponse({
                    response: res,
                    data: bundles,
                });
            } else {
                return sendErrorResponse({
                    response: res,
                    msg: "check json body",
                });
            }
        },
    });

    /**
     *  @rotue   POST "/api/v1/student/marketpaperbundle/purchase"
     *  @desc    use to purchase market place bundle by student
     */
    fastify.route({
        method: "POST",
        url: "/student/marketpaperbundle/purchase",
        handler: async (req, res) => {
            const { bundle_id, student_id, purchased_entity } = await validate(
                yup.object({
                    bundle_id: yup.string().required(),
                    student_id: yup.string().required(),
                    purchased_entity: yup
                        .array()
                        .of(yup.string())
                        .default(() => []),
                }),
                req.body
            );

            const studentData = await findStudentById(student_id);
            const marketBundle = await MarketPaperBundleService.findMarketPaperBundleById(bundle_id);

            if (!studentData || !marketBundle) {
                return sendErrorResponse({
                    msg: "User does not exists",
                    response: res,
                });
            }

            // check bundle already purchased
            const isAlreadyPurchased = marketBundle.purchased_students.includes(student_id);

            if (isAlreadyPurchased) {
                if (marketBundle.bundle_type === "free") {
                    return sendErrorResponse({
                        msg: "Bundle is already purchased by student",
                        response: res,
                    });
                }

                if (marketBundle.bundle_type === "paid") {
                    if (purchased_entity.length === 0) {
                        return sendErrorResponse({
                            msg: "Bundle is already purchased by student",
                            response: res,
                        });
                    } else {
                        await PurchaseBundleService.addEntityFromMarketBundle(
                            {
                                bundleId: marketBundle._id.toString(),
                                studentId: studentData._id.toString(),
                                entities: purchased_entity.filter(Boolean),
                            },
                            lodash.omit(marketBundle, ["_id"])
                        );
                    }
                }
            } else {
                if (marketBundle.bundle_type === "free") {
                    const freeBundle = {
                        ...lodash.omit(marketBundle, ["_id"]),
                        market_bundle_id: marketBundle._id,
                        student_details: {
                            _id: studentData._id,
                            name: studentData.name,
                            image: studentData.image,
                            email: studentData.email,
                        },
                        expiry_date: moment().add(90, "days"),
                    };

                    await PurchaseBundleService.createPurchasedPaperBundle(freeBundle);
                }

                if (marketBundle.bundle_type === "paid") {
                    if (purchased_entity.length === 0) {
                        // add only free entity to purchase bundle
                        const paidBundleWithFreeEntity = {
                            ...lodash.omit(marketBundle, ["_id"]),
                            market_bundle_id: marketBundle._id,
                            student_details: {
                                _id: studentData._id,
                                name: studentData.name,
                                image: studentData.image,
                                email: studentData.email,
                            },
                            entity_details: marketBundle.entity_details.filter((entity: $TSFixMe) =>
                                marketBundle.free_entity.includes(entity.type)
                            ),
                            expiry_date: moment().add(90, "days"),
                        };

                        await PurchaseBundleService.createPurchasedPaperBundle(paidBundleWithFreeEntity);
                    } else {
                        // add free entity and paid entity to purchase bundle
                        const paidBundleWithFreeAndPaidEntity = {
                            ...lodash.omit(marketBundle, ["_id"]),
                            market_bundle_id: marketBundle._id,
                            student_details: {
                                _id: studentData._id,
                                name: studentData.name,
                                image: studentData.image,
                                email: studentData.email,
                            },
                            purchased_entity: purchased_entity,
                            entity_details: [
                                // free entities
                                ...marketBundle.entity_details.filter((entity: $TSFixMe) =>
                                    marketBundle.free_entity.includes(entity.type)
                                ),
                                // purchased entities
                                ...marketBundle.entity_details.filter((entity: $TSFixMe) =>
                                    purchased_entity.includes(entity.type)
                                ),
                            ],
                            expiry_date: moment().add(90, "days"),
                        };

                        await PurchaseBundleService.createPurchasedPaperBundle(paidBundleWithFreeAndPaidEntity);
                    }
                }

                await MarketPaperBundleService.addStudentToBundle(student_id, bundle_id);
            }

            const purchasedBundle = await PurchaseBundleService.findPurchasedBundleByStudentIdAndBundleId({
                studentId: student_id,
                marketBundleId: bundle_id,
            });

            // sending purchase notification to the parent that student have purchases the bundle
            const parentList = await findParentsByStudentId(student_id);
            if (parentList.length > 0) {
                await Promise.allSettled(
                    parentList.map((parent) =>
                        NotificationService.sendNotification({
                            user_id: parent._id.toString(),
                            message: `You child has purchased a test series of Rs ${purchasedBundle?.total_price} from TestnPrep.`,
                        })
                    )
                );
            }

            return sendSuccessResponse({
                data: purchasedBundle,
                response: res,
            });
        },
    });

    /**
     *  @rotue   POST "/api/v1/student/marketpaperbundle/details"
     *  @desc    get bundle details for bundle id
     */
    fastify.route({
        method: "POST",
        url: "/student/marketpaperbundle/details",
        handler: async (req, res) => {
            const { bundle_ids } = req.body as { bundle_ids: string[] };

            return sendSuccessResponse({
                response: res,
                data: await MarketPaperBundleService.getBundlesByIds(bundle_ids),
            });
        },
    });

    /**
     *  @rotue   POST "/api/v1/student/purchasedpaperbundle/details"
     *  @desc    get bundle details for bundle id
     */
    fastify.route({
        method: "POST",
        url: "/student/purchasedpaperbundle/details",
        handler: async (req, res) => {
            const { bundle_ids } = req.body as { bundle_ids: string[] };

            return sendSuccessResponse({
                response: res,
                data: await PurchaseBundleService.getPurchasedPaperBundleByIds(bundle_ids),
            });
        },
    });

    /**
     *  @rotue   GET "/api/v1/student/purchasedpaperbundle?student"
     *  @desc    use to purchase market place bundle by student
     */
    fastify.route({
        method: "GET",
        url: "/student/purchasedpaperbundle",
        handler: async (req, res) => {
            const { student } = req.query as { student: string };
            const bundles = await PurchaseBundleService.getPurchasedPaperBundleByStudent(student);

            return sendSuccessResponse({
                response: res,
                data: bundles,
            });
        },
    });

    /**
     *  @rotue   POST "/api/v1/student/purchasedpaperbundle/paper/schedule"
     *  @desc    use to schedule paper in bundle for student
     */
    fastify.route({
        method: "POST",
        url: "/student/purchasedpaperbundle/paper/schedule",
        handler: async (req, res) => {
            const { bundle_id, schedule_time, student_id, paper_id } = req.body as {
                bundle_id: string;
                student_id: string;
                paper_id: string;
                schedule_time: string;
            };

            // getting bundle by id
            const bundle = await PurchaseBundleService.findPurchasedBundleById(bundle_id);
            if (!bundle) {
                return sendErrorResponse({ response: res, msg: "unable to find bundle" });
            }

            const paperIndex = bundle.paper_list.findIndex((paper) => paper._id.toString() === paper_id);
            const paper = bundle.paper_list[paperIndex];

            if (!paper) {
                return sendErrorResponse({ response: res, msg: "unable to find paper in bundle" });
            }

            if (!["unlocked", "scheduled", "missed"].includes(paper.status)) {
                return sendErrorResponse({
                    response: res,
                    msg: "Paper not unlocked yet",
                });
            }

            // shifting paper start time to schedule time
            const diff = moment(paper.schedule_details.end_time).diff(moment(paper.schedule_details.start_time), "s");
            const endTime = moment(schedule_time).add(diff, "s");

            paper.status = "scheduled";
            paper.schedule_details.end_time = endTime.toDate();
            paper.schedule_details.start_time = new Date(schedule_time);

            bundle.paper_list[paperIndex] = paper;

            // updating new bundle on the database according to the server
            await PurchaseBundleService.purchasedPaperBundleModel.findByIdAndUpdate(bundle_id, bundle);

            // add schedule notification for the student that new paper is scheduled at a time
            await NotificationService.sendNotification({
                user_id: student_id,
                message: "New paper is scheduled. don't forget to attempt paper on time.",
                url: NotificationService.redirect.tnp.paperListScreen({ bundleId: bundle_id }),
            });

            return sendSuccessResponse({
                response: res,
                data: bundle,
            });
        },
    });

    /**
     *  @rotue   POST "/api/v1/student/purchasedpaperbundle/paper/reuploadEvaluationCopy"
     *  @desc    Reupload evaluation copy
     */
    fastify.route({
        method: "POST",
        url: "/student/purchasedpaperbundle/paper/reuploadEvaluationCopy",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    bundle_id: yup.string().required(),
                    paper_id: yup.string().required(),
                    copy_id: yup.string().required(),
                    new_copy: yup.string().required(),
                }),
                req.body
            );

            const copy = await findEvaluationCopyById(body.copy_id);

            if (!copy) {
                return sendErrorResponse({ response: res, msg: "unable to find evaluation copy" });
            }

            await PurchaseBundleService.updateBundlePaperStatus({
                bundleId: body.bundle_id,
                paperId: body.paper_id,
                status: "re-uploaded",
            });

            await updateRejectionStatus({
                status: "re-uploaded",
                copyId: body.copy_id,
                newCopyUrl: body.new_copy,
            });

            await NotificationService.sendNotification({
                user_id: copy.associate_teacher?.teacher_id?.toString() ?? "",
                message: "Evaluation copy is reuploaded.",
            });

            return sendSuccessResponse({ response: res, msg: "copy re-uploaded successfully" });
        },
    });

    /**
     *  @rotue   POST "/api/v1/student/purchasedpaperbundle/paper/unlock"
     *  @desc    unlock new paper
     */
    fastify.route({
        method: "POST",
        url: "/student/purchasedpaperbundle/paper/unlock",
        handler: async (req, res) => {
            const { bundle_id, paper_id } = req.body as { bundle_id: string; paper_id: string };

            await PurchaseBundleService.unlockNewPaperInBundle(bundle_id, paper_id);
            return sendSuccessResponse({ response: res, msg: "new paper unlocked successfully" });
        },
    });

    /**
     *  @rotue   POST "/api/v1/student/purchasedpaperbundle/paper/missed"
     *  @desc    update paper for missed
     */
    fastify.route({
        method: "POST",
        url: "/student/purchasedpaperbundle/paper/missed",
        handler: async (req, res) => {
            const { message, student_id, bundle_id, paper_id } = req.body as $TSFixMe;

            await PurchaseBundleService.updateBundlePaperStatus({
                bundleId: bundle_id,
                paperId: paper_id,
                status: "missed",
            });

            const parentList = await findParentsByStudentId(student_id);

            if (parentList.length > 0) {
                await Promise.allSettled(
                    parentList.map((parent: $TSFixMe) =>
                        NotificationService.sendNotification({
                            user_id: parent._id,
                            message: message,
                        })
                    )
                );
            }

            return sendSuccessResponse({ response: res, msg: "bundle update successfully" });
        },
    });

    /**
     *  @rotue   POST "/api/v1/student/actions/all/:type"
     *  @desc    use to get banners and nav_actions for students
     */
    fastify.route({
        method: "GET",
        url: "/student/actions/all/:type",
        handler: async (req, res) => {
            const { type } = req.params as $TSFixMe;

            const data = await getActions(type);

            return sendSuccessResponse({
                response: res,
                data: data,
            });
        },
    });
};
