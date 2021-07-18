# Changelog

## 0.4.4 (2021-07-18)
- Overhauled how configurable settings are handled to correctly configure things without stomping on the configurations set by other mods and systems.
- Added two new optional config settings (ALT_MAX_HITPOINTS_ATTRIBUTE_1 & ALT_MAX_HITPOINTS_ATTRIBUTE_2) which facilitate handling of temporary health in DnD5e.
- New fields added to each language file to support new configurable settings.

## 0.4.3 (2021-06-04)
- Added Japanese translation (Thanks BrotherSharper)
- Updated French, German and Japanese translations for new fields (used Google Translate)
- Disabled use of conditions for AGE games until that capability get's sorted out in 0.8.6
- Updated minimum core version to 0.8.5

## 0.4.2 (2021-05.30)
- Added user configurable damage types (up to three) - mainly useful for AGE System games or other games that need both damage mitigation and the ability to bypass that.
- Added user configurable damage subtypes (up to two) - Useful for games with two different health resource pools (e.g. SWADE, L5R5E, TORG, etc.) or games with different rules for application of damage to a single pool (e.g. AGE - wound vs. stun)
- These changes improve the localization of the TH dialog box by allowing localized configuration of damage type and subtype terminology in addition to supporting many more game systems.

## 0.4.1 (2021-05.29)
- Added setting control for enabling/disabling token images in Token Health dialog. Defaults to enabled. When disabled the dialog box is vertically shorter
- Added setting control for enabling/disabling setting of token conditions (specific to AGE system). Defaults to enabled. When disabled no token conditions will be set by Token Health, although the module will still track what the conditions would be so that otherwise the behavior is the same.
- Added setting control for switching polarity on damage/healing (Damage is Additive). This enables support for game systems like SWADE and L5R5E where damage accumulates as a positive quantity from a base of zero (0) which is full health.

## 0.4.0 (2021-05.23)
- Updated to be compatible with FVTT 0.8.5
- Switched keybinding to DF Hotkeys (added dependency to lib-df-hotkeys)

## 0.3.1 (2021-05-04)
- Added user configurable control to enable/disable token chat - efault to Enable (true)

## 0.3.0 (2021-05-01)

- Transferred repository from tonifisler to schlosrat to fold in fixes and updates listed below
- Fixed incorrect handling of a blank/empty setting for TEMP_HITPOINTS_ATTRIBUTE
- Code cleanup so that only one update call is made per possible path through the code
- Updated compatibleCoreVersion to 0.7.9

- Dialog Box Improvements:
  - Added name of token(s) to dialog header - Thanks itamarcu!
  - Added thumbnails of token(s) inside dialog box above the Amount entry box - Thanks itamarcu!
  - Added pulldown menu for Damage Type (See Damage Mitigation and Damage Type Features added below)
  - Added radio buttons for Damage Subtype (Only present if playing age-system. See AGE Specific Features added below)

- Token Chat Capability:
  - Added Token Chat capability to generate chat messages from each affected token indicating their reaction/result
  - Token Chat messages are localized for language with user configurable overrides through module settings
  - General token chat messages visible to all indicate token reaction, but not number of points damage/healing
  - GM-Only token chat messages indicate the actual amount of damage/healing done to each token
  - Token Chat Situations:
    - More than 1 point of damage/healing done
    - Just 1 point of damage/healing done
    - No damage/healing done
    - Token takes Injured condition (AGE System specific)
    - Token takes Wounded condition (AGE System specific)
    - Token takes Unconscious condition as determined by health <= to user configurable KO threshold
    - Token takes Dead condition as determined by health <= to user configurable death threshold
    - Damage applied to already dead token

- Health State Thresholds:
  - User configurable health threshold for Unconscious (default: health = 0)
  - User configurable threshold for Death (default: health = 0, may be set lower for some games)
  - Token states for unconscious, dying, dead tracked thorough token flags

- Damage Mitigation Feature:
  - Allow for up to three token attributes to be specified for damage mitigation by Damage Type
  - This allows for armor/toughness/etc. to automatically reduce the amount of damage done - no reduction of healing

- Damage Type Feature: (only present if Damage Mitigation is turned on
  - Implemented Damage Types: Impact (default), Ballistic, and Penetrating (bypasses all mitigation)
  - NOTE: The default Damage Types are defined for the AGE system, but may be used for other systems where damage mitigation is allowed

- AGE System Specific Features:
  - AGE-System dependent module features only executed for AGE-System games to prevents conflicts with other systems
  - Added correct automatic configuration for AGE System (game.system.id === 'age-system')
  - Implemented Damage Subtypes: Wound (default) & Stun (will not take token beyond unconscious)
  - Added User Configurable setting to permit Damage Buyoff
  - Implemented a Damage Buyoff system to automate damage mitigation by token taking Injured or Wounded conditions
  - Added Belter translations so Token Chat sounds more like what a Belter might really say (only if token is a Belter)

- Language Translation Updates:
  - Extended English and French localizations for token chat an other new features (lang/en.json, lang/fs.json)
  - Updated Espanol (Spanish) language translation (lang/es.json) - Thanks ForjaSalvaje#2419!
  - Added Deutsche (German) language translation (lang/de.json) - Thanks, dabri0n#1632!


## 0.2.2 (2020-10-11)

- add config for negative HP values (defaults to true with Pathfinder 1e)
- fix wrong applied values #17

## 0.2.1 (2020-10-05)

- forgot the download link

## 0.2.0 (2020-10-05)

- add feature to apply damage/healing to targeted tokens (thanks @AJAnderson) #10
- allow negative hp (thanks @emdant) #11

## 0.1.7 (2020-05-31)

- update settings extender

## 0.1.6 (2020-05-02)

- add missing translation strings
- improve readme

## 0.1.5 (2020-04-30)

- add default settings for pf2 (thanks @kenster421) #6
- add a new keyboard shortcut to apply healing (suggested by @apoapostolov) #7

## 0.1.4 (2020-04-22)

- fix module on other systems than dnd5e (thanks @Joonasm) #4
- fix settings not used correctly

## 0.1.3 (2020-04-19)

- fix some issues with dialog toggling with other interactions on FoundryVTT (thanks @apoapostolov) #1

## 0.1.2 (2020-04-19)

- fix custom key being printed in the input when opening dialog
- fix dialog being retoggled when validating and auto-closing with Enter key

## 0.1.1 (2020-04-19)

- fix wrong mapping to data attributes
- make sure the config is stored when changed

## 0.1.0 (2020-04-19)

- **First public release**
