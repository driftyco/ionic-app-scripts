import { fileNameLoader } from './file-name-ts-loader-impl';

module.exports = function loader(source: string, map: any) {
  fileNameLoader(source, map, this);
};
