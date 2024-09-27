import type { FastifyPluginAsync } from "fastify";
import stream from "node:stream";
import { createWriteStream, readFileSync, unlink } from "node:fs";

import { getFilePathName, getFilePath } from "project/utils/utils.js";
import { sendSuccessResponse, sendErrorResponse } from "project/utils/serverResponse.js";

export const fileStorageRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * @rotue   POST "/api/v1/file/upload/:type"
   * @desc    Upload file
   */
  fastify.route({
    method: "POST",
    url: "/file/upload/:type",
    handler: async (req, res) => {
      const { type } = req.params as { type: "image" | "pdf" | "audio" };

      const data = await req.file({ limits: { fileSize: 100000000 } });

      if (!data) {
        return sendErrorResponse({ response: res, msg: "unable to upload file" });
      }

      const file = getFilePathName(type);

      if (!file) {
        return sendErrorResponse({ response: res, msg: "unable to upload file" });
      }

      await stream.promises.pipeline(data.file, createWriteStream(file.filename));
      return sendSuccessResponse({ data: file.fileId, response: res });
    },
  });

  /**
   * @rotue   GET "/api/v1/file/get/:type/:id"
   * @desc    Get file
   */
  fastify.route({
    method: "GET",
    url: "/file/get/:type/:id",
    handler: async (req, res) => {
      const { type, id } = req.params as { type: "image" | "pdf" | "audio"; id: string };

      const filePath = getFilePath({ type, id });

      if (!filePath) {
        return sendErrorResponse({ response: res, msg: "uable to get file path" });
      }

      try {
        const fileBuffer = readFileSync(filePath);

        if (type === "image") {
          return res.type("image/jpeg").send(fileBuffer);
        }

        if (type === "pdf") {
          return res.type("application/pdf").send(fileBuffer);
        }

        if (type === "audio") {
          return res.type("audio/aac").send(fileBuffer);
        }
      } catch {
        return sendErrorResponse({
          msg: "file not found",
          response: res,
        });
      }
    },
  });

  /**
   * @rotue   GET "/api/v1/file/download/:type/:id"
   * @desc    download file
   */
  fastify.route({
    method: "GET",
    url: "/file/download/:type/:id",
    handler: async (req, res) => {
      const { type, id } = req.params as { type: "image" | "pdf" | "audio"; id: string };

      const filePath = getFilePath({ type, id });

      if (!filePath) {
        return sendErrorResponse({ response: res, msg: "uable to get file path" });
      }

      try {
        const fileBuffer = readFileSync(filePath);

        if (type === "image") {
          return res.headers({ "Content-Type": "image/jpeg", "Content-Disposition": "attachment" }).send(fileBuffer);
        }

        if (type === "pdf") {
          return res
            .headers({ "Content-Type": "application/pdf", "Content-Disposition": "attachment" })
            .send(fileBuffer);
        }

        if (type === "audio") {
          return res.headers({ "Content-Type": "audio/aac", "Content-Disposition": "attachment" }).send(fileBuffer);
        }
      } catch {
        return sendErrorResponse({
          msg: "file not found",
          response: res,
        });
      }
    },
  });

  /**
   * @rotue   POST "/api/v1/file/upload/:type"
   * @desc    genrate pdf from images file
   */
  fastify.route({
    method: "POST",
    url: "/file/generatePdf",
    handler: async (req, res) => {
      // const data = await req.saveRequestFiles();

      // const doc = new PDFDocument();
      // const file = utils.getFilePathName("pdf");
      // doc.pipe(fs.createWriteStream(file.filename));

      // for await (const tempFile of data) {
      //     doc.addPage({ size: "A4" }).image(tempFile.filePath, 0, 15, { width: 600 });
      // }
      // doc.end();

      return sendSuccessResponse({ data: [], response: res });
    },
  });

  /**
   * @rotue   POST "/api/v1/file/uploadStudentCopy"
   * @desc    Upload pdf and extract images from pdf
   */
  fastify.route({
    method: "POST",
    url: "/file/uploadStudentCopy",
    handler: async (req, res) => {
      // const { type = "" } = req.params;

      // const data = await req.file({ limits: { fileSize: 100000000 } });

      // if (
      //     (type === "pdf" && data.mimetype !== "application/pdf")

      // ) {
      //     return sendErrorResponse({
      //         code: message.master_validation.status_code,
      //         msg: "please upload pdf file only",
      //         response: res,
      //     });
      // }

      // const file = utils.getFilePathName("pdf");

      // await stream.pipeline(data.file, fs.createWriteStream(file.filename));

      // const images = [];

      // const outputImages2 = await pdf2img.convert(file.filename);

      // for (let i = 0; i < outputImages2.length; i++)
      // {

      // const tempFile = utils.getFilePathName("image");

      //  fs.writeFileSync(tempFile.filename,outputImages2[i]);

      //     images.push(tempFile.fileId);
      //     }

      return sendSuccessResponse({
        data: {
          // pdf: file.fileId,
          // images:images
        },
        response: res,
      });
    },
  });

  /**
   * @rotue   POST "/api/v1/file/delete/:type/:id"
   * @desc   delete File file
   */
  fastify.route({
    method: "POST",
    url: "/file/delete/:type/:id",
    handler: async (req, res) => {
      const { type, id } = req.params as { type: "image" | "pdf" | "audio"; id: string };

      const filePath = getFilePath({ type, id });

      if (!filePath) {
        return sendErrorResponse({ response: res, msg: "uable to get file path" });
      }

      unlink(filePath, function (err) {
        if (err && err.code === "ENOENT") {
          // file doens't exist
          console.info("File doesn't exist, won't remove it.");
          sendErrorResponse({
            msg: "File doesn't exist",
            response: res,
          });
        } else if (err) {
          // other errors, e.g. maybe we don't have enough permission
          console.error("Error occurred while trying to remove file");
          sendErrorResponse({
            msg: "File Not Deleted due to some error occured",
            response: res,
          });
        } else {
          console.info(`removed`);
          return sendSuccessResponse({ data: "File Deleted", response: res });
        }
      });
    },
  });
};
