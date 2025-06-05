import * as Phaser from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import {MatterAttractors} from '../lib/attractors';
import PropTypes from 'prop-types';
import React from 'react';
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


class Game extends React.Component {

    constructor(props) {
        super(props);

        const fetchInt = (key) => {
            let n = parseInt(localStorage.getItem(key) || 0);
            return isNaN(n) ? 0 : n;
        }

        this.state = {
            tool: TOOLS[0],
            score: 0,
            topScore: fetchInt(`top_score_${this.props.map.name.replace(/\s+/g, '_')}`),
            logs: 'Loading...',
            showMenu: true,
            started: false,
        };
    }

    setupPhaser() {
        const {map} = this.props;

        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: 'phaser',
            // width: natural.width > window.innerWidth ? window.innerWidth : natural.width,
            // height: natural.height > window.innerHeight ? window.innerHeight : natural.height,
            // width: natural.width * window.devicePixelRatio,
            // height: natural.height * window.devicePixelRatio,
            ...natural,
            // dom: {
            //     createContainer: true
            // },
            physics: {
                default: 'matter',
            },
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
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

        this.game.getState = (k) => this.state[k];
        this.game.scene.start('preload', {stage: map});

        this.game.events.on('score', (score) => {
            const newTopScore = Math.max(score, this.state.topScore);
            if (newTopScore > this.state.topScore) {
                const mapKey = `top_score_${this.props.map.name.replace(/\s+/g, '_')}`;
                localStorage.setItem(mapKey, newTopScore);
            }
            this.setState({score, topScore: newTopScore});
        });
        this.game.scale.once('resize', () => this.resizeContainer());

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') {
                this.setState({showMenu: true});
                const board = this.game.scene.getScene('board');
                if (board && !this.game.scene.isPaused('board')) {
                    this.game.scene.pause('board');
                    if (board.current_track && board.current_track.isPlaying) {
                        board.current_track.pause();
                    }
                }
            }
        });
        this.resizeContainer();
    }

    componentDidMount() {
        const url = window.location.href
        if (url.indexOf('cheat') > -1) {
            this.setState({cheat: true});
        }
        this.setupPhaser();
    }


    componentDidUpdate({map}) {
        if (map !== this.props.map) {
            const fetchInt = (key) => {
                let n = parseInt(localStorage.getItem(key) || 0);
                return isNaN(n) ? 0 : n;
            }
            const newTopScore = fetchInt(`top_score_${this.props.map.name.replace(/\s+/g, '_')}`);
            this.setState({ score: 0, started: false, topScore: newTopScore });
            this.game.scene.stop('board');
            this.game.scene.start('preload', {stage: this.props.map});
        }
    }


    componentWillUnmount() {
        // this.game.scene.restart();
    }

    resizeContainer() {
        window.setTimeout(() => {
            const canvasStyle = document.querySelector('#phaser canvas').getAttribute("style");
            document.querySelector('.game').setAttribute("style", canvasStyle);
        }, 10);
    }

    restartScene() {
        this.setState({ showMenu: false, started: true, score: 0 });

        const opts = {stage: this.props.map};
        this.game.scene.stop('board', opts);
        this.game.scene.start('board', opts);
    }

    togglePause() {
        const board = this.game.scene.getScene('board');
        if (this.game.scene.isPaused('board')) {
            this.setState({showMenu: false});
            this.game.scene.resume('board');
            if (board && board.current_track && board.current_track.isPaused) {
                board.current_track.resume();
            }
        } else {
            this.setState({showMenu: true});
            this.game.scene.pause('board');
            if (board && board.current_track && board.current_track.isPlaying) {
                board.current_track.pause();
            }
        }
    }


    selectedTool(tool) {
        this.setState({tool})
    }

    switchMap(mapIndex) {
        Router.push({
            pathname: '/',
            query: { map: mapIndex + 1 },
        });
    }

    render() {
        return <div className="game no-select">
            <ScoreBoard
                title={this.props.map.name}
                score={this.state.score}
                topScore={this.state.topScore}
                logs={this.state.logs}
                onClick={() => {
                    this.togglePause();
                }}
            />
            <MainMenu
                active={this.state.showMenu}
            >
                {this.state.started && (
                    <button onClick={() => this.togglePause()} onTouchEnd={() => this.togglePause()}>
                        Resume
                    </button>
                )}
                <button onClick={() => this.restartScene()} onTouchEnd={() => this.restartScene()}>
                    {this.state.started ? 'Restart' : 'Start'}
                </button>
                <div style={{textAlign: 'center'}}>
                    <h3>Maps</h3>
                    {maps.map((map, index) => (
                        <button 
                            key={index}
                            onClick={() => this.switchMap(index)}
                            onTouchEnd={() => this.switchMap(index)}
                            style={{
                                display: 'block',
                                width: '100%',
                                marginBottom: '0.5em',
                                textAlign: 'left',
                                fontSize: '0.8em',
                            }}
                        >
                            {index + 1}. {map.name}
                        </button>
                    ))}
                </div>
            </MainMenu>
            {!this.state.showMenu && this.state.started && <Toolbar className="no-select" onChange={(tool) => this.selectedTool(tool)} /> }
        </div>
    }
}

Game.propTypes = {
    map: PropTypes.object.isRequired
};

export default Game;
