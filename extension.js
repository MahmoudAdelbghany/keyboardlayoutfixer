'use strict';

const { GObject, St, Gio, GLib } = imports.gi;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const CLIPBOARD_TYPE = St.ClipboardType.CLIPBOARD;
const SELECTION_TYPE = St.ClipboardType.PRIMARY;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Shell = imports.gi.Shell;
const Meta = imports.gi.Meta;

// Keyboard mapping objects
const ENGLISH_TO_ARABIC = {
    'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ', 'u': 'ع',
    'i': 'ه', 'o': 'خ', 'p': 'ح', '[': 'ج', ']': 'د', 'a': 'ش', 's': 'س',
    'd': 'ي', 'f': 'ب', 'g': 'ل', 'h': 'ا', 'j': 'ت', 'k': 'ن', 'l': 'م',
    ';': 'ك', "'": 'ط', 'z': 'ئ', 'x': 'ء', 'c': 'ؤ', 'v': 'ر', 'b': 'لا',
    'n': 'ى', 'm': 'ة', ',': 'و', '.': 'ز', '/': 'ظ',
};

const ARABIC_TO_ENGLISH = Object.fromEntries(
    Object.entries(ENGLISH_TO_ARABIC).map(([k, v]) => [v, k])
);

class Extension {
    constructor() {
        this._settings = null;
        this._clipboard = null;
    }

    enable() {
        log('Keyboard Layout Fixer: enabling...');
        this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.keyboardlayoutfixer');

        // Initialize Clipboard instance
        this._clipboard = St.Clipboard.get_default();

        // Add keyboard shortcut
        Main.wm.addKeybinding(
            'convert-text-shortcut',
            this._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            () => {
                log('Keyboard Layout Fixer: shortcut pressed');
                this._onShortcutPressed();
            }
        );
        log('Keyboard Layout Fixer: enabled');
    }

    disable() {
        Main.wm.removeKeybinding('convert-text-shortcut');
        if (this._settings) {
            this._settings = null;
        }

        // Nullify Clipboard instance
        this._clipboard = null;

        log('Keyboard Layout Fixer: disabled');
    }

    _getSelectedText(callback) {
        if (!this._clipboard) {
            callback('');
            return;
        }

        // First try to get the primary selection (highlighted text)
        this._clipboard.get_text(SELECTION_TYPE, (_, primaryText) => {
            if (primaryText) {
                callback(primaryText);
            } else {
                // If no selection, try clipboard content
                this._clipboard.get_text(CLIPBOARD_TYPE, (_, clipboardText) => {
                    callback(clipboardText || '');
                });
            }
        });
    }

    _onShortcutPressed() {
        log('Keyboard Layout Fixer: processing shortcut');
        
        this._getSelectedText((text) => {
            if (!text) {
                this._showNotification('No text selected', 'Please select some text first');
                return;
            }

            try {
                let convertedText = this._convertText(text);
                if (convertedText) {
                    // Copy converted text to clipboard
                    this._clipboard.set_text(CLIPBOARD_TYPE, convertedText);
                    
                    // Show notification
                    this._showNotification('Text Converted', convertedText);
                    log('Keyboard Layout Fixer: text converted successfully');
                }
            } catch (error) {
                log('Keyboard Layout Fixer: error converting text - ' + error.message);
                this._showNotification('Error', 'Failed to convert text: ' + error.message);
            }
        });
    }

    _convertText(text) {
        // Detect if text is mainly English or Arabic
        const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
        const englishCount = (text.match(/[a-zA-Z]/g) || []).length;
        const isEnglish = englishCount >= arabicCount;
        
        return text.split('').map(char => {
            if (isEnglish) {
                // Convert capital letters to lowercase before looking up in the mapping
                const lowerChar = char.toLowerCase();
                return ENGLISH_TO_ARABIC[lowerChar] || char;
            } else {
                return ARABIC_TO_ENGLISH[char] || char;
            }
        }).join('');
    }

    _showNotification(title, text) {
        let source = new MessageTray.Source('Keyboard Layout Fixer',
                                          'input-keyboard-symbolic');
        Main.messageTray.add(source);

        let notification = new MessageTray.Notification(source, title, text);
        notification.setTransient(true);
        source.showNotification(notification);
    }
}

function init() {
    log('Keyboard Layout Fixer: initializing');
    return new Extension();
}
