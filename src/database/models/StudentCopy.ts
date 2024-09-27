import mongoose from "mongoose";
import StudentCopySchema, { type IDBCommonCopy, type TCommonCopyModel } from "./CommonCopy.js";

const { model } = mongoose;

export const StudentCopyModel = model<IDBCommonCopy, TCommonCopyModel>("StudentCopy", StudentCopySchema);
export default StudentCopyModel;
