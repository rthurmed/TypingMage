import kaboom from "kaboom"
import randomWords from 'random-words'

// source: https://stackoverflow.com/questions/1431094/how-do-i-replace-a-character-at-a-particular-index-in-javascript
const replaceAt = (string: string, index: number, replacement: string) => {
  return string.substring(0, index) + replacement + string.substring(index + replacement.length)
}

const FONT_SIZE = 8
const PROMPT_MAX = 8
const MAGE_SPEED = 100
const ATTACK_SPEED = 300
const SLIME_SIZE = 16
const SLIME_SPEED = 10

const kaboomInstance = kaboom({
  width: 224,
  height: 256,
  crisp: true,
  scale: 3,
  font: 'basic',
  background: [57, 133, 90]
})

focus()

loadFont('basic', 'fonts/basic.png', 8, 8, { chars: "abcdefghijklmnopqrstuvwxyz #1234567890.,()[]:" })
loadSprite("bean", "sprites/bean.png")

onClick(() => kaboomInstance.addKaboom(mousePos()))
onKeyRelease('=', () => (debug.paused = !debug.paused))

debug.inspect = true

const timer = add([
  pos(width() / 2, 16),
  text('01:23'),
  color(WHITE),
  kaboomInstance.origin('center')
])

const backPrompt = add([
  pos(width() / 2, height() - 16),
  text(''),
  color(BLACK),
  kaboomInstance.origin('center')
])

const prompt = add([
  pos(width() / 2, height() - 16),
  text(''),
  color(WHITE),
  kaboomInstance.origin('center'),
  {
    currentChar: 0,
    reset () {
      this.currentChar = 0

      const words = randomWords({ exactly: 1, maxLength: PROMPT_MAX })
      const text = words[0]

      this.text = text
      backPrompt.text = text
    },
    read (char: string): boolean {
      if (this.text[this.currentChar] !== char) {
        return false
      }
      this.text = replaceAt(this.text, this.currentChar, ' ')
      this.currentChar += 1
      return this.currentChar >= this.text.length
    }
  }
])

prompt.reset()

onKeyPress('/', () => {
  prompt.reset()
})

const walls = [
  add([
    pos(0, 0),
    rect(16, height()),
    kaboomInstance.origin('topright'),
    area(),
    solid()
  ]),
  add([
    pos(width(), 0),
    rect(16, height()),
    kaboomInstance.origin('topleft'),
    area(),
    solid()
  ])
]

const mage = add([
  rect(16, 16),
  pos(width() / 2, height() - 32),
  kaboomInstance.origin('bot'),
  color(WHITE),
  area(),
  body(),
  gravity(0),
  {
    shooting: false,
    shoot () {
      add([
        pos(this.pos),
        kaboomInstance.origin('center'),
        circle(16),
        color(RED),
        area({
          shape: "circle",
          height: 32,
          width: 32
        }),
        move(UP, ATTACK_SPEED),
        cleanup(),
        'fireball'
      ])
    }
  }
])

const moveMage = (direction: number) => {
  if (mage.shooting) {
    return
  }
  mage.pos.x += direction * MAGE_SPEED * dt()
}

const moveMageLeft = () => moveMage(-1)
const moveMageRight = () => moveMage(1)

onKeyDown(',', moveMageLeft)
onKeyDown('.', moveMageRight)
onKeyDown('left', moveMageLeft)
onKeyDown('right', moveMageRight)

const startShooting = () => {
  mage.shooting = true
  mage.color = RED
  prompt.color = mage.color
}

const stopShooting = () => {
  if (!mage.shooting) {
    return
  }
  mage.shooting = false
  mage.color = WHITE
  prompt.color = mage.color
  prompt.reset()
}

onKeyPress('space', startShooting)
onKeyPress('enter', startShooting)
onKeyPress('backspace', stopShooting)

onCharInput((char) => {
  if (!mage.shooting) {
    return
  }
  const completed = prompt.read(char)
  if (completed) {
    stopShooting()
    mage.shoot()
  }
})

const slime = () => [
  pos(rand(SLIME_SIZE / 2, width() - SLIME_SIZE / 2), -SLIME_SIZE),
  kaboomInstance.origin('bot'),
  rect(SLIME_SIZE, SLIME_SIZE),
  color(GREEN),
  area(),
  move(DOWN, SLIME_SPEED),
  'slime',
]

// TODO: spawn logic
onKeyRelease('[', () => {
  add([
    ...slime()
  ])
})

onCollide('fireball', 'slime', (fireball, slime) => {
  destroy(slime)
})
