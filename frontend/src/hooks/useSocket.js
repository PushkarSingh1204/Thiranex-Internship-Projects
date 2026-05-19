import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useSocket(onTaskEvent, onConnect) {
  const socketRef = useRef(null);
  const callbackRef = useRef(onTaskEvent);
  const connectRef = useRef(onConnect);
  callbackRef.current = onTaskEvent;
  connectRef.current = onConnect;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => connectRef.current?.(true));
    socket.on('disconnect', () => connectRef.current?.(false));

    socket.on('task:created', (task) => callbackRef.current?.('created', task));
    socket.on('task:updated', (task) => callbackRef.current?.('updated', task));
    socket.on('task:deleted', (payload) => callbackRef.current?.('deleted', payload));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef;
}
