import {COLORS, FONT_FAMILY, FONT_SERIF} from '../lib/colors';
import Ticker from '../lib/ticker';
import * as Phaser from 'phaser';
import {musicPanel, slider} from '../lib/ui';
import {playTrack} from '../lib/music';

import {TOOLS} from '../components/toolbar';

const FADE_MUSIC = false;
const random = () => Phaser.Math.RND.frac();
const DEFAULT_GRAVITY = 0.75;
const MIX_OCCUPIED_DISTANCE = 2;

export default class Board extends Phaser.Scene {
    constructor() {
        super({
            key: 'board',
            physics: {
                matter: {
                    gravity: {y: DEFAULT_GRAVITY}
                }
            }
        })
    }

    init({stage}) {
        const fetchInt = (key) => {
            let n = parseInt(localStorage.getItem(key) || 0);
            return isNaN(n) ? 0 : n;
        }
    
        this.stage = this.checkDimensions(stage);
        this.score = 0;
        this.started = false;
        this.lastDropX = this.game.config.width / 2;
        this.clicks = {
            total: fetchInt('total_clicks'),
            by_second: new Uint32Array(10),
            slot: 0,
            per_second: 0.0
        };
        this.points = new Ticker(10);
    }

    isSpaceOccupied(x, y, radius) {
        // Check only the most recent 10 dynamic bodies for efficiency
        const bodies = this.matter.world.localWorld.bodies;
        const dynamicBodies = bodies.filter(body => 
            !body.isStatic && body.gameObject && body.gameObject.active
        );
        
        // Check only the last 10 bodies (most recently created)
        const recentBodies = dynamicBodies.slice(-10).reverse();
        
        for (let body of recentBodies) {
            const distance = Phaser.Math.Distance.Between(x, y, body.position.x, body.position.y);
            
            if (distance < MIX_OCCUPIED_DISTANCE) {
                return true;
            }
        }
        
        return false;
    }


    preload() {
        this.load.svg('music', 'images/music.svg', {width: 16, height: 16});
        this.load.image('ring', 'images/ring-16.png');
        this.load.image('ring-32', 'images/ring-32.png');
        this.load.atlas('pucks', 'images/round_nodetailsOutline.png', 'images/round_nodetailsOutline.json');

        for (const mp3 of PINGS) {
            this.load.audio(mp3, [`audio/${mp3}.mp3`]);
        }
        this.load.audio('ding', [`audio/ding.mp3`]);
    }

    create() {
        const {game, stage} = this;

        this.matter.world.setGravity(0, DEFAULT_GRAVITY);

        this.sound.pauseOnBlur = false;
        this.disableVisibilityChange = true;

        this.matter.world.setBounds(0, -200, game.config.width, game.config.height + 300);

        this.generateTextures();

        this.buildStage(stage);

        this.input.on("pointerup", (evt) => {
            const {x} = evt;
            this.lastPointerX = x;
            this.lastDropX = x;
            this.onClicked();

            const tool = this.game.getState('tool');
            tool && tool.onUp && tool.onUp(this, evt);
        });

        this.input.on('pointermove', (evt) => {
            const tool = this.game.getState('tool');
            tool && tool.onPointerMove && tool.onPointerMove(this, evt);
        });

        this.input.on("pointerdown", (evt) => {
            const tool = this.game.getState('tool');
            tool && tool.onDown && tool.onDown(this, evt);
        });

        // if (this.game.input.touch) {
        //     this.game.input.touch.capture = false;
        // }

        // causing crashing!
        //     TypeError: Cannot read property 'getWorldPoint' of undefined
        // this.matter.add.pointerConstraint({length: 0});

        this.floor = this.matter.add.rectangle(
            0, game.config.height + stage.y_increment * 3,
            game.config.width * 10, stage.y_increment * 4,
            {isStatic: true}
        );

        this.pings = {};
        for (const name of PINGS) {
            this.pings[name] = this.sound.add(name).setVolume(0.5);
        }

        this.matter.world.on('collisionstart', (event) => {
            var pairs = event.pairs;
            for (const pair of pairs) {
                if (pair.bodyA === this.floor) {
                    if (pair.bodyB.gameObject && pair.bodyB.gameObject.active) {
                        // Stop any running tweens on this object before destroying
                        this.tweens.killTweensOf(pair.bodyB.gameObject);
                        pair.bodyB.gameObject.destroy();
                    }
                    continue;
                }

                if (Math.sqrt(pair.collision.depth) > 1 && pair.bodyA.gameObject && pair.bodyA.gameObject.sound) {
                    const volume = pair.collision.depth > 8 ? 1 : pair.collision.depth / 8;
                    if (volume > 0.1) {
                        const stage_depth = parseInt(pair.bodyA.position.y / this.game.config.height * 12) * 100;
                        this.pings[pair.bodyA.gameObject.sound].play({volume, detune: stage_depth});
                    }
                }

                if (pair.bodyA.gameObject && pair.bodyA.gameObject.onHitStart) {
                    pair.bodyA.gameObject.onHitStart(pair.bodyB);
                }
            }
        });

        this.matter.world.on('collisionend', (event) => {
            var pairs = event.pairs;
            for (const pair of pairs) {
                if (pair.bodyA.gameObject && pair.bodyA.gameObject.onHitEnd) {
                    pair.bodyA.gameObject.onHitEnd(pair.bodyB);
                }
            }
        });

        this.onStart();
    }

