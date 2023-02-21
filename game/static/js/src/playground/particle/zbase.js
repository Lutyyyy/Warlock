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
