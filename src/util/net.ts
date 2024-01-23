import Logger from '../logger';

export const ping = (host: string): Promise<any> => {
  return new Promise((resolve) => {
    const socket = new WebSocket(host);

    let pings = 0;
    const latencies: number[] = [];
    let pingInterval: any;
    let timeoutInterval: any;

    const ping = () => {
      pings++;

      const start = Date.now();
      socket.send('ping');

      socket.onmessage = (event) => {
        if (event.data === 'pong') {
          const latency = Date.now() - start;
          latencies.push(latency);

          if (pings >= 3) {
            clearInterval(pingInterval);
            clearInterval(timeoutInterval);
            const median = latencies.sort((a, b) => a - b)[1];
            socket.close();
            resolve(median);
          }
        }
      };
    }

    const timeout = () => {
      Logger.warn('Socket timeout');
      clearInterval(pingInterval);
      clearInterval(timeoutInterval);
      socket.close();
      resolve(-1);
    }

    socket.onerror = (err) => {
      Logger.warn('Error opening socket');
      socket.close();
      resolve(-1);
    };

    socket.onopen = () => {
      ping();
      pingInterval = setInterval(ping, 1000);
      timeoutInterval = setInterval(timeout, 10000);
    };
  });
};
