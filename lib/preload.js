import * as Phaser from 'phaser';
import {COLORS, FONT_SERIF} from '../lib/colors';

export default class Preload extends Phaser.Scene {
    constructor() {
        super({
            key: 'preload',
        })
    }

    init(options) {
        this.nextOptions = options;
    }

    preload() {
        this.load.image('bamboo', 'images/bamboo-bg.jpg');
        this.load.on('complete', () => {
            this.game.scene.pause('board', this.nextOptions);
        });
    }

    create() {
        const {width, height} = this.game.config;

        this.add.image(0, 0, 'bamboo').setOrigin(0).setScale(width/450, height/450);

        this.add.text(0, height, 'Droppings', {
            fontFamily: FONT_SERIF,
            fontSize: 80,
            color: COLORS.lightHex,
            align: 'center',
            fixedWidth: height,
            resolution: 2,
        }).setOrigin(0, 0)
            .setAngle(-90)
            .setStroke('#FFFF', 16)
            .setShadow(0,0,'#111', 1)
            .setAlpha(.3);
    }
}
