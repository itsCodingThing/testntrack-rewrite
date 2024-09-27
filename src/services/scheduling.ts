import logger from "../utils/logger.js";
import { agenda } from "../utils/agenda.js";
import { removeUncheckedCopies } from "./db/evaluator.js";
import { refreshBundleByPaperId } from "./db/marketplacebundle.js";

const jobNames = {
    REMOVE_UNCHECKED_COPIES: "REMOVE_UNCHECKED_COPIES",
    REFRESH_BUNDLE_BY_PAPERID: "REFRESH_BUNDLE_BY_PAPERID",
} as const;

agenda.define(jobNames.REMOVE_UNCHECKED_COPIES, async (job) => {
    logger.info("REMOVE_UNCHECKED_COPIES >>>>>>>>>>>>>");
    const data = job.attrs.data;
    await removeUncheckedCopies(data);
});

agenda.define<{ paperId: string }>(jobNames.REFRESH_BUNDLE_BY_PAPERID, async (job) => {
    logger.info("REFRESH_BUNDLE_BY_PAPERID >>>>>>>>>>>>>");
    const data = job.attrs.data;
    await refreshBundleByPaperId(data.paperId);
});

export function scheduleRefreshBundleByPaperId(paperId: string) {
    agenda.now(jobNames.REFRESH_BUNDLE_BY_PAPERID, { paperId });
}

export function scheduleRemoveUncheckedCopies(copies = [], evaluatorId = "", scheduleTime: Date) {
    agenda.schedule("24 hours", jobNames.REMOVE_UNCHECKED_COPIES, {
        copies,
        evaluatorId,
        scheduleTime: scheduleTime.toISOString(),
    });
}
