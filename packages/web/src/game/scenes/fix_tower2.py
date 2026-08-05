import sys

with open('GameScene.ts', 'r') as f:
    lines = f.readlines()

# We'll change the Tower class: rename 'body' to 'sprite' and adjust the constructor and any usage.
# We'll look for the Tower class and replace the relevant lines.

# First, find the line numbers for the Tower class.
start = None
for i, line in enumerate(lines):
    if line.strip() == "/** タワークラス */":
        start = i
        break

if start is None:
    print("Could not find Tower class start")
    sys.exit(1)

# Now, from start, find the end of the class (the line before the next class or export)
# We'll look for the line that starts with "}export" or just "}" followed by export or class.
end = None
for i in range(len(lines)-1, start, -1):
    if lines[i].strip() == "}" and (i+1 < len(lines) and (lines[i+1].strip().startswith("export") or lines[i+1].strip().startswith("class"))):
        end = i
        break

if end is None:
    # Fallback: look for the line that has "}export class GameScene"
    for i in range(len(lines)-1, start, -1):
        if "}export class GameScene" in lines[i]:
            end = i
            break

if end is None:
    print("Could not find Tower class end")
    sys.exit(1)

# Now we have the range [start, end] inclusive of the class lines.
# We'll replace the lines in that range with a corrected version.

# Build the new Tower class as a string.
new_tower = """/** タワークラス */
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

# Now, we want to replace from start to end (inclusive) with the new tower class lines.
# But note: the line at `end` is the closing brace of the Tower class. We want to replace the entire block.
# We'll split the new_tower string into lines and ensure each line ends with newline.
new_tower_lines = [line + '\n' + [line + '\n' for line in new_tower.split('\n')]

# Let's do it step by step.
' for line in new_tower.split('\n')]

# Now, construct the new lines list: everything before start, then new_tower_lines, then everything after end.
new_lines = lines[:start] + new_tower_lines + lines[end+1:]

# Write back
with open('GameScene.ts', 'w') as f:
    f.writelines(new_lines)

print("Fixed Tower class by renaming 'body' to 'sprite'")
