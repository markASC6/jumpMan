// Basic Consts
const SCREEN_L = 850;
const SCREEN_H = 800;
const A_KEY = 65;
const D_KEY = 68;
const W_KEY = 87;
const S_KEY = 83;

// Physics Consts
const NORMAL_GRAVITY = 1/80;
const SPRING_GRAVITY = 1/200;
const DEFAULT_BOUNCE_HEIGHT = 12;
const SPRING_BOUNCE_HEIGHT = 24;

// Management Consts
const PLAT_STARTER = -200;
const START_PLAT_NUM = 12;
const CLOUD_ODDS = 1.7;
const SPRING_ODDS = 1.08;
const MOVE_ODDS = 1.8;
const PLAT_SPD = 3;
const CHAR_SPD = 9;

// Drawing Consts
const PLAT_L = 95;
const PLAT_H = 14;
const PLAT_ROUNDNESS = 6;
const SPRING_L = 13;
const SPRING_H = 8;
const SPRING_POPPED_H = 14;
const CHAR_L = 35;
const CHAR_H = 50;
const MONSTER_L = 85;
const MONSTER_H = 60;


function setup(){
    createCanvas(SCREEN_L, SCREEN_H);
    background(10, 145, 73);
    frameRate(60);
}

class Global {
    constructor(){
        // Objects
        this.char = undefined; // char class not valid yet
        this.plat = [];
        this.spring = [];
        this.moster = [];

        // Vars for Difficulty
        this.platNum = START_PLAT_NUM;
        this.platSpd = PLAT_SPD;
        this.cloudOdds = CLOUD_ODDS;
        this.springOdds = SPRING_ODDS;
        this.moveOdds = MOVE_ODDS;

        // Vars for Mechanisms
        this.grav = [NORMAL_GRAVITY, SPRING_GRAVITY];
        this.bounceHeight = [DEFAULT_BOUNCE_HEIGHT, SPRING_BOUNCE_HEIGHT];
        this.floor = SCREEN_H;
        this.playerMovement;
        this.start = false;
        this.score = 0;
        this.lastScore = 0;
    }

    initialPlat(){
        // should make sure *initial* platforms don't spawn on top of each other
        for (let i = 0; i < this.platNum; i++){
            // Spawns in a random spot in the place set for it, -19 +5 is to make sure they don't spawn on each other
            this.plat.unshift(new Plat(((Math.random() * ((SCREEN_H / this.platNum) - 19) + 5) + (i * (SCREEN_H / this.platNum)))));
            this.plat[0].assignAttributes();
        }
    }

    platManage(){
        for (let i = 0; i < this.plat.length; i++){
            // If Platform falls off screen
            if (this.plat[i].y > SCREEN_H){
                this.score++;
                this.plat.splice(i, 1);
                // Make new platform
                if (this.plat.length < this.platNum){
                    let highest = this.plat[this.plat.length - 1].y;
                    let newHeight;
                    let distanceBetween = SCREEN_H / this.platNum
                    newHeight = highest - distanceBetween - (Math.random() * (distanceBetween / 4) - (distanceBetween / 8));
                    if (newHeight > -20) newHeight = -20;
                    this.plat.push(new Plat(newHeight));
                    this.plat[this.plat.length - 1].assignAttributes();
                }
            }
            
            // Normal Updates
            if (this.plat[i].move) this.plat[i].moveSelf();
            if (this.plat[i].cloud) this.plat[i].manageCloud();
            if (this.plat[i].spring) this.plat[i].manageSpring();
            this.plat[i].drawSelf();
        }

    }

    charManage(){
        this.char.update();
        this.char.leftRight();
        this.char.drawSelf();
        for (let i = 0; i < this.plat.length; i++){
            this.char.checkPlat(this.plat[i]);
        }
        this.char.jump();
    }

    // If char is at top 1/4 of screen, move everything else down to account; if not, move char normally
    verticalMovementManage(){
        this.playerMovement = this.char.total - this.char.last;
        if (this.playerMovement < (PLAT_H * -1) + 1) this.playerMovement = (PLAT_H * -1) + 1;

        if (this.char.y <= SCREEN_H / 4 && this.char.rising){ // if char is at top 1/4 of screen
            for (let i = 0; i < this.plat.length; i++){ // loop thru plats and push them down to account for char
                this.plat[i].y += this.playerMovement;
            }
        } else {
            this.char.y -= this.playerMovement;
        }
    }

    startGame(){
        this.initialPlat();
    }

    runGame(){
        // difficulty ramping up
        if (this.score % 50 == 0 && this.score != this.lastScore){
            if (this.score % 100 == 0){
                if (this.platNum >= 7) this.platNum--;
                this.platSpd += .5;
            }
            if (this.score >= 100){
                this.cloudOdds = Math.random() * this.score / 50;
                this.moveOdds = Math.random() * this.score / 50;
            }
        }
        this.lastScore = this.score

        // General managment
        this.platManage();
        this.charManage();
        this.verticalMovementManage();

        fill(255, 255, 255)
        textSize(30);
        text("Score: " + this.score + " Cloud: " + this.cloudOdds + " Move: " + this.moveOdds, 10, 30);
    }

}

let g = new Global;

