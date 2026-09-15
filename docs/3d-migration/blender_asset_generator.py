"""
ピロリ菌タワーディフェンス 3D化 — アセット自動生成スクリプト
Blenderの Text Editor に全文貼り付けて実行(Alt+P / Run Script)してください。
Blender 3.6 / 4.x 系で動作確認済みの書き方をしています。

生成されるもの:
  1. Stage_Tunnel   : 粘膜状にうねるトンネルコース(Displace + Subdivision)
  2. HPylori_Enemy  : 球体ベース+カーブ鞭毛のピロリ菌クリーチャー(複数配置可)
  3. Tower_Antibiotic: サイバーパンク風の抗生物質タワー
  4. Lighting        : 胃内部を想起させる暗色環境+ネオン点光源
  5. Camera          : 戦略的クォータービュー俯瞰カメラ
"""

import bpy
import bmesh
import math
import random
from mathutils import Vector, noise

# ---------------------------------------------------------------------------
# 0. シーン初期化
# ---------------------------------------------------------------------------

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block_type in (bpy.data.meshes, bpy.data.curves, bpy.data.materials,
                       bpy.data.lights, bpy.data.cameras, bpy.data.textures):
        for block in list(block_type):
            block_type.remove(block)


def new_material(name, base_color, emission_color=None, emission_strength=0.0,
                  roughness=0.5, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission_color is not None:
        # Blender 4.x: Emission Color / Emission Strength ; 3.x: Emission / Emission Strength
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*emission_color, 1.0)
        else:
            bsdf.inputs["Emission"].default_value = (*emission_color, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


# ---------------------------------------------------------------------------
# 1. ステージ: 粘膜トンネル
# ---------------------------------------------------------------------------

def create_stomach_tunnel(name="Stage_Tunnel", length=40.0, radius=3.0, segments=64, rings=200):
    """円柱をベースに、パス上の経路を蛇行させつつ Displace で粘膜質感を出す"""
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius, depth=length, vertices=segments,
        location=(0, 0, 0), rotation=(0, math.radians(90), 0))
    tunnel = bpy.context.active_object
    tunnel.name = name

    # 円柱を細分化してうねりを付けられるようにする
    mod_subsurf_pre = tunnel.modifiers.new("PreSubdiv", 'SUBSURF')
    mod_subsurf_pre.levels = 2
    mod_subsurf_pre.render_levels = 2

    # メッシュを蛇行させる(コース自体の曲がり) — 頂点シェイプをsin波で歪ませる
    bpy.ops.object.modifier_apply(modifier=mod_subsurf_pre.name)
    mesh = tunnel.data
    for v in mesh.vertices:
        x = v.co.x
        wave = math.sin(x * 0.25) * 1.2
        wave_z = math.cos(x * 0.18) * 0.8
        v.co.y += wave
        v.co.z += wave_z

    # 粘膜のうねり(表面の凹凸)を Displace + ノイズテクスチャで表現
    tex = bpy.data.textures.new("MucosaNoise", type='CLOUDS')
    tex.noise_scale = 0.6
    tex.noise_depth = 3

    disp = tunnel.modifiers.new("MucosaDisplace", 'DISPLACE')
    disp.texture = tex
    disp.strength = 0.35
    disp.mid_level = 0.5

    subsurf = tunnel.modifiers.new("Smooth", 'SUBSURF')
    subsurf.levels = 2
    subsurf.render_levels = 3

    solidify = tunnel.modifiers.new("Thickness", 'SOLIDIFY')
    solidify.thickness = 0.15
    solidify.offset = 1.0  # 内側に厚みを付け、内壁をコースとして使う

    # 内側から見る想定なので法線を反転
    bpy.context.view_layer.objects.active = tunnel
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.flip_normals()
    bpy.ops.object.mode_set(mode='OBJECT')

    mat = new_material(
        "Mat_Mucosa", base_color=(0.55, 0.08, 0.12),
        emission_color=(0.8, 0.1, 0.05), emission_strength=0.05,
        roughness=0.25)
    tunnel.data.materials.append(mat)

    return tunnel


# ---------------------------------------------------------------------------
# 2. ピロリ菌クリーチャー(球体 + 鞭毛カーブ)
# ---------------------------------------------------------------------------

