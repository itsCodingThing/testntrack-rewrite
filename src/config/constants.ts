export default {
    issue_types: {
        A: {
            PAPER_ATTEMPT: "not able to attempt exam after purchase",
            COPY_REJECTED: "copy was rejected by evaluator",
            RESULT_DECLARED: "result not declared yet",
            PAPER_SCHEDULE: "not able to schedule paper",
            COPY_SUBMIT: "not able to submit copy",
            OTHER: "other",
        },
        B: {
            BUNDLE_PURCHASE: "purchasing test series",
            BUNDLE_SHOW: "test series not displayed after purchase",
        },
        C: {
            APP_WORK: "app not working",
            PROFILE_UPDATE: "profile issue",
        },
    },
    user: {
        type: {
            teacher: "teacher",
            student: "student",
            admin: "admin",
            school_admin: "school_admin",
            evaluator: "evaluator",
            parent: "parent",
        },
    },
    paper: {
        get: {
            upcoming: "upcoming",
            current: "current",
            previous: "previous",
        },
        type: {
            subjective: "subjective",
            objective: "objective",
        },
        question: {
            type: {
                pdf: "pdf",
                individual: "individual",
            },
        },
        schedule: {
            type: {
                online: "online",
                offline: "offline",
                hybrid: "hybrid",
            },
        },
        objective_no_copy:
            "https://tnt-public-storage.s3.ap-south-1.amazonaws.com/pdf/1657178368052_d263e6cc-64d5-45f1-bfd4-bc86124e62a7",
    },
    listResultDeclareType: ["Auto", "Manual"],
    listPaperType: ["Subjective", "Objective"],
    listSchedulingType: ["Online", "Offline", "Hybrid"],
    listVariantType: [
        "EXAM",
        "TERM 1",
        "TERM 2",
        "TERM 3",
        "PRE BOARDS",
        "HALF_YEARLY",
        "YEARLY",
        "CLASS TEST",
        "DPP",
        "WORKSHEET",
        "PRACTICE",
        "HOMEWORK",
    ],
    listQuestionAnalysis: ["BASIC UNDERSTANDING", "CONCEPTUAL CLARITY", "CRITICAL ANALYSIS", "PRACTICAL APPROACH"],
    listSwotAnalysis: [
        "ATTENTION IN CLASS",
        "STUDY AT HOME",
        "MUGGING POWER",
        "CALCULATION",
        "SILLY MISTAKES",
        "PRACTICE ISSUE",
        "GRASPING POWER",
    ],
};
