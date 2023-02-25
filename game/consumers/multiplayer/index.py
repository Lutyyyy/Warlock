from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings
from django.core.cache import cache

class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        print('disconnect')
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def create_player(self, data):
        self.room_name = None

        # enumerate all the 1000 rooms
        for i in range(1000):
            name = "room-%d" % (i)
            # find the room we can add to
            if not cache.has_key(name) or len(cache.get(name)) < settings.ROOM_CAPACITY:
                self.room_name = name
                break

        # have no more rooms for this player, do not accept to establish this connection
        if not self.room_name:
            return

        # create a new room as we can
        if not cache.has_key(self.room_name):
            cache.set(self.room_name, [], 3600)  # every room is valid for 1 hour

        # send the create message to client(frontend)
        for player in cache.get(self.room_name):
            await self.send(text_data=json.dumps({
                'events': "create_player",
                'uuid': player['uuid'],
                'username': player['username'],
                'photo': player['photo']
                }))

        await self.channel_layer.group_add(self.room_name, self.channel_name)

        players = cache.get(self.room_name)
        # add to the room
        players.append({
            'uuid': data['uuid'],
            'username': data['username'],
            'photo': data['photo']
            })
        # after the last player is added to the room, the room will last for 1 hour
        cache.set(self.room_name, players, 3600)

        # send the message to all the players in one same group
        await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': "group_send_events",
                    'event': "create_player",
                    'uuid': data['uuid'],
                    'username': data['username'],
                    'photo': data['photo'],
                }
        )


    # send to everyone in the group for the specific player's moving action
    async def move_to(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_events",
                'event': "move_to",
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty']
            }
        )


    # send to everyone in the group for the specific player's shoot_ball action
    async def shoot_fireball(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_events",
                'event': "shoot_fireball",
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
                'ball_uuid': data['ball_uuid']
            }
        )


    async def blink(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_events",
                'event': "blink",
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
            }
        )



    async def attack(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_events",
                'event': "attack",
                'uuid': data['uuid'],
                'attackee_uuid': data['attackee_uuid'],
                'x': data['x'],
                'y': data['y'],
                'angle': data['angle'],
                'damage': data['damage'],
                'ball_uuid': data['ball_uuid'],
            }
        )


    # receive the data from the group member
    # function name should same as the type name
    async def group_send_events(self, data):
        # object-->string
        await self.send(text_data=json.dumps(data))


    # receive the data from client and call the server function
    async def receive(self, text_data):
        data = json.loads(text_data)
        event = data['event']
        if event == "create_player":
            await self.create_player(data)
        elif event == "move_to":
            await self.move_to(data)
        elif event == "shoot_fireball":
            await self.shoot_fireball(data)
        elif event == "attack":
            await self.attack(data)
        elif event == "blink":
            await self.blink(data)
