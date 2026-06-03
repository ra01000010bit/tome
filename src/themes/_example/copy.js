// UI-szövegek központi helye. A motor nem feltételez nyelvet — bármilyen nyelv
// mehet. A kulcs-struktúrának egyeznie kell azzal, amire a képernyők hivatkoznak
// (COPY.<kulcs>...). Új téma másik nyelvet/hangot is használhat.

export const COPY = {
  nav: {
    home:       'Tanulás',
    collection: 'Gyűjtemény',
    settings:   'Beállítások',
  },

  home: {
    title:          'Tome — Starter téma',
    weakPointsCard: 'Hibanapló',
    starterTitle:   'Üdvözlő ajándék',
  },

  collection: {
    title:               'Gyűjtemény',
    chaptersTitle:       'Fejezetek',
    undiscoveredChapter: 'Felfedezetlen fejezet',
    sortToggle:          'Sorrend rendezése',
    cancel:              'Mégse',
    save:                'Mentés',
    closeModal:          'Bezárás',
    undiscoveredCard:    'Felfedezetlen',
    notDiscovered:       'Még nem fedezted fel',
    levelLabel:          'SZINT',
    riderSuffix:         '',
    emptyKaram:          'A gyűjtemény még üres — vedd át az üdvözlő ajándékot a főoldalon, vagy teljesíts egy leckét.',
  },

  quiz: {
    notFound: 'Nincs ilyen lecke.',
  },

  subjectView: {
    notFound:     'Nincs ilyen tantárgy.',
    noTopics:     'Ehhez a tantárgyhoz még nincsenek leckék.',
    pipelineHint: 'A pipeline futtatásával töltődnek fel.',
  },

  weakPoints: {
    title:        'Hibanapló',
    drilledTitle: 'Átismételve!',
  },

  flashcard: {
    solutionLabel:   'Megoldás',
    confidenceLabel: 'Mennyire tudtad?',
  },

  multipleChoice: {
    confidenceLabel: 'Mennyire vagy biztos a válaszodban?',
    sectionLabel:    'Fejezet:',
    pdfLabel:        'Forrás:',
    continue:        'Tovább',
  },

  cloze: {
    correctAnswers: 'Helyes válaszok:',
  },

  settings: {
    title:      'Beállítások',
    dangerZone: 'Veszélyzóna',
    syncOff:    'Sync kikapcsolva',
  },
};

export default COPY;