class Plat {
    constructor(y){
        this.x = Math.random() * (SCREEN_L - PLAT_L);
        this.y = y;
        this.bump = 0
        this.cloud = false;
        this.spring = false;
        this.move = false;
        this.direction = Math.floor(Math.random()*2);
        this.springObj = undefined;
        this.l = PLAT_L;
        this.h = PLAT_H;
        this.marked = false;
        this.r = 0;
        this.g = 0;
        this.b = 0;
    }

    assignAttributes(){
        // if it's a cloud
        if (Math.random() * g.cloudOdds >= 1){
            this.cloud = true;
            this.r = 255;
            this.g = 255;
            this.b = 255;
        }

        // if it has a spring
        if (Math.random() * g.springOdds >= 1){
            this.spring = true;
            g.spring.push({
                x: this.x + (this.l / 2) - (SPRING_L / 2),
                y: this.y - SPRING_H,
                h: SPRING_H,
                plat: undefined
            })
            this.springObj = g.spring[g.spring.length - 1]; // connect this plat to the spring
            this.springObj.plat = this; // connects the spring to this plat
        }

        // if it moves
        if (Math.random() * g.moveOdds >= 1){
            this.move = true;
            this.bump = Math.floor(Math.random() * 2); // random 0 or 1 so that they start going in different directions
        }
    }

    moveSelf(){
        // if the platform exceeds the edges, flip bump (odd / even)
        if (this.x < 0 || this.x + this.l > SCREEN_L) this.bump++;
        
        // move the plat left or right based on bump
        if (this.bump % 2 == 0){
            this.x += g.platSpd;
        } else {
            this.x -= g.platSpd;
        }
    }

    manageCloud(){
        if (this.marked) {
            this.move = false;
            this.spring = false;
            this.x = SCREEN_L + 100;
        }
    }

    manageSpring(){
        this.springObj.x = this.x + (this.l / 2) - (SPRING_L / 2);
        this.springObj.y = this.y - this.springObj.h;
    }

    drawSelf(){
        fill(this.r, this.g, this.b);
        rect(this.x, this.y, this.l, this.h, PLAT_ROUNDNESS);
        if (this.spring){
            fill(255, 0, 0);
            rect(this.springObj.x, this.springObj.y, SPRING_L, this.springObj.h);
        }
    }
}

class Character{

    constructor(name = "Jeff"){
        this.name = name;
        this.l = CHAR_L;
        this.h = CHAR_H;
        this.x = (SCREEN_L / 2) + (this.h / 2);
        this.y = SCREEN_H - this.h;
        // to be updated
        this.mid = this.x + (this.l / 2);
        this.bottom = this.y + this.h;
        this.right = this.x + this.l;
        this.rising = false;
        // jumping mechanism
        this.bounce = false;
        this.onSpring = false;
        this.total = 0;
        this.last = 0;
        this.tic = 0;
    }

    update(){
        this.mid = this.x + (this.l / 2);
        this.bottom = this.y + this.h;
        this.right = this.x + this.l;
        if (this.last >= this.total){
            this.rising = false;
        } else {
            this.rising = true;
        }
    }

    leftRight(){
        // move
        if (keyIsDown(LEFT_ARROW)) this.x -= CHAR_SPD;
        if (keyIsDown(RIGHT_ARROW)) this.x += CHAR_SPD;
        if (keyIsDown(UP_ARROW)) this.bounce = true;
        // teleport off sides
        if (this.mid < 0) this.x = SCREEN_L - (this.l / 2);
        if (this.mid > SCREEN_L) this.x = 0 - (this.l / 2);
        this.update();
    }

    drawSelf() {
        fill(103, 80, 179)
        rect(this.x, this.y, this.l, this.h, 15, 15, 0, 0)
    }

    // JUMPING MECHANISM

    checkPlat(plat) {
        this.update();
        let abovePlat = false;
        let onPlat = false;

        if (this.right >= plat.x && this.x <= plat.x + plat.l) abovePlat = true;
        if (this.bottom >= plat.y && this.bottom <= plat.y + plat.h) onPlat = true;
        if (abovePlat && onPlat && !this.rising){
            g.start = true;
            plat.marked = true;
            this.bounce = true;
            this.onSpring = false;

            if (plat.spring){
                if (this.right >= plat.springObj.x && this.x <= plat.springObj.x + SPRING_L){
                    this.onSpring = true;
                    plat.springObj.h = SPRING_POPPED_H;
                }
            }
        }
    }

    jump(){
        this.tic += 1;
        this.last = this.total;
        if (this.bottom > g.floor + 15) noLoop(); 
        if (this.bottom > g.floor && !g.start) this.bounce = true;
        if (this.bounce){
            this.tic = 1;
            this.last = 0;
        }

        let onSpring = this.onSpring | 0; // 1 if char is bouncing from a spring
        let up = this.tic;
        let down = g.grav[onSpring] * (this.tic ** 2);
        this.total = (up - down) * g.bounceHeight[onSpring]; // calculation

        this.bounce = false;
        
    }
}

class Monsters {
    constructor(x, y){
        this.l = MONSTER_L;
        this.h = MONSTER_H;
        this.x = x;
        this.y = y;
        this.marked = false;
    }
}

g.char = new Character;
g.startGame();

function draw(){
    background(10, 145, 73);
    g.runGame();
}