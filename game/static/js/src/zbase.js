export class MyGame {
    constructor(id, other_platform) {
        // console.log("Create Game!");
        this.id = id;
        this.other_platform = other_platform;
        this.$game_obj = $('#' + id);

        // declare by order
        this.settings = new Settings(this);
        this.menu = new GameMenu(this);
        this.playground = new GamePlayground(this);
    }

    start() {
    }
}
