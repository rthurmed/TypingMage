import kaboom from "kaboom"
import randomWords from 'random-words'

// source: https://stackoverflow.com/questions/1431094/how-do-i-replace-a-character-at-a-particular-index-in-javascript
const replaceAt = (string: string, index: number, replacement: string) => {
  return string.substring(0, index) + replacement + string.substring(index + replacement.length)
}

const FONT_SIZE = 8
const PROMPT_MAX = 8
const MAGE_SPEED = 100

const kaboomInstance = kaboom({
  width: 224,
  height: 256,
  crisp: true,
  scale: 3,
  font: 'basic',
  background: [57, 133, 90]
})

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
    shooting: false
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

const toggleShooting = () => {
  mage.shooting = !mage.shooting

  mage.color = mage.shooting ? RED : WHITE
  prompt.color = mage.color

  if (mage.shooting) {
    // started shooting

  } else {
    // stopped shooting
    prompt.reset()
  }
}

const cancelShooting = () => {
  if (!mage.shooting) {
    return
  }
  mage.shooting = false
  mage.color = WHITE
  prompt.reset()
}

onKeyPress('space', toggleShooting)
onKeyPress('enter', toggleShooting)

onCharInput((char) => {
  if (!mage.shooting) {
    return
  }
  const completed = prompt.read(char)
  if (completed) {
    toggleShooting()
    // TODO: shoot fireball
  }
})

