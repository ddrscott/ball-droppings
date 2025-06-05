import * as Phaser from 'phaser';

export default class Puck {
    label = 'Puck';

    onUp(scene, {x}) {
        const radius = scene.game.config.width / 15;

        // Check if space is occupied before creating object
        if (scene.isSpaceOccupied(x, -radius, radius)) {
            return; // Silently ignore the click - space occupied
        }

        scene.matter.add.image(x, -radius, 'ring-32')
            .setCircle()
            .setAngularVelocity(Phaser.Math.RND.frac() * 0.2 - 0.1 )
            .setFriction(0.001)
            .setDensity(1.0)
            .setBounce(0.3)
            .setScale(radius/32);
    }
}
