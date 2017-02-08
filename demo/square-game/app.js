// config
const SQUARE_SIZE = 20;
const TARGET_DISTANCE = 5;
const TICK_INTERVAL = 200;

// constants
const TOP = 'top';
const RIGTH = 'right';
const BOTTOM = 'bottom';
const LEFT = 'left';

const CSS_SQUARE = 'square';
const CSS_SQUARE_USER = 'square-user';
const CSS_SQUARE_WIN = 'square-win';

class Mask {
  constructor (maskEl) {
    this.maskEl = maskEl;
  }

  show (text, color) {
    this.maskEl.style.display = 'block';
    this.maskEl.style.color = color;
    this.maskEl.innerHTML = text;
  }

  hide () {
    this.maskEl.style.display = 'none';
    this.maskEl.style.color = '';
    this.maskEl.innerHTML = '';
  }
}

class Game {
  constructor (box, mask) {
    this.mask = mask;
    this.height = box.scrollHeight;
    this.width = box.scrollWidth;
    this.initState();
    this.renderField();
  }

  renderField () {
    while (true) {
      const el = document.createElement('DIV');
      el.className = CSS_SQUARE;
      box.appendChild(el);
      const rect = el.getBoundingClientRect();
      if (rect.top > this.height - SQUARE_SIZE) {
        break;
      }
    }
  }

  isStarted () {
    return Boolean(this.userEl);
  }

  isSquare (el) {
    return el.className.split(' ').includes(CSS_SQUARE);
  }

  setUserPosition (el) {
    el.className = `${CSS_SQUARE} ${CSS_SQUARE_USER}`;
    this.userEl = el;
  }

  cleanPosition (el) {
    el.className = CSS_SQUARE;
  }

  getUserXY () {
    if (this.userEl) {
      const rect = this.userEl.getBoundingClientRect();
      return [rect.left, rect.top];
    }
    return [];
  }

  selectTargetElement () {
    const generateRandom = (max) => {
      return ((SQUARE_SIZE / 2) + (Math.random() * (max - SQUARE_SIZE)));
    };
    const [userX, userY] = this.getUserXY();
    let x;
    let y;
    while (true) {
      x = generateRandom(this.width);
      y = generateRandom(this.height);
      if (Math.sqrt(Math.pow(x - userX, 2) + Math.pow(y - userY, 2)) > TARGET_DISTANCE * SQUARE_SIZE) {
        break;
      }
    }
    this.targetEl = document.elementFromPoint(x, y);
    this.targetEl.className = `${CSS_SQUARE} ${CSS_SQUARE_WIN}`;
  }

  updateMovementVector (x, y) {
    const rect = this.userEl.getBoundingClientRect();
    const vectorX = x - rect.left;
    const vectorY = y - rect.top;

    if (Math.abs(vectorX) > Math.abs(vectorY)) {
      this.vector = (vectorX > 0 ? RIGTH : LEFT);
    } else {
      this.vector = (vectorY > 0 ? BOTTOM : TOP);
    }
  }

  tick () {
    let [userX, userY] = this.getUserXY();

    switch (this.vector) {
      case TOP:
        userY -= SQUARE_SIZE;
        break;
      case RIGTH:
        userX += SQUARE_SIZE;
        break;
      case BOTTOM:
        userY += SQUARE_SIZE;
        break;
      case LEFT:
        userX -= SQUARE_SIZE;
        break;
    }

    const nextEl = document.elementFromPoint(userX, userY);

    if (nextEl == this.targetEl) {
      this.win();
    } else if (nextEl && this.isSquare(nextEl)) {
      this.cleanPosition(this.userEl);
      this.setUserPosition(nextEl);
      this.timer = setTimeout(() => this.tick(), TICK_INTERVAL);
    } else {
      this.lose();
    }
  }

  initState () {
    if (this.userEl) {
      this.cleanPosition(this.userEl);
    }
    if (this.targetEl) {
      this.cleanPosition(this.targetEl);
    }
    clearTimeout(this.timer);
    this.userEl = null;
    this.targetEl = null;
    this.vector = RIGTH;
  }

  start (el) {
    mask.hide();
    this.initState();
    this.setUserPosition(el);
    this.selectTargetElement();
    this.tick();
  }

  win () {
    this.initState();
    this.mask.show('WIN', 'green');
  }

  lose () {
    this.initState();
    this.mask.show('LOSE', 'red');
  }
}

// start

const boxEl = document.getElementById('box');
const maskEl = document.getElementById('mask');

const mask = new Mask(maskEl);
const game = new Game(boxEl, mask);

boxEl.addEventListener('click', ({target, clientX: x, clientY: y}) => {
  if (game.isStarted()) {
    game.updateMovementVector(x, y);
  } else {
    game.start(target);
  }
});

maskEl.addEventListener('click', () => game.mask.hide());
