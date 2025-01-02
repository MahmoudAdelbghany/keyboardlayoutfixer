'use strict';

const { Adw, Gio, Gtk } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

function init() {
}

function fillPreferencesWindow(window) {
    // Get settings
    const settings = ExtensionUtils.getSettings(
        'org.gnome.shell.extensions.keyboardlayoutfixer'
    );

    // Create a preferences page
    const page = new Adw.PreferencesPage();
    window.add(page);

    // Create a preferences group
    const group = new Adw.PreferencesGroup({
        title: 'Keyboard Layout Fixer Settings',
        description: 'Configure keyboard shortcut'
    });
    page.add(group);

    // Create a row for the shortcut setting
    const shortcutRow = new Adw.ActionRow({
        title: 'Conversion Shortcut',
        subtitle: 'Click to set new shortcut (Current: ' + 
                 settings.get_strv('convert-text-shortcut')[0] + ')'
    });

    // Create a shortcut button
    const shortcutButton = new Gtk.Button({
        label: 'Set Shortcut',
        valign: Gtk.Align.CENTER
    });

    shortcutButton.connect('clicked', () => {
        // Show "Press a key" in subtitle
        shortcutRow.subtitle = 'Press a key combination...';
        
        // Create a new grab handle
        let eventController = new Gtk.EventControllerKey();
        
        // Add the controller to the window
        window.add_controller(eventController);
        
        // Connect to key-pressed event
        eventController.connect('key-pressed', (controller, keyval, keycode, state) => {
            // Get the key combination as string
            let mask = state & Gtk.accelerator_get_default_mod_mask();
            let accelerator = Gtk.accelerator_name(keyval, mask);
            
            if (accelerator) {
                // Update settings
                settings.set_strv('convert-text-shortcut', [accelerator]);
                // Update subtitle
                shortcutRow.subtitle = 'Current: ' + accelerator;
                // Remove the controller
                window.remove_controller(eventController);
            }
            
            return true;
        });
    });

    // Add the button to the row
    shortcutRow.add_suffix(shortcutButton);
    group.add(shortcutRow);
}