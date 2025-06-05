import * as Phaser from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import {MatterAttractors} from '../lib/attractors';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {Toolbar, TOOLS} from '../components/toolbar';
import {ScoreBoard} from '../components/score-board';
import Board from '../lib/board';
import Preload from '../lib/preload';
import {MainMenu} from '../components/main-menu';
import maps from '../maps';
import Router from 'next/router';


const natural = {
    width: 480,
    height: 800
};


const fetchInt = (key) => {
    let n = parseInt(localStorage.getItem(key) || 0);
    return isNaN(n) ? 0 : n;
}

function Game({ map }) {
    const [tool, setTool] = useState(TOOLS[0]);
    const [score, setScore] = useState(0);
    const [topScore, setTopScore] = useState(() => fetchInt(`top_score_${map.name.replace(/\s+/g, '_')}`));
    const [logs, setLogs] = useState('Loading...');
    const [showMenu, setShowMenu] = useState(true);
    const [started, setStarted] = useState(false);
    const [cheat, setCheat] = useState(false);
    
    const gameRef = useRef(null);

    const resizeContainer = useCallback(() => {
        window.setTimeout(() => {
            const canvasStyle = document.querySelector('#phaser canvas')?.getAttribute("style");
            if (canvasStyle) {
                document.querySelector('.game')?.setAttribute("style", canvasStyle);
            }
        }, 10);
    }, []);

    const setupPhaser = useCallback(() => {
        if (gameRef.current) {
            gameRef.current.destroy(true);
        }

        gameRef.current = new Phaser.Game({
            type: Phaser.AUTO,
            parent: 'phaser',
            ...natural,
            physics: {
                default: 'matter',
            },
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_HORIZONTAL,
            },
            disableContextMenu: true,
            scene: [Preload, Board],
            plugins: {
                scene: [
                    { key: 'rexUI', plugin: RexUIPlugin, mapping: 'rexUI' },
                ]
            }
        });

        const {Matter} = Phaser.Physics.Matter;
        Matter.use(Matter, MatterAttractors);

        gameRef.current.getState = (k) => {
            switch(k) {
                case 'tool': return tool;
                case 'score': return score;
                case 'topScore': return topScore;
                case 'logs': return logs;
                case 'showMenu': return showMenu;
                case 'started': return started;
                case 'cheat': return cheat;
                default: return undefined;
            }
        };
        gameRef.current.scene.start('preload', {stage: map});

        gameRef.current.events.on('score', (newScore) => {
            const newTopScore = Math.max(newScore, topScore);
            if (newTopScore > topScore) {
                const mapKey = `top_score_${map.name.replace(/\s+/g, '_')}`;
                localStorage.setItem(mapKey, newTopScore);
                setTopScore(newTopScore);
            }
            setScore(newScore);
        });
        
        gameRef.current.scale.once('resize', resizeContainer);

        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') {
                setShowMenu(true);
                const board = gameRef.current?.scene.getScene('board');
                if (board && !gameRef.current?.scene.isPaused('board')) {
                    gameRef.current?.scene.pause('board');
                    if (board.current_track && board.current_track.isPlaying) {
                        board.current_track.pause();
                    }
                }
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        resizeContainer();
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [map, tool, score, topScore, logs, showMenu, started, cheat, resizeContainer]);

    const restartScene = useCallback(() => {
        setShowMenu(false);
        setStarted(true);
        setScore(0);

        const opts = {stage: map};
        if (gameRef.current) {
            gameRef.current.scene.stop('board', opts);
            gameRef.current.scene.start('board', opts);
        }
    }, [map]);

    const togglePause = useCallback(() => {
        const board = gameRef.current?.scene.getScene('board');
        if (gameRef.current?.scene.isPaused('board')) {
            setShowMenu(false);
            gameRef.current?.scene.resume('board');
            if (board && board.current_track && board.current_track.isPaused) {
                board.current_track.resume();
            }
        } else {
            setShowMenu(true);
            gameRef.current?.scene.pause('board');
            if (board && board.current_track && board.current_track.isPlaying) {
                board.current_track.pause();
            }
        }
    }, []);

    const selectedTool = useCallback((tool) => {
        setTool(tool);
    }, []);

    const switchMap = useCallback((mapIndex) => {
        Router.push({
            pathname: '/',
            query: { map: mapIndex + 1 },
        });
    }, []);

    // Main effect for mount/unmount and map changes
    useEffect(() => {
        // Initial setup on mount
        const url = window.location.href;
        if (url.indexOf('cheat') > -1) {
            setCheat(true);
        }
        
        // Setup Phaser game
        const cleanup = setupPhaser();
        
        // Cleanup function for unmount
        return () => {
            cleanup?.();
            if (gameRef.current) {
                gameRef.current.destroy(true);
            }
        };
    }, []); // Only run on mount

    // Effect for map changes (after initial mount)
    useEffect(() => {
        if (!gameRef.current) return; // Skip if game not initialized yet
        
        const newTopScore = fetchInt(`top_score_${map.name.replace(/\s+/g, '_')}`);
        setScore(0);
        setStarted(false);
        setTopScore(newTopScore);
        
        gameRef.current.scene.stop('board');
        gameRef.current.scene.start('preload', {stage: map});
    }, [map]);

    return (
        <div className="game no-select">
            <div id="phaser"></div>
            <ScoreBoard
                title={map.name}
                score={score}
                topScore={topScore}
                logs={logs}
                onClick={togglePause}
            />
            <MainMenu
                active={showMenu}
            >
                {started && (
                    <button onClick={togglePause} onTouchEnd={togglePause}>
                        Resume
                    </button>
                )}
                <button onClick={restartScene} onTouchEnd={restartScene}>
                    {started ? 'Restart' : 'Start'}
                </button>
                <div style={{textAlign: 'center'}}>
                    <h3>Maps</h3>
                    {maps.map((mapItem, index) => (
                        <button 
                            key={index}
                            onClick={() => switchMap(index)}
                            onTouchEnd={() => switchMap(index)}
                            style={{
                                display: 'block',
                                width: '100%',
                                marginBottom: '0.5em',
                                textAlign: 'left',
                                fontSize: '0.8em',
                            }}
                        >
                            {index + 1}. {mapItem.name}
                        </button>
                    ))}
                </div>
            </MainMenu>
            {!showMenu && started && <Toolbar className="no-select" onChange={selectedTool} />}
        </div>
    );
}

Game.propTypes = {
    map: PropTypes.object.isRequired
};

export default Game;
