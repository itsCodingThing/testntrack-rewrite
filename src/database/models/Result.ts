import mongoose from "mongoose";
import ResultSchema, { type IDBCommonCopy, type TCommonCopyModel } from "./CommonCopy.js";

const { model } = mongoose;

export const ResultCopyModel = model<IDBCommonCopy, TCommonCopyModel>("Result", ResultSchema);
export default ResultCopyModel;
