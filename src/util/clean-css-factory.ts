import * as cleanCss from 'clean-css';

export function getCleanCssInstance(options: cleanCss.Options) {
  return new cleanCss(options);
}

export interface CleanCssConfig {
  // https://www.npmjs.com/package/clean-css
  sourceFileName: string;
  // sourceSourceMapName: string;
  destFileName: string;
  // options: cleanCss Options;
  options?: cleanCss.Options;
}
