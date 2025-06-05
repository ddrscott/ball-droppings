'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import * as Phaser from 'phaser';
import {COLORS, FONT_FAMILY} from '../lib/colors';


export default class Overlay extends Phaser.Scene {
    constructor() {
        super({
            key: 'overlay',
            active: true,
        })
    }
    preload() {
        this.load.html('overlay', '/overlay.html')
    }

    create() {
        this.input.enabled = false;

        const x_increment = 16,
            y_increment = 25;

        const {width} = this.game.config;

        this.stats_text = this.add.text(0, y_increment * 1.75, '', {
            align: 'right', 
            fontSize: '14px',
            fontFamily: 'Nine Pin',
            fixedWidth: width - x_increment/2,
        });
        
        const overlay = this.add.dom(0, 0).createFromCache('overlay').setOrigin(0);
        this.scorePanel = overlay.node.querySelector('.score-panel');
        this.scoreElm = overlay.node.querySelector('.score');
        this.stageElm = overlay.node.querySelector('.stage');
        this.statsElm = overlay.node.querySelector('.stats');
        this.menuElm = overlay.node.querySelector('.menu');

        this.scorePanel.addEventListener('click', () => {
            this.menuElm.classList.toggle("active");
        });
    }

    setScore(score) {
        this.scoreElm.innerText = score;
    }

    setStage(name) {
        this.stageElm.innerText = name;
    }

    setStats(text) {
        this.statsElm.innerText = text;
    }
}
