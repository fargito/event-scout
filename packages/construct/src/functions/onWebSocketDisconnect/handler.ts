export const main = async (event: unknown): Promise<unknown> => {
  await Promise.resolve();
  console.log(event);

  return { statusCode: 200, body: 'Disconnected' };
};
