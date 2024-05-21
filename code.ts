figma.showUI(__html__, { width: 300, height: 200 });

figma.ui.onmessage = msg => {
  if (msg.type === 'export-layers') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.notify('Please select a frame or group.');
      return;
    }

    const exportableLayers = findExportableLayers(selection[0]);

    if (exportableLayers.length === 0) {
      figma.notify('No layers marked for export found.');
      return;
    }

    exportLayers(exportableLayers);
  }
};

function findExportableLayers(node: SceneNode): SceneNode[] {
  const exportableLayers: SceneNode[] = [];

  function traverse(node: SceneNode) {
    if (node.exportSettings.length > 0) {
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

async function exportLayers(layers: SceneNode[]) {
  const exportedLayers = [];

  for (const layer of layers) {
    console.log(`Exporting layer: ${layer.name}`); // Print layer names to the console

    const exportSettings = layer.exportSettings;

    for (const setting of exportSettings) {
      const exported = await layer.exportAsync(setting as ExportSettings);
      exportedLayers.push({ name: layer.name, data: exported });
    }
  }

  figma.ui.postMessage({
    type: 'exported-layers',
    layers: exportedLayers
  });

  figma.notify('Export complete.');
}
