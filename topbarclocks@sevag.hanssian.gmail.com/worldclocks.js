// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
//
// Mostly copied from the gnome-shell project:
// https://github.com/GNOME/gnome-shell/blob/master/js/ui/dateMenu.js#L86
//

const GLib = imports.gi.GLib;
const GnomeDesktop = imports.gi.GnomeDesktop;
const GWeather = imports.gi.GWeather;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;

const Util = imports.misc.util;
const Main = imports.ui.main;

var WorldClocksSection = new Lang.Class({
    Name: 'WorldClocksSection',

    _init() {
        this._clock = new GnomeDesktop.WallClock();
        this._clockNotifyId = 0;

        this._locations = [];

        let layout = new Clutter.GridLayout({ orientation: Clutter.Orientation.HORIZONTAL });
        this._grid = new St.Widget({ layout_manager: layout }); 
        layout.set_column_spacing(10);
        layout.hookup_style(this._grid);

        this._clockAppMon = new Util.AppSettingsMonitor('org.gnome.clocks.desktop',
                                                        'org.gnome.clocks');
        this._clockAppMon.watchSetting('world-clocks',
                                       this._clocksChanged.bind(this));
    },

    _clocksChanged(settings) {
        this._grid.destroy_all_children();
        this._locations = [];

        let world = GWeather.Location.get_world();
        let clocks = settings.get_value('world-clocks').deep_unpack();
        for (let i = 0; i < clocks.length; i++) {
            if (!clocks[i].location)
                continue;
            let l = world.deserialize(clocks[i].location);
            if (l)
                this._locations.push({ location: l });
        }

        this._locations.sort((a, b) => {
            return a.location.get_timezone().get_offset() -
                   b.location.get_timezone().get_offset();
        });

        let layout = this._grid.layout_manager;

        for (let i = 0; i < this._locations.length; i++) {
            let l = this._locations[i].location;

            let name = l.get_level() == GWeather.LocationLevel.NAMED_TIMEZONE ? l.get_name()
                                                                              : l.get_city_name();
            let label = new St.Label({ x_align: Clutter.ActorAlign.START });

            this._grid.add_child(label);

            this._locations[i].actor = label;
            this._locations[i].city_name = name;
        }

        if (this._grid.get_n_children() > 1) {
            if (!this._clockNotifyId)
                this._clockNotifyId =
                    this._clock.connect('notify::clock', this._updateLabels.bind(this));
            this._updateLabels();
        } else {
            if (this._clockNotifyId)
                this._clock.disconnect(this._clockNotifyId);
            this._clockNotifyId = 0;
        }
    },

    _updateLabels() {
        for (let i = 0; i < this._locations.length; i++) {
            let l = this._locations[i];
            let tz = GLib.TimeZone.new(l.location.get_timezone().get_tzid());
            let now = GLib.DateTime.new_now(tz);
            l.actor.text = l.city_name + " " + Util.formatTime(now, { timeOnly: true });
        }
    }
});
