import mongoose from "mongoose";
import TeacherEvaluationCopySchema, { type IDBCommonCopy, type TCommonCopyModel } from "./CommonCopy.js";

const { model } = mongoose;

export const EvaluationCopyModel = model<IDBCommonCopy, TCommonCopyModel>(
    "TeacherEvaluationCopy",
    TeacherEvaluationCopySchema
);
export default EvaluationCopyModel;