    update() {
        let {clicks} = this;
        this.game.events.emit('logs', `${clicks.total} clicks\n${clicks.per_second} cps\n${this.points.per_second} pps`);
    }

    onClicked() {
        this.onStart();
        this.clicks.total += 1;
        let {clicks} = this;
        clicks.by_second[clicks.slot] += 1;
    }

    onSecond() {
        let {clicks} = this;
        clicks.slot = (clicks.slot + 1) % clicks.by_second.length;
        clicks.by_second[clicks.slot] = 0;
        clicks.per_second = clicks.by_second.reduce((a,b) => a + b, 0) / clicks.by_second.length;
        this.onSaveStats();
        this.points.onSecond();
    }

    onSaveStats() {
        if (this.lastTotalClicks != this.clicks.total) {
            localStorage.setItem('total_clicks', this.clicks.total);
            this.lastTotalClicks = this.clicks.total;
        }
    }

    onBonusDrop() {
        let delay = 1000;
        if (this.clicks.per_second > 1) {
            delay /= this.clicks.per_second * 2;
        }
        this.time.addEvent({
            delay: delay,
            callback: () => {
                const {stage} = this;

                const variance = stage.x_increment,
                    offset = random() * variance - variance/2,
                    x = this.lastDropX + offset;

                const radius = this.game.config.width / 30;
                
                // Check if space is occupied before creating bonus object
                if (!this.isSpaceOccupied(x, -stage.y_increment, radius)) {
                    var ball = this.matter.add.image(x, -stage.y_increment, 'ring');
                    ball.setCircle();
                    // ball.setVelocity(random() - 0.5, random() * 5 + 2);
                    ball.setAngularVelocity(random() * 0.2 - 0.1 );
                    ball.setFriction(0.25);
                    ball.setDensity(0.5);
                    ball.setBounce(0.3);
                    ball.setScale(radius/16);
                }
                
                // Always schedule next bonus drop, regardless of whether this one was created
                this.onBonusDrop();
            },
            loop: false
        });
    }

    addDrop(x) {
        const {stage} = this;
        const radius = this.game.config.width / 18;

        if (!x) {
            const variance = stage.x_increment,
                offset = random() * variance - variance/2;
            x = this.lastDropX + offset;
        }

        // Check if space is occupied before creating object
        if (this.isSpaceOccupied(x, -radius, radius)) {
            return; // Silently ignore the drop - space occupied
        }

        this.matter.add.image(x, -radius, 'ring-32')
        .setCircle()
        .setAngularVelocity(random() * 0.2 - 0.1 )
        .setFriction(0.001)
        .setDensity(1.0)
        .setBounce(0.3)
        .setScale(radius/32);
    }

