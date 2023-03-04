class ScoreBoard extends GameEngine {
    constructor(playground) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;

        this.state= null; // status: win or lose

        this.win_image = new Image();
        this.win_image.src = "https://cdn.acwing.com/media/article/image/2021/12/17/1_8f58341a5e-win.png";

        this.lose_image = new Image();
        this.lose_image.src = "https://cdn.acwing.com/media/article/image/2021/12/17/1_9254b5f95e-lose.png";
    }

    start() {
    }

    add_listening_events() {
        let outer = this;
        this.$canvas = this.playground.game_map.$canvas;

        this.$canvas.on('click', function() {
            outer.playground.hide();
            outer.playground.root.menu.show();
        });
    }

    win() {
        let outer = this;
        this.state = "win";

        setTimeout(function() {
            outer.add_listening_events();
        }, 1000);
    }

    lose() {
        let outer = this;
        this.state = "lose";

        setTimeout(function() {
            outer.add_listening_events();
        }, 1000);
    }

    late_update() {
        this.render();
    }

    render() {
        let len = this.playground.height / 2;
        if (this.state === "win") {
            this.ctx.drawImage(this.win_image, this.playground.width / 2 - len / 2, this.playground.height / 2 - len / 2, len, len);
        }
        else if (this.state === "lose") {
            this.ctx.drawImage(this.lose_image, this.playground.width / 2 - len / 2, this.playground.height / 2 - len / 2, len, len);
        }
    }
}
