import React, { useState } from 'react';
import Matter from 'matter-js';
import {config as map} from '../components/maps.js';
import {Howl, Howler} from 'howler';
import styled from 'styled-components';

import {ragdoll} from '../components/ragdoll.js'

const Score = styled.div`
  font-size: 1.5em;
  text-shadow: 2px 2px 10px #000;
  color: white;
  text-align: center;
`;

export class Game extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      engine: null,
      render: null,
      score: 0,
      bonus_per_second: 1,
      total_clicks: 0,
      generating: false,
      bonus_size: 10,
    };
  }

  componentDidMount() {
    var Engine = Matter.Engine,
        Render = Matter.Render,
        World = Matter.World,
        Bodies = Matter.Bodies;

    // create an engine
    var engine = Engine.create(); 
    // react-measure
    // 800 x 480 Out[3]: 1.7777777777777777
    let {height} = this.props;
    let width = height * 0.6; // 800 x 480
    let thickness = 100;

    // create a renderer
    var render = Render.create({
        element: this.el,
        engine: engine,
        options: {
          background: map.background,
          width: width,
          height: height,
          //showAngleIndicator: true,
          // showCollisions: true,
          // showVelocity: true,
          wireframes: false,
          // showVelocity: true,
          // showCollisions: true,
          // showSeparations: true,
          // showAxes: true,
          // showPositions: true,
          // showAngleIndicator: true,
          // showIds: true,
          // showShadows: true,
          // showVertexNumbers: true,
          // showConvexHulls: true,
          // showInternalEdges: true,
          // showMousePosition: true,
        }
    });

    // Matter.Bodies.rectangle(x, y, width, height, [options]) -> Body
    var top =    Bodies.rectangle(width / 2, thickness / -2 + 1,      width, thickness, { isStatic: true });
    var bottom = Bodies.rectangle(width / 2, height + (map.y_increment * 2) + (thickness * 0.5), width, thickness, { isStatic: true });
    var left =   Bodies.rectangle( thickness / -2, height / 2,      thickness, height, { isStatic: true });
    var right =  Bodies.rectangle( width + thickness / 2, height / 2 - 1,  thickness, height, { isStatic: true });

    this.buildMap(engine.world, map);

    // add all of the bodies to the world
    World.add(engine.world, [bottom, left, right]);

    // add mouse control
    var mouse = Matter.Mouse.create(render.canvas),
        mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 1,
                render: { visible: false }
            }
        });

    Matter.Events.on(mouseConstraint, 'mouseup', (event) => {
      map.onMouseUp.bind(this)(event.mouse.position);
      this.setState({
        total_clicks: this.state.total_clicks + 1,
        bonus_per_second: this.state.bonus_per_second + 1,
      });
    });
    World.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // setup audio
    const pings = map.audio.pings.map((src) => new Howl({src}));

    // an example of using collisionStart event on an engine
    const PING_VOLUME_CLIP = Math.pow(8, 4);
    Matter.Events.on(engine, 'collisionStart', (event) => {
      var pairs = event.pairs;
      for (const pair of pairs) {
        if (pair.bodyA.isStatic || pair.bodyB.isStatic) {
          map.onPeg.bind(this)(pair.bodyA, pair.bodyB);
        }

        if (pair.bodyA.isSensor || pair.bodyB.isSensor) {
          for (const key of Object.keys(map.goals)) {
            const goal = map.goals[key];
            if (goal.body === pair.bodyA) {
              goal.onCollision(this, pair.bodyB); 
            }
            if (goal.body === pair.bodyB) {
              goal.onCollision(this, pair.bodyA); 
            }
          }
        }

        let volume = Math.pow(pair.bodyB.speed, 3) / PING_VOLUME_CLIP;
        volume = volume > 1 ? 1 : volume;
        if (volume > 0.01) {
          const sound = Matter.Common.choose(pings);
          //const sound = new Howl({src, volume: (volume > 1 ? 1 : volume)});
          sound.volume(volume, sound.play())
        }
        if (pair.bodyA === bottom) {
          map.onBottom.bind(this)(pair.bodyB);
          Matter.Composite.remove(engine.world, pair.bodyB);
        }
      }
    });


    // start evertying
    Render.run(render);
    Engine.run(engine);

    let score = parseInt(window.localStorage.getItem('score') || '0');
    this.setState({render, engine, score})
  }

  onStart() {
    if (this.state.generating) {
      // already started
      return;
    }
    this.setState({generating: true});

    let off_center = 24;
    let balls = 0;
    let {width} = this.state.render.options;

    let bonus_generator = () => {
      if (!document.hidden) {
        map.onBonus(this);
      }
      window.setTimeout(bonus_generator, parseInt(1000 / this.state.bonus_per_second) );
    };
    bonus_generator();

    this.onSecond();
  }

  addBody(body) {
    Matter.World.add(this.state.engine.world, body)
  }

  onSecond() {
    this.saveScore();

    let {bonus_per_second} = this.state;

    bonus_per_second = bonus_per_second - 1;
    if (bonus_per_second < 1) {
      bonus_per_second = 1;
    }
    this.setState({bonus_per_second});
    window.setTimeout(() => this.onSecond(), 1000);
  }

  saveScore() {
    localStorage.setItem('score', this.state.score);
  }

  buildMap(world, {layout, x_increment, y_increment}) {
    let y = 0;
    let lines = layout.split("\n");
    lines.splice(0,1);
    for (const line of lines) {
      let x = 0;
      for (const c of line) {
        const obj = map.statics[c]
        if (obj) {
          Matter.World.add( world, obj(x, y));
        }
        x += x_increment;
      }
      y += y_increment;
    }
  }

  componentWillUnmount() {
    const {render, engine} = this.state;

    Howler.stop();
    Matter.Render.stop(render);
    Matter.Events.off(engine);
    Matter.Engine.clear(engine);
  }

  render() {
    return (
    <div onClick={() => this.onStart() }>
      <div><small>Bonus per Second (Click to increase!):</small> {this.state.bonus_per_second} ({parseInt(1000 / this.state.bonus_per_second)} ms)</div>
      <div><small>Clicks:</small> {this.state.total_clicks}</div>
        <div><small>Bonus Size:</small>
          <input
            type="number" 
            min="1"
            max="100"
            value={this.state.bonus_size}
            onChange={(e) => this.setState({bonus_size: e.target.value})}
          />
          </div>
      <Score>{this.state.score.toLocaleString()}</Score> 
      <div ref={el => this.el = el} />
    </div>
    );
  }
}
