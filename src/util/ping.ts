export const ping = (host: string): Promise<number> => {
  return new Promise((resolve, reject) => {
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
      console.error('Socket timeout');
      clearInterval(pingInterval);
      clearInterval(timeoutInterval);
      socket.close();
      reject(-1);
    }

    socket.onerror = (err) => {
      console.error('Error opening socket: ', err);
      socket.close();
      reject(-1);
    };

    socket.onopen = () => {
      ping();
      pingInterval = setInterval(ping, 1000);
      timeoutInterval = setInterval(timeout, 10000);
    };
  });
};
