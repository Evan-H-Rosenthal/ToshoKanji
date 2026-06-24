# ToshoKanji

ToshoKanji is a collectible kanji dictionary: a mobile-first app where users unlock kanji through a playful gacha flow, then browse, search, personalize, and study the collection they build over time.

The app is not meant to be a full Kanshudo replacement, a complete Japanese dictionary, or a heavy learning management system. Its center of gravity is simpler:

1. Unlock kanji.
2. Browse a colorful collection.
3. Open useful, readable entries.
4. Learn through meanings, readings, components, radicals, words, notes, and practice.

## Product Identity

ToshoKanji should feel like a personal kanji library crossed with a capsule toy machine. The gacha mechanic gives the app momentum and delight. The entry system gives it lasting utility.

The guiding product sentence is:

> Kanji are collectible entries. Words and components are supporting entries. Radicals are metadata with occasional entry pages. Raw decomposition is internal data.

That hierarchy keeps the app focused while still allowing the underlying dataset to contain richer, messier information.

## Core Principles

### Collect first, study second

The gacha unlock mechanic is part of the app's identity, not decoration. Users should feel that they are building a personal collection of kanji over time.

### Entries are the durable value

Even without the game layer, ToshoKanji should be useful as a browsable and searchable kanji reference.

### Simple by default, deeper on demand

Kanji data is messy. ToshoKanji should show the most useful learner-facing information first and keep technical or raw data out of the default reading path.

### Kanji are primary

Kanji are the main collectible objects. Words make them useful. Components explain their visual structure. Official radicals provide classification when helpful.

### Avoid false precision

The app should not pretend uncertain decomposition, etymology, or component relationships are more exact than they are. Labels like "components" or "visible parts" are safer than overconfident claims about what a kanji "really" contains.

## Main User Flow

1. The user opens the app on the gacha screen.
2. The user unlocks a kanji.
3. The app reveals the unlocked item and optionally jumps to the collection.
4. The collection highlights the new kanji.
5. The user opens the kanji entry.
6. The user reviews meanings, readings, components, radical information, and example words.
7. The user favorites, renames, or adds notes to the entry.
8. The user later practices from the kanji they have unlocked.

## Main App Areas

### Gacha

The gacha screen is the emotional engine of the app.

Required features:

- Main gacha machine interaction.
- Random unlock from the available pool.
- Clear reveal state for newly unlocked items.
- Progress summary.
- Completion state when all available content has been unlocked.
- Optional auto-jump to the collection after an unlock.

Product recommendation:

- Kanji should be the primary gacha unlock.
- Components and radicals should become visible through unlocked kanji rather than competing with kanji as equally important collectibles.

### Collection

The collection is the user's browsable shelf of unlocked kanji.

Required features:

- Grid of unlocked kanji.
- Search by character, meaning, readings, custom names, and example word meanings.
- Favorites filter.
- Progress count.
- Color-coded cards.
- Recently unlocked highlight.

Future filters:

- Grade.
- JLPT level.
- Stroke count.
- Category or theme.
- Recently unlocked.
- Needs practice.

Product rule:

- The collection should feel like a shelf of things the user owns, not a database table.

### Kanji Entry

The kanji entry is the central information page.

Default sections:

1. Hero
   - Kanji character.
   - Primary meaning.
   - Favorite button.
   - Optional custom name.

2. Meanings
   - Primary meaning emphasized.
   - Secondary meanings listed simply.
   - No oversized dictionary gloss dump.

3. Readings
   - On'yomi.
   - Kun'yomi.
   - Long reading lists collapsed by default.

4. Example Words
   - Japanese word.
   - Reading or furigana.
   - Optional romaji.
   - English meaning.
   - Common word marker when available.
   - Link to word entry.

5. Components
   - Learner-facing visible components.
   - Simple meaning when known.
   - Link to component entry.

6. Official Radical
   - Official radical when available.
   - Radical form used in the kanji.
   - Variant note only when useful.

7. Notes
   - User notes, mnemonics, and reminders.

8. Ask or Chat
   - Optional helper for explanations or mnemonic ideas.
   - Should be treated as assistance, not authoritative dictionary truth.

Advanced or internal data:

- Raw decomposition should not appear in the default learner UI.
- Source provenance, filtered fragments, and raw component details belong in developer or advanced views.
- Alternate radicals should not be foregrounded unless they solve a clear learner-facing problem.

### Component Entry

Component entries help users recognize recurring visual parts.

Default sections:

- Component character or form.
- Simple learner meaning when available.
- Whether it corresponds to an official radical.
- Related kanji.
- Variant relationship only when useful.

Product rule:

- Components are pattern-recognition aids. They do not need the same depth as kanji entries.

### Word Entry

Word entries make kanji useful in real vocabulary.

Default sections:

- Word in Japanese.
- Reading or furigana.
- Meaning.
- Common marker.
- Kanji used in the word.
- Links back to kanji entries.

Future additions:

- Example sentences.
- Audio.
- Part of speech.
- Frequency or commonness.

Product rule:

- Words support kanji learning. ToshoKanji should not become a full Japanese dictionary by accident.

### Practice

Practice should create memory pressure from the user's unlocked collection.

Initial modes:

- Meaning recall: show kanji, choose meaning.
- Reading recognition: show kanji, choose reading.
- Word recognition: show word, choose meaning.
- Favorites-only practice.
- Recently unlocked practice.

Future modes:

- Spaced repetition.
- Writing or stroke-order practice.
- Custom decks.
- Weak-items queue.

Product rule:

- Practice should use unlocked content by default.

### Achievements

Achievements provide light motivation.

Good achievement types:

- First unlock.
- 10, 25, 50, and 100 kanji unlocked.
- First favorite.
- First note.
- First practice session.
- Complete a grade, JLPT level, or category group.

Avoid:

- Aggressive daily streak pressure.
- Achievements that require obscure radical trivia.

## AI Features

AI should make ToshoKanji feel more conversational, personal, and exploratory. It should help the user ask better questions about kanji without replacing the app's curated dictionary data.

The core AI feature is in-entry chat: a user can open a kanji, word, or component entry and ask an AI about that specific item. The chat should have access to the current entry's structured data so answers can be grounded in what the app already knows.

Possible providers:

- Gemini or another free/low-cost API for early development.
- A provider abstraction so the app is not permanently tied to one model vendor.
- A mock/local response mode for development, demos, and offline fallback.

Product rule:

- AI is a learning companion, not the canonical data source. Meanings, readings, radicals, components, and word links should come from the app's dataset first.

### Entry Chat

Entry chat is the primary AI experience.

Users should be able to ask about:

- What a kanji means and how its meanings relate.
- How to remember a kanji.
- Words that use the kanji.
- Differences between similar-looking kanji.
- On'yomi and kun'yomi reading patterns.
- Pictographic or historical origins when known.
- How the character may have changed over time.
- Whether a component is semantic, phonetic, official, or mostly visual.

AI responses should:

- Prefer concise, learner-friendly explanations.
- Mention uncertainty when discussing etymology, historical evolution, or component roles.
- Avoid inventing facts when the app does not have enough context.
- Invite follow-up questions when a topic is naturally deeper.
- Use the user's notes or custom names only when relevant.

Useful default prompts:

- "Explain this kanji simply."
- "Give me a mnemonic."
- "Why is this reading used?"
- "Show me useful words with this kanji."
- "Compare this to a similar kanji."
- "What is known about its origin?"

### Personalized Practice Generation

AI may generate short practice lessons from the user's unlocked collection.

Possible lesson types:

- Quick review of recently unlocked kanji.
- Mini-lesson around a theme, such as numbers, school, nature, or directions.
- Favorites-only review.
- Weak-item review once practice history exists.
- Example-word quiz using unlocked kanji.
- Custom explanation after a missed answer.

Product rule:

- AI can assemble and explain practice, but quiz answers should be checked against structured app data whenever possible.

### Notes Assistance

AI may help users improve their notes.

Possible note tools:

- Summarize long notes.
- Expand a short note into a clearer mnemonic.
- Turn notes into flashcard-style prompts.
- Suggest a memory hook based on the user's wording.
- Clean up spelling or formatting.

Product rule:

- Notes are personal. AI should suggest edits, not silently replace the user's writing.

### AI Boundaries

AI features should avoid:

- Presenting speculative etymology as fact.
- Overwriting curated entry data.
- Generating unsupported readings, meanings, radicals, or example words.
- Making the app dependent on network access for core browsing.
- Sending unnecessary personal data to external APIs.

The app should remain useful without AI. AI should deepen the experience when available.

## Data Philosophy

ToshoKanji should store more data than it shows.

### Core learner data

- Character.
- Meanings.
- On'yomi and kun'yomi.
- Stroke count.
- Grade, JLPT, or frequency when available.
- Example words.
- Official radical.
- Learner-facing components.

### Advanced optional data

- Full reading lists.
- Etymology summary, only when sourced and confidence-labeled.
- Frequency and grade metadata.
- Stroke count.

### Developer or debug data

- Raw decomposition.
- Source provenance.
- Filtered raw fragments.
- Alternate extraction details.

This approach keeps the app honest without making the user wade through the full mess of kanji reference data.

## Non-Goals

ToshoKanji should not initially try to be:

- A complete Kanshudo replacement.
- A full Japanese dictionary.
- A grammar app.
- A sentence mining tool.
- A stroke-order handwriting tutor.
- A full spaced-repetition system with complex scheduling.
- A scholarly kanji etymology database.
- A comprehensive radical variant database.

These may become future features, but they should not define the first stable architecture.

## MVP Definition

The first complete version of ToshoKanji should include:

- Gacha unlock flow.
- Persistent unlocked kanji.
- Collection grid.
- Search and favorites.
- Kanji entries.
- Word entries.
- Component entries.
- Entry chat powered by an AI provider or development mock.
- Notes and custom names.
- Basic achievements.
- One simple practice mode.
- Generated dataset with stable IDs and validated references.

The app is successful if a user can open it daily, unlock a few kanji, browse their growing library, and find the entries pleasant enough to revisit.

## Original Design Source

The prototype began from the original Figma design:

https://www.figma.com/design/2oZvSayfYzcQBdNLDGOxhJ/Kanji-Dictionary-App-Design

## Windows Setup

Install Node.js for Windows from https://nodejs.org/. Use the LTS installer unless you have a reason to use another version.

If PowerShell blocks `npm` with a script execution policy error, approve locally signed or remote-signed scripts for your Windows account:

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

The script downloads source files into `.cache/datasets/` and writes generated TypeScript data to:

```text
src/app/data/generated/
```

For this milestone, the generator creates a starter set of 100 kanji: all grade 1 kanji plus the most frequent grade 2 kanji needed to reach 100 total entries. It also generates the radical entries used by those kanji, a distinct component catalog where every radical is also a component, learner-facing and raw component data from KRADFILE, and vocabulary examples from JMdict_e.
