export { build, buildUpdate } from './build';
export { bundle, bundleUpdate } from './bundle';
export { clean } from './clean';
export { cleancss } from './cleancss';
export { copy, copyUpdate } from './copy';
export { compress } from './compress';
export { generator } from './generator';
export { ngc, ngcUpdate } from './ngc';
export { sass, sassUpdate } from './sass';
export { transpile, transpileUpdate } from './transpile';
export { uglifyjs } from './uglifyjs';
export { watch } from './watch';
export * from './util';


export function run(task: string) {
  try {
    require(`../dist/${task}`)[task]();
  } catch (e) {
    console.error(`Error running ionic app script "${task}": ${e}`);
    process.exit(1);
  }
}
