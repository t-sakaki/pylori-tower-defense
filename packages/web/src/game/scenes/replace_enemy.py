import sys

def main():
    filename = 'GameScene.ts'
    with open(filename, 'r') as f:
        lines = f.readlines()

    # Find the indices of the start and end markers
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(lines):
        if line.strip() == '/** 敵クラス */':
            start_idx = i
        if line.strip() == '/** 弾クラス */' and start_idx != -1:
            end_idx = i
            break

    if start_idx == -1 or end_idx == -1:
        print("Could not find markers")
        sys.exit(1)

    # The new class definition (without the markers)
    new_class_lines = [
        'class Enemy extends Phaser.GameObjects.Container {\n',
        '  sprite: Phaser.GameObjects.Sprite;\n',
        '  hp: number;\n',
        '  maxHp: number;\n',
        '  speed: number;\n',
        '  reward: number;\n',
        '  waypoints: Waypoint[];\n',
        '  currentWp = 0;\n',
        '  private hpBar: Phaser.GameObjects.Graphics;\n',
        '  private readonly RADIUS = 12;\n',
        '\n',
        '  constructor(scene: Phaser.Scene, waypoints: Waypoint[], config: typeof ENEMY_CONFIGS[\\'scout\\']) {\n',
        '    super(scene, waypoints[0].x, waypoints[0].y);\n',
        '\n',
        '    // Enemy sprite (body)\n',
        '    this.sprite = scene.add.sprite(0, 0, \\'h-pylori\\');\n',
        '    this.sprite.setOrigin(0.5);\n',
        '    this.sprite.setScale(0.5); // adjust size as needed\n',
        '    this.add(this.sprite);\n',
        '\n',
        '    // Health bar\n',
        '    this.hpBar = scene.add.graphics();\n',
        '    this.add(this.hpBar);\n',
        '    this.drawHpBar();\n',
        '\n',
        '    // Set properties\n',
        '    this.waypoints = waypoints;\n',
        '    this.hp = config.hp;\n',
        '    this.maxHp = config.hp;\n',
        '    this.speed = config.speed;\n',
        '    this.reward = config.reward;\n',
        '\n',
        '    // Add to scene\'s update list\n',
        '    scene.add.existing(this);\n',
        '  }\n',
        '\n',
        '  private drawHpBar() {\n',
        '    this.hpBar.clear();\n',
        '    const ratio = this.hp / this.maxHp;\n',
        '    const w = 24;\n',
        '    const h = 4;\n',
        '    this.hpBar.fillStyle(0x000000, 0.5);\n',
        '    this.hpBar.fillRect(-w / 2, -20, w, h);\n',
        '    this.hpBar.fillStyle(ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xeab308 : 0xef4444, 1);\n',
        '    this.hpBar.fillRect(-w / 2, -20, w * ratio, h);\n',
        '  }\n',
        '\n',
        '  takeDamage(damage: number) {\n',
        '    this.hp -= damage;\n',
        '    this.drawHpBar();\n',
        '    if (this.hp <= 0) {\n',
        '      this.destroy();\n',
        '      return true; // 死亡\n',
        '    }\n',
        '    return false;\n',
        '  }\n',
        '\n',
        '  preUpdate(time: number, delta: number) {\n',
        '    if (this.currentWp >= this.waypoints.length) return;\n',
        '\n',
        '    const target = this.waypoints[this.currentWp];\n',
        '    const dx = target.x - this.x;\n',
        '    const dy = target.y - this.y;\n',
        '    const dist = Math.sqrt(dx * dx + dy * dy);\n',
        '    const moveDist = (this.speed * delta) / 1000;\n',
        '\n',
        '    if (dist <= moveDist) {\n',
        '      this.x = target.x;\n',
        '      this.y = target.y;\n',
        '      this.currentWp++;\n',
        '      if (this.currentWp >= this.waypoints.length) {\n',
        '        this.destroy();\n',
        '      }\n',
        '    } else {\n',
        '      this.x += (dx / dist) * moveDist;\n',
        '      this.y += (dy / dist) * moveDist;\n',
        '    }\n',
        '  }\n',
        '}\n'
    ]

    # Build the new lines: keep everything up to and including the start marker,
    # then insert the new class lines, then everything from the end marker onward.
    new_lines = lines[:start_idx+1] + new_class_lines + lines[end_idx:]

    with open(filename, 'w') as f:
        f.writelines(new_lines)

    print("Enemy class replaced successfully.")

if __name__ == '__main__':
    main()
