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
