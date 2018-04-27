const St = imports.gi.St;
const Gtk = imports.gi.Gtk;
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;

const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
//const Lang = imports.lang;


class PomodoroMenu extends PanelMenu.Button {

  constructor(){
    super(1.0, null, false);

    this.states = {
      STOP: 0,
      WORK: 1,
      BREAK: 2
    }

    this.workMin = 25;
    this.breakMin = 5;
    this.cycles = 4;
    this.state = this.states.STOP;
    this.timeSpent = 0;
    this.curCycle = 1;

    let box = new St.BoxLayout({ style_class: 'panel-button-content' });
    let icon = new St.Icon({ icon_name: 'pomodoro', style_class: 'system-status-icon' });
    this.label = new St.Label({
      text: "-----",
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER
    });

    box.add_child(icon);
    box.add_child(this.label);
    this.actor.add_child(box);

    let menuItem = new PopupMenu.PopupMenuItem('Start');
    // let settingsSubMenu = new PopupMenu.PopupSubMenuMenuItem('Settings');
    // let workMinSet = new St.Entry({ text: this.workMin.toString() });
    // settingsSubMenu.menu.addMenuItem(workMinSet);
    // this.menu.addMenuItem(settingsSubMenu);
    this.menu.addMenuItem(menuItem);
    menuItem.connect('activate', () => {
      this.state = this.states.WORK;
      this._refreshTimer();
      this._updateLabel();
      this._notify();
    });


  }

  destroy(){
    super.destroy();
  }

  _refreshTimer() {
    if (this.state == this.states.WORK || this.state == this.states.BREAK) {
      this.timeSpent += 1;
      Mainloop.timeout_add_seconds(1, () => { this._refreshTimer() });
    }
    this._checkStatus();
  }

  _updateLabel() {
    switch(this.state) {
      case this.states.STOP:
        this.label.set_text("------");
        break;
      case this.states.WORK:
        this.label.set_text("WORK");
        break;
      case this.states.BREAK:
        this.label.set_text("BREAK");
        break;
    }
  }

  _checkStatus() {
    if(this.state == this.states.WORK && this.timeSpent >= this.workMin * 60) {
      if(this.curCycle >= this.cycles){
        this.state = this.states.STOP;
        this.curCycle = 1;

        this._notify();
      } else {
        this.state = this.states.BREAK;
        this._notify();
      }
      this.timeSpent = 0;
      this._updateLabel();
      this._notify();
    }
    if(this.state == this.states.BREAK && this.timeSpent >= this.breakMin * 60) {
      this.state = this.states.WORK;
      this.curCycle += 1;
      this.timeSpent = 0;
      this._updateLabel()
      this._notify();
      }
  }

  _notify() {
    let msg;
    switch(this.state) {
      case this.states.STOP:
        msg = "Complete"
        break;
      case this.states.WORK:
        msg = "Get to Work!";
        break;
      case this.states.BREAK:
        msg = "Break Time!";
        break;
    }
    let source = new MessageTray.SystemNotificationSource();
    Main.messageTray.add(source);

    let notification = new MessageTray.Notification(
        source,
        _("Simple Pomodoro"),
        _(msg),
    );

    notification.setTransient(true);
    source.notify(notification);
  }
}

function init(extensionMeta) {
    let theme = imports.gi.Gtk.IconTheme.get_default();
    theme.append_search_path(extensionMeta.path + "/icons");
}

let _indicator;

function enable() {
    _indicator = new PomodoroMenu;
    Main.panel.addToStatusArea('simple-pomodoro', _indicator);
}

function disable() {
    _indicator.destroy();
}
