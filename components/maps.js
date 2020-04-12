import Matter from 'matter-js'
import {ragdoll} from '../components/ragdoll.js'

const {circle, rectangle} = Matter.Bodies;

const staticProps = {
  isStatic: true,
  render: {fillStyle: '#8F671F'}
}

const DEFAULT_PUCK_BODY = {
  restitution: 0.4,
  density:  0.9,
  friction: 0.001,
  frictionAir: 0,
  frictionStatic: 0,
  render: {
    lineWidth: 3,
    strokeStyle: '#6F471F',
  }
}

const SLOT_POINTS_MULT = {
  1: 1,
  4: 5,
  7: 25,
  10: 100,
  13: 1000,
  14: 1000
}

const x_increment = 16,
      y_increment = 25;

class Goal {
  constructor({bonus}) {
    this.bonus = bonus;
    this.body = undefined;
  }

  createBody(x, y) {
    this.body = rectangle(x + x_increment/2, y + y_increment * 0.3, x_increment * 2, y_increment, {
      isStatic: true,
      isSensor: true,
      render: {
        fillStyle: 'transparent',
        strokeStyle: '#888',
        lineWidth: 4,
      }
      }
    )
    return this.body;
  }

  onCollision(game, otherBody) {
    let {score, render} = game.state;
    const points =  this.bonus * (otherBody.area < 300 ? 1 : 10);
    game.setState({score: score + points});
  }
}
const GOALS = {
  'A': new Goal({bonus: 1000}),
  'B': new Goal({bonus: 100}),
  'C': new Goal({bonus: 25}),
  'D': new Goal({bonus: 10}),
  'E': new Goal({bonus: 1}),
}

function renderGoal(x,y) {
  return rectangle(x + x_increment/2, y + y_increment * 0.3, x_increment * 2, y_increment, {
    isStatic: true,
    isSensor: true,
    render: {
      fillStyle: 'transparent',
      strokeStyle: '#888',
      lineWidth: 4,
    }
  })
}

export const config = {
  x_increment,
  y_increment,
  puck: {
    diameter: 10,
    //diameter: 18,
    body: DEFAULT_PUCK_BODY,
  },
  background: "url('/bamboo-bg.jpg') center center fixed",
  layout: `
            |     |
            |     |
            O     O

O     O     O     O     O     O

   O     O     O     O     O

O     O     O     O     O     O

   O     O     O     O     O
                            
O     O     O     O     O     O

   O     O     O     O     O

O     O     O     O     O     O

   O     O     O     O     O
                            
O     O     O     O     O     O
|                             |
|  O     O     O     O     O  |
|  |                       |  |
|  |  O     O     O     O  |  |
|  |  |                 |  |  |
|  |  |  O     O     O  |  |  |
|  |  |  |           |  |  |  |
|  |  |  |  O     O  |  |  |  |
|  |  |  |  |     |  |  |  |  |
|  |  |  |  |  O  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |
|A |B |C |D |E |E |D |C |B |A |`,
  statics: {
    'O': (x,y) => circle(x, y, x_increment/2, staticProps),
    '|': (x,y) => rectangle(x, y, x_increment/2, y_increment+1, staticProps),
    'i': (x,y) => [
          circle(x, y - y_increment / 4, 4, staticProps),
          rectangle(x, y + y_increment * 0.3, 8, 12.5, staticProps)
         ],
    'A': (x,y) => GOALS['A'].createBody(x,y),
    'B': (x,y) => GOALS['B'].createBody(x,y),
    'C': (x,y) => GOALS['C'].createBody(x,y),
    'D': (x,y) => GOALS['D'].createBody(x,y),
    'E': (x,y) => GOALS['E'].createBody(x,y),
  },
  goals: GOALS,
  audio: {
    pings: [
      '/audio/wood-01.flac',
      '/audio/wood-02.flac',
      '/audio/wood-03.flac',
      '/audio/wood-04.flac',
      '/audio/wood-05.flac',
      '/audio/wood-06.flac',
    ]
  },
  onBonus(game) {
    const {engine, render, bonus_size} = game.state,
          {width} = render.options,
          off_center = x_increment*2,
          ball_x = width / 2 + Matter.Common.random(off_center) - (off_center / 2);
    game.addBody(circle(ball_x, 0 - 50, bonus_size, DEFAULT_PUCK_BODY));
  },
  onBottom(body) {
    // let {score, render} = this.state;
    // const {width} = render.options;
    // const off_center = Math.abs(body.position.x - (width / 2));
    // const slot = parseInt(off_center / x_increment);
    // const points =  SLOT_POINTS_MULT[slot] || 1 * (body.area < 300 ? 1 : 10);
    // this.setState({score: score + points});
  },
  onPeg(bodyA, bodyB) {
    // let {score} = this.state;
    // this.setState({score: this.state.score + 1});
  },
  onMouseUp({x, y}) {
    var diameter = 18;
    const {engine, render} = this.state;
    const {width} = render.options;
    Matter.World.add(engine.world,
      // ragdoll(x, -10, 0.25)
     Matter.Bodies.circle(x, diameter * -0.5, diameter, DEFAULT_PUCK_BODY)
      // Matter.Bodies.circle(x, y, diameter, DEFAULT_PUCK_BODY)
    );
  }
}
