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
let GAME_OBJECTS = [];

class GameEngine {
    constructor() {
        GAME_OBJECTS.push(this);
        this.has_call_start = false; // has executed the start() or not
        this.time_delta = 0; // The time interval between the current frame and the previous frame
        this.uuid = this.create_uuid();

    }

    // create a random 9-bit id for every game object
    create_uuid() {
        let res = "";
        for (let i = 0; i < 9; i ++) {
            let x = parseInt(Math.floor(10 * Math.random())); // return a random number in [0, 10)
            res += x;
        }
        return res;
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

    resize() {
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)"; // resize the background, render a totally black canvas
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
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
        this.eps = 0.01;
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
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
class Player extends GameEngine {
    constructor(playground, x, y, radius, color, speed, character, username, photo) {
        console.log(character, username, photo);

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
        this.character = character;
        this.username = username;
        this.photo = photo;
        this.eps = 0.01;
        this.current_skill = null;
        this.spent_time = 0;
        this.fireballs = [];

        if (character !== "robot") {
            // all the enemy and myself should render the photo
            this.img = new Image();
            this.img.src = this.photo;
        }
    }

    start() {
        if (this.character === "me") {
            this.add_listening_events();
        }
        else if (this.character === "robot") { // robot
            let tx = Math.random() * this.playground.width / this.playground.scale;
            let ty = Math.random() * this.playground.height / this.playground.scale;
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
                let tx = (e.clientX - rectangle.left) / outer.playground.scale;
                let ty = (e.clientY - rectangle.top) / outer.playground.scale;
                outer.move_to(tx, ty);

                // broadcast the move to function
                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_move_to_message(tx, ty);
                }
            }
            else if (e.which == 1) { // left click
                let tx = (e.clientX - rectangle.left) / outer.playground.scale;
                let ty = (e.clientY - rectangle.top) / outer.playground.scale;
                if (outer.current_skill === "fireball") {
                    let fireball = outer.shoot_fireball(tx, ty);

                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_shoot_fireball(fireball.ball_uuid, tx, ty);
                    }
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
        let radius = 0.01;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let color = "orange";
        let speed = 0.5;
        let move_len = 0.8;
        let fireball = new FireBall(this.playground, this, x, y, radius, vx, vy, speed, color, move_len, 0.005);
        this.fireballs.push(fireball);

        // inorder to get the uuid of the fireball
        return fireball;
    }

    // remove the fireball from the playground's game_object array
    destroy_fireball(uuid) {
        for (let i = 0; i < this.fireballs.length; i ++) {
            let fireball = this.fireballs[i];
            if (fireball.uuid === uuid) {
                this.fireballs.destroy();
                break;
            }
        }
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
        if (this.radius < this.eps) {
            this.destroy();
            return false;
        }
        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage * 60;
        this.speed *= 0.8;
    }

    update() {
        this.update_move();
        this.render();
    }

    update_move() {
        this.spent_time += this.time_delta / 1000;
        // shoot at the player with a probability 1/300, which means enemy will shoot at player every 5 secs and 5 secs after start.
        if (this.character === "robot" && this.spent_time > 5 && Math.random() < 1 / 300) {
            let player = this.playground.players[Math.floor(Math.random() * this.playground.players.length)];
            let tx = player.x + player.speed * this.vx * this.time_delta / 1000 * 0.3;
            let ty = player.y + player.speed * this.vy * this.time_delta / 1000 * 0.3;
            this.shoot_fireball(tx, ty);
        }

        if (this.damage_speed > this.eps) {
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
                if (this.character === "robot") {
                    let tx = Math.random() * this.playground.width / this.playground.scale;
                    let ty = Math.random() * this.playground.height / this.playground.scale;
                    this.move_to(tx, ty);
                }
            }
            else {
                let move_d = Math.min(this.speed * this.time_delta / 1000, this.move_distance);
                this.x += this.vx * move_d, this.y += this.vy * move_d;
                this.move_distance -= move_d;
            }
        }
    }

    // print the circle
    render() {
        let scale = this.playground.scale;
        // draw by absoulute size but not relative size
        if (this.character !== "robot") {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, (this.x - this.radius) * scale, (this.y - this.radius) * scale, this.radius * 2 * scale, this.radius * 2 * scale);
            this.ctx.restore();
        }
        else {
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }

    }

