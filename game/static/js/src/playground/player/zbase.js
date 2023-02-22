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
                if (outer.current_skill === "fireball") {
                    outer.shoot_fireball((e.clientX - rectangle.left) / outer.playground.scale, (e.clientY - rectangle.top) / outer.playground.scale);
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
        new FireBall(this.playground, this, x, y, radius, vx, vy, speed, color, move_len, 0.005);
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
            }
        }
    }
}
