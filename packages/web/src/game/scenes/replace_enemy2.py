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

    # The new class definition as a multi-line string
    new_class = '''class Enemy extends Phaser.GameObjects.Container {
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
}'''

    # Split the new class into lines and ensure each line ends with newline
    new_class_lines = [line + '\n' for line in new_class.split('\n')]

    # Build the new lines: keep everything up to and including the start marker,
    # then insert the new class lines, then everything from the end marker onward.
    new_lines = lines[:start_idx+1] + new_class_lines + lines[end_idx:]

    with open(filename, 'w') as f:
        f.writelines(new_lines)

    print("Enemy class replaced successfully.")

if __name__ == '__main__':
    main()
