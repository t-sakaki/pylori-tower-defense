import sys

with open('GameScene.ts', 'r') as f:
    lines = f.readlines()

# Find the start of Tower class: "/** タワークラス */"
start_index = None
for i, line in enumerate(lines):
    if line.strip() == "/** タワークラス */":
        start_index = i
        break

if start_index is None:
    print("Could not find Tower class start marker")
    sys.exit(1)

# Find the end of Tower class: the line before "export class GameScene"
end_index = None
for i in range(len(lines)-1, -1, -1):
    if lines[i].strip() == "export class GameScene extends Phaser.Scene {":
        end_index = i
        break

if end_index is None:
    print("Could not find end marker (export class GameScene)")
    sys.exit(1)

# Now we want to replace from start_index to end_index-1 (since end_index is the line of export class)
# We'll keep the lines before start_index, then insert the new Tower class, then from end_index onward.

new_tower_class = """/** タワークラス */
class Tower extends Phaser.GameObjects.Container {
  config: typeof TOWER_CONFIGS['acid'];
  lastFireTime = 0;
  private sprite: Phaser.GameObjects.Image;
  private rangeGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, config: typeof TOWER_CONFIGS['acid']) {
    super(scene, x, y);
    this.config = config;

    let key = '';
    switch (this.config.type) {
      case 'acid':
        key = 'tower-acid';
        break;
      case 'amoxicillin':
        key = 'tower-amoxi';
        break;
      case 'clarithromycin':
        // fallback
        key = 'tower-acid';
        break;
      case 'barrier':
        key = 'tower-acid';
        break;
      case 'lacto':
        key = 'tower-acid';
        break;
      default:
        key = 'tower-acid';
    }

    this.sprite = scene.add.image(0, 0, key).setOrigin(0.5).setScale(0.4);
    this.add(this.sprite);

    this.rangeGraphics = scene.add.graphics();
    this.add(this.rangeGraphics);

    scene.add.existing(this);
  }

  private drawRange(active: boolean) {
    this.rangeGraphics.clear();
    if (!active) return;
    this.rangeGraphics.lineStyle(1, 0xffffff, 0.15);
    this.rangeGraphics.strokeCircle(0, 0, this.config.range);
  }

  setRangeVisible(v: boolean) {
    this.drawRange(v);
  }

  preUpdate(time: number, delta: number) {
    const scene = this.scene as GameScene;
    if (time - this.lastFireTime < 1000 / this.config.fireRate) return;

    // 射程内の最も経路が進んだ敵を検索
    let target: Enemy | null = null;
    let maxWp = -1;

    scene.enemies.forEach((e) => {
      if (!e.active) return;
      const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
      if (d <= this.config.range && e.currentWp > maxWp) {
        maxWp = e.currentWp;
        target = e;
      }
    });

    if (target) {
      this.lastFireTime = time;
      const projColor = this.config.type === 'acid' ? 0xf43f5e : 0x3b82f6;
      scene.projectiles.push(new Projectile(this.scene, this.x, this.y, target!, this.config.damage, projColor));
    }
  }
}"""

# Split into lines with newline
new_tower_lines = [line + '\n' for line in new_tower_class.split('\n')]

# Build new lines
new_lines = lines[:start_index] + new_tower_lines + lines[end_index:]

# Write back
with open('GameScene.ts', 'w') as f:
    f.writelines(new_lines)

print("Fixed Tower class")
