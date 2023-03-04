class GamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`
            <div class="game_playground">
            </div>
        `);
        this.hide();
        this.root.$game_obj.append(this.$playground);
        this.start();
    }

    get_random_color() {
        let colors = ["blue", "pink", "grey", "green", "purple", "red"];
        return colors[Math.floor(Math.random() * 6)];
    }

    start() {
        let outer = this;
        let uuid = this.create_uuid();
        $(window).on('resize.${uuid}',function () {
            outer.resize();
        });
        // other platform
        if (this.root.other_platform) {
            this.root.other_platform.api.window.on_close(function() {
                $(window).off('resize.${uuid}');
            });
        }
    }

    create_uuid() {
        let res = "";
        for (let i = 0; i < 8; i ++) {
            let x = parseInt(Math.floor(Math.random() *10));
            res += x;
        }
        return res;
    }

    update() {
    }

    // resize the total operation interface
    resize() {
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        // zoom by 16:9 and take the smaller one
        let unit = Math.min(this.width / 16, this.height / 9);
        this.width = unit * 16;
        this.height = unit * 9;
        this.scale = this.height;

        if (this.game_map) this.game_map.resize();
    }

    show(mode) { // show the playground page
        let outer = this;
        this.$playground.show();
        // console.log(this.scale);

        this.width = this.$playground.width();
        this.height = this.$playground.height();
        this.game_map = new GameMap(this);

        this.resize();

        this.mode = mode;
        this.status = "waiting"; // waiting --> fighting --> over
        this.notice_board = new NoticeBoard(this);
        this.score_board = new ScoreBoard(this);
        this.player_count = 0; // number of people in the playground

        this.players = []; // maintain all the players

        // create myself
        this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, "white", 0.20, "me", this.root.settings.username, this.root.settings.photo));

        if (mode === "single mode") {
            // create robot
            for (let i = 0; i < 5; i++) {
                this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, this.get_random_color(), 0.20, "robot"));
            }
        }
        else if (mode === "multi mode") {
            this.chat_field = new ChatField(this);
            this.mps = new MultiPlayerSocket(this); // create a wss connection try to establish a wss connect
            this.mps.uuid = this.players[0].uuid; // my uuid

            // callback function after establish the connection successfully
            this.mps.ws.onopen = function () {
                // after connection, send the create player message to bakcend from websocket class memeber function
                outer.mps.send_create_player_message(outer.root.settings.username, outer.root.settings.photo);
            }
        }

    }

    hide() { // hide the playground page
        while (this.players && this.players.length > 0) {
            this.players[0].destroy();
        }

        if (this.game_map) {
            this.game_map.destroy();
            this.game_map = null;
        }

        if (this.notice_board) {
            this.notice_board.destroy();
            this.notice_board = null;
        }

        if (this.score_board) {
            this.score_board.destroy();
            this.score_board = null;
        }

        this.$playground.empty(); // clean up the html object

        this.$playground.hide();
    }
}
