import numpy as np
import argparse
from plyfile import PlyData, PlyElement


def rotation_matrix(axis: str, degrees: float) -> np.ndarray:
    """Crée une matrice de rotation autour de l'axe spécifié."""
    radians = np.radians(degrees)
    c, s = np.cos(radians), np.sin(radians)

    if axis == 'x':
        return np.array([
            [1, 0, 0],
            [0, c, -s],
            [0, s, c]
        ])
    elif axis == 'y':
        return np.array([
            [c, 0, s],
            [0, 1, 0],
            [-s, 0, c]
        ])
    elif axis == 'z':
        return np.array([
            [c, -s, 0],
            [s, c, 0],
            [0, 0, 1]
        ])
    else:
        raise ValueError(f"Axe invalide: {axis}. Utilisez 'x', 'y' ou 'z'.")


def rotate_ply(input_path: str, output_path: str, rx: float = 0, ry: float = 0, rz: float = 0):
    """
    Applique une rotation au fichier PLY.
    
    Args:
        input_path: Chemin du fichier PLY source
        output_path: Chemin du fichier PLY de sortie
        rx: Rotation autour de l'axe X en degrés
        ry: Rotation autour de l'axe Y en degrés
        rz: Rotation autour de l'axe Z en degrés
    """
    plydata = PlyData.read(input_path)
    vertex = plydata['vertex']

    # Extraire les coordonnées
    x = np.array(vertex['x'], dtype=np.float64)
    y = np.array(vertex['y'], dtype=np.float64)
    z = np.array(vertex['z'], dtype=np.float64)
    coords = np.stack([x, y, z], axis=-1)

    # Construire la matrice de rotation combinée (Z * Y * X)
    R = rotation_matrix('z', rz) @ rotation_matrix('y', ry) @ rotation_matrix('x', rx)

    # Appliquer la rotation
    rotated = (R @ coords.T).T

    # Mettre à jour les coordonnées
    vertex['x'] = rotated[:, 0].astype(np.float32)
    vertex['y'] = rotated[:, 1].astype(np.float32)
    vertex['z'] = rotated[:, 2].astype(np.float32)

    # Rotation des normales si elles existent
    if all(prop in [p.name for p in vertex.properties] for prop in ['nx', 'ny', 'nz']):
        nx = np.array(vertex['nx'], dtype=np.float64)
        ny = np.array(vertex['ny'], dtype=np.float64)
        nz = np.array(vertex['nz'], dtype=np.float64)
        normals = np.stack([nx, ny, nz], axis=-1)
        rotated_normals = (R @ normals.T).T
        vertex['nx'] = rotated_normals[:, 0].astype(np.float32)
        vertex['ny'] = rotated_normals[:, 1].astype(np.float32)
        vertex['nz'] = rotated_normals[:, 2].astype(np.float32)

    plydata.write(output_path)
    print(f"Rotation appliquée: X={rx}°, Y={ry}°, Z={rz}°")
    print(f"Fichier sauvegardé: {output_path}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Appliquer une rotation à un fichier PLY")
    parser.add_argument('input', help="Fichier PLY d'entrée")
    parser.add_argument('-o', '--output', help="Fichier PLY de sortie (défaut: input_rotated.ply)")
    parser.add_argument('-x', '--rx', type=float, default=0, help="Rotation autour de X en degrés")
    parser.add_argument('-y', '--ry', type=float, default=0, help="Rotation autour de Y en degrés")
    parser.add_argument('-z', '--rz', type=float, default=0, help="Rotation autour de Z en degrés")

    args = parser.parse_args()
    output = args.output or args.input.replace('.ply', '_rotated.ply')
    rotate_ply(args.input, output, args.rx, args.ry, args.rz)