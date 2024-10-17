interface Response {
  code?: number;
  msg?: string;
  data?: any;
  status?: boolean;
}

export function createResponse(params: Response) {
  const { code = 200, msg = "success", data = {}, status = true} = params;
  return { statusCode: code, message: msg, data: data, status };
}