    checkDimensions(stage) {
        let updated = {...stage};
        let lines = stage.layout.split("\n");
        // always ignore first new line!!!
        let max_y = lines.length - 2;
        let max_x = 0;
        for (const line of lines) {
            if (line.length > max_x) {
                max_x = line.length;
            }
        }
        // ignore trailing new line
        max_x -= 1;
        if (updated.y_increment === 'auto') {
            updated.y_increment = this.game.config.height / max_y;
        }
        if (updated.x_increment === 'auto') {
            updated.x_increment = this.game.config.width / max_x;
        }
        return updated;
    }

    buildStage(stage) {
        let y = 0;
        let lines = stage.layout.split("\n");
        lines.splice(0,1);
        for (const line of lines) {
            let x = 0;
            for (const peg of line) {
                this.addPeg(peg, x, y);
                x += stage.x_increment;
            }
            y += stage.y_increment;
        }
    }

    addPeg(peg, x, y) {
        const {x_increment, y_increment} = this.stage;
        const img = `peg=${peg}`;
        let poly = undefined;

        switch (peg) {
        case 'o':
                poly = this.matter.add.image(x, y, img, null, {shape: 'circle', label: img})
                .setFriction(0.01)
                .setStatic(true);
            poly.sound = 'wood-03';
            break;
        case 'O': 
            poly = this.matter.add.image(x, y, img, null, {shape: 'circle'})
                .setFriction(0.01)
                .setStatic(true);
            poly.sound = 'wood-03';
            break;
        case '|':
            poly = this.matter.add.image(x, y, img)
                .setFriction(0.01)
                .setStatic(true);
            break;
        case '^':
            poly = this.matter.add.image(x, y, img)
                .setPolygon(x_increment, 3)
                .setFriction(0.01)
                .setAngle(210)
                .setDensity(0.75);
            poly.sound = 'wood-03';
            this.matter.add.worldConstraint(poly, 0, 1, {pointA: {x, y}});
            break;
        }
        const target = TARGETS[peg];
        if (target) {
            poly = this.matter.add.image(x + x_increment/2, y + y_increment/3, 'target-outline')
                .setAlpha(0)
                .setFriction(0.01)
                .setSensor(true)
                .setStatic(true);

            const bonusText = this.add.text(x - x_increment/3, y + x_increment * 1.25, target.bonus, {
                fontFamily: FONT_SERIF,
                fontSize: 20,
                color: '#ffffff',
                align: 'left',
                resolution: 2,
            }).setOrigin(0, 0)
               .setAngle(-90)
               .setStroke(COLORS.outlineHex, 2)
               .setAlpha(.8);

            poly.onHitStart = (other) => {
                const points = Math.round(Math.sqrt(other.area / Math.PI)) * target.bonus;
                this.score += points;
                this.game.events.emit('score', this.score);

                this.bubbleText(poly.x, poly.y - 25, "+" + points);
                this.points.add(points);
                this.pings['wood-03'].play({detune: MUSICAL_NOTES * 100});
            };
        }
    }

    bubbleText(x,y, text) {
        var obj = this.make.text({x, y,
            text: text,
            origin: 0.5,
            style: {
                //fontFamily: 'Comic Sans',
                fontSize: '24px',
                color: '#fff',
                align: 'center',
                stroke: COLORS.outline,
                strokeThickness: 1,
            }
        });//.setShadow(0,3,'#333', 10);

        var tween = this.tweens.add({
            targets: obj,
            scale: { from: 0, to: 1 },
            y: `-=${this.stage.y_increment*2}`,
            x: `-=${6 * random() + 3}`,
            ease: 'Cubic',
            duration: 2000,
            repeat: 0,
            yoyo: false,
            onComplete: () => {
                if (obj.active) {
                    // Stop any running tweens on this object before destroying
                    this.tweens.killTweensOf(obj);
                    obj.destroy();
                }
            },
        });
    }

