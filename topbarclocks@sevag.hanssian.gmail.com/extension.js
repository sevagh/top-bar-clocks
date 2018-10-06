// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const St = imports.gi.St;
const Main = imports.ui.main;
const Clutter = imports.gi.Clutter;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const WorldClocks = Me.imports.worldclocks;

let worldClocks;

function init() {
	worldClocks = new WorldClocks.WorldClocksSection();
}

function enable() {
	Main.panel._centerBox.add_child(worldClocks._grid)
}

function disable() {
	Main.panel._centerBox.remove_child(worldClocks._grid)
}
