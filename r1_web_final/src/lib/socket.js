import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants.js';

let sosSocket = null;
let supervisorSocket = null;

export const getSosSocket = () => {
  if (!sosSocket) {
    sosSocket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      auth: { token: localStorage.getItem('accessToken') },
    });
  }
  return sosSocket;
};

export const getSupervisorSocket = (supervisorServiceUrl = 'http://localhost:8092') => {
  if (!supervisorSocket) {
    supervisorSocket = io(supervisorServiceUrl, {
      autoConnect: false,
      transports: ['websocket'],
      auth: { token: localStorage.getItem('accessToken') },
    });
  }
  return supervisorSocket;
};

export const disconnectAll = () => {
  sosSocket?.disconnect();
  supervisorSocket?.disconnect();
  sosSocket = null;
  supervisorSocket = null;
};
