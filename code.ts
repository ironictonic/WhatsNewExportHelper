figma.showUI(__html__, { width: 300, height: 200 });

let assetNumber: string = '';

figma.on('selectionchange', async () => {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'update-layer-names', names: [] });
    return;
  }

  assetNumber = await findAssetNumber(selection[0]);

  if (!assetNumber) {
    figma.notify('AssetNumber layer not found.');
    return;
  }

  const exportableLayers = findExportableLayers(selection[0]);

  if (exportableLayers.length === 0) {
    figma.notify('No layers marked for export found.');
    return;
  }

  const layerNames = exportableLayers.map(layer => layer.name.replace('999', assetNumber));

  // Debug line to show the names of the layers when a selection is made
  layerNames.forEach(name => {
    console.log(`Selected layer for export: ${name}`);
  });

  figma.ui.postMessage({ type: 'update-layer-names', names: layerNames });
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'export-layers') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.notify('Please select a frame or group.');
      return;
    }

    if (!assetNumber) {
      assetNumber = await findAssetNumber(selection[0]);

      if (!assetNumber) {
        figma.notify('AssetNumber layer not found.');
        return;
      }
    }

    const exportableLayers = findExportableLayers(selection[0]);

    if (exportableLayers.length === 0) {
      figma.notify('No layers marked for export found.');
      return;
    }

    exportLayers(exportableLayers, assetNumber);
  }
};

async function findAssetNumber(node: SceneNode): Promise<string> {
  let assetNumber = '';

  function traverse(node: SceneNode) {
    if (node.type === 'TEXT' && node.name === 'AssetNumber') {
      assetNumber = (node as TextNode).characters;
    }

    if ('children' in node) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return assetNumber;
}

function findExportableLayers(node: SceneNode): SceneNode[] {
  const exportableLayers: SceneNode[] = [];
  const targetNames = ['splash-999-botleft', 'splash-999-right', 'splash-999-topleft'];

  function traverse(node: SceneNode) {
    if (node.exportSettings.length > 0 && targetNames.indexOf(node.name) !== -1) {
      exportableLayers.push(node);
    }

    if ('children' in node) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return exportableLayers;
}

async function exportLayers(layers: SceneNode[], assetNumber: string) {
  const exportedLayers = [];

  for (const layer of layers) {
    const exportSettings = layer.exportSettings;

    for (const setting of exportSettings) {
      const exported = await layer.exportAsync(setting as ExportSettings);
      const fileName = layer.name.replace('999', assetNumber);
      console.log(`Exporting layer: ${fileName}`); // Debug line to show file names
      exportedLayers.push({ name: fileName, data: exported });
    }
  }

  figma.ui.postMessage({
    type: 'exported-layers',
    layers: exportedLayers,
  });

  figma.notify('Export complete.');
}
