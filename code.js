"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__, { width: 300, height: 200 });
let assetNumber = '';
figma.on('selectionchange', () => __awaiter(void 0, void 0, void 0, function* () {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.ui.postMessage({ type: 'update-layer-names', names: [] });
        return;
    }
    assetNumber = yield findAssetNumber(selection[0]);
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
}));
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'export-layers') {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.notify('Please select a frame or group.');
            return;
        }
        if (!assetNumber) {
            assetNumber = yield findAssetNumber(selection[0]);
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
});
function findAssetNumber(node) {
    return __awaiter(this, void 0, void 0, function* () {
        let assetNumber = '';
        function traverse(node) {
            if (node.type === 'TEXT' && node.name === 'AssetNumber') {
                assetNumber = node.characters;
            }
            if ('children' in node) {
                for (const child of node.children) {
                    traverse(child);
                }
            }
        }
        traverse(node);
        return assetNumber;
    });
}
function findExportableLayers(node) {
    const exportableLayers = [];
    const targetNames = ['splash-999-botleft', 'splash-999-right', 'splash-999-topleft'];
    function traverse(node) {
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
function exportLayers(layers, assetNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const exportedLayers = [];
        for (const layer of layers) {
            const exportSettings = layer.exportSettings;
            for (const setting of exportSettings) {
                const exported = yield layer.exportAsync(setting);
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
    });
}
