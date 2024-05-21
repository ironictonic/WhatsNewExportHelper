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
function findExportableLayers(node) {
    const exportableLayers = [];
    function traverse(node) {
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
function exportLayers(layers) {
    return __awaiter(this, void 0, void 0, function* () {
        const exportedLayers = [];
        for (const layer of layers) {
            console.log(`Exporting layer: ${layer.name}`); // Print layer names to the console
            const exportSettings = layer.exportSettings;
            for (const setting of exportSettings) {
                const exported = yield layer.exportAsync(setting);
                exportedLayers.push({ name: layer.name, data: exported });
            }
        }
        figma.ui.postMessage({
            type: 'exported-layers',
            layers: exportedLayers
        });
        figma.notify('Export complete.');
    });
}