    generateTextures() {
        const {stage} = this,
            base_unit = this.game.config.width / 30;

        this.generateCircle('peg=o', base_unit, COLORS.light, COLORS.outline);
        this.generateCircle('peg=O', base_unit * 1.5, COLORS.light, COLORS.outline);
        this.generateRectangle('peg=|', base_unit/2, stage.y_increment+1, COLORS.outline, COLORS.outline);
        this.generateTriangle('peg=^', base_unit, COLORS.light, COLORS.outline);

        // targets
        this.generateRectangle('target-outline', stage.y_increment, stage.y_increment, null, COLORS.target);
    }

    generateCircle(name, radius, pin_color, stroke) {
        const graphic = this.add.graphics(),
            line = 2;

        graphic.fillStyle(stroke);
        graphic.fillCircle(radius / 2, radius / 2, radius / 2);
        graphic.lineStyle(line, pin_color);
        graphic.strokeCircle(radius / 2, radius / 2, line);
        graphic.generateTexture(name, radius, radius);
        graphic.clear();
    }

    generateRectangle(name, width, height, fill, stroke) {
        const graphic = this.add.graphics(),
            line = 2;

        if (fill) {
            graphic.fillStyle(fill);
            graphic.fillRect(0, 0, width, height);
        }

        graphic.lineStyle(line, stroke);
        graphic.strokeRect(line/2, line/2, width-line, height-line);
        graphic.generateTexture(name, width, height);
        graphic.clear();
    }

    generateTriangle(name, length, pin_color, stroke) {
        const graphic = this.add.graphics(),
            line = 2;

        // hardcoded for 16 px based on matter body
        const triangle = {
            x1: 16 + 8,
            y1: 13.856 + 13.856,
            x2: 16 + -16,
            y2: 13.856 + 0,
            x3: 16 + 8,
            y3: 13.856 + -13.856,
        }

        graphic.fillStyle(stroke);
        graphic.fillTriangleShape(triangle);
        graphic.lineStyle(line, pin_color);
        graphic.strokeCircle(16, 13.856, line);
        graphic.generateTexture(name, 16 + 8, 13.856 * 2);
        graphic.clear();
    }

    onStart() {
        if (!this.started) {
            this.started = window.performance.now();
            this.time.addEvent({
                delay: 1000,
                callback: () => this.onSecond(),
                loop: true
            });
            this.onBonusDrop();
            // const preload = this.scene.get('preload');
            playTrack(this);
            // this.scene.sendToBack('preload');
            // this.scene.resume('board');
        }
    }
}

const PUCKS = [
    'bear',
    'buffalo',
    'chick',
    'chicken',
    'cow',
    'crocodile',
    'dog',
    'duck',
    'elephant',
    'frog',
    'giraffe',
    'goat',
    'gorilla',
    'hippo',
    'horse',
    'monkey',
    'moose',
    'narwhal',
    'owl',
    'panda',
    'parrot',
    'penguin',
    'pig',
    'rabbit',
    'rhino',
    'sloth',
    'snake',
    'walrus',
    'whale',
    'zebra',
]

const BROWN_PUCKS = [
    'bear',
    'buffalo',
    'goat',
    'horse',
    'monkey',
    'moose',
    'owl',
    'sloth',
    'walrus',
]

const COLOR_PUCKS = PUCKS.filter(n => !BROWN_PUCKS.includes(n));

const PUCK_SRC_SIZE = 140;

const PINGS = [
    'wood-01',
    'wood-02',
    'wood-03',
    'wood-04',
    'wood-05',
    'wood-06'
]

export const TARGETS = {
    'A': {
        bonus: 100,
    },
    'B': {
        bonus: 25,
    },
    'C': {
        bonus: 10,
    },
    'D': {

        bonus: 5,
    },
    'E': {
        bonus: 1,
    },
}

export const MUSICAL_NOTES = 13;

export const SLOWEST_MUSIC_RATE = 0.01;
export const SLOWDOWN_MUSIC_DURATION = 1000;
