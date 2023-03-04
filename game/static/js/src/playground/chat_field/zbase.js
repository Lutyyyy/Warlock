class ChatField {
    constructor(playground) {
        this.playground = playground;

        this.$history = $(`<div class="game-chat-field-history">History</div>`);
        this.$input = $(`<input type="text" class="game-chat-field-input">`);

        this.$history.hide();
        this.$input.hide();
        this.function_id = null;

        this.playground.$playground.append(this.$history);
        this.playground.$playground.append(this.$input);

        this.start();
    }

    start() {
        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;
        this.$input.keydown(function(e) {
            if (e.which === 27) { // Esc
                outer.hide_input();
                return false;
            }
            else if (e.which === 13) { // Enter
                let username = outer.playground.root.settings.username;
                let text = outer.$input.val();
                if (text) {
                    outer.$input.val("");
                    outer.add_message(username, text);
                    outer.playground.mps.send_message_message(username, text);
                }
                return false;
            }
        });
    }

    render_message(message) {
        return $(`<div>${message}</div>`);
    }

    add_message(username, text) {
        this.show_history();
        let message = `[${username}]${text}`;
        this.$history.append(this.render_message(message));
        this.$history.scrollTop(this.$history[0].scrollHeight);
    }

    show_history() {
        let outer = this;
        this.$history.fadeIn();

        if (this.function_id) clearTimeout(this.function_id);

        this.function_id = setTimeout(function() {
            outer.$history.fadeOut();
            outer.function_id = null;
        }, 3000);
    }

    show_input() {
        this.show_history();
        this.$input.show();
        this.$input.focus();
    }

    hide_input() {
        this.$input.hide();
        this.playground.game_map.$canvas.focus();
    }
}
