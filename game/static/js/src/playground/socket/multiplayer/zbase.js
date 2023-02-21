class MultiPlayerSocket {
    constructor(playground) {
        this.playground = playground;

        this.ws = new WebSocket("wss://47.113.219.182:8000/wss/multiplayer/");

        this.start();
    }

    start() {
    }

    send_create_player_message() {
        this.ws.send(JSON.stringify({
            'message': "hello",
        }));
    }

    receive_create_player_message() {

    }
}