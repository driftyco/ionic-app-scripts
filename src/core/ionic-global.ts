import { BuildContext } from '../util/interfaces';
import { getSystemData, toUnixPath } from '../util/helpers';


export function buildIonicGlobal(context: BuildContext) {
  context.ionicGlobal = context.ionicGlobal || {};

  // gather data to add to window.Ionic
  const systemData = getSystemData(context.rootDir);
  if (systemData.ionicFramework) {
    context.ionicGlobal['version'] = `'${systemData.ionicFramework}'`;
  }
  if (systemData.angularCore) {
    context.ionicGlobal['angular'] = `'${systemData.angularCore}'`;
  }
  if (systemData.ionicNative) {
    context.ionicGlobal['ionicNative'] = `'${systemData.ionicNative}'`;
  }

  let staticDir = toUnixPath(context.buildDir.replace(context.wwwDir, ''));
  staticDir += '/';

  if (staticDir.charAt(0) === '/') {
    staticDir = staticDir.substring(1);
  }

  context.ionicGlobal['staticDir'] = `'${staticDir}'`;

  // output the JS
  let o = [
    '(function(w){',
    'var i=w.Ionic=w.Ionic||{};'
  ];

  Object.keys(context.ionicGlobal).forEach(key => {
    o.push(`i.${key}=${context.ionicGlobal[key]};`);
  });

  o.push('})(window);');

  return o.join('');
}
