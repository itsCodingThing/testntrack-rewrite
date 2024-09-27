import { v4 as uuid } from "uuid";
import FormData from "form-data";
import axios from "axios";

const instance = axios.create({
  baseURL: "",
});

export async function sendErrorMail({ subject, ...rest }: $TSFixMe, config = {}) {
  return await instance.post(
    "/api/sendmail",
    {
      ...rest,
      subject: subject,
      to: "deepanshu@testntrack.com, bhanu@testntrack.com, ranveer@testntrack.com",
    },
    config
  );
}

export async function sendMail(body: $TSFixMe, config: $TSFixMe) {
  return await instance.post("/api/sendmail", body, config);
}

export async function replaceUploadedCopy(body: $TSFixMe, config?: $TSFixMe) {
  return await instance.post("/api/upload/copy/replace", body, config);
}

export async function uploadPdf(buffer: Buffer) {
  const formData = new FormData();

  const filename = `${uuid()}-${Date.now()}.pdf`;

  formData.append("pdf", buffer, { filename: filename, contentType: "application/pdf" });

  const response = await axios.post("https://service.testntrack.com/api/upload/pdf", formData, {
    headers: formData.getHeaders(),
  });

  return response.data.data;
}
