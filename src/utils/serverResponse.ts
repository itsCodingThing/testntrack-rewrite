interface IResponse {
  code?: number;
  msg?: string;
  data?: any;
  status?: boolean;
}

export function createResponse(params: IResponse) {
  const { code = 200, msg, data = {}, status } = params;
  if (Array.isArray(data)) {
    return { statusCode: code, message: msg, data: data, status };
  }

  return { statusCode: code, message: msg, data: data, status };
}
