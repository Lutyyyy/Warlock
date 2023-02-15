class GamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`
            <div>
                PlayGround!!
            </div>
        `);
        this.hide();
        this.root.$game_obj.append(this.$playground);

        this.start();
    }

    start() {

    }

    update() {

    }

    show() { // show the playground page
        this.$playground.show();
    }

    hide() { // hid the playground page
        this.$playground.hide();
    }
}
