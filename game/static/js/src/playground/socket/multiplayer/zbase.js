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
        for (let i = 0; i < players.length; i ++) {
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
        this.ws.onmessage = function(e) {
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
}