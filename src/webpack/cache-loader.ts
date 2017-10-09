import { cacheLoader } from './cache-loader-impl';

module.exports = function loader(source: string, map: any) {
  cacheLoader(source, map, this);
};
