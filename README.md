
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

## Testing The PWA Build

Service workers are generated for production builds. To test offline caching locally:

```powershell
npm run build
npm run preview
```

Open the preview URL printed by Vite, usually:

```text
http://localhost:4173/
```

In Chrome DevTools, open Application > Service Workers to inspect the registered worker, and Application > Cache Storage to inspect cached app assets.

## Regenerating App Icons

The source app icon lives at:

```text
public/icons/toshokanji-icon.svg
```

After replacing that SVG, regenerate the PWA, iOS, and favicon assets with:

```powershell
npm run icons
```

## Regenerating Kanji Data

The current app dataset is generated from public dictionary sources instead of being hand-authored. To rebuild it:

```powershell
npm run data:kanji
```

The script downloads source files into `.cache/datasets/` and writes the generated TypeScript data to:

```text
src/app/data/kanjiData.ts
```

For this milestone, the generator creates a starter set of 100 kanji: all grade 1 kanji plus the most frequent grade 2 kanji needed to reach 100 total entries. It also generates the radical entries used by those kanji, visible component data from KRADFILE, and a small set of vocabulary examples from JMdict_e.
  
