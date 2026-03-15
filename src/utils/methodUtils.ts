export const responseData = (
  statusCode = 500,
  msg = "Internal Server Error",
  data?: any,
) => {
  const bodyOpn: any = {
    message: msg,
  };
  if (data != undefined) {
    bodyOpn.data = data;
  }
  return {
    statusCode, // statusCode:400
    body: JSON.stringify(bodyOpn),
  };
};
