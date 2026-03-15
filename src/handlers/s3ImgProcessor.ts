export const handler = async (event: any) => {
  console.log(JSON.stringify(event, null, 2));
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  console.log(`File uploaded: ${key}`);
  console.log(`From bucket: ${bucket}`);

  return {
    statusCode: 200,
  };
};
