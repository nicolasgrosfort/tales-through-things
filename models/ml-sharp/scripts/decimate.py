import argparse
import numpy as np
from plyfile import PlyData, PlyElement


def main():
    parser = argparse.ArgumentParser(
        description="Decimate a PLY point cloud"
    )
    parser.add_argument("input_ply", help="Input PLY file")
    parser.add_argument("output_ply", help="Output decimated PLY file")
    parser.add_argument(
        "--ratio",
        type=float,
        default=0.3,
        help="Decimation ratio (0–1), default: 0.3"
    )

    args = parser.parse_args()

    # ------------------------
    # LOAD
    # ------------------------
    ply = PlyData.read(args.input_ply)
    v = ply["vertex"].data
    n = len(v)

    print(f"Points initiaux : {n}")

    # ------------------------
    # DÉCIMATION
    # ------------------------
    keep_n = int(n * args.ratio)
    indices = np.random.choice(n, keep_n, replace=False)
    v = v[indices]

    print(f"Points conservés : {len(v)}")

    # ------------------------
    # EXPORT
    # ------------------------
    PlyData(
        [PlyElement.describe(v, "vertex")],
        text=False
    ).write(args.output_ply)

    print(f"✔ Fichier décimé : {args.output_ply}")


if __name__ == "__main__":
    main()