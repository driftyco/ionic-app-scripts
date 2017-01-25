import * as net from 'net';

export function findClosestOpenPort(host: string, port: number): Promise<number> {
  function t(portToCheck: number): Promise<number> {
    return isPortTaken(host, portToCheck).then(isTaken => {
      if (!isTaken) {
        return portToCheck;
      }
      return t(portToCheck + 1);
    });
  }

  return t(port);
}

export function isPortTaken(host: string, port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const tester = net.createServer()
    .once('error', (err: any) => {
      if (err.code !== 'EADDRINUSE') {
        return resolve(true);
      }
      resolve(true);
    })
    .once('listening', () => {
      tester.once('close', () => {
        resolve(false);
      })
      .close();
    })
    .listen(port, host);
  });
}
