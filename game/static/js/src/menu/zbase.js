class GameMenu {
    constructor(root) {
        this.root = root;
        this.$menu = $(`
            <div class="game_menu">
                <div class="game_menu_filed">
                    <div class="game_menu_filed_item game_menu_filed_item_single_mode">
                        SinglePlayer
                    </div>
                    <br>
                    <div class="game_menu_filed_item game_menu_filed_item_multi_mode">
                        MultiPlayers
                    </div>
                    <br>
                    <div class="game_menu_filed_item game_menu_filed_item_settings">
                        Exit
                    </div>
                </div>
            </div>
        `);
        this.$menu.hide();
        this.root.$game_obj.append(this.$menu); // add the menu obj to the div
        // take out the html object
        this.$single_mode = this.$menu.find('.game_menu_filed_item_single_mode');
        this.$multi_mode = this.$menu.find('.game_menu_filed_item_multi_mode');
        this.$settings = this.$menu.find('.game_menu_filed_item_settings');

        this.start();
    }

    start() {
        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;
        this.$single_mode.click(function () {
            // close the menu page then open the single mode playground
            outer.hide();
            outer.root.playground.show("single mode");
        });
        this.$multi_mode.click(function () {
            outer.hide();
            outer.root.playground.show("multi mode");
        });
        this.$settings.click(function () {
            console.log("Click Settings");
            outer.root.settings.logout_from_remote();
        });
    }

    show() { // show the menu page
        this.$menu.show();
    }

    hide() { // close the menu page
        this.$menu.hide();
    }
}
