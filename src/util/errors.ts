
export class BuildError extends Error {
  hasBeenLogged = false;
  isFatal: boolean = false;

  constructor(err?: any) {
    super();
    if (err) {
      if (err.message) {
        this.message = err.message;
      } else if (err) {
        this.message = err;
      }
      if (err.stack) {
        this.stack = err.stack;
      }
      if (err.name) {
        this.name = err.name;
      }
      if (typeof err.hasBeenLogged === 'boolean') {
        this.hasBeenLogged = err.hasBeenLogged;
      }
      if (err.hasOwnProperty('isFatal')) {
        this.isFatal = err.isFatal;
      }
    }
  }

  toJson() {
    return {
      message: this.message,
      name: this.name,
      stack: this.stack,
      hasBeenLogged: this.hasBeenLogged
    };
  }
}


/* There are special cases where strange things happen where we don't want any logging, etc.
 * For our sake, it is much easier to get off the happy path of code and just throw an exception
 * and do nothing with it
 */
export class IgnorableError extends Error {
  constructor(msg?: string) {
    super(msg);
  }
}
