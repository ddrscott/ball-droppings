export const SLOWEST_MUSIC_RATE = 0.01;
export const SLOWDOWN_MUSIC_DURATION = 1000;
export const DEFAULT_VOLUME = 0.5;

export const TRACKS = [
    'Chad_Crouch_-_04_-_Children_By_The_Creek_Instrumental.mp3',
    'Chad_Crouch_-_04_-_The_Spring_Instrumental.mp3'
]


export function playTrack(scene, idx) {
    if (!idx) {
        idx = 0;
    }
    if (scene.current_track) {
        scene.current_track.stop();
    }
    const track = `music/${TRACKS[idx]}`;

    if (!scene.cache.audio.get(track)) {
        scene.load.audio(track, track);
        scene.load.once('filecomplete', () => playTrack(scene, idx));
        scene.load.start();
    } else {
        scene.current_track = scene.sound.add(track);
        scene.current_track.play({
            volume: DEFAULT_VOLUME,
            loop: true
        });
    }
}

export function fadeinMusic(scene, onComplete) {
    if (scene.fadeMusicTween) {
        scene.fadeMusicTween.remove();
    }
    if (scene.current_track) {
        //  && scene.current_track.rate == SLOWEST_MUSIC_RATE
        // scene.current_track.setRate(SLOWEST_MUSIC_RATE + 0.01);
        scene.fadeMusicTween = scene.tweens.add({
            targets: scene.current_track,
            rate: 1,
            duration: SLOWDOWN_MUSIC_DURATION,
            onComplete: () => {cleanupFadeMusic(scene); onComplete && onComplete()},
        });
    } else {
        onComplete && onComplete();
    }
}

export function fadeoutMusic(scene, onComplete) {
    if (scene.fadeMusicTween) {
        scene.fadeMusicTween.remove();
    }
    if (scene.current_track) {
        scene.fadeMusicTween = scene.tweens.add({
            targets:  scene.current_track,
            rate:   SLOWEST_MUSIC_RATE,
            duration: SLOWDOWN_MUSIC_DURATION,
            onComplete: () => {cleanupFadeMusic(scene); onComplete && onComplete()},
        });
    } else {
        onComplete && onComplete();
    }
}

export function pauseMusic(scene) {
    if (scene.current_track && scene.current_track.isPlaying) {
        scene.current_track.pause();
    }
}

export function resumeMusic(scene) {
    if (scene.current_track && scene.current_track.isPaused) {
        scene.current_track.resume();
    }
}

export function cleanupFadeMusic(scene) {
    if (scene.fadeMusicTween) {
        scene.fadeMusicTween.remove();
        delete scene.fadeMusicTween;
    }
}
