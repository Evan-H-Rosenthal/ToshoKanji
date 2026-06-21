
# ToshoKanji

ToshoKanji is a kanji and radical learning app prototype generated from the original Figma design:
https://www.figma.com/design/2oZvSayfYzcQBdNLDGOxhJ/Kanji-Dictionary-App-Design.

## Windows Setup

Install Node.js for Windows from https://nodejs.org/. Use the LTS installer unless you have a reason to use another version.

If PowerShell blocks `npm` with a script execution policy error, approve locally signed/remote-signed scripts for your Windows account:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Close and reopen PowerShell after changing the execution policy.

## Running The App

From the project folder:

```powershell
npm install
npm rebuild
npm run dev
```

Then open the local URL printed by Vite, usually:

```text
http://localhost:5173/
```

## Regenerating App Icons

The source app icon lives at:

```text
public/icons/toshokanji-icon.svg
```

After replacing that SVG, regenerate the PWA, iOS, and favicon assets with:

```powershell
npm run icons
```
  
