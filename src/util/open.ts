import * as childProcess from 'child_process';


/**
 * open a file or uri using the default application for the file type.
 *
 * @return {ChildProcess} - the child process object.
 * @param {string} target - the file/uri to open.
 * @param {string} appName - (optional) the application to be used to open the
 *      file (for example, "chrome", "firefox")
 * @param {function(Error)} callback - called with null on success, or
 *      an error object that contains a property 'code' with the exit
 *      code of the process.
 */

export default function (target: string, appName: string | Function, callback?: Function) {
  var opener: string;

  if (typeof appName === 'function') {
    callback = appName;
    appName = null;
  }

  switch (process.platform) {
  case 'darwin':
    if (typeof appName === 'string') {
      opener = 'open -a "' + escape(appName) + '"';
    } else {
      opener = 'open';
    }
    break;
  case 'win32':
    // if the first parameter to start is quoted, it uses that as the title
    // so we pass a blank title so we can quote the file we are opening
    if (typeof appName === 'string') {
      opener = 'start "" "' + escape(appName) + '"';
    } else {
      opener = 'start ""';
    }
    break;
  default:
    if (typeof appName === 'string') {
      opener = escape(appName);
    } else {
      // use system installed Portlands xdg-open everywhere else
      opener = 'xdg-open';
    }
    break;
  }

  if (process.env.SUDO_USER) {
    opener = 'sudo -u ' + process.env.SUDO_USER + ' ' + opener;
  }
  return childProcess.exec(opener + ' "' + escape(target) + '"', callback);
}

function escape(s: string) {
  return s.replace(/"/g, '\\\"');
}