    on_destroy() {
        for (let i = 0; i < this.playground.players.length; i++) {
            if (this.playground.players[i] === this) {
                this.playground.players.splice(i, 1);
                break;
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
        this.eps = 0.01;
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
        this.update_move();
        this.update_attack();

        this.render();
    }

    update_move() {
        let move_d = Math.min(this.move_length, this.speed * this.time_delta / 1000);
        this.x += this.vx * move_d, this.y += this.vy * move_d;
        this.move_length -= move_d;
    }

    update_attack() {
        for (let i = 0; i < this.playground.players.length; i++) {
            let player = this.playground.players[i];
            if (this.player !== player && this.is_collision(player)) {
                this.attack(player);
                break;
            }
        }
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
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    // remove the fireball from the players' fireball array
    on_destroy() {
        let fireballs = this.player.fireballs;
        for (let i = 0; i < fireballs.length; i ++) {
            if (fireballs[i] === this) {
                fireballs.splice(i, 1);
                break;
            }
        }
    }
}
class MultiPlayerSocket {
    constructor(playground) {
        this.playground = playground;

        // establish the server and client
        // according to the routing.py, it will call consumers/multiplayer/index.py connect function
        this.ws = new WebSocket("wss://47.113.219.182:8000/wss/multiplayer/");

        this.start();
    }

    start() {
        this.receive();
    }

    // find player by uuid
    get_player(uuid) {
        let players = this.playground.players;
        for (let i = 0; i < players.length; i ++) {
            let player = players[i];
            if (player.uuid === uuid)
                return uuid;
        }
        return null;
    }

    // handle the data come from server(backend)
    receive() {
        let outer = this;
        // callback funciton after receive data from server(backend)
        this.ws.onmessage = function(e) {
            // string-->json
            let data = JSON.parse(e.data);
            if (data.uuid === outer.uuid) return false;

            // handle the event not sent by myself
            let event = data.event;
            if (event === "create_player") {
                outer.receive_create_player_message(data.uuid, data.username, data.photo);
            }
            else if (event === "move_to") {
                outer.receive_move_to_message(data.uuid, data.tx, data.ty);
            }
            else if (event === "shoot_fireball") {
                outer.receive_shoot_fireball_message(uuid, data.tx, data.ty, data.ball_uuid);
            }
        }
    }

    // send the create player messasge to backend after establishing the connection successfully
    send_create_player_message(username, photo) {
        let outer = this;
        // json-->string
        this.ws.send(JSON.stringify({
            'event': "create_player",
            'uuid': outer.uuid,
            'username': username,
            'photo': photo
        }));
    }

    receive_create_player_message(uuid, username, photo) {
        let player = new Player(this.playground, this.playground, this.playground.width / 2 / this.playgroud.scale, 0.5, 0.05, "white", 0.15, "enemy", username, photo);
        player.uuid = uuid;
        this.playground.players.push(player);
    }

    // send the player's moving to the server
    send_move_to_message(tx, ty) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "move_to",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }

    receive_move_to_message(uuid, tx, ty) {
        let player = this.get_player(uuid);
        // move the specific player in every window
        if (player) {
            player.move_to(tx, ty);
        }
    }

    send_shoot_fireball_message(ball_uuid, tx, ty) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "shoot_fireball",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
            'ball_uuid': ball_uuid,
        }));
    }

    receive_shoot_fireball_message(uuid, tx, ty, ball_uuid) {
        let player = this.get_player(uuid);
        if (player) {
            let fireball = player.shoot_fireball(tx, ty);
            fireball.uuid = ball_uuid; // all the uuid of every window for one fireball should be the same
        }
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
                <div class="game-settings-wechat">
                    <img src="https://open.weixin.qq.com/zh_CN/htmledition/res/assets/res-design-download/icon24_appwx_logo.png">
                    <br>
                    <div class="game-settings-wechat-text">Login</div>
                    <br>
                </div>
                <br><br>
                <div class="game-settings-error-message">
                </div>
            </div>
            <!--- register page -->
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
                <!--
                <div class="game-settings-upload">
                    <input type="file" accept="image/*" id="1010">
                </div>
                <br>
                -->
                <br>
                <div class="game-settings-submit-button">
                    <button>Register</button>
                </div>
                <div class="game-settings-option">
                    Login
                </div>
                <br><br>
                <div class="game-settings-wechat">
                    <img src="https://open.weixin.qq.com/zh_CN/htmledition/res/assets/res-design-download/icon24_appwx_logo.png">
                    <br>
                    <div class="game-settings-wechat-text">Login</div>
                    <br>
                </div>
                <br>
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
        // this.$register_upload_pic = this.$register.find(".game-settings-upload input");

        this.$register.hide();

        this.$wechat_login = this.$setttings.find('.game-settings-wechat');

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
        let outer = this;
        this.add_listening_events_login();
        this.add_listening_events_register();
        
        this.$wechat_login.click(function() {
            $.ajax({
                url: "http://47.113.219.182:8000/settings/thirdparty/apply_code/",
                type: "GET",
                success: function(resp) {
                    console.log(resp);
                    if (resp.result === "success") {
                        // redirect
                        window.location.replace(resp.apply_code_url);
                    }
                }
            });
        });
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
        this.$register_submit.click(function() {
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
        // let photo = this.$register_upload_pic.val();
        // if (photo) {
        //     console.log(photo);
        //     var file_obj = document.getElementById("1010").files[0];
        //     console.log(file_obj);
        // }
        this.$register_error_message.empty();

        $.ajax({
            url: "http://47.113.219.182:8000/settings/register/",
            type: "GET",
            data: {
                username: username,
                password: password,
                password_confirm: password_confirm,
                // photo: photo,
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

    wechat_login() {
        console.log("wechat!!!");
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
