import argparse
import numpy as np
from plyfile import PlyData, PlyElement

C0 = 0.28209479177387814


def main():
    parser = argparse.ArgumentParser(
        description="Convert ML-Sharp PLY SH DC to standard vertex colors"
    )
    parser.add_argument("input_ply", help="Input PLY from ML-Sharp")
    parser.add_argument("output_ply", help="Output PLY with RGB vertex colors")

    args = parser.parse_args()

    # ------------------------
    # LOAD
    # ------------------------
    ply = PlyData.read(args.input_ply)
    v = ply["vertex"].data
    print(f"Points : {len(v)}")

    # ------------------------
    # POSITIONS
    # ------------------------
    pos = np.vstack([v["x"], v["y"], v["z"]]).T.astype(np.float32)

    # ------------------------
    # COULEURS (SH DC → RGB)
    # ------------------------
    f_dc = np.vstack([
        v["f_dc_0"],
        v["f_dc_1"],
        v["f_dc_2"]
    ]).T

    rgb = np.clip(f_dc * C0 + 0.5, 0.0, 1.0)
    rgb_u8 = (rgb * 255).astype(np.uint8)

    # ------------------------
    # STRUCTURE PLY STANDARD
    # ------------------------
    vertex = np.empty(len(v), dtype=[
        ("x", "f4"),
        ("y", "f4"),
        ("z", "f4"),
        ("red", "u1"),
        ("green", "u1"),
        ("blue", "u1"),
    ])

    vertex["x"], vertex["y"], vertex["z"] = pos.T
    vertex["red"], vertex["green"], vertex["blue"] = rgb_u8.T

    # ------------------------
    # EXPORT
    # ------------------------
    PlyData(
        [PlyElement.describe(vertex, "vertex")],
        text=False
    ).write(args.output_ply)

    print(f"✔ Fichier converti : {args.output_ply}")


if __name__ == "__main__":
    main()