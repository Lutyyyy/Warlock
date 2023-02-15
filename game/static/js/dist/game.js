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
                        Settings
                    </div>
                </div>
            </div>
        `);
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

requestAnimationFrame(GAME_ANIMATION);class GameMap extends GameEngine {
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
}class Particle extends GameEngine {
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
}class Player extends GameEngine {
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
    }

    start() {
        if (this.is_me) {
            this.add_listening_events();
        }
        else {
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
            if (e.which === 3) { // right click
                outer.move_to(e.clientX, e.clientY);
            }
            else if (e.which == 1) { // left click
                if (outer.current_skill === "fireball") {
                    outer.shoot_fireball(e.clientX, e.clientY);
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
        if (Math.random() < 1 / 180) { // shoot at the player with a probability 1/180, which means enemy will shoot at player every 3 secs.
            let player = this.playground.players[0];
            this.shoot_fireball(player.x, player.y);
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
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}class FireBall extends GameEngine {
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
}class GamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`
            <div class="game_playground">
            </div>
        `);
        // this.hide();
        this.root.$game_obj.append(this.$playground);

        this.width = this.$playground.width();
        this.height = this.$playground.height();
        this.game_map = new GameMap(this);
        this.players = []; // maintain all the players

        // create myself
        this.players.push(new Player(this, this.width / 2, this.height / 2, this.height * 0.05, "white", this.height * 0.15, true));

        for (let i = 0; i < 5; i++) {
            this.players.push(new Player(this, this.width / 2, this.height / 2, this.height * 0.05, this.get_random_color(), this.height * 0.15, false));
        }

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
    }

    hide() { // hid the playground page
        this.$playground.hide();
    }
}
export class MyGame {
    constructor(id) {
        // console.log("Create Game!");
        this.id = id;
        this.$game_obj = $('#' + id);
        // this.menu = new GameMenu(this);
        this.playground = new GamePlayground(this);
    }

    start() {
    }
}
