// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

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

        let layout = new Clutter.GridLayout({ orientation: Clutter.Orientation.VERTICAL });
        this._grid = new St.Widget({ style_class: 'world-clocks-grid',
                                     layout_manager: layout });
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
            let label = new St.Label({ style_class: 'world-clocks-city',
                                       text: name,
                                       x_align: Clutter.ActorAlign.START,
                                       x_expand: true });

            let time = new St.Label({ style_class: 'world-clocks-time',
                                      x_align: Clutter.ActorAlign.END,
                                      x_expand: true });

            if (this._grid.text_direction == Clutter.TextDirection.RTL) {
                layout.attach(time, 0, i + 1, 1, 1);
                layout.attach(label, 1, i + 1, 1, 1);
            } else {
                layout.attach(label, 0, i + 1, 1, 1);
                layout.attach(time, 1, i + 1, 1, 1);
            }

            this._locations[i].actor = time;
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
            l.actor.text = Util.formatTime(now, { timeOnly: true });
        }
    }
});

