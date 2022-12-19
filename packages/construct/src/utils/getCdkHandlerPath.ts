type GetCdkHandlerPathProps = {
  extension?: 'js' | 'ts' | 'cjs' | 'mjs';
  fileName?: string;
};

/**
 *
 * Wait for https://github.com/swarmion/swarmion/pull/402 to be merged then import it from Swarmion
 *
 * Helper to be used in CDK config.ts files to retrieve the path of the handler.
 *
 * Use it with `__dirname` as the first argument to reference to neighboring files.
 * You can also customize the filename and extension.
 */
export const getCdkHandlerPath = (
  directoryPath: string,
  props?: GetCdkHandlerPathProps,
): string => {
  const processRunLocation = process.cwd();

  const fileName = props?.fileName ?? 'handler';
  const extension = props?.extension ?? 'ts';

  return (
    directoryPath.replace(processRunLocation + '/', '') +
    `/${fileName}.${extension}`
  );
};
