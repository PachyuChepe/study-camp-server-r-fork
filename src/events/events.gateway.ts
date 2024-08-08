import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket, Namespace } from 'socket.io';

interface UserData {
  id: string;
  spaceId: number;
  nickName: string;
  x: number;
  y: number;
  skin: number;
  face: number;
  hair: number;
  hair_color: number;
  clothes: number;
  clothes_color: number;
  layer: number;
}

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  userMap = new Map<string, UserData>();

  @SubscribeMessage('connect')
  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  @SubscribeMessage('disconnect')
  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
    const userData = this.userMap.get(client.id);
    if (userData) {
      client.leave(userData.spaceId + '_' + userData.layer);
      client.leave(userData.spaceId.toString());
      this.server.to(userData.spaceId.toString()).emit('leaveSpace', userData);
      this.userMap.delete(client.id);
    }
  }

  @SubscribeMessage('joinSpace')
  handleJoinSpace(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userData: UserData = {
      id: client.id,
      spaceId: data.spaceId,
      nickName: data.nickName,
      x: 1,
      y: 1,
      skin: data.skin,
      face: data.face,
      hair: data.hair,
      hair_color: data.hair_color,
      clothes: data.clothes,
      clothes_color: data.clothes_color,
      layer: 0,
    };

    this.userMap.set(client.id, userData);

    client.join(data.spaceId.toString());
    client.join(data.spaceId + '_' + data.layer);

    const spaceUsers = [...this.userMap.values()].filter(
      (user) => user.spaceId === data.spaceId,
    );
    this.server.to(data.spaceId.toString()).emit('joinSpace', spaceUsers);

    return {
      status: 'success',
      message: 'Joined space',
      spaceId: data.spaceId,
    };
  }

  @SubscribeMessage('joinLayer')
  handleJoinLayer(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userData = this.userMap.get(client.id);
    if (!userData) {
      return { status: 'error', message: 'User not found' };
    }
    const prevLayer = userData.layer;
    this.server.to(prevLayer.toString()).emit('leaveLayer', userData);
    client.leave(userData.spaceId + '_' + prevLayer);

    userData.layer = data.layer;
    this.userMap.set(client.id, userData);
    this.server.to(data.spaceId.toString()).emit('joinLayer', userData);

    client.join(userData.spaceId + '_' + data.layer);
    console.log(`User ${client.id} joined layer: ${data.layer}`);
  }

  @SubscribeMessage('leaveSpace')
  handleLeaveRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userData = this.userMap.get(client.id);
    if (!userData) {
      return { status: 'error', message: 'User not found' };
    }
    client.leave(userData.spaceId.toString());
    this.server.to(userData.spaceId.toString()).emit('leaveSpace', userData);
    this.server
      .to(userData.spaceId + '_' + data.layer)
      .emit('leaveLayer', userData);

    console.log(`User ${client.id} left space: ${userData.spaceId}`);
  }

  @SubscribeMessage('sendSpaceMessage')
  handleSendSpaceMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userData = this.userMap.get(client.id);
    if (!userData) {
      return { status: 'error', message: 'User not found' };
    }
    const spaceId = userData.spaceId;
    const nickName = userData.nickName;
    const message = data.message;

    this.server
      .to(spaceId.toString())
      .emit('spaceMessage', { nickName, message });
    console.log(
      `spaceId : ${spaceId} nickName : ${nickName} spaceMessage: ${message}`,
    );
  }

  @SubscribeMessage('sendLayerMessage')
  handleSendRoomMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userData = this.userMap.get(client.id);
    if (!userData) {
      return { status: 'error', message: 'User not found' };
    }
    const spaceId = userData.spaceId;
    const nickName = userData.nickName;
    const layer = userData.layer;
    const message = data.message;

    this.server
      .to(spaceId + '_' + layer)
      .emit('layerMessage', { nickName, message });
    console.log(
      `spaceId : ${spaceId} layer : ${layer} nickName : ${nickName} spaceMessage: ${message}`,
    );
  }

  @SubscribeMessage('movePlayer')
  handleMovePlayer(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userData = this.userMap.get(client.id);
    if (!userData) {
      return { status: 'error', message: 'User not found' };
    }
    const spaceId = userData.spaceId;
    userData.x = data.x;
    userData.y = data.y;
    this.userMap.set(client.id, userData);

    this.server.to(spaceId.toString()).emit('movePlayer', userData);
    console.log(`movePlayer: ${userData.x}_${userData.y}`);
  }

  @SubscribeMessage('offer')
  handleWebTRCOffer(
    @MessageBody() offer: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userData = this.userMap.get(client.id);
    const spaceId = userData.spaceId;
    const layer = userData.layer;

    this.server
      .to(spaceId.toString() + '_' + layer.toString())
      .emit('offer', offer);
    console.log(`offer`);
  }

  @SubscribeMessage('answer')
  handleWebTRCAnwser(
    @MessageBody() answer: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userData = this.userMap.get(client.id);
    const spaceId = userData.spaceId;
    const layer = userData.layer;

    this.server
      .to(spaceId.toString() + '_' + layer.toString())
      .emit('answer', answer);
    console.log(`answer`);
  }

  @SubscribeMessage('candidate')
  handleWebTRCCandidate(
    @MessageBody() candidate: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userData = this.userMap.get(client.id);
    const spaceId = userData.spaceId;
    const layer = userData.layer;

    this.server
      .to(spaceId.toString() + '_' + layer.toString())
      .emit('candidate', candidate);
    console.log(`candidate`);
  }
}
