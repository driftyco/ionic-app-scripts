import { transpileLoader } from './transpile-loader-impl';

module.exports = function loader(source: string, map: any) {
  transpileLoader(source, map, this);
};
