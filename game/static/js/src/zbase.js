export class MyGame {
    constructor(id) {
        // console.log("Create Game!");
        this.id = id;
        this.$game_obj = $('#' + id);
        this.menu = new GameMenu(this);
        this.playground = new GamePlayground(this);
    }

    start() {
    }
}
