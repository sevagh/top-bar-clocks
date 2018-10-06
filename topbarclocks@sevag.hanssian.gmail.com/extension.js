
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

let text, button;

function getCitiesFromGnomeClocks() {
	var ret = new Array();
	var gnome_clocks = new Gio.Settings({schema: "org.gnome.clocks"});
	var world_clocks = gnome_clocks.get_value("world-clocks");
	var time_to_display = "";
	for (var i = 0; i < world_clocks.n_children(); i++) {
		var x = world_clocks.get_child_value(i);
		for (var j = 0; j < x.n_children(); j++) {
			var y = x.get_child_value(j);
			for (var k = 0; k < y.n_children(); k++) {
				var z = y.get_child_value(k);
				if (z.classify() == 118) {
					var a, b = z.unpack();
					var c = b.unpack();
					for (var l = 0; l < c.length; l++) {
						var d = c[l];
						if (d.classify() == 118) {
							var e = d.unpack();
							var ICAO_airport_code = e.get_child_value(1).get_string().toString().split(",")[0];
							ret.push(ICAO_airport_code);
						}
					}
				}
			}
		}
	}
	return ret
}

function _hideHello() {
    Main.uiGroup.remove_actor(text);
    text = null;
}

function _showHello() {
    if (!text) {
	var cities = getCitiesFromGnomeClocks()
        text = new St.Label({ style_class: 'helloworld-label', text: cities.join(",") });
        Main.uiGroup.add_actor(text);
    }

    text.opacity = 255;

    let monitor = Main.layoutManager.primaryMonitor;

    text.set_position(monitor.x + Math.floor(monitor.width / 2 - text.width / 2),
                      monitor.y + Math.floor(monitor.height / 2 - text.height / 2));

    Tweener.addTween(text,
                     { opacity: 0,
                       time: 2,
                       transition: 'easeOutQuad',
                       onComplete: _hideHello });
}

function init() {
    button = new St.Bin({ style_class: 'panel-button',
                          reactive: true,
                          can_focus: true,
                          x_fill: true,
                          y_fill: false,
                          track_hover: true });
    let icon = new St.Icon({ icon_name: 'system-run-symbolic',
                             style_class: 'system-status-icon' });

    button.set_child(icon);
    button.connect('button-press-event', _showHello);
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    Main.panel._rightBox.remove_child(button);
}
