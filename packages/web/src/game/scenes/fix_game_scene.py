import sys

# Read the file
with open('GameScene.ts', 'r') as f:
    lines = f.readlines()

# Find the start and end markers
start_marker = "/** 敵クラス */"
end_marker = "/** 弾クラス */"
start_index = None
end_index = None
for i, line in enumerate(lines):
    if line.strip() == start_marker:
        start_index = i
    if line.strip() == end_marker and start_index is not None:
        end_index = i
        break

if start_index is None or end_index is None:
    print("Could not find markers")
    sys.exit(1)

# Define the new class (without the markers)
new_class_str = """class Enemy extends Phaser.GameObjects.Container {
  sprite: Phaser.GameObjects.Sprite;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  waypoints: Waypoint[];
  currentWp = 0;
  private hpBar: Phaser.GameObjects.Graphics;
  private readonly RADIUS = 12;

  constructor(scene: Phaser.Scene, waypoints: Waypoint[], config: typeof ENEMY_CONFIGS['scout']) {
    super(scene, waypoints[0].x, waypoints[0].y);

    // Enemy sprite (body)
    this.sprite = scene.add.sprite(0, 0, 'h-pylori');
    this.sprite.setOrigin(0.5);
    this.sprite.setScale(0.5); // adjust size as needed
    this.add(this.sprite);

    // Health bar
    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.drawHpBar();

    // Set properties
    this.waypoints = waypoints;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.speed = config.speed;
    this.reward = config.reward;

    // Add to scene's update list
    scene.add.existing(this);
  }

  private drawHpBar() {
    this.hpBar.clear();
    const ratio = this.hp / this.maxHp;
    const w = 24;
    const h = 4;
    this.hpBar.fillStyle(0x000000, 0.5);
    this.hpBar.fillRect(-w / 2, -20, w, h);
    this.hpBar.fillStyle(ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xeab308 : 0xef4444, 1);
    this.hpBar.fillRect(-w / 2, -20, w * ratio, h);
  }

  takeDamage(damage: number) {
    this.hp -= damage;
    this.drawHpBar();
    if (this.hp <= 0) {
      this.destroy();
      return true; // 死亡
    }
    return false;
  }

  preUpdate(time: number, delta: number) {
    if (this.currentWp >= this.waypoints.length) return;

    const target = this.waypoints[this.currentWp];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveDist = (this.speed * delta) / 1000;

    if (dist <= moveDist) {
      this.x = target.x;
      this.y = target.y;
      this.currentWp++;
      if (this.currentWp >= this.waypoints.length) {
        this.destroy();
      }
    } else {
      this.x += (dx / dist) * moveDist;
      this.y += (dy / dist) * moveDist;
    }
  }
}"""

# Split the new class string into lines and ensure each line ends with newline
new_class_lines = [line + '\n' for line in new_class_str.split('\n')]

# Build new lines: keep everything up to and including the start marker, then new class, then from the end marker onward
new_lines = lines[:start_index+1] + new_class_lines + lines[end_index:]

# Write back
with open('GameScene.ts', 'w') as f:
    f.writelines(new_lines)

print("Fixed GameScene.ts")
