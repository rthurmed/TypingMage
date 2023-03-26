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
const SLIME_SPEED = 20
const SLIME_TIME_TO_INCREASE_AMOUNT = 20 // seconds
const CASTLE_SIZE = 56
const MAX_GAME_TIME = 60 * 4 // seconds
const UI_Z = 200
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

const kaboomInstance = kaboom({
  width: 224,
  height: 256,
  crisp: true,
  scale: 3,
  font: 'basic',
  background: [55, 37, 56]
})

focus()

loadFont('basic', 'fonts/basic.png', 8, 8, { chars: "abcdefghijklmnopqrstuvwxyz #1234567890.,()[]:" })
loadSprite("bean", "sprites/bean.png")
loadSprite("background", "sprites/background.png")
loadSprite("mage", "sprites/mage.png")
loadSprite("slime", "sprites/slime.png")

onKeyRelease('=', () => (debug.paused = !debug.paused))

const background = [
  pos(-16, -16,),
  sprite('background'),
  z(-2)
]

scene('win', () => {
  add(background)
  add([
    pos(width() / 2, height() / 2),
    text('you\nwin', {
      size: 32
    }),
    kaboomInstance.origin('center')
  ])
})

scene('gameover', () => {
  add(background)
  add([
    pos(width() / 2, height() / 2),
    text('game\nover', {
      size: 32
    }),
    kaboomInstance.origin('center')
  ])
})

scene('main', () => {
  add(background)
  
  const timer = add([
    pos(width() / 2, 16),
    z(UI_Z),
    text('01:23'),
    color(WHITE),
    kaboomInstance.origin('center'),
    {
      time: 0,
      update () {
        const minutes = Math.floor(this.time / 60)
        const seconds = this.time - minutes * 60
        const strSeconds = seconds.toString().padStart(2, '0')
        const strMinutes = minutes.toString().padStart(2, '0')
        this.text = `${strMinutes}:${strSeconds}`
      }
    }
  ])
  
  const backPrompt = add([
    pos(width() / 2, height() - 16),
    text(''),
    color(GREEN),
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
  timer.time = MAX_GAME_TIME

  loop(1 ,() => {
    timer.time -= 1
    timer.update()
    if (timer.time <= 0) {
      go('win')
    }
  })
  
  const walls = [
    add([
      pos(0, 0),
      rect(16, height()),
      kaboomInstance.origin('topright'),
      area(),
      solid(),
      opacity(0),
    ]),
    add([
      pos(width(), 0),
      rect(16, height()),
      kaboomInstance.origin('topleft'),
      area(),
      solid(),
      opacity(0),
    ])
  ]
  
  const castle = add([
    pos(width() / 2, height() - CASTLE_SIZE),
    kaboomInstance.origin('top'),
    opacity(0),
    z(-1),
    rect(width(), height()),
    area(),
    health(3),
    'castle'
  ])
  
  const mage = add([
    sprite('mage'),
    pos(width() / 2, height() - 32),
    kaboomInstance.origin('bot'),
    area({
      height: 16,
      width: 16
    }),
    body(),
    gravity(0),
    {
      shooting: false,
      shoot () {
        add([
          pos(this.pos),
          kaboomInstance.origin('center'),
          circle(16),
          color(255, 191, 54),
          outline(2, Color.fromArray([196, 77, 41])),
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
    prompt.color = RED
  }
  
  const stopShooting = () => {
    if (!mage.shooting) {
      return
    }
    mage.shooting = false
    prompt.color = WHITE
    prompt.reset()
  }
  
  onKeyPress('space', startShooting)
  onKeyPress('enter', startShooting)
  onKeyPress('backspace', stopShooting)
  
  onCharInput((char) => {
    if (LETTERS.indexOf(char) < 0) {
      return
    }
    if (!mage.shooting) {
      startShooting()
    }
    const completed = prompt.read(char)
    if (completed) {
      stopShooting()
      mage.shoot()
    }
  })
  
  const slime = () => [
    sprite('slime'),
    pos(rand(SLIME_SIZE / 2, width() - SLIME_SIZE / 2), -SLIME_SIZE),
    kaboomInstance.origin('bot'),
    area({
      height: 16,
      width: 16
    }),
    move(DOWN, SLIME_SPEED),
    'slime',
  ]
  
  let slimeSpawnDelay = 3
  
  const spawnSlime = () => {
    add([
      ...slime()
    ])
    wait(slimeSpawnDelay, spawnSlime)
  }
  
  spawnSlime()
  
  loop(SLIME_TIME_TO_INCREASE_AMOUNT, () => {
    slimeSpawnDelay = slimeSpawnDelay * 0.95
    console.log({ slimeSpawnDelay })
  })
  
  onCollide('fireball', 'slime', (fireball, slime) => {
    destroy(slime)
  })
  
  onCollide('slime', 'castle', (slime, castle) => {
    castle.hurt(1)
    shake(10)
    destroy(slime)
    // TODO: update UI
    if (castle.hp() <= 0) {
      go('gameover')
    }
  })
})

go('main')
