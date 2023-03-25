import kaboom from "kaboom"

const kaboomInstance = kaboom({
  width: 800,
  height: 600,
  crisp: true
})

loadFont('basic', 'fonts/basic.png', 8, 8, {
  chars: "abcdefghijklmnopqrstuvwxyz #1234567890.,()[]"
})

loadSprite("bean", "sprites/bean.png")

add([
	pos(120, 80),
	sprite("bean"),
])

onClick(() => kaboomInstance.addKaboom(mousePos()))
