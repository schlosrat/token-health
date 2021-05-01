# Token Health

Apply damage/healing with a few keystrokes to all selected tokens at once.

⚠️ If your version is 0.1.3, you will have to reinstall the module.

## Description

This is a module for [FoundryVTT](https://foundryvtt.com/) intended for GMs that want to apply damage or healing more easily. Without this mod, you have to click several times to adjust the hit points of a token. With Token Health installed, you can hit Enter, enter the damage and hit Enter again. 

## Install

You can install this module directly from the "Add-on Modules" page on the FoudryVTT Setup screen. 

Make sure to enable the module once your world is launched, in the Manage Modules setting page.

## Usage

You can always change the default settings in the Module Settings.
NOTE: Some settings are game system specific and may not work correctly (or at all) with game systems that don't support those features.

### Use Token Health

1. Select/target one or multiple token(s)
1. Press the toggle key (default: <kbd>Enter</kbd>) of the alternate toggle key (default: <kbd>Shift</kbd> + <kbd>Enter</kbd>) to display the dialog. To apply damage/healing to targeted tokens, add the <kbd>Alt</kbd> key by default.
1. Enter a value
1. Validate by pressing <kbd>Enter</kbd> or by clicking the big button

### What you can do

- Press the **toggle key** and enter a value to apply **damage** 
- Press the **toggle key** and enter a ***negative value*** to apply **healing**
- Press the **alternate toggle key** and enter a value to apply **healing** 
- Press the **alternate toggle key** and enter a ***negative value*** to apply **damage** 

![screenshot](screenshot.png)

### Output to Chat

- Token Health will create a chat message from each affected token indicating how much actual damage was done or healing received. This is particularly useful when applying damage to multiple tokens where damage mitigation is being employed and each token may be mitigating a different amount of damage.

## Credits

### Original Version:
- by Discord user *thorni#4664*

### Localization
- **Français**: by ? and Google Translate
- **Español**: by Discord user *ForjaSalvaje#2419*.
- **Deutsch**: by Discord user *dabri0n#1632*
