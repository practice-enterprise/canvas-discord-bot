import { Client } from 'discord.js';
import { connect, } from 'socket.io-client';
import { buildClient } from '../discord';

export class ShardService {
  socket: SocketIOClient.Socket
  client?: Client;

  constructor(public apiURI: string) {
    this.socket = connect(apiURI, {
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 1000, // do not increase time between attempts 
      autoConnect: false
    });

    this.socket.on('connect', (socket: SocketIOClient.Socket) => {
      // TODO: socket undefined at this point?
      // console.log(socket);
      // console.log(`connected to api with ID ${socket.id}`);
    });

    this.socket.on('system', async (str: string) => {
      const msg = JSON.parse(str);
      console.log(msg)
      if (msg.opcode == 0) {
        // FIX: client starts 2 shards if a reconnect request was sent before the first client was done building
        console.log(`reconnecting as shard ${msg.data.number} of ${msg.data.total}`);
        this.client?.destroy();
        this.client = await buildClient(msg.data.number, msg.data.total)
      } else if (msg.opcode == 1) {
        console.error('reveived disconnect request');
        this.client?.destroy();
        process.exit(1);
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      console.error('lost connection to api, closing');
      this.client?.destroy();
      process.exit(2);
    });

    this.socket.connect();
  }
}