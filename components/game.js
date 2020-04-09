import React, { useState } from 'react';
import Matter from 'matter-js';
import {config as map} from '../components/maps.js';
import {Howl, Howler} from 'howler';
import styled from 'styled-components';

const Score = styled.div`
  color: white;
  float: right;
  position: relative;
  margin-bottom: -100%;
  padding: .5em 1em;
`;

export class Game extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      engine: null,
      render: null,
      score: 0,
      generating: false,
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
          showVelocity: true,
          showCollisions: true,
          showSeparations: false,
          showAxes: false,
          showPositions: false,
          showAngleIndicator: false,
          showIds: false,
          showShadows: false,
          showVertexNumbers: false,
          showConvexHulls: false,
          showInternalEdges: false,
          showMousePosition: false,
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
    });
    World.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // setup audio
    const pings = map.audio.pings.map((src) => new Howl({src}));

    // an example of using collisionStart event on an engine
    const PING_VOLUME_CLIP = Math.pow(8, 3);
    Matter.Events.on(engine, 'collisionStart', (event) => {
      var pairs = event.pairs;
      for (const pair of pairs) {
        if (pair.bodyA.isStatic || pair.bodyB.isStatic) {
          map.onPeg.bind(this)(pair.bodyA, pair.bodyB);

          let volume = Math.pow(pair.bodyB.speed, 3) / PING_VOLUME_CLIP / 4;
          volume = volume > 1 ? 1 : volume;
          if (volume > 0.01) {
            const sound = Matter.Common.choose(pings);
            //const sound = new Howl({src, volume: (volume > 1 ? 1 : volume)});
            sound.volume(volume, sound.play())
          }
          if (pair.bodyA === bottom) {
            map.onBottom.bind(this)();
            Matter.Composite.remove(engine.world, pair.bodyB);
          }
        }
      }
    });


    // start evertying
    Render.run(render);
    Engine.run(engine);
    this.setState({render, engine, score: 0})
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

    let generator = () => {
      if (!document.hidden) {
        const ball_x = width / 2 + Matter.Common.random(off_center) - (off_center * 0.5);
        Matter.World.add(this.state.engine.world,
          Matter.Bodies.circle(ball_x, 0 - 50, map.puck.diameter, {
            ...map.puck.body,
            render: {
              fillStyle: Matter.Common.choose(map.puck.colors)
            }
          })
        );
        balls += 1;
      }
      window.setTimeout(generator, 250 + Matter.Common.random(1000) );
    };
    generator();
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

  componentDidUpdate() {
  }

  componentWillUnmount() {
    const {render, engine} = this.state;

    Howler.stop();
    Matter.Render.stop(render);
    Matter.Events.off(engine);
    Matter.Engine.clear(engine);
  }

  render() {
    return <div onClick={() => this.onStart() }>
      <Score>{this.state.score}</Score> 
      <div ref={el => this.el = el} />
    </div>;
  }
}
