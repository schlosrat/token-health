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

![screenshot](screenshot_0.png)

- Multiple tokens may be selected. The name for each token selected will appear in the title bar of the dialog box.
- Up to four selected token icons will also be shown inside the dialog box with decreasing opacity (the fourth is cut off)
- This helps you ensure you've got the right tokens targeted before you apply damage or healing!

### Output to Chat

- Token Health will create chat messages from each affected token indicating the effect and how much actual damage was done or healing received. This is particularly useful when applying damage to multiple tokens where damage mitigation is being employed and each token may be mitigating a different amount of damage.
- Tokens will output one message that's visible to everyone indicating the token's reaction to the effect
- Tokens also output an additional GM-Only message indicating the total amount of damage or healing done
- Tokens announce the following results in chat
	- When they are damaged or healed, with optionally different messages if the amount is trivial
	- If they're uneffected by damage/healing
	- If they've fallen unconscious (based on user configurable health threashold for unconsciousness)
	- If they die due to the damage applied (based on user configurable health threashold for death)
	- If damage is being applied to them and they're already dead
- Token chat messages default to language localizations, but each case may be overridden via module settings so they'll say what you want them to say

### AGE System Specific Features

- Damage Type may be selected from the pull down menu to the right of the Amount entry field
- Damage Subtype may be selected from the radio buttons below the Amount entry field
- Damage Buyoff may be selected from the Module Configuration Screen (implements Injured and Wounded conditions)
- Additional Belter translation of Token Chat messages if the effected token has it's Origin set to Belter (Specific to The Expanse)

![screenshot](screenshot_1.png)

- Damage Type selections are Impact (default), Ballisitic, and Penetraiting
- If Impact is selected, then either ordinary (impact) or specialized (ballisitic) armor will help to reduce the damage done
- If Ballistic is selected as the Damage Type, then only ballistic armor will be used for the armor-based mitigation of damage
- If Penetrating is selected, then all armor and/or tougness are bypassed and the full damage is applied
- NOTE: Damage mitigation by Tougness is set in the Game Settings in conjunction with the Damage Mitigation Attributes. If included, then Tougness adds to armor for Impact or Ballistic damage mitigation.
- Healing is never mitigate by armor or toughness

![screenshot](screenshot_detail.png)

## Credits

### Original Version:
- by Discord user *thorni#4664*

### Localization
- **Français**: by ? and Google Translate
- **Español**: by Discord user *ForjaSalvaje#2419*.
- **Deutsch**: by Discord user *dabri0n#1632*
