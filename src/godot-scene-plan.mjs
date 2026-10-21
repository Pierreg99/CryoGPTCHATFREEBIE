import { existsSync, lstatSync, realpathSync } from 'node:fs';
import path from 'node:path';

export const ROOT_TYPES = Object.freeze(['Node2D', 'Node3D', 'Control']);
export const SCENE_DIR = 'scenes/cryogptchat';

export function prepareScene(projectPath, sceneName, rootType) {
  if (typeof sceneName !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(sceneName)) {
    throw new Error('Szenenname: 1–40 Zeichen, beginnt mit einem Buchstaben; nur Buchstaben, Ziffern, _ und -.');
  }
  if (!ROOT_TYPES.includes(rootType)) throw new Error('Nur Node2D, Node3D oder Control sind als Szenenwurzel zugelassen.');
  if (!projectPath || !path.isAbsolute(projectPath) || !existsSync(path.join(projectPath, 'project.godot'))) {
    throw new Error('Kein gültiges fest konfiguriertes Godot-Projekt.');
  }
  const root = realpathSync(projectPath);
  // Refuse symlinks in every component of the fixed scene destination.
  let current = root;
  for (const part of SCENE_DIR.split('/')) {
    current = path.join(current, part);
    if (!existsSync(current)) throw new Error('Bitte zuerst im Testprojekt den Ordner scenes/cryogptchat anlegen.');
    if (lstatSync(current).isSymbolicLink() || !lstatSync(current).isDirectory()) {
      throw new Error('Szenenordner muss ein echter Ordner sein, ohne symbolische Links.');
    }
  }
  if (realpathSync(current) !== path.join(root, SCENE_DIR)) throw new Error('Szenenordner liegt außerhalb des Projekts.');
  const scenePath = SCENE_DIR + '/' + sceneName + '.tscn';
  const absolutePath = path.join(root, scenePath);
  if (existsSync(absolutePath)) throw new Error('Die Szene existiert bereits. Überschreiben ist nicht erlaubt.');
  return {
    sceneName,
    rootNodeType: rootType,
    scenePath,
    absolutePath,
    projectPath: root,
    summary: 'NEUE Godot-Szene: ' + scenePath + '\nRoot-Node: ' + rootType + '\nZielprojekt: ' + root +
      '\nEs wird nur eine neue .tscn-Datei angelegt. Keine bestehenden Szenen überschreiben.'
  };
}
