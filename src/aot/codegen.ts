import { CodegenOptions } from '../util/interfaces';
import { runCodegen, isAngular22 } from './codegen/codegen-ng22';
import { runCodegen as runCodegen23 } from './codegen/codegen-ng23plus';


export function doCodegen(options: CodegenOptions) {
  if (isAngular22()) {
    return runCodegen(options);
  }
  return runCodegen23(options);
}


