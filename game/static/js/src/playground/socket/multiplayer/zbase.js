class MultiPlayerSocket {
    constructor(playground) {
        this.playground = playground;

        // establish the server and client
        // according to the routing.py, it will call consumers/multiplayer/index.py connect function
        this.ws = new WebSocket("wss://47.113.219.182:8000/wss/multiplayer/");

        this.start();
    }

    start() {
        this.receive();
    }

    // find player by uuid
    get_player(uuid) {
        let players = this.playground.players;
        for (let i = 0; i < players.length; i++) {
            let player = players[i];
            if (player.uuid === uuid)
                return uuid;
        }
        return null;
    }

    // handle the data come from server(backend)
    receive() {
        let outer = this;

        // callback funciton after receive data from server(backend)
        this.ws.onmessage = function (e) {
            // string-->json
            let data = JSON.parse(e.data);
            if (data.uuid === outer.uuid) return false;

            // handle the event not sent by myself
            let event = data.event;
            if (event === "create_player") {
                outer.receive_create_player_message(data.uuid, data.username, data.photo);
            }
            else if (event === "move_to") {
                outer.receive_move_to_message(data.uuid, data.tx, data.ty);
            }
            else if (event === "shoot_fireball") {
                outer.receive_shoot_fireball_message(uuid, data.tx, data.ty, data.ball_uuid);
            }
            else if (event === "blink") {
                outer.receive_blink_message(uuid, data.tx, data.ty);
            }
            else if (event === "attack") {
                outer.receive_attack_message(uuid, data.attackee_uuid, data.x, data.y, data.angle, data.damage, data.ball_uuid);
            }
            else if (event === "message") {
                outer.receive_message_message(uuid, data.username, data.text);
            }
        }
    }

    // send the create player messasge to backend after establishing the connection successfully
    send_create_player_message(username, photo) {
        let outer = this;
        // json-->string
        this.ws.send(JSON.stringify({
            'event': "create_player",
            'uuid': outer.uuid,
            'username': username,
            'photo': photo
        }));
    }

    receive_create_player_message(uuid, username, photo) {
        let player = new Player(this.playground, this.playground, this.playground.width / 2 / this.playgroud.scale, 0.5, 0.05, "white", 0.15, "enemy", username, photo);
        player.uuid = uuid;
        this.playground.players.push(player);
    }

    // send the player's moving to the server
    send_move_to_message(tx, ty) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "move_to",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }

    receive_move_to_message(uuid, tx, ty) {
        let player = this.get_player(uuid);
        // move the specific player in every window
        if (player) {
            player.move_to(tx, ty);
        }
    }

    send_shoot_fireball_message(ball_uuid, tx, ty) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "shoot_fireball",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
            'ball_uuid': ball_uuid,
        }));
    }

    receive_shoot_fireball_message(uuid, tx, ty, ball_uuid) {
        let player = this.get_player(uuid);
        if (player) {
            let fireball = player.shoot_fireball(tx, ty);
            fireball.uuid = ball_uuid; // all the uuid of every window for one fireball should be the same
        }
    }

    // should synchronize the information of the attackee and the hit fireball to delete
    receive_attack_message(attackee_uuid, x, y, angle, damage, ball_uuid) {
        let attacker = this.get_player(uuid);
        let attackee = this.get_player(attackee_uuid);
        if (attacker && attackee) {
            // handle the attack action
            attackee.receive_attack_message(x, y, angle, damage, ball_uuid, attacker);
        }
    }

    send_attack_message(uuid, attackee_uuid, x, y, angle, damage, ball_uuid) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "attack",
            'uuid': outer.uuid,
            'attackee_uuid': attackee_uuid,
            'x': x,
            'y': y,
            'angle': angle,
            'damage': damage,
            'ball_uuid': ball_uuid,
        }));
    }

    send_blink_message(tx, ty) {
        let outer = this;
        this.ws.send(JSON.stringfy({
            'event': "blink",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }

    receive_blink_message(uuid, tx, ty) {
        let player = this.get_player(uuid);
        if (player) {
            player.blink(tx, ty);
        }
    }

    send_message_message(text) {
        let outer = this;
        this.ws.send(JSON.stringfy({
            'event': "message",
            'uuid': outer.uuid,
            'username': username,
            'text': text,
        }));
    }

    receive_message_message(uuid, username, text) {
        this.playground.chat_field.add_message(username, text);
    }
}
