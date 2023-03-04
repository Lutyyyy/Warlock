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

            if (this.character === "me") {
                this.fireball_coldtime = 3; // 3s for cool down time
                this.fireball_img = new Image();
                this.fireball_img.src = "https://game.gtimg.cn/images/yxzj/img201606/summoner/80104.jpg";

                this.blink_coldtime = 5;
                this.blink_img = new Image();
                this.blink_img.src = "https://game.gtimg.cn/images/yxzj/img201606/summoner/80115.jpg";
            }
        }
    }

    start() {
        this.playground.player_count ++;
        this.playground.notice_board.write("Ready to begin: " + this.playground.player_count + " people");

        if (this.playground.player_count >= 3) {
            this.playground.status = "fighting";
            this.playground.notice_board.write("Fighting!");
        }

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
            if (outer.playground.status !== "fighting")
                return true;

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
                    if (outer.fireball_coldtime > outer.eps) return false; // cold time

                    let fireball = outer.shoot_fireball(tx, ty);

                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_shoot_fireball_message(fireball.ball_uuid, tx, ty);
                    }
                }
                else if (outer.current_skill === "blink") {
                    if (outer.blink_coldtime > outer.eps) return false; // cold time
                    outer.blink(tx, ty);

                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_blink_message(tx, ty);
                    }
                }
                outer.current_skill = null;
            }
        });

        this.playground.game_map.$canvas.keydown(function (e) { // keycode
            if (e.which === 13) { // enter
                if (outer.playground.mode === "multi mode") { // open the chat window
                    outer.playground.chat_field.show_input();
                    return false;
                }
            }
            else if (e.which === 27) { // Esc
                if (outer.playground.mode === "multi mode") { // close the chat window
                    outer.playground.chat_field.hide_input();
                }
            }
            if (outer.playground.status !== "fighting")
                return true;

            if (e.which === 81) {
                if (outer.fireball_coldtime > outer.eps)
                    return true; // cold time

                outer.current_skill = "fireball";
                return false;
            }
            else if (e.which === 70) {
                if (outer.blink_coldtime > outer.eps)
                    return true;
                outer.current_skill = "blink";
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

        this.fireball_coldtime = 3; // reset cold time

        // inorder to get the uuid of the fireball
        return fireball;
    }

    blink(tx, ty) {
        let d = this.get_dist(this.x, this.y, tx, ty);
        d = Math.min(0.8, d); // maximum distance of blink is 0.8
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.x += d * Math.cos(angle);
        this.y += d * Math.sin(angle);

        this.blink_coldtime = 5;
        this.move_distance = 0; // stop after blink
    }

    // remove the fireball from the playground's game_object array
    destroy_fireball(uuid) {
        for (let i = 0; i < this.fireballs.length; i++) {
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

    receive_attack(x, y, angle, damage, ball_uuid, attacker) {
        attacker.destroy_fireball(ball_uuid);
        this.x = x;
        this.y = y;
        this.be_attacked(angle, damage);
    }

    update() {
        this.spent_time += this.time_delta / 1000;
        this.update_win();

        if (this.character == "me" && this.playground.status === "fighting")
            this.update_coldtime();

        this.update_move();
        this.render();
    }

    update_win() { // check if win
        if (this.playground.status === "fighting" && this.character === "me" && this.playground.players.length === 1) {
            this.playground.score_board.win();
        }
    }

    update_coldtime() {
        this.fireball_coldtime -= this.time_delta / 1000;
        this.fireball_coldtime = Math.max(0, this.fireball_coldtime);

        this.blink_coldtime -= this.time_delta / 1000;
        this.blink_coldtime = Math.max(this.blink_coldtime, 0);
    }

    update_move() {
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
        else { // draw circle
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }

        if (this.character === "me" && this.playground.status === "fighting") {
            this.render_skill_coldtime();
        }
    }

    render_skill_coldtime() {
        let x = 1.5, y = 0.9, r = 0.04, scale = this.playground.scale;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.fireball_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if (this.fireball_coldtime > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.fireball_coldtime / 3) - Math.PI / 2, true); // draw part of the circle
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";  // limpid blue
            this.ctx.fill();
        }

        x = 1.62, y = 0.9, r = 0.04;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.blink_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if (this.blink_coldtime > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.blink_coldtime / 5) - Math.PI / 2, true); // draw part of the circle
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";  // limpid blue
            this.ctx.fill();
        }
    }

    on_destroy() {
        if (this.character === "me")
            if (this.playground.status === "fighting") {
                this.playground.status === "over";
                this.playground.score_board.lose();
            }

        for (let i = 0; i < this.playground.players.length; i++) {
            if (this.playground.players[i] === this) {
                this.playground.players.splice(i, 1);
                break;
            }
        }
    }
}