def create_flagellum_curve(name, origin, length=1.6, coil_turns=3, seed=0):
    """カーブで螺旋状の鞭毛を作り、Beveleで太さを与える"""
    random.seed(seed)
    curve_data = bpy.data.curves.new(name, type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.bevel_depth = 0.025
    curve_data.bevel_resolution = 4
    curve_data.resolution_u = 12

    spline = curve_data.splines.new('NURBS')
    points_count = 14
    spline.points.add(points_count - 1)

    for i in range(points_count):
        t = i / (points_count - 1)
        angle = t * coil_turns * 2 * math.pi
        r = 0.15 * (1 - t * 0.4)
        x = origin.x - t * length
        y = origin.y + math.cos(angle) * r
        z = origin.z + math.sin(angle) * r
        spline.points[i].co = (x, y, z, 1.0)

    spline.use_endpoint_u = True
    curve_obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(curve_obj)

    mat = new_material(name + "_Mat", base_color=(0.9, 0.85, 0.3),
                        emission_color=(0.9, 0.8, 0.1), emission_strength=0.3,
                        roughness=0.4)
    curve_obj.data.materials.append(mat)
    return curve_obj


def create_hpylori(name="HPylori_Enemy", location=(0, 0, 0), scale=1.0, seed=0):
    """UV球ベースに、螺旋変形とバンプでバクテリアらしさを付け、複数の鞭毛を配置"""
    random.seed(seed)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.4 * scale, segments=32, ring_count=16,
                                          location=location)
    body = bpy.context.active_object
    body.name = name + "_Body"

    # 螺旋(コルク栓抜き)形状に変形 — SimpleDeform(Twist)+ 少し伸ばす
    body.scale.x = 2.2  # 楕円状に伸ばして桿菌らしいシルエットに

    twist = body.modifiers.new("SpiralTwist", 'SIMPLE_DEFORM')
    twist.deform_method = 'TWIST'
    twist.angle = math.radians(260)
    twist.deform_axis = 'X'

    # 表面の凹凸(ノイズ)でぬめり感を追加
    tex = bpy.data.textures.new(name + "_Bump", type='STUCCI')
    tex.noise_scale = 0.4
    disp = body.modifiers.new("SurfaceBump", 'DISPLACE')
    disp.texture = tex
    disp.strength = 0.04

    subsurf = body.modifiers.new("Smooth", 'SUBSURF')
    subsurf.levels = 2
    subsurf.render_levels = 2

    mat = new_material(name + "_BodyMat", base_color=(0.75, 0.15, 0.55),
                        emission_color=(0.9, 0.2, 0.7), emission_strength=0.15,
                        roughness=0.2, metallic=0.05)
    body.data.materials.append(mat)

    # 鞭毛(複数)を後方に束ねて配置
    flagella = []
    tail_origin = Vector(location) + Vector((0.35 * scale, 0, 0))
    for i in range(4):
        offset = Vector((0, (i - 1.5) * 0.06 * scale, (i % 2) * 0.05 * scale))
        f = create_flagellum_curve(
            f"{name}_Flagellum_{i}", tail_origin + offset,
            length=1.6 * scale, coil_turns=3, seed=seed * 10 + i)
        flagella.append(f)

    # 空のペアレント用オブジェクトでボディと鞭毛をまとめる
    empty = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(empty)
    empty.location = location
    body.parent = empty
    body.location = (0, 0, 0)
    for f in flagella:
        f.parent = empty

    return empty


# ---------------------------------------------------------------------------
# 3. タワー: サイバーパンク風抗生物質カプセル砲台
# ---------------------------------------------------------------------------

