import { webpackLoader } from './loader-impl';

module.exports = function loader(source: string, map: any) {
  webpackLoader(source, map, this);
};
