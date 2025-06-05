import * as Phaser from 'phaser';
import {COLORS} from '../../lib/colors';

export default class Pushy {
    label = 'Wind';


    onDown(scene, {x, y}) {
        this.downAt = {x,y};
        this.graphics = scene.add.graphics(x, y);
    }
    
    onPointerMove(scene, {x, y}) {
        if (this.downAt) {
            // console.log(x, y);
            this.graphics.clear();
            this.graphics.lineStyle(3, COLORS.outline, .5);
            this.graphics.fillStyle(COLORS.outline, 1);
            this.graphics.fillCircle(this.downAt.x, this.downAt.y, 5);
            this.graphics.lineBetween(this.downAt.x, this.downAt.y, x, y);
        }
    }
    
    onUp(scene, {x, y}) {
        const item = scene.matter.add.circle(x, y, 3);
        item.force_angle;
        item.label = "Pushy";
        item.isStatic = true;
        item.isSensor = true;
        item.plugin.attractors.push((bodyA, bodyB) => {
            const dist = Phaser.Math.Between(bodyA.position.x, bodyB.position.x, bodyA.position.y, bodyB.position.y),
                dir = (bodyA.position.x > bodyB.position.x ? -1 : 1);
            return {
                x: dist * 0.01/bodyB.mass * dir,
                y: 0,
            }
        })

        this.downAt = false;
    }
}
