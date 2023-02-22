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
        $(window).resize(function() {
            outer.resize();
        });
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
            this.mps = new MultiPlayerSocket(this); // create a wss connection try to establish a wss connect
            this.mps.uuid = this.players[0].uuid; // my uuid

            // callback function after establish the connection successfully
            this.mps.ws.onopen = function() {
                // after connection, send the create player message to bakcend from websocket class memeber function
                outer.mps.send_create_player_message(outer.root.settings.username, outer.root.settings.photo);
            }
        }

    }

    hide() { // hid the playground page
        this.$playground.hide();
    }
}
