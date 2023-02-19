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
                        退出
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
            outer.root.playground.show();
        });
        this.$multi_mode.click(function () {
            console.log("Click the Multi mode");
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
let GAME_OBJECTS = [];

class GameEngine {
    constructor() {
        GAME_OBJECTS.push(this);
        this.has_call_start = false; // has executed the start() or not
        this.time_delta = 0; // The time interval between the current frame and the previous frame
    }

    start() { // only execute once on the first frame
    }

    update() { // refresh the object on every frame
    }

    on_destroy() { // execute before the current object deleted
    }

    destroy() { // delete the object
        this.on_destroy();
        for (let i = 0; i < GAME_OBJECTS.length; i++)
            if (GAME_OBJECTS[i] === this) {
                GAME_OBJECTS.splice(i, 1);
                break;
            }
    }
}

let last_timestamp;
let GAME_ANIMATION = function (timestamp) {
    for (let i = 0; i < GAME_OBJECTS.length; i++) {
        let obj = GAME_OBJECTS[i];
        if (!obj.has_call_start) {
            obj.start();
            obj.has_call_start = true;
        }
        else {
            obj.time_delta = timestamp - last_timestamp;
            obj.update();
        }
    }
    last_timestamp = timestamp;
    requestAnimationFrame(GAME_ANIMATION);
}

requestAnimationFrame(GAME_ANIMATION);
class GameMap extends GameEngine {
    constructor(playground) {
        super();
        this.playground = playground;
        this.$canvas = $(`<canvas></canvas>`);
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start() {

    }

    update() {
        this.render();
    }

    render() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; // Game map background color
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}
class Particle extends GameEngine {
    constructor(x, y, radius, color, speed, vx, vy, playground, move_length) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x, this.y = y;
        this.vx = vx, this.vy = vy;
        this.radius = radius;
        this.speed = speed;
        this.friction = 0.9;
        this.color = color;
        this.move_length = move_length;
        this.eps = 1;
    }

    start() {
    }

    update() {
        if (this.move_length < this.eps || this.speed < this.eps) {
            this.destroy();
            return false;
        }
        let movd = Math.min(this.move_length, this.speed * this.time_delta / 1000);
        this.x += this.vx * movd;
        this.y += this.vy * movd;
        this.speed *= this.friction;
        this.move_length -= movd;
        this.render();
    }

    render() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
class Player extends GameEngine {
    constructor(playground, x, y, radius, color, speed, is_me) {
        super();
        this.playground = playground;
        this.x = x, this.y = y;
        this.vx = 0, this.vy = 0;
        this.damage_x = 0, this.damage_y = 0, this.damage_speed = 0;
        this.friction = 0.9;
        this.ctx = this.playground.game_map.ctx; // the reference of the canvas
        this.radius = radius;
        this.speed = speed;
        this.move_distance = 0;
        this.color = color;
        this.is_me = is_me;
        this.eps = 0.1;
        this.current_skill = null;
        this.spent_time = 0;

        if (is_me) {
            this.img = new Image();
            this.img.src = this.playground.root.settings.photo;
        }
    }

    start() {
        if (this.is_me) {
            this.add_listening_events();
        }
        else { // robot
            let tx = Math.random() * this.playground.width;
            let ty = Math.random() * this.playground.height;
            this.move_to(tx, ty);
        }
    }

    add_listening_events() {
        let outer = this;
        this.playground.game_map.$canvas.on("contextmenu", function () {
            return false;
        });
        this.playground.game_map.$canvas.mousedown(function (e) {
            const rectangle = outer.ctx.canvas.getBoundingClientRect();
            if (e.which === 3) { // right click
                outer.move_to(e.clientX - rectangle.left, e.clientY - rectangle.top);
            }
            else if (e.which == 1) { // left click
                if (outer.current_skill === "fireball") {
                    outer.shoot_fireball(e.clientX - rectangle.left, e.clientY - rectangle.top);
                }
                outer.current_skill = null;
            }
        });
        $(window).keydown(function (e) { // keycode
            if (e.which == 81) {
                outer.current_skill = "fireball";
                return false;
            }
        });
    }

    shoot_fireball(tx, ty) {
        // console.log("Shoot fireball", tx, ty);
        let x = this.x, y = this.y;
        let radius = this.playground.height * 0.01;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let color = "orange";
        let speed = this.playground.height * 0.5;
        let move_len = this.playground.height * 0.8;
        new FireBall(this.playground, this, x, y, radius, vx, vy, speed, color, move_len, this.playground.height * 0.005);
    }

    move_to(tx, ty) {
        // console.log("move to", tx, ty);
        this.move_distance = this.get_dist(this.x, this.y, tx, ty);
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.vx = Math.cos(angle), this.vy = Math.sin(angle);
    }

    // calculate the distance
    get_dist(x1, y1, x2, y2) {
        let dx = x1 - x2, dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    be_attacked(angle, damage) {
        for (let i = 0; i < 10 + Math.random() * 7; i++) {
            let x = this.x, y = this.y;
            let radius = this.radius * Math.random() * 0.1;
            let angle = Math.PI * 2 * Math.random();
            let vx = Math.cos(angle), vy = Math.sin(angle);
            let color = this.color;
            let speed = this.speed * 10;
            let move_length = this.radius * Math.random() * 6;
            new Particle(x, y, radius, color, speed, vx, vy, this.playground, move_length);
        }

        this.radius -= damage;
        if (this.radius < 10) {
            this.destroy();
            return false;
        }
        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage * 60;
        this.speed *= 0.8;
    }

    update() {
        this.spent_time += this.time_delta / 1000;
        // shoot at the player with a probability 1/300, which means enemy will shoot at player every 5 secs and 5 secs after start.
        if (!this.is_me && this.spent_time > 5 && Math.random() < 1 / 300) {
            let player = this.playground.players[Math.floor(Math.random() * this.playground.players.length)];
            let tx = player.x + player.speed * this.vx * this.time_delta / 1000 * 0.3;
            let ty = player.y + player.speed * this.vy * this.time_delta / 1000 * 0.3;
            this.shoot_fireball(tx, ty);
        }

        if (this.damage_speed > 10) {
            this.vx = this.vy = 0;
            this.move_distance = 0;
            this.x += this.damage_x * this.damage_speed * this.time_delta / 1000;
            this.y += this.damage_y * this.damage_speed * this.time_delta / 1000;
            this.damage_speed *= this.friction;
        }
        else {
            if (this.move_distance < this.eps) {
                this.move_distance = 0;
                this.vx = this.vy = 0;
                if (!this.is_me) {
                    let tx = Math.random() * this.playground.width;
                    let ty = Math.random() * this.playground.height;
                    this.move_to(tx, ty);
                }
            }
            else {
                let move_d = Math.min(this.speed * this.time_delta / 1000, this.move_distance);
                this.x += this.vx * move_d, this.y += this.vy * move_d;
                this.move_distance -= move_d;
            }
        }
        this.render();
    }

    // print the circle
    render() {
        if (this.is_me) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
            this.ctx.restore();
        }
        else {
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }

    }

    on_destroy() {
        for (let i = 0; i < this.playground.players.length; i++) {
            if (this.playground.players[i] === this) {
                this.playground.players.splice(i, 1);
            }
        }
    }
}
class FireBall extends GameEngine {
    constructor(playground, player, x, y, radius, vx, vy, speed, color, move_length, damage) {
        super();
        this.playground = playground;
        this.player = player;
        this.ctx = this.playground.game_map.ctx;
        this.x = x, this.y = y;
        this.vx = vx, this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length;
        this.damage = damage;
        this.eps = 0.1;
    }

    start() {

    }

    is_collision(player) {
        let distance = this.get_dist(this.x, this.y, player.x, player.y);
        if (distance < this.radius + player.radius) return true;
        return false;
    }

    update() {
        if (this.move_length < this.eps) {
            this.destroy();
            return false;
        }
        let move_d = Math.min(this.move_length, this.speed * this.time_delta / 1000);
        this.x += this.vx * move_d, this.y += this.vy * move_d;
        this.move_length -= move_d;

        for (let i = 0; i < this.playground.players.length; i++) {
            let player = this.playground.players[i];
            if (this.player !== player && this.is_collision(player)) {
                this.attack(player);
            }
        }

        this.render();
    }

    attack(player) {
        let angle = Math.atan2(player.y - this.y, player.x - this.x);
        player.be_attacked(angle, this.damage);
        this.destroy(); // destroy the fireball
    }

    // calculate the distance
    get_dist(x1, y1, x2, y2) {
        let dx = x1 - x2, dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    render() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
class GamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`
            <div class="game_playground">
            </div>
        `);
        this.hide();
        this.start();
    }

    get_random_color() {
        let colors = ["blue", "pink", "grey", "green", "purple", "red"];
        return colors[Math.floor(Math.random() * 6)];
    }

    start() {
    }

    update() {
    }

    show() { // show the playground page
        this.$playground.show();
        this.root.$game_obj.append(this.$playground);

        this.width = this.$playground.width();
        this.height = this.$playground.height();
        this.game_map = new GameMap(this);
        this.players = []; // maintain all the players

        // create myself
        this.players.push(new Player(this, this.width / 2, this.height / 2, this.height * 0.05, "white", this.height * 0.20, true));

        for (let i = 0; i < 5; i++) {
            this.players.push(new Player(this, this.width / 2, this.height / 2, this.height * 0.05, this.get_random_color(), this.height * 0.20, false));
        }
    }

    hide() { // hid the playground page
        this.$playground.hide();
    }
}
class Settings {
    constructor(root) {
        this.root = root;
        this.platform = "WEB";
        if (this.root.other_platform) this.platform = "OTHER";
        this.username = "";
        this.photo = "";

        this.$setttings = $(`
        <div class="game-settings">
            <div class="game-settings-login">
                <div class="game-settings-title">
                    LOG IN
                </div>
                <div class="game-settings-username">
                    <div class="game-settings-item">
                        <input type="text" placeholder="Username">
                    </div>
                </div>
                <br>
                <div class="game-settings-password">
                    <div class="game-settings-item">
                        <input type="password" placeholder="Password">
                    </div>
                </div>
                <br>
                <div class="game-settings-submit-button">
                    <button>Log In</button>
                </div>
                <div class="game-settings-option">
                    Register
                </div>
                <br><br>
                <div class="game-settings-error-message">
                </div>
            </div>
            <div class="game-settings-register">
                <div class="game-settings-title">
                    REGISTER
                </div>
                <div class="game-settings-username">
                    <div class="game-settings-item">
                        <input type="text" placeholder="Username">
                    </div>
                </div>
                <br>
                <div class="game-settings-password">
                    <div class="game-settings-item">
                        <input type="password" placeholder="New password">
                    </div>
                </div>
                <br>
                <div class="game-settings-password-confirm">
                    <div class="game-settings-item">
                        <input type="password" placeholder="Confirm password">
                    </div>
                </div>
                <br>
                <div class="game-settings-submit-button">
                    <button>Register</button>
                </div>
                <div class="game-settings-option">
                    Login
                </div>
                <br><br>
                <div class="game-settings-error-message">
                </div>
            </div>
        
            <div class="game-settings-back">
            </div>
        </div>
        `);
        this.$login = this.$setttings.find(".game-settings-login");
        this.$login_username = this.$login.find(".game-settings-username input");
        this.$login_password = this.$login.find(".game-settings-password input");
        this.$login_submit = this.$login.find(".game-settings-submit-button button");
        this.$login_error_message = this.$login.find(".game-settings-error-message");
        this.$login_register = this.$login.find(".game-settings-option");

        this.$login.hide();

        this.$register = this.$setttings.find(".game-settings-register");
        this.$register_username = this.$register.find(".game-settings-username input");
        this.$register_password = this.$register.find(".game-settings-password input");
        this.$register_confirm_password = this.$register.find(".game-settings-password-confirm input");
        this.$register_submit = this.$register.find(".game-settings-submit-button button");
        this.$register_error_message = this.$register.find(".game-settings-error-message");
        this.$register_login = this.$register.find(".game-settings-option");

        this.$register.hide();

        this.root.$game_obj.append(this.$setttings);

        this.start();
    }

    start() {
        this.getinfo();
        this.add_listening_events();
    }

    // show the login page
    login() {
        this.$register.hide();
        this.$login.show();
    }

    // show the register page
    register() {
        this.$login.hide();
        this.$register.show();
    }

    add_listening_events() {
        this.add_listening_events_login();
        this.add_listening_events_register();
    }

    add_listening_events_login() {
        let outer = this;
        this.$login_register.click(function() {
            outer.register();
        });
        this.$login_submit.click(function() {
            outer.login_on_remote();
        });
    }

    add_listening_events_register() {
        let outer = this;
        this.$register_login.click(function() {
            outer.login();
        });
        this.$register_submit.click(function(){
            outer.register_on_remote();
        });
    }

    // login on the remote server
    login_on_remote() {
        let username = this.$login_username.val();
        let password = this.$login_password.val();
        this.$login_error_message.empty(); // clear the error messages
        let outer = this;

        $.ajax ({
            url: "http://47.113.219.182:8000/settings/login/",
            type: "GET",
            data: {
                username: username,
                password: password,
            },
            success: function(resp) {
                console.log(resp);
                if (resp.result === "success") location.reload();
                else outer.$login_error_message.html(resp.result);
            }
        });
    }

    // register on the remote server
    register_on_remote() {
        let outer = this;
        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let password_confirm = this.$register_confirm_password.val();
        this.$register_error_message.empty();

        $.ajax({
            url: "http://47.113.219.182:8000/settings/register/",
            type: "GET",
            data: {
                username: username,
                password: password,
                password_confirm: password_confirm,
            },
            success: function(resp) {
                console.log(resp);
                if (resp.result === "success") location.reload();
                else outer.$register_error_message.html(resp.result);
            }
        });
    }

    // log out from the remote server
    logout_from_remote() {
        $.ajax ({
            url: "http://47.113.219.182:8000/settings/logout/",
            type: "GET",
            success: function(resp){
                console.log(resp);
                if (resp.result === "success") location.reload();
            }
        });
    }

    getinfo() {
        let outer = this;

        $.ajax({
            url: "http://47.113.219.182:8000/settings/getinfo/",
            type: "GET",
            data: {
                platform: outer.platform,
            },
            success: function (resp) {
                console.log(resp);
                if (resp.result === "success") { // success to get the info
                    outer.username = resp.username;
                    outer.photo = resp.photo;
                    outer.hide();
                    outer.root.menu.show();
                }
                else { // fail to get info, go to the login page
                    // outer.register();
                    outer.login();
                }
            }
        });
    }

    hide() {
        this.$setttings.hide();
    }

    show() {
        this.$settings.show();
    }
}
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