def create_antibiotic_tower(name="Tower_Antibiotic", location=(0, 0, 0)):
    empty = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(empty)
    empty.location = location

    # 台座(サイバーパンクな多角形ベース)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=0.25, vertices=8,
                                         location=(location[0], location[1], location[2] + 0.125))
    base = bpy.context.active_object
    base.name = name + "_Base"
    bevel = base.modifiers.new("EdgeGlow", 'BEVEL')
    bevel.width = 0.02
    bevel.segments = 3
    mat_base = new_material(name + "_BaseMat", base_color=(0.05, 0.05, 0.07),
                             emission_color=(0.0, 0.9, 1.0), emission_strength=1.2,
                             roughness=0.3, metallic=0.8)
    base.data.materials.append(mat_base)
    base.parent = empty
    base.location = Vector(base.location) - Vector(location)

    # カプセル本体(抗生物質カプセルのモチーフ、回転タレット)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=0.9, vertices=24,
                                         location=(location[0], location[1], location[2] + 0.75))
    capsule = bpy.context.active_object
    capsule.name = name + "_Capsule"

    # 上下に半球キャップを付けてカプセル形状に(Boolean Union)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(location[0], location[1], location[2] + 1.2))
    cap_top = bpy.context.active_object
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(location[0], location[1], location[2] + 0.3))
    cap_bottom = bpy.context.active_object

    for cap in (cap_top, cap_bottom):
        bool_mod = capsule.modifiers.new("Union_" + cap.name, 'BOOLEAN')
        bool_mod.operation = 'UNION'
        bool_mod.object = cap
    bpy.context.view_layer.objects.active = capsule
    for m in list(capsule.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cap_top, do_unlink=True)
    bpy.data.objects.remove(cap_bottom, do_unlink=True)

    subsurf = capsule.modifiers.new("Smooth", 'SUBSURF')
    subsurf.levels = 2

    bevel2 = capsule.modifiers.new("PanelLines", 'BEVEL')
    bevel2.width = 0.015
    bevel2.segments = 2

    mat_capsule = new_material(name + "_CapsuleMat", base_color=(0.85, 0.9, 0.95),
                                emission_color=(1.0, 0.05, 0.35), emission_strength=0.8,
                                roughness=0.15, metallic=0.6)
    capsule.data.materials.append(mat_capsule)
    capsule.parent = empty
    capsule.location = Vector(capsule.location) - Vector(location)

    # 砲身(細い円柱を複数、放射状に配置してサイバーな砲台感を出す)
    barrel_group = []
    for i in range(3):
        angle = i * (2 * math.pi / 3)
        bx = location[0] + math.cos(angle) * 0.12
        by = location[1] + math.sin(angle) * 0.12
        bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.6, vertices=12,
                                             location=(bx, by, location[2] + 1.5))
        barrel = bpy.context.active_object
        barrel.name = f"{name}_Barrel_{i}"
        barrel.rotation_euler = (math.radians(90), 0, 0)
        mat_barrel = new_material(f"{name}_BarrelMat_{i}", base_color=(0.02, 0.02, 0.02),
                                   emission_color=(0.0, 1.0, 0.6), emission_strength=1.5,
                                   roughness=0.2, metallic=0.9)
        barrel.data.materials.append(mat_barrel)
        barrel.parent = empty
        barrel.location = Vector(barrel.location) - Vector(location)
        barrel_group.append(barrel)

    return empty


# ---------------------------------------------------------------------------
# 4. ライティング(胃の中の暗い環境 + ネオン点光源)
# ---------------------------------------------------------------------------

def setup_lighting():
    world = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.02, 0.005, 0.01, 1.0)
    bg.inputs["Strength"].default_value = 0.15

    neon_colors = [
        (0.0, 1.0, 0.9),   # シアン
        (1.0, 0.05, 0.55), # マゼンタ
        (0.6, 0.0, 1.0),   # パープル
        (0.0, 1.0, 0.3),   # グリーン
    ]
    for i, color in enumerate(neon_colors):
        angle = i * (2 * math.pi / len(neon_colors))
        x = math.cos(angle) * 5
        y = math.sin(angle) * 5
        bpy.ops.object.light_add(type='POINT', location=(x, y, 3 + i * 0.5))
        light = bpy.context.active_object
        light.name = f"NeonLight_{i}"
        light.data.color = color
        light.data.energy = 800
        light.data.shadow_soft_size = 0.4

    # 全体の輪郭を出すための弱いキーライト(暖色寄りだが暗め)
    bpy.ops.object.light_add(type='AREA', location=(0, 0, 8))
    key = bpy.context.active_object
    key.name = "DimKeyLight"
    key.data.energy = 60
    key.data.color = (0.6, 0.2, 0.2)
    key.data.size = 6


# ---------------------------------------------------------------------------
# 5. カメラ(クォータービュー俯瞰)
# ---------------------------------------------------------------------------

def setup_camera():
    bpy.ops.object.camera_add(location=(8, -8, 9))
    cam = bpy.context.active_object
    cam.name = "Camera_QuarterView"
    cam.rotation_euler = (math.radians(50), 0, math.radians(45))
    cam.data.lens = 35
    bpy.context.scene.camera = cam
    return cam


# ---------------------------------------------------------------------------
# メイン実行
# ---------------------------------------------------------------------------

def main():
    clear_scene()

    create_stomach_tunnel()

    # 敵を経路上に複数体配置(デモ用のサンプル配置)
    for i in range(4):
        create_hpylori(
            name=f"HPylori_Enemy_{i}",
            location=(-10 + i * 4, math.sin(i) * 1.5, 0.4),
            scale=random.uniform(0.8, 1.3),
            seed=i,
        )

    # タワーを経路脇に複数配置
    tower_positions = [(-6, 3, 0), (0, -3, 0), (6, 3, 0)]
    for i, pos in enumerate(tower_positions):
        create_antibiotic_tower(name=f"Tower_Antibiotic_{i}", location=pos)

    setup_lighting()
    setup_camera()

    print("=== ピロリ菌タワーディフェンス 3Dアセット生成完了 ===")


if __name__ == "__main__":
    main()
