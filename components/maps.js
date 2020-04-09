import Matter from 'matter-js'

const staticProps = {
  isStatic: true,
  render: {fillStyle: '#65737E'}
}

const DEFAULT_PUCK_BODY = {
  restitution: 0.4,
  density:  0.5,
  friction: 0.001,
  frictionAir: 0,
  frictionStatic: 0,
}

export const config = {
  puck: {
    diameter: 18,
    body: DEFAULT_PUCK_BODY,
    colors: [ "#AB4642", "#A1B56C", "#F7CA88", "#7CAFC2", "#BA8BAF", "#86C1B9", "#D8D8D8", "#DC9656", "#A16946",
    ]
  },
  background: '#2B303B',
  x_increment: 16,
  y_increment: 25,
  layout: `
            |     |
            |     |


   O     O     O     O     O

O     O     O     O     O     O

   O     O     O     O     O

O     O     O     O     O     O

   O     O     O     O     O

O     O     O     O     O     O

   O     O     O     O     O

O     O     O     O     O     O

   O     O     O     O     O

O     O     O     O     O     O

   O     O     O     O     O

O     O     O     O     O     O

   O     O     O     O     O

i  i  i  i  i  i  i  i  i  i  i
|  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |`,
  statics: {
    'O': (x,y) => Matter.Bodies.circle(x, y, 8, {...staticProps, 
       ...{render: {fillStyle: '#D0A98F'}}
    }),
    '|': (x,y) => Matter.Bodies.rectangle(x, y, 8, 26, staticProps),
    'i': (x,y) => [
          Matter.Bodies.circle(x, y - 25 / 4, 4, staticProps),
          Matter.Bodies.rectangle(x, y + 25 * 0.3, 8, 12.5, staticProps)
         ]
  },
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
  onBottom() {
    let {score} = this.state;
    this.setState({score: score + 100});
  },
  onPeg(bodyA, bodyB) {
    let {score} = this.state;
    this.setState({score: this.state.score + 1});
  },
  onMouseUp({x, y}) {
    var diameter = 10;
    const {engine, render} = this.state;
    const {width} = render.options;
    Matter.World.add(engine.world, 
      Matter.Bodies.circle(x, diameter * -0.5, diameter, DEFAULT_PUCK_BODY)
    );
  }
}
