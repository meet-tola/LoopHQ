import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { Message } from '@/types';

let socket: Socket | null = null;

export function useSocketMessages(channelId: string) {
    const queryClient = useQueryClient();

    // Directly pull the authenticated token from your global auth store
    const accessToken = useAuthStore((state) => state.accessToken);

    useEffect(() => {
        if (!accessToken || !channelId) return;

        // Initialize socket
        if (!socket) {
            socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
                withCredentials: true,

                extraHeaders: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });
        }

        // Join specific channel
        socket.emit('channel:join', channelId, (err?: string) => {
            if (err) console.error("Socket error mapping workspace membership constraints:", err);
        });

        // Listen to Incoming Messages
        socket.on('message:new', (incomingMessage: Message) => {
            queryClient.setQueryData(['messages', channelId], (oldMessages: Message[] | undefined) => {
                if (!oldMessages) return [incomingMessage];
                if (oldMessages.some((msg) => msg.id === incomingMessage.id)) return oldMessages;

                return [...oldMessages, incomingMessage];
            });
        });

        // Clean up connections
        return () => {
            if (socket) {
                socket.emit('channel:leave', channelId);
                socket.off('message:new');
            }
        };
    }, [channelId, accessToken, queryClient]);

    return socket;
}