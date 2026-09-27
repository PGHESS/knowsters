/* Learning progression and pet-specific abilities, independent of the interface. */
(()=>{'use strict';
const thresholds=[0,2,5,9,16,27,42,62];
const domains={
 math:{label:'Mathematik',icon:'∑',attributes:['attack','focus','resonance']},
 logic:{label:'Logik & Denken',icon:'◇',attributes:['initiative','defense','focus']},
 language:{label:'Deutsch & Sprache',icon:'Aa',attributes:['charisma','focus','willpower']},
 english:{label:'Englisch',icon:'EN',attributes:['charisma','initiative','intuition']},
 nature:{label:'Natur & Umwelt',icon:'⌁',attributes:['vitality','defense','resonance']},
 history:{label:'Geschichte',icon:'⌛',attributes:['willpower','intuition','charisma']},
 civics:{label:'Gesellschaft & Sozialkunde',icon:'◎',attributes:['charisma','willpower','intuition']},
 media:{label:'IT, KI & Social Media',icon:'⌘',attributes:['focus','initiative','intuition']},
 geography:{label:'Geografie & Welt',icon:'◉',attributes:['agility','intuition','vitality']},
 economy:{label:'Alltag & Wirtschaft',icon:'¤',attributes:['focus','charisma','willpower']}
};
const titles={
 math:['Plus & Minus','Mal & Geteilt','Punkt vor Strich','Klammern','Brüche','Prozentrechnung','Gemischte Rechnungen','Gleichungen'],
 logic:['Zahlenmuster','Wechselnde Muster','Reihen & Regeln','Räumliches Denken','Aussagenlogik','Mehrere Bedingungen','Planen & Kombinieren','Logische Schlüsse'],
 language:['Wörter verstehen','Rechtschreibung','Satzbau','Grammatik','Zeichensetzung','Texte verstehen','Genau formulieren','Argumente prüfen'],
 english:['Everyday words','Simple sentences','Tenses','Reading context','Nuance','Communication','Inference','Precise meaning'],
 nature:['Lebensräume','Körper & Stoffe','Kräfte & Energie','Ökosysteme','Chemische Grundlagen','Klima & Kreisläufe','Systeme verstehen','Transfer & Bewertung'],
 history:['Zeit & Epochen','Ursache & Folge','Alltag früher','Wandel & Erfindungen','Quellen lesen','Perspektiven','Zusammenhänge','Historisch urteilen'],
 civics:['Zusammenleben','Regeln & Rechte','Demokratische Grundlagen','Institutionen','Interessen abwägen','Gesellschaft & Wirtschaft','Konflikte einordnen','Begründet urteilen'],
 media:['Digitale Grundlagen','Sicher online','Quellen prüfen','Plattformen verstehen','Algorithmen & Daten','KI & Manipulation','Statistiken & Wirkung','Digitale Urteilskraft'],
 geography:['Karten & Räume','Länder & Klima','Koordinaten & Orientierung','Naturkräfte','Bevölkerung & Städte','Globale Verflechtung','Ressourcen & Wandel','Räumliche Systeme'],
 economy:['Geld & Budget','Preise & Prozent','Verträge & Konsum','Zinsen & Inflation','Arbeit & Unternehmen','Angebot & Nachfrage','Risiko & Entscheidungen','Wirtschaftlich abwägen']
};

const difficultyLabels=['Grundlage','Aufbau','Anwendung','Vertiefung','Transfer','Analyse','Vernetzung','Meisterschaft'];
const curriculum={
 math:[
  {id:'math-arithmetic',title:'Plus & Minus',goal:'Zahlen sicher zerlegen, addieren und subtrahieren.',scope:'Grundrechnen · Zahlverständnis · Überschlag'},
  {id:'math-multiply',title:'Mal & Geteilt',goal:'Multiplikation und Division flexibel anwenden.',scope:'Produkte · Quotienten · Umkehroperationen'},
  {id:'math-order',title:'Punkt vor Strich',goal:'Rechenregeln sicher in mehrschrittigen Aufgaben nutzen.',scope:'Reihenfolge · Terme · Rechenwege'},
  {id:'math-brackets',title:'Klammern',goal:'Terme mit Klammern strukturiert auflösen.',scope:'Klammern · Rechenstrategien · Terme'},
  {id:'math-fractions',title:'Brüche',goal:'Anteile verstehen, vergleichen und berechnen.',scope:'Brüche · Anteile · Verhältnisdenken'},
  {id:'math-percent',title:'Prozentrechnung',goal:'Prozentwerte in Alltag, Preisen und Veränderungen berechnen.',scope:'Prozent · Rabatt · Anteile'},
  {id:'math-mixed',title:'Gemischte Rechnungen',goal:'Mehrere Rechenideen kombinieren und passende Wege auswählen.',scope:'Transfer · Größen · gemischte Operationen'},
  {id:'math-equations',title:'Gleichungen',goal:'Unbekannte Größen aus Beziehungen und Gleichungen bestimmen.',scope:'Variablen · Umformen · Modellieren'}
 ],
 logic:[
  {id:'logic-sequences',title:'Zahlenmuster',goal:'Einfache Regeln in Folgen erkennen und fortsetzen.',scope:'Muster · Reihen · Regel erkennen'},
  {id:'logic-alternating',title:'Wechselnde Muster',goal:'Mehrere abwechselnde Regeln auseinanderhalten.',scope:'Wechselregeln · Aufmerksamkeit · Struktur'},
  {id:'logic-rules',title:'Reihen & Regeln',goal:'Regeln verallgemeinern und auf neue Fälle übertragen.',scope:'Verdopplung · Struktur · Transfer'},
  {id:'logic-spatial',title:'Räumliches Denken',goal:'Richtungen, Positionen und räumliche Veränderungen mental verfolgen.',scope:'Orientierung · Drehung · Raumvorstellung'},
  {id:'logic-statements',title:'Aussagenlogik',goal:'Aus gegebenen Aussagen nur das ableiten, was sicher folgt.',scope:'Wenn–dann · Kategorien · Schlussfolgern'},
  {id:'logic-conditions',title:'Mehrere Bedingungen',goal:'Mehrere Bedingungen gleichzeitig berücksichtigen.',scope:'Reihenfolgen · Bedingungen · Ausschluss'},
  {id:'logic-combine',title:'Planen & Kombinieren',goal:'Möglichkeiten systematisch zählen und Entscheidungen planen.',scope:'Kombinationen · Planung · Varianten'},
  {id:'logic-deduction',title:'Logische Schlüsse',goal:'Komplexere Schlüsse prüfen und Fehlschlüsse vermeiden.',scope:'Deduktion · Gegenbeispiel · Schlussregeln'}
 ],
 language:[
  {id:'de-vocabulary',title:'Wörter verstehen',goal:'Bedeutungen, Gegensätze und passende Formulierungen erkennen.',scope:'Wortschatz · Bedeutung · Kontext'},
  {id:'de-spelling',title:'Rechtschreibung',goal:'Häufige und anspruchsvollere Schreibweisen sicher unterscheiden.',scope:'Rechtschreibung · Wortformen · dass/das'},
  {id:'de-syntax',title:'Satzbau',goal:'Satzarten und Nebensätze korrekt verstehen.',scope:'Satzbau · Verbposition · Satzarten'},
  {id:'de-grammar',title:'Grammatik',goal:'Fälle, Satzglieder und Formen im Kontext bestimmen.',scope:'Kasus · Satzglieder · Flexion'},
  {id:'de-punctuation',title:'Zeichensetzung',goal:'Satzstruktur durch passende Zeichensetzung verständlich machen.',scope:'Komma · direkte Rede · Satzgrenzen'},
  {id:'de-reading',title:'Texte verstehen',goal:'Aussagen, Bezüge und Kernaussagen aus Texten herausarbeiten.',scope:'Lesen · Kernaussage · Textbezug'},
  {id:'de-precision',title:'Genau formulieren',goal:'Missverständnisse vermeiden und Aussagen präzise formulieren.',scope:'Stil · Präzision · adressatengerecht'},
  {id:'de-arguments',title:'Argumente prüfen',goal:'Behauptung, Beleg und Schluss sauber voneinander unterscheiden.',scope:'Argumentation · Belege · Schlussfolgerung'}
 ],
 english:[
  {id:'en-everyday',title:'Everyday words',goal:'Alltagswortschatz und häufige Gegensätze sicher verstehen.',scope:'Vocabulary · everyday situations'},
  {id:'en-sentences',title:'Simple sentences',goal:'Einfache Sätze, Fragen und laufende Handlungen korrekt verstehen.',scope:'Present simple · present continuous · questions'},
  {id:'en-tenses',title:'Tenses',goal:'Zeitformen und zeitliche Signale in typischen Situationen unterscheiden.',scope:'Past · present · future'},
  {id:'en-context',title:'Reading context',goal:'Bedeutung aus Satz- und Textzusammenhang erschließen.',scope:'Context · reference · main idea'},
  {id:'en-nuance',title:'Nuance',goal:'Verknüpfungen, Einschränkungen und Bedeutungsnuancen erkennen.',scope:'Contrast · consequence · probability'},
  {id:'en-communication',title:'Communication',goal:'Höflich, klar und situationsgerecht kommunizieren.',scope:'Register · requests · clarification'},
  {id:'en-inference',title:'Inference',goal:'Zwischen belegter Aussage und Interpretation unterscheiden.',scope:'Sources · inference · evidence'},
  {id:'en-precision',title:'Precise meaning',goal:'Komplexere Aussagen präzise lesen und sprachliche Unsicherheit erkennen.',scope:'Claims · evidence · ambiguity'}
 ],
 nature:[
  {id:'nature-basics',title:'Naturwissenschaftliche Grundlagen',goal:'Lebewesen, Lebensräume, Stoffe und grundlegende Kräfte einordnen.',scope:'Biologie · Stoffe · Gravitation'},
  {id:'nature-body',title:'Körper & Stoffe',goal:'Körperfunktionen und Stoffeigenschaften mit einfachen Modellen erklären.',scope:'Körper · Aggregatzustände · Wärme'},
  {id:'nature-energy',title:'Energie & Wechselwirkungen',goal:'Energieumwandlungen und Kräfte in Alltag und Natur verstehen.',scope:'Energie · Kräfte · Bewegung'},
  {id:'nature-ecosystems',title:'Ökosysteme',goal:'Nahrungsnetze, Stoffkreisläufe und Wechselwirkungen beschreiben.',scope:'Ökosystem · Nahrung · Kreisläufe'},
  {id:'nature-chemistry',title:'Stoffe & chemische Grundlagen',goal:'Stoffeigenschaften, pH und chemische Veränderungen unterscheiden.',scope:'pH · Teilchen · Reaktionen'},
  {id:'nature-climate',title:'Klima & Kreisläufe',goal:'Klima, Kohlenstoff- und Wasserkreisläufe miteinander verknüpfen.',scope:'Klima · Treibhauseffekt · Kreisläufe'},
  {id:'nature-models',title:'Systeme & Modelle',goal:'Modelle, Daten und Zusammenhänge kritisch interpretieren.',scope:'Modelle · Korrelation · Systemdenken'},
  {id:'nature-evidence',title:'Wissenschaftlich urteilen',goal:'Versuche, Unsicherheit und Evidenz methodisch bewerten.',scope:'Kontrollvariablen · Stichprobe · Evidenz'}
 ],
 history:[
  {id:'history-time',title:'Zeit & Quellen',goal:'Ereignisse zeitlich und räumlich einordnen und Quellen erkennen.',scope:'Chronologie · Quelle · Kontext'},
  {id:'history-causes',title:'Ursache & Folge',goal:'Auslöser, längerfristige Ursachen und Folgen unterscheiden.',scope:'Kausalität · Anlass · Folge'},
  {id:'history-life',title:'Alltag & Gesellschaft früher',goal:'Lebensbedingungen verschiedener Gruppen historisch vergleichen.',scope:'Alltag · Gesellschaft · Wandel'},
  {id:'history-change',title:'Wandel & Erfindungen',goal:'Technische, wirtschaftliche und gesellschaftliche Veränderungen verbinden.',scope:'Innovation · Industrialisierung · Veränderung'},
  {id:'history-sources',title:'Quellen lesen',goal:'Urheber, Zweck, Entstehungssituation und Grenzen einer Quelle prüfen.',scope:'Quellenkritik · Kontext · Absicht'},
  {id:'history-perspectives',title:'Perspektiven',goal:'Unterschiedliche historische Perspektiven vergleichen, ohne sie gleichzusetzen.',scope:'Perspektive · Interessen · Vergleich'},
  {id:'history-connections',title:'Zusammenhänge',goal:'Mehrere Ursachen und Entwicklungen zu einer begründeten Erklärung verbinden.',scope:'Mehrursächlichkeit · Kontinuität · Wandel'},
  {id:'history-judgement',title:'Historisch urteilen',goal:'Historische Deutungen mit Quellen, Kontext und offengelegten Maßstäben bewerten.',scope:'Urteil · Erinnerung · Evidenz'}
 ],
 civics:[
  {id:'civics-together',title:'Zusammenleben',goal:'Regeln, Interessen und gegenseitige Rücksicht im Alltag einordnen.',scope:'Zusammenleben · Konflikte · Verantwortung'},
  {id:'civics-rights',title:'Regeln & Rechte',goal:'Rechte, Pflichten und begründete Grenzen von Regeln unterscheiden.',scope:'Rechte · Pflichten · Regeln'},
  {id:'civics-democracy',title:'Demokratische Grundlagen',goal:'Mehrheit, Minderheit, Beteiligung und Gewaltenteilung grundsätzlich verstehen.',scope:'Demokratie · Beteiligung · Gewaltenteilung'},
  {id:'civics-institutions',title:'Institutionen',goal:'Aufgaben verschiedener staatlicher Ebenen und Institutionen auseinanderhalten.',scope:'Bund · Länder · Kommune · Institutionen'},
  {id:'civics-interests',title:'Interessen abwägen',goal:'Konfligierende Interessen erkennen und faire Verfahren beurteilen.',scope:'Interessen · Kompromiss · Verfahren'},
  {id:'civics-society',title:'Gesellschaft & Wirtschaft',goal:'Zusammenhänge zwischen Arbeit, öffentlicher Infrastruktur und gesellschaftlicher Teilhabe verstehen.',scope:'Gesellschaft · Arbeit · öffentliche Güter'},
  {id:'civics-conflicts',title:'Konflikte einordnen',goal:'Fakten, Werte, Interessen und mögliche Folgen in Konflikten trennen.',scope:'Konfliktanalyse · Beteiligung · Perspektiven'},
  {id:'civics-judgement',title:'Begründet urteilen',goal:'Politische und gesellschaftliche Aussagen anhand transparenter Kriterien bewerten.',scope:'Fakten · Werte · Begründung · Minderheitenschutz'}
 ],
 media:[
  {id:'media-basics',title:'Digitale Grundlagen',goal:'Grundbegriffe zu Geräten, Daten, Netzen und Konten verstehen.',scope:'Daten · Browser · Konto · Netzwerk'},
  {id:'media-security',title:'Sicher online',goal:'Konten, Geräte und persönliche Daten mit grundlegenden Maßnahmen schützen.',scope:'Passwörter · 2FA · Phishing · Updates'},
  {id:'media-sources',title:'Quellen prüfen',goal:'Urheber, Belege, Datum und Primärquelle einer Behauptung prüfen.',scope:'Quelle · Beleg · Rückwärtssuche · Kontext'},
  {id:'media-platforms',title:'Plattformen verstehen',goal:'Empfehlungssysteme, öffentliche Reichweite und Privatsphäre auseinanderhalten.',scope:'Feeds · Plattformen · Datenschutz · Aufmerksamkeit'},
  {id:'media-algorithms',title:'Algorithmen & Daten',goal:'Verstehen, wie Daten und Optimierungsziele digitale Ausgaben beeinflussen.',scope:'Algorithmus · Daten · Personalisierung'},
  {id:'media-ai',title:'KI & Manipulation',goal:'Generative KI, Deepfakes und überzeugend klingende Fehlinformation kritisch prüfen.',scope:'KI · Deepfake · Halluzination · Verifikation'},
  {id:'media-statistics',title:'Statistiken & Wirkung',goal:'Diagramme, Prozentangaben und Aufmerksamkeitsmechanismen kritisch lesen.',scope:'Statistik · Basisrate · Engagement · Wirkung'},
  {id:'media-judgement',title:'Digitale Urteilskraft',goal:'Informationsqualität, Sicherheit, Privatsphäre und Aufmerksamkeit bewusst abwägen.',scope:'Urteil · Informationshygiene · Privatsphäre'}
 ],
 geography:[
  {id:'geo-maps',title:'Karten & Räume',goal:'Karten, Maßstab und grundlegende räumliche Begriffe nutzen.',scope:'Karte · Maßstab · Äquator'},
  {id:'geo-climate',title:'Länder, Wetter & Klima',goal:'Wetter, Klima, Klimazonen und räumliche Unterschiede unterscheiden.',scope:'Wetter · Klima · Regionen'},
  {id:'geo-coordinates',title:'Koordinaten & Orientierung',goal:'Positionen mit Koordinaten, Himmelsrichtungen und Zeitzonen beschreiben.',scope:'Breite · Länge · Orientierung'},
  {id:'geo-forces',title:'Naturkräfte',goal:'Plattentektonik, Wasser und Landschaftsbildung als Prozesse verstehen.',scope:'Erdbeben · Vulkanismus · Erosion'},
  {id:'geo-cities',title:'Bevölkerung & Städte',goal:'Urbanisierung, Migration und Infrastruktur als räumliche Prozesse einordnen.',scope:'Stadt · Bevölkerung · Migration'},
  {id:'geo-global',title:'Globale Verflechtung',goal:'Lieferketten, Handel und Verkehr als räumliche Netzwerke verstehen.',scope:'Lieferketten · Verkehr · Globalisierung'},
  {id:'geo-resources',title:'Ressourcen & Wandel',goal:'Ressourcennutzung, Wasser, Energie und Nachhaltigkeitskonflikte räumlich betrachten.',scope:'Ressourcen · Nutzung · Nachhaltigkeit'},
  {id:'geo-systems',title:'Räumliche Systeme',goal:'Wechselwirkungen zwischen Natur, Infrastruktur, Wirtschaft und Gesellschaft abwägen.',scope:'Systemdenken · Planung · räumliche Folgen'}
 ],
 economy:[
  {id:'eco-budget',title:'Geld & Budget',goal:'Einnahmen, Ausgaben und begrenzte Mittel planen.',scope:'Budget · Bedarf · Reserve'},
  {id:'eco-prices',title:'Preise & Prozent',goal:'Rabatte, Grundpreise und Preisvergleiche korrekt berechnen.',scope:'Prozent · Stückpreis · Vergleich'},
  {id:'eco-contracts',title:'Verträge & Konsum',goal:'Kosten, Laufzeiten, Pflichten und Verbraucherentscheidungen einordnen.',scope:'Vertrag · Konsum · Folgekosten'},
  {id:'eco-inflation',title:'Zinsen & Inflation',goal:'Zinsen, Preisniveau und Kaufkraft grundsätzlich verstehen.',scope:'Zins · Inflation · Kaufkraft'},
  {id:'eco-business',title:'Arbeit & Unternehmen',goal:'Kosten, Erlöse, Produktivität und Unternehmensentscheidungen unterscheiden.',scope:'Arbeit · Kosten · Erlös · Produktivität'},
  {id:'eco-market',title:'Angebot & Nachfrage',goal:'Knappheit, Preise und Marktreaktionen als vereinfachte Modelle verstehen.',scope:'Angebot · Nachfrage · Knappheit'},
  {id:'eco-risk',title:'Risiko & Entscheidungen',goal:'Risiko, Streuung, Versicherungsprinzip und Unsicherheit unterscheiden.',scope:'Risiko · Diversifikation · Absicherung'},
  {id:'eco-judgement',title:'Wirtschaftlich abwägen',goal:'Kosten, Nutzen, Alternativen, externe Effekte und Verteilung gemeinsam betrachten.',scope:'Opportunitätskosten · Folgen · Abwägung'}
 ]
};
const ageBands={
 '12-13':{label:'12–13 Jahre',hint:'mittlere Grundlagen',base:{math:4,logic:2,language:3,english:2,nature:2,history:2,civics:1,media:2,geography:2,economy:1}},
 '14-15':{label:'14–15 Jahre',hint:'Aufbau & Anwendung',base:{math:5,logic:3,language:4,english:3,nature:3,history:3,civics:2,media:3,geography:3,economy:2}},
 '16-17':{label:'16–17 Jahre',hint:'Transfer & Vertiefung',base:{math:6,logic:4,language:5,english:4,nature:4,history:4,civics:3,media:4,geography:4,economy:3}},
 '18-24':{label:'18–24 Jahre',hint:'anspruchsvoller Einstieg',base:{math:6,logic:5,language:5,english:5,nature:5,history:5,civics:5,media:5,geography:5,economy:5}},
 '25-40':{label:'25–40 Jahre',hint:'anspruchsvoller Einstieg',base:{math:6,logic:5,language:5,english:5,nature:5,history:5,civics:5,media:5,geography:5,economy:5}}
};
const attributeDefs=[
 {id:'vitality',label:'Vitalität / LP',short:'LP'},{id:'attack',label:'Angriff',short:'ANG'},{id:'defense',label:'Abwehr',short:'ABW'},{id:'initiative',label:'Initiative',short:'INI'},{id:'agility',label:'Beweglichkeit',short:'BEW'},
 {id:'resonance',label:'Mana / Resonanz',short:'MAN'},{id:'focus',label:'Fokus',short:'FOK'},{id:'charisma',label:'Charisma',short:'CHA'},{id:'intuition',label:'Intuition',short:'INT'},{id:'willpower',label:'Willenskraft',short:'WIL'}
];
const attributeOrder=attributeDefs.map(x=>x.id),attributeMap=Object.fromEntries(attributeDefs.map(x=>[x.id,x]));
const potentialTemplates={
 ember:{vitality:760,attack:980,defense:660,initiative:900,agility:900,resonance:820,focus:730,charisma:650,intuition:720,willpower:880},
 moss:{vitality:950,attack:680,defense:990,initiative:620,agility:650,resonance:760,focus:820,charisma:800,intuition:790,willpower:940},
 tide:{vitality:840,attack:740,defense:820,initiative:760,agility:820,resonance:950,focus:920,charisma:760,intuition:880,willpower:510},
 generic:{vitality:800,attack:800,defense:800,initiative:800,agility:800,resonance:800,focus:800,charisma:800,intuition:800,willpower:800}
};
const startTemplates={
 ember:{vitality:330,attack:450,defense:290,initiative:430,agility:440,resonance:390,focus:350,charisma:320,intuition:340,willpower:390},
 moss:{vitality:430,attack:300,defense:450,initiative:270,agility:300,resonance:340,focus:380,charisma:360,intuition:340,willpower:410},
 tide:{vitality:360,attack:340,defense:380,initiative:370,agility:400,resonance:430,focus:420,charisma:360,intuition:410,willpower:390},
 generic:{vitality:350,attack:350,defense:350,initiative:350,agility:350,resonance:350,focus:350,charisma:350,intuition:350,willpower:350}
};
const abilities={
 ember:[
  {id:'ember-wave',name:'Feuerwelle',branch:'Angriff',icon:'🔥',cost:1,focus:2,type:'damage',power:17,description:'Eine Feuerwelle trifft für 17 Schaden.'},
  {id:'ember-wall',name:'Flammenwand',branch:'Schutz',icon:'◇',cost:1,focus:2,type:'wall',power:14,description:'14 Schild. Der nächste Gegenangriff erhält 4 Feuerschaden zurück.'},
  {id:'ember-spark',name:'Glutfreund',branch:'Gefährte',icon:'✧',cost:2,focus:3,type:'summon',power:4,turns:3,description:'Beschwört einen Glutfreund. Er greift in 3 Runden mit je 4 Schaden an.'},
  {id:'ember-burn',name:'Glutbrand',branch:'Angriff',icon:'♨',cost:2,focus:3,type:'dot',power:9,tick:4,turns:3,requires:'ember-wave',description:'9 Schaden und 3 Runden lang jeweils 4 Brandschaden.'},
  {id:'ember-heart',name:'Glutherz',branch:'Schutz',icon:'♡',cost:2,focus:2,type:'heal',power:16,requires:'ember-wall',description:'Entfacht neue Kraft und stellt bis zu 16 Leben wieder her.'},
  {id:'ember-storm',name:'Flammensturm',branch:'Angriff',icon:'✦',cost:3,focus:4,type:'damage',power:29,requires:'ember-burn',description:'Ein konzentrierter Sturm trifft für 29 Schaden.'}
 ],
 moss:[
  {id:'moss-vines',name:'Lebende Ranken',branch:'Angriff',icon:'🌿',cost:1,focus:2,type:'weaken',power:10,turns:2,description:'10 Schaden. Die nächsten 2 Gegenangriffe verursachen je 3 Schaden weniger.'},
  {id:'moss-shield',name:'Waldschild',branch:'Schutz',icon:'◇',cost:1,focus:2,type:'shield',power:16,description:'Eine Rindenbarriere fängt 16 Schaden ab.'},
  {id:'moss-sprout',name:'Wurzelling',branch:'Gefährte',icon:'✧',cost:2,focus:3,type:'summon',power:4,turns:3,description:'Ein kleiner Wurzelling kämpft 3 Runden an deiner Seite: je 4 Schaden.'},
  {id:'moss-poison',name:'Giftsporen',branch:'Angriff',icon:'◌',cost:2,focus:3,type:'dot',power:6,tick:5,turns:3,requires:'moss-vines',description:'6 Schaden und 3 Runden lang jeweils 5 Giftschaden.'},
  {id:'moss-bloom',name:'Heilblüte',branch:'Schutz',icon:'♡',cost:2,focus:2,type:'heal',power:17,requires:'moss-shield',description:'Eine Blüte stellt bis zu 17 Leben wieder her.'},
  {id:'moss-thorns',name:'Dornenwall',branch:'Schutz',icon:'✦',cost:3,focus:3,type:'wall',power:23,requires:'moss-shield',description:'23 Schild. Der nächste Gegenangriff erhält 4 Dornenschaden zurück.'}
 ],
 tide:[
  {id:'tide-wave',name:'Wellenstoß',branch:'Angriff',icon:'💧',cost:1,focus:2,type:'damage',power:16,description:'Eine gebündelte Welle trifft für 16 Schaden.'},
  {id:'tide-heal',name:'Heilquelle',branch:'Schutz',icon:'♡',cost:1,focus:2,type:'heal',power:15,description:'Frisches Quellwasser stellt bis zu 15 Leben wieder her.'},
  {id:'tide-friend',name:'Quellgeist',branch:'Gefährte',icon:'✧',cost:2,focus:3,type:'summon',power:4,turns:3,description:'Beschwört einen Quellgeist. Er greift 3 Runden mit je 4 Schaden an.'},
  {id:'tide-frost',name:'Frostgriff',branch:'Angriff',icon:'❄',cost:2,focus:3,type:'weaken',power:12,turns:2,requires:'tide-wave',description:'12 Schaden. Die nächsten 2 Gegenangriffe verursachen je 3 Schaden weniger.'},
  {id:'tide-veil',name:'Wasserschleier',branch:'Schutz',icon:'◇',cost:2,focus:2,type:'shield',power:20,requires:'tide-heal',description:'Eine Wasserhülle fängt 20 Schaden ab.'},
  {id:'tide-flow',name:'Lebensstrom',branch:'Schutz',icon:'✦',cost:3,focus:3,type:'heal',power:28,requires:'tide-veil',description:'Ein tiefer Lebensstrom stellt bis zu 28 Leben wieder her.'}
 ]};
const trees={ember:['Flammenmagie','Glutherz','Glutgefährten'],moss:['Ranken & Gift','Lebensbaum','Waldgefährten'],tide:['Gezeiten','Quellschutz','Wassergeister']};
const additions={
 ember:[{id:'ember-aegis',name:'Phönixmantel',branch:'Schutz',icon:'◇',cost:3,focus:4,type:'wall',power:28,requires:'ember-heart',description:'28 Schild und 4 Schaden beim nächsten Gegenangriff.'},{id:'ember-fox',name:'Glutfuchs',branch:'Gefährte',icon:'✧',cost:2,focus:3,type:'summon',power:6,turns:3,requires:'ember-spark',description:'Ein Glutfuchs hilft 3 Runden mit je 6 Schaden.'},{id:'ember-phoenix',name:'Phönixruf',branch:'Gefährte',icon:'✦',cost:3,focus:4,type:'summon',power:8,turns:3,requires:'ember-fox',description:'Ein Phönix hilft 3 Runden mit je 8 Schaden.'}],
 moss:[{id:'moss-briar',name:'Rankensturm',branch:'Angriff',icon:'✦',cost:3,focus:4,type:'damage',power:28,requires:'moss-poison',description:'Dichte Ranken treffen für 28 Schaden.'},{id:'moss-guardian',name:'Rindenwächter',branch:'Gefährte',icon:'✧',cost:2,focus:3,type:'summon',power:6,turns:3,requires:'moss-sprout',description:'Ein Rindenwächter hilft 3 Runden mit je 6 Schaden.'},{id:'moss-ancient',name:'Uralter Baumgeist',branch:'Gefährte',icon:'✦',cost:3,focus:4,type:'summon',power:8,turns:3,requires:'moss-guardian',description:'Ein Baumgeist hilft 3 Runden mit je 8 Schaden.'}],
 tide:[{id:'tide-tsunami',name:'Gezeitenbruch',branch:'Angriff',icon:'✦',cost:3,focus:4,type:'damage',power:28,requires:'tide-frost',description:'Eine mächtige Woge trifft für 28 Schaden.'},{id:'tide-otter',name:'Wasserotter',branch:'Gefährte',icon:'✧',cost:2,focus:3,type:'summon',power:6,turns:3,requires:'tide-friend',description:'Ein Wasserotter hilft 3 Runden mit je 6 Schaden.'},{id:'tide-dragon',name:'Quellendrache',branch:'Gefährte',icon:'✦',cost:3,focus:4,type:'summon',power:8,turns:3,requires:'tide-otter',description:'Ein Quellendrache hilft 3 Runden mit je 8 Schaden.'}]
};
for(const id of Object.keys(abilities))abilities[id].push(...additions[id]);
const basics=['strike','guard','focus'];
function prepareSets(pet,id){
 const valid=new Set([...basics,...pet.unlocked.filter(x=>abilities[id].some(a=>a.id===x))]);
 const defaultSet=[...basics,pet.unlocked.find(x=>valid.has(x))||null];
 if(!Array.isArray(pet.sets))pet.sets=[defaultSet,[...defaultSet],[...defaultSet]];
 pet.sets=Array.from({length:3},(_,i)=>{const seen=new Set();return Array.from({length:4},(_,j)=>{const x=pet.sets[i]?.[j];if(!valid.has(x)||seen.has(x))return null;seen.add(x);return x;});});
 pet.activeSet=Number.isInteger(pet.activeSet)&&pet.activeSet>=0&&pet.activeSet<3?pet.activeSet:0;
 return pet.sets[pet.activeSet];
}
function equip(pet,id,slot,ability){prepareSets(pet,id);if(!Number.isInteger(slot)||slot<0||slot>3)return false;
 if(ability!==null&&!basics.includes(ability)&&!abilities[id].some(a=>a.id===ability&&pet.unlocked.includes(a.id)))return false;
 const set=pet.sets[pet.activeSet],old=set[slot],other=set.indexOf(ability);if(ability&&other>=0&&other!==slot)set[other]=old;set[slot]=ability;return true;
}
const r=(lo,hi)=>lo+Math.floor(Math.random()*(hi-lo+1));
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=r(0,i);[a[i],a[j]]=[a[j],a[i]]}return a;};
function tier(count){let n=0;for(let i=0;i<thresholds.length;i++)if(count>=thresholds[i])n=i;return n;}
function curriculumStage(kind,index){const stages=curriculum[kind]||[];return stages[Math.max(0,Math.min(7,Number(index)||0))]||null;}
function track(kind,count){const n=tier(count),stage=curriculumStage(kind,n);return{tier:n,title:stage?.title||titles[kind][n],difficulty:difficultyLabels[n],topicId:stage?.id||`${kind}-${n}`,goal:stage?.goal||'',scope:stage?.scope||'',next:thresholds[n+1]??null,remaining:thresholds[n+1]===undefined?null:thresholds[n+1]-count,solved:count};}
function pack(kind,count,prompt,answer,wrong,explanation,extra={}){
 const meta=track(kind,count),opts=[...new Set([String(answer),...wrong.map(String)])];let i=1;while(opts.length<4){const v=String(Number(answer)+i++);if(!opts.includes(v))opts.push(v);}
 return{kind,label:domains[kind]?.label||kind,tier:meta.tier,difficulty:meta.difficulty,topic:meta.title,topicId:meta.topicId,learningGoal:meta.goal,scope:meta.scope,prompt,answer:String(answer),options:shuffle(opts.slice(0,4)),explanation,attempts:0,status:'open',...extra};
}
function numeric(kind,count,prompt,answer,explanation,extra={}){return pack(kind,count,prompt,answer,[answer+1,answer-1,answer+3],explanation,extra);}
const gcd=(a,b)=>b?gcd(b,a%b):a;
const fraction=(n,d)=>{const g=gcd(Math.abs(n),d);return d/g===1?String(n/g):`${n/g}/${d/g}`;};
function math(count){
 const t=tier(count),v=r(0,2),a=r(3,12),b=r(2,9),c=r(2,6);
 if(t===0){const sub=v===1,x=r(8,30),y=r(2,8);return numeric('math',count,`${x} ${sub?'−':'+'} ${y} = ?`,sub?x-y:x+y,sub?`Ziehe ${y} von ${x} ab: ${x} − ${y} = ${x-y}.`:`Addiere ${y} zu ${x}: ${x} + ${y} = ${x+y}.`);}
 if(t===1){const divide=v===1;return numeric('math',count,divide?`${a*b} ÷ ${b} = ?`:`${a} × ${b} = ?`,divide?a:a*b,`${a} × ${b} = ${a*b}. Deshalb ist ${a*b} ÷ ${b} = ${a}.`);}
 if(t===2){const divide=v===1;return numeric('math',count,divide?`${a} + ${b*c} ÷ ${c} = ?`:`${a} + ${b} × ${c} = ?`,divide?a+b:a+b*c,divide?`Zuerst teilen: ${b*c} ÷ ${c} = ${b}. Dann ${a} + ${b} = ${a+b}.`:`Punkt vor Strich: ${b} × ${c} = ${b*c}. Dann ${a} + ${b*c} = ${a+b*c}.`);}
 if(t===3){return numeric('math',count,`(${a} + ${b}) × ${c} = ?`,(a+b)*c,`Zuerst die Klammer: ${a} + ${b} = ${a+b}. Dann ${a+b} × ${c} = ${(a+b)*c}.`);}
 if(t===4){
  const denominator=r(3,10),n=r(1,denominator-1);
  if(v===0){const whole=denominator*r(2,8);return numeric('math',count,`Wie viel ist ${n}/${denominator} von ${whole}?`,whole/denominator*n,`Teile ${whole} in ${denominator} gleiche Teile: ${whole/denominator} je Teil. Nimm ${n} davon: ${whole/denominator*n}.`,{fractionVisual:{n,d:denominator}});}
  if(v===1){const answer=fraction(n+1,denominator);return pack('math',count,`${n}/${denominator} + 1/${denominator} = ?`,answer,[fraction(n,denominator),fraction(n+2,denominator),fraction(n+1,denominator*2)],`Gleicher Nenner: Addiere die Zähler. (${n} + 1)/${denominator} = ${answer}.`,{fractionVisual:{n,d:denominator}});}
  const answer=fraction(n,denominator*c);return pack('math',count,`${n}/${denominator} ÷ ${c} = ?`,answer,[fraction(n*c,denominator),fraction(n,denominator+c),fraction(n+1,denominator*c)],`Beim Teilen durch ${c} wird jeder Anteil ${c}-mal kleiner: ${n}/(${denominator} × ${c}) = ${answer}.`);
 }
 if(t===5){const pct=[10,20,25,50,75][r(0,4)],base=r(2,15)*20,val=base*pct/100;return numeric('math',count,v===1?`Ein Gegenstand kostet ${base} Münzen. Du erhältst ${pct} % Rabatt. Was zahlst du?`:`Wie viel sind ${pct} % von ${base}?`,v===1?base-val:val,`${pct} % bedeutet ${pct}/100. ${base} × ${pct} ÷ 100 = ${val}.${v===1?` Nach dem Rabatt: ${base} − ${val} = ${base-val}.`:''}`);}
 if(t===6){if(v===0)return numeric('math',count,`(${a*b} ÷ ${b} + ${c}) × ${b} = ?`,(a+c)*b,`In der Klammer zuerst teilen: ${a*b} ÷ ${b} = ${a}. Danach ${a} + ${c} = ${a+c}. Zuletzt mal ${b}: ${(a+c)*b}.`);const base=20*r(2,10),pct=[10,25,50][r(0,2)],part=base*pct/100;return numeric('math',count,`${pct} % von ${base} + (${a} × ${c}) = ?`,part+a*c,`${pct} % von ${base} sind ${part}. Die Klammer ergibt ${a*c}. Zusammen: ${part+a*c}.`);}
 const x=r(2,Math.min(30,10+Math.floor((count-62)/10))),coef=r(2,9),offset=r(2,15),right=coef*x+offset;return numeric('math',count,`Finde x: ${coef} × x + ${offset} = ${right}`,x,`Ziehe zuerst ${offset} ab: ${right-offset}. Teile dann durch ${coef}: x = ${x}.`);
}
function logic(count){
 const t=tier(count),a=r(2,9),b=r(2,6);
 if(t===0)return numeric('logic',count,`Wie geht die Reihe weiter? ${a}, ${a+b}, ${a+2*b}, ?`,a+3*b,`Jedes Mal kommen ${b} dazu. ${a+2*b} + ${b} = ${a+3*b}.`);
 if(t===1)return numeric('logic',count,`Die Regel wechselt. ${a}, ${a+2}, ${a+5}, ${a+7}, ?`,a+10,'Die Schritte wechseln zwischen +2 und +3. Als Nächstes kommt +3.');
 if(t===2)return numeric('logic',count,`Welche Zahl folgt? ${a}, ${a*2}, ${a*4}, ?`,a*8,'Jede Zahl wird verdoppelt. Multipliziere die letzte Zahl mit 2.');
 if(t===3){const dirs=['Norden','Osten','Süden','Westen'],start=r(0,3),right=r(1,3);return pack('logic',count,`Du schaust nach ${dirs[start]} und drehst dich ${right}-mal um 90° nach rechts. Wohin schaust du?`,dirs[(start+right)%4],dirs.filter(x=>x!==dirs[(start+right)%4]),`Eine Rechtsdrehung folgt dieser Reihenfolge: Norden → Osten → Süden → Westen. Gehe ${right} Schritte ab ${dirs[start]} weiter.`);}
 if(t===4){const names=['Lumo','Mika','Runa','Taro','Suri','Nilo'],name=names[r(0,5)],groups=[['Quellgeister','schwimmen','Quellgeist'],['Waldhüter','klettern','Waldhüter'],['Glutfüchse','Feuer spüren','Glutfuchs']][r(0,2)];return pack('logic',count,`Alle ${groups[0]} können ${groups[1]}. ${name} ist ein ${groups[2]}. Was folgt sicher?`,`${name} kann ${groups[1]}.`,[`Nur ${name} kann ${groups[1]}.`,`${name} kann nicht ${groups[1]}.`,`${name} ist das einzige Wesen im Wald.`],`Die Regel gilt für alle ${groups[0]} und damit auch für ${name}. Eine Aussage über andere Wesen folgt daraus nicht.`);}
 if(t===5){const order=shuffle(['Moos','Funke','Welle']);return pack('logic',count,`${order[0]} kommt vor ${order[1]}. ${order[2]} kommt nach ${order[1]}. Wer kommt als Zweites?`,order[1],[order[0],order[2],'Nicht bestimmbar'],`Die Reihenfolge ist ${order.join(' → ')}.`);}
 if(t===6){const kinds=r(2,5),colors=r(2,5);return numeric('logic',count,`Du hast ${kinds} verschiedene Umhänge und ${colors} verschiedene Abzeichen. Wie viele Kombinationen aus je einem Umhang und einem Abzeichen gibt es?`,kinds*colors,`Zu jedem der ${kinds} Umhänge passen ${colors} Abzeichen. Also ${kinds} × ${colors} = ${kinds*colors}.`);}
 const conditions=[['die Laterne leuchtet','jemand im Turm ist','Niemand ist im Turm.','Die Laterne leuchtet nicht.'],['das Tor offen ist','die Glocke läutet','Die Glocke läutet nicht.','Das Tor ist nicht offen.'],['die Quelle warm ist','der Kristall leuchtet','Der Kristall leuchtet nicht.','Die Quelle ist nicht warm.']][r(0,2)];return pack('logic',count,`Es gilt: Wenn ${conditions[0]}, dann gilt, dass ${conditions[1]}. ${conditions[2]} Was folgt sicher?`,conditions[3],['Die Regel hat keine Bedeutung.','Beide Bedingungen sind trotzdem erfüllt.','Die umgekehrte Regel gilt immer.'],'Wäre die erste Bedingung erfüllt, müsste auch die zweite erfüllt sein. Da die zweite nicht erfüllt ist, kann auch die erste nicht erfüllt sein.');
}
const languageBank=[
 [
  ['Welches Wort bedeutet ungefähr „mutig“?','tapfer',['laut','müde','hastig'],'„Tapfer“ und „mutig“ beschreiben, dass jemand trotz Angst handelt.'],
  ['Was ist das Gegenteil von „vorsichtig“?','unbedacht',['achtsam','behutsam','umsichtig'],'„Unbedacht“ bedeutet, ohne ausreichendes Nachdenken zu handeln.'],
  ['Welches Wort passt? „Wir lösen das Rätsel ___.“','gemeinsam',['gemeinsamer','Gemeinschaft','gemeinsamen'],'Das Adverb „gemeinsam“ beschreibt, wie wir etwas tun.']
 ],
 [
  ['Welches Wort ist richtig geschrieben?','Rhythmus',['Rytmus','Rythmuß','Rhytmus'],'Das Wort schreibt man „Rhythmus“: mit h nach R und nach t.'],
  ['Welche Schreibung stimmt?','nämlich',['nähmlich','nämlih','nemlich'],'„Nämlich“ schreibt man ohne h.'],
  ['Ergänze: „Ich weiß, ___ du helfen willst.“','dass',['das','daß','dahs'],'Die Konjunktion „dass“ leitet hier einen Nebensatz ein.']
 ],
 [
  ['Welcher Satz hat einen korrekten Nebensatz?','Moos wartet, weil Welle noch lernt.',['Moos wartet, weil Welle lernt noch.','Moos wartet weil, Welle noch lernt.','Weil Welle noch, lernt Moos wartet.'],'Im Nebensatz mit „weil“ steht das gebeugte Verb am Ende.'],
  ['Welcher Satz steht im Perfekt?','Funke hat den Pfad gefunden.',['Funke findet den Pfad.','Funke fand den Pfad.','Funke wird den Pfad finden.'],'Das Perfekt besteht hier aus „hat“ und dem Partizip „gefunden“.'],
  ['Welcher Satz ist eine Frage?','Warum leuchtet die Quelle?',['Die Quelle leuchtet hell.','Lass die Quelle in Ruhe!','Wenn die Quelle leuchtet.'],'„Warum“ leitet eine Frage nach einem Grund ein.']
 ],
 [
  ['Welcher Fall steht in „mit dem kleinen Wesen“?','Dativ',['Nominativ','Akkusativ','Genitiv'],'Die Präposition „mit“ verlangt den Dativ: mit wem?'],
  ['Was ist das Subjekt in „Am Morgen öffnet Welle das Tor“?','Welle',['Am Morgen','das Tor','öffnet'],'Wer öffnet das Tor? Welle. Das Subjekt steht im Nominativ.'],
  ['Welche Form passt? „Wegen ___ blieb der Pfad leer.“','des starken Regens',['dem starken Regenes','den starken Regens','der starke Regen'],'In der Standardsprache steht „wegen“ hier mit Genitiv: wegen des Regens.']
 ],
 [
  ['Welcher Satz ist korrekt gesetzt?','Als es dunkel wurde, gingen wir zurück.',['Als es dunkel wurde gingen, wir zurück.','Als, es dunkel wurde gingen wir zurück.','Als es dunkel, wurde gingen wir zurück.'],'Ein vorangestellter Nebensatz wird durch ein Komma vom Hauptsatz getrennt.'],
  ['Welche Schreibung passt?','Sie blieb, um das Rätsel zu lösen.',['Sie blieb um, das Rätsel zu lösen.','Sie, blieb um das Rätsel zu lösen.','Sie blieb um das Rätsel, zu lösen.'],'Eine Infinitivgruppe mit „um“ wird durch ein Komma abgetrennt.'],
  ['Welche Aussage ist korrekt?','Das Haus, das am See steht, ist leer.',['Das Haus dass am See steht ist leer.','Das Haus, dass am See steht ist leer.','Das Haus das, am See steht, ist leer.'],'Der Relativsatz wird durch zwei Kommas eingeschlossen. „Das“ ist hier ein Relativpronomen.']
 ],
 [
  ['„Funke griff nach der Fackel, legte sie aber wieder hin, als sie das trockene Gras sah.“ Was lässt sich am besten erschließen?','Sie wollte einen Brand vermeiden.',['Sie konnte die Fackel nicht sehen.','Sie vergaß, wo sie war.','Sie hatte bereits ein Feuer gelegt.'],'Das trockene Gras erklärt, warum sie auf das Feuer verzichtet.'],
  ['„Welle kannte den Weg. Trotzdem fragte sie Moos nach seiner Meinung.“ Was passt am besten?','Sie bezog Moos in die Entscheidung ein.',['Sie hatte den Weg vergessen.','Sie wollte Moos wegschicken.','Sie konnte nicht sprechen.'],'„Trotzdem“ zeigt: Obwohl sie den Weg kannte, war ihr seine Meinung wichtig.'],
  ['„Der Nebel lichtete sich. Erst jetzt entdeckten sie den schmalen Steg.“ Welche Ursache wird nahegelegt?','Der Nebel hatte die Sicht auf den Steg verdeckt.',['Der Steg wurde gerade gebaut.','Sie hatten vorher die Augen geschlossen.','Der Nebel zerstörte den Steg.'],'„Erst jetzt“ verknüpft die bessere Sicht mit der Entdeckung.']
 ],
 [
  ['Welche Bitte ist am klarsten formuliert?','Bitte bring morgen zwei leere Flaschen zur Quelle.',['Bring vielleicht irgendwann etwas mit.','Mach das dann mal dort.','Die Sachen sollten irgendwie kommen.'],'Die Bitte benennt Handlung, Zeitpunkt, Menge und Ziel.'],
  ['Welche Aussage trennt Beobachtung und Vermutung?','Die Tür ist offen. Vielleicht ist jemand im Haus.',['Weil die Tür offen ist, wohnt sicher ein Dieb dort.','Offene Türen bedeuten immer Gefahr.','Niemand schließt hier je eine Tür.'],'Der erste Satz nennt eine Beobachtung; „vielleicht“ kennzeichnet die Schlussfolgerung als unsicher.'],
  ['Welche Formulierung ist sachlich?','Der Versuch gelang in drei von fünf Durchgängen.',['Der Versuch war einfach unfassbar perfekt.','Jeder weiß, dass der Versuch nutzlos ist.','So etwas klappt selbstverständlich immer.'],'Die Formulierung liefert eine überprüfbare Angabe ohne Übertreibung.']
 ],
 [
  ['Welche Aussage ist ein begründetes Argument?','Wir nehmen den beleuchteten Weg, weil wir dort Hindernisse besser erkennen.',['Wir nehmen ihn, weil das eben so ist.','Alle anderen Wege sind bestimmt schlecht.','Wer anders geht, versteht nichts.'],'Die Begründung erklärt nachvollziehbar, warum die vorgeschlagene Handlung nützlich ist.'],
  ['„Zwei Wesen scheiterten am Rätsel. Also kann niemand es lösen.“ Was ist das Problem?','Aus zwei Fällen wird eine Aussage über alle abgeleitet.',['Die Aussage enthält zu viele Belege.','Es fehlen Namen, sonst wäre der Schluss sicher.','Jeder Schluss aus Beobachtungen ist falsch.'],'Zwei erfolglose Versuche beweisen nicht, dass niemand eine Lösung finden kann.'],
  ['Welche Aussage berücksichtigt ein Gegenargument?','Der kurze Weg spart Zeit; bei Regen ist der längere befestigte Weg aber sicherer.',['Der kurze Weg ist immer richtig.','Wer den langen Weg nimmt, hat keine Ahnung.','Über den Weg muss man nie nachdenken.'],'Die Aussage wägt Zeitersparnis und Sicherheit unter verschiedenen Bedingungen ab.']
 ]
];
function language(count){const bank=languageBank[tier(count)],q=bank[r(0,bank.length-1)];return pack('language',count,q[0],q[1],q[2],q[3]);}

const genericBanks={
 english:[
  [['What does “careful” mean?','vorsichtig',['laut','schnell','hungrig'],'“Careful” bedeutet vorsichtig oder aufmerksam.'],['Choose the correct sentence.','She goes to school every day.',['She go to school every day.','She going to school every day.','She gone to school every day.'],'Bei “she” erhält das Verb im Simple Present meistens ein -s.'],['What is the opposite of “early”?','late',['near','slow','small'],'“Late” ist das Gegenteil von “early”.']],
  [['Which sentence is in the past?','They visited the museum yesterday.',['They visit the museum every week.','They are visiting the museum now.','They will visit the museum tomorrow.'],'“Visited” und “yesterday” markieren hier die Vergangenheit.'],['What does “although” signal?','a contrast',['a place','a number','a command'],'“Although” leitet einen Gegensatz oder eine Einschränkung ein.'],['Choose the natural phrase.','I am looking forward to the trip.',['I am looking forward the trip.','I look forward at the trip.','I am forward looking to the trip.'],'Die feste Wendung lautet “look forward to”.']],
  [['“The shop was closed, so we came back later.” What does “so” express?','a consequence',['a question','a comparison','a location'],'“So” verbindet hier Ursache und Folge.'],['Which sentence is the most polite request?','Could you please send me the details?',['Send the details.','You must send details now.','Details!'],'“Could you please …?” formuliert eine höfliche Bitte.'],['What does “reliable source” mean?','a source that can be trusted after checking',['a source with the biggest headline','a source shared most often','a source that never names evidence'],'“Reliable” bedeutet verlässlich; entscheidend sind überprüfbare Informationen und nachvollziehbare Belege.']],
  [['Which statement is best supported?','The report says sales rose by 8%, but it does not explain why.',['Sales rose because the new logo was blue.','Everyone prefers the product now.','The company will certainly keep growing forever.'],'Die erste Aussage trennt berichtete Daten von einer nicht belegten Ursache.'],['What does “to weigh up options” mean?','to compare advantages and disadvantages',['to measure physical weight only','to refuse every option','to decide without information'],'Die Wendung bedeutet, verschiedene Möglichkeiten gegeneinander abzuwägen.'],['“Hardly any” means …','almost none',['almost all','exactly half','more than expected'],'“Hardly any” drückt eine sehr kleine Menge aus.']]
 ],
 nature:[
  [['Welche Aufgabe haben Pflanzen bei der Fotosynthese?','Sie wandeln Lichtenergie in chemisch gespeicherte Energie um.',['Sie erzeugen Energie aus dem Nichts.','Sie verbrauchen grundsätzlich keinen Kohlenstoffdioxid.','Sie ersetzen den gesamten Wasserkreislauf.'],'Bei der Fotosynthese werden mit Licht unter anderem Wasser und Kohlenstoffdioxid in energiereiche Stoffe umgewandelt.'],['Was ist ein Lebensraum?','Ein Gebiet mit Bedingungen, in denen bestimmte Organismen leben.',['Nur ein Gebäude für Menschen.','Ausschließlich ein Wald.','Ein Gebiet ohne Wechselwirkungen.'],'Ein Lebensraum wird durch biotische und abiotische Bedingungen geprägt.'],['Welche Kraft zieht Gegenstände zur Erde?','Gravitation',['Magnetismus bei jedem Material','Reibung ohne Kontakt','Schall'],'Die Gravitation bewirkt die gegenseitige Anziehung von Massen.']],
  [['Warum schwitzt der menschliche Körper?','Verdunstung kann den Körper kühlen.',['Damit das Blut gefriert.','Um Licht zu speichern.','Damit Muskeln ohne Energie arbeiten.'],'Beim Verdunsten von Schweiß wird Wärme abgeführt.'],['Was beschreibt eine Nahrungskette?','Wer in einem Ökosystem von wem Energie erhält.',['Nur die Größe von Tieren.','Die Reihenfolge von Jahreszeiten.','Eine Liste aller Mineralien.'],'Nahrungsketten zeigen Energie- und Stoffbeziehungen zwischen Organismen.'],['Welche Aussage zu Energie ist richtig?','Energie kann umgewandelt werden.',['Energie verschwindet bei jeder Nutzung vollständig.','Energie kann nur als Wärme vorkommen.','Lebewesen benötigen keine Energie.'],'Energie tritt in verschiedenen Formen auf und kann zwischen ihnen umgewandelt werden.']],
  [['Warum kann Biodiversität ein Ökosystem stabiler machen?','Unterschiedliche Arten können verschiedene Funktionen übernehmen.',['Weil dann jede Art genau gleich ist.','Weil Konkurrenz vollständig verschwindet.','Weil Wetter keinen Einfluss mehr hat.'],'Vielfalt kann Funktionen und Reaktionsmöglichkeiten eines Systems verbreitern; sie garantiert aber keine Unverwundbarkeit.'],['Was bedeutet pH 7 bei reinem Wasser ungefähr?','neutral',['stark sauer','stark alkalisch','radioaktiv'],'Auf der üblichen pH-Skala gilt 7 bei Raumtemperatur ungefähr als neutral.'],['Warum erwärmt zusätzliches Treibhausgas die bodennahe Atmosphäre?','Es verändert, wie Wärmestrahlung aufgenommen und abgegeben wird.',['Es schaltet die Sonne heller.','Es stoppt jede Wolkenbildung.','Es erzeugt Wärme ohne Energiefluss.'],'Treibhausgase beeinflussen den Strahlungshaushalt der Erde.']],
  [['Warum ist eine einzelne Wetterwoche kein ausreichender Beleg für einen langfristigen Klimatrend?','Klima beschreibt statistische Muster über längere Zeiträume.',['Wetter und Klima sind exakt dasselbe.','Klima kann nur im Sommer gemessen werden.','Ein einzelner Tag enthält immer alle Klimainformationen.'],'Wetter beschreibt kurzfristige Zustände, Klima längerfristige statistische Eigenschaften.'],['Was ist bei einem wissenschaftlichen Modell wichtig?','Es vereinfacht Wirklichkeit und muss an Beobachtungen geprüft werden.',['Es ist automatisch wahr, sobald es kompliziert aussieht.','Es darf nie verändert werden.','Es benötigt keine Annahmen.'],'Modelle sind Werkzeuge mit Annahmen und Grenzen; sie werden anhand von Daten geprüft.'],['Warum sind Korrelation und Ursache nicht dasselbe?','Zwei Größen können gemeinsam auftreten, ohne dass eine die andere verursacht.',['Weil Ursachen nie messbar sind.','Weil Korrelation immer Zufall bedeutet.','Weil jede Korrelation eine Ursache beweist.'],'Für Kausalität braucht es mehr als einen statistischen Zusammenhang.']]
 ],
 history:[
  [['Was hilft zuerst, historische Ereignisse einzuordnen?','Zeit, Ort und beteiligte Akteure klären.',['Nur die heutige Meinung übernehmen.','Jede Quelle gleich behandeln.','Den Ausgang kennen und Ursachen ignorieren.'],'Historische Einordnung beginnt mit Kontext: Wann, wo, wer und unter welchen Bedingungen?'],['Was ist eine historische Quelle?','Ein Zeugnis aus oder über die untersuchte Vergangenheit.',['Nur ein modernes Schulbuch.','Jede erfundene Geschichte.','Ausschließlich ein Gesetz.'],'Quellen können Texte, Bilder, Gegenstände, Tonaufnahmen und vieles mehr sein.'],['Was bedeutet Chronologie?','Ereignisse zeitlich zu ordnen.',['Orte nach Größe sortieren.','Meinungen zählen.','Nur Jahreszahlen auswendig lernen.'],'Chronologie beschreibt die zeitliche Abfolge.']],
  [['Warum begann die Industrialisierung nicht überall gleichzeitig?','Regionen hatten unterschiedliche Ressourcen, Infrastruktur und politische Bedingungen.',['Alle Menschen entschieden am selben Tag darüber.','Maschinen funktionierten nur in einem Land.','Geografie spielte grundsätzlich keine Rolle.'],'Historischer Wandel hängt meist von mehreren Bedingungen ab.'],['Was ist bei einer Quelle wichtig?','Zu fragen, wer sie wann und mit welchem Zweck erstellt hat.',['Nur die Länge des Textes.','Ob sie die eigene Meinung bestätigt.','Ob sie besonders alt aussieht.'],'Urheber, Entstehungssituation und Zweck helfen, Aussagekraft und Grenzen einzuschätzen.'],['Was bedeutet Ursache und Anlass zu unterscheiden?','Ein Anlass kann etwas auslösen, während Ursachen tiefer und länger wirken können.',['Beides ist immer identisch.','Anlässe gibt es nur in der Gegenwart.','Ursachen sind grundsätzlich unwichtig.'],'Historische Ereignisse haben oft längerfristige Ursachen und konkrete Auslöser.']],
  [['Warum können zwei Quellen dasselbe Ereignis unterschiedlich darstellen?','Menschen haben unterschiedliche Perspektiven, Interessen und Informationsstände.',['Eine der beiden Quellen muss immer gefälscht sein.','Vergangenheit verändert sich nachträglich.','Nur kurze Quellen können stimmen.'],'Unterschiedliche Perspektiven sind normal; deshalb werden Quellen verglichen und kontextualisiert.'],['Was ist ein Anachronismus?','Etwas wird einer Zeit zugeordnet, in die es historisch nicht passt.',['Eine besonders genaue Datierung.','Eine übereinstimmende Quelle.','Ein moderner Begriff für Statistik.'],'Anachronismen vermischen Zeitstände, die historisch nicht zusammengehören.'],['Welche Frage hilft beim Quellenvergleich?','Welche Aussagen stimmen überein und wo widersprechen sich die Quellen?',['Welche Quelle gefällt mir optisch besser?','Welche ist am längsten?','Welche wurde zuletzt geöffnet?'],'Vergleich macht Gemeinsamkeiten, Widersprüche und Ergänzungen sichtbar.']],
  [['Was ist eine faire historische Bewertung?','Handlungen im damaligen Kontext untersuchen und zugleich begründete Maßstäbe offenlegen.',['Nur heutige Erwartungen rückwirkend voraussetzen.','Jede Handlung mit dem Zeitgeist entschuldigen.','Auf Belege verzichten, wenn eine Geschichte plausibel klingt.'],'Historisches Urteilen braucht Kontext, Quellen und transparent begründete Maßstäbe.'],['Warum ist Erinnerungskultur nicht dasselbe wie Geschichtswissenschaft?','Erinnerung erfüllt gesellschaftliche Funktionen; Geschichtswissenschaft untersucht Vergangenheit methodisch.',['Beides hat nie miteinander zu tun.','Erinnerung ist immer falsch.','Geschichtswissenschaft besteht nur aus Gedenktagen.'],'Beide können sich überschneiden, verfolgen aber unterschiedliche Aufgaben und Methoden.'],['Was stärkt eine historische Erklärung?','Mehrere unabhängige Quellen und nachvollziehbare Begründungen.',['Nur eine sehr selbstsichere Formulierung.','Viele Wiederholungen derselben Behauptung.','Das Weglassen widersprechender Belege.'],'Erklärungen werden belastbarer, wenn Quellenlage und Argumentation transparent sind.']]
 ],
 civics:[
  [['Warum gibt es Regeln für gemeinsames Zusammenleben?','Sie schaffen Orientierung und helfen, Interessen und Rechte miteinander abzustimmen.',['Damit niemand Entscheidungen treffen muss.','Damit immer die stärkste Person gewinnt.','Damit Konflikte unmöglich werden.'],'Regeln lösen nicht jeden Konflikt, schaffen aber einen gemeinsamen Rahmen.'],['Was ist ein Recht?','Ein anerkannter Anspruch oder eine geschützte Freiheit innerhalb einer Rechtsordnung.',['Eine persönliche Vorliebe, die alle erfüllen müssen.','Eine beliebige Empfehlung.','Nur eine Belohnung für gutes Verhalten.'],'Rechte schützen Freiheiten oder Ansprüche und sind an eine Rechtsordnung gebunden.'],['Was bedeutet Kompromiss?','Beteiligte nähern sich an und akzeptieren eine für sie tragbare Lösung.',['Eine Seite bekommt immer alles.','Niemand darf seine Meinung erklären.','Der Konflikt wird ignoriert.'],'Ein Kompromiss versucht unterschiedliche Interessen praktisch auszugleichen.']],
  [['Warum ist Gewaltenteilung in einer Demokratie wichtig?','Macht wird auf verschiedene Institutionen verteilt und kontrolliert.',['Damit Gesetze geheim bleiben.','Damit niemand Verantwortung trägt.','Damit Wahlen überflüssig werden.'],'Geteilte und kontrollierte Macht soll Machtmissbrauch erschweren.'],['Was bedeutet Mehrheitsentscheidung nicht?','Dass Minderheiten deshalb keine Rechte mehr haben.',['Dass Stimmen gezählt werden.','Dass Entscheidungen Regeln brauchen.','Dass Ergebnisse überprüfbar sein sollten.'],'Demokratische Mehrheiten wirken innerhalb von Grund- und Minderheitenrechten.'],['Was ist eine öffentliche Institution?','Eine Einrichtung, die öffentliche Aufgaben auf Grundlage festgelegter Regeln wahrnimmt.',['Jede private Freundesgruppe.','Nur ein Geschäft.','Ein zufälliger Internetkanal.'],'Öffentliche Institutionen übernehmen Aufgaben für Staat oder Gemeinwesen.']],
  [['Warum ist Interessenabwägung nötig?','Politische und gesellschaftliche Entscheidungen betreffen oft mehrere legitime Ziele gleichzeitig.',['Weil Fakten keine Rolle spielen.','Weil jede Meinung gleich gut begründet ist.','Damit Entscheidungen möglichst unklar bleiben.'],'Abwägung macht Zielkonflikte sichtbar und verlangt Begründungen.'],['Welche Aussage beschreibt Rechtsstaatlichkeit am besten?','Auch staatliches Handeln ist an Recht und überprüfbare Verfahren gebunden.',['Regeln gelten nur für Bürger.','Entscheidungen brauchen keine Begründung.','Macht ersetzt Gerichte.'],'Rechtsstaatlichkeit begrenzt öffentliche Macht durch Recht und Verfahren.'],['Warum sind freie Medien für öffentliche Debatten wichtig?','Sie können Informationen recherchieren, Macht beobachten und unterschiedliche Perspektiven sichtbar machen.',['Weil jede Veröffentlichung automatisch wahr ist.','Weil Kritik dann verboten werden kann.','Weil nur eine Quelle gebraucht wird.'],'Freie Medien sind wichtig, müssen aber wie andere Quellen kritisch geprüft werden.']],
  [['Welche Frage hilft bei einem gesellschaftlichen Konflikt besonders?','Welche Interessen, Rechte, Folgen und belastbaren Informationen stehen gegenüber?',['Welche Seite klingt am lautesten?','Wer hat die meisten Follower?','Wie lässt sich die Gegenseite möglichst schnell abwerten?'],'Strukturierte Abwägung trennt Interessen, Rechte, Fakten und Folgen.'],['Warum ist Beteiligung mehr als Abstimmen?','Sie kann auch Information, Diskussion, Engagement und Mitgestaltung umfassen.',['Weil Abstimmungen nie demokratisch sind.','Weil nur Amtsträger beteiligt sein dürfen.','Weil Beteiligung keine Regeln benötigt.'],'Demokratische Beteiligung kann viele Formen haben.'],['Was unterscheidet eine Tatsachenbehauptung von einem Werturteil?','Eine Tatsachenbehauptung ist grundsätzlich überprüfbar; ein Werturteil beruht zusätzlich auf Maßstäben.',['Werturteile enthalten nie Gründe.','Tatsachen sind immer Meinungen.','Beide sind exakt dasselbe.'],'Gute Debatten machen kenntlich, was empirisch prüfbar und was normativ bewertet wird.']]
 ],
 media:[
  [['Was bringt Zwei-Faktor-Authentisierung zusätzlich?','Neben dem Passwort wird ein weiterer unabhängiger Nachweis verlangt.',['Das Passwort wird öffentlich.','Man braucht nie wieder Updates.','Jede Phishing-Mail wird automatisch gelöscht.'],'Ein zweiter Faktor erschwert Kontoübernahmen, wenn nur das Passwort bekannt wird.'],['Woran erkennst du eine belastbarere Online-Information?','Autor, Quelle, Datum und Belege lassen sich nachvollziehen.',['Sie wurde sehr oft geteilt.','Die Überschrift ist besonders emotional.','Sie passt genau zu meiner Meinung.'],'Nachvollziehbarkeit und Belege sind stärkere Kriterien als Reichweite oder Zustimmung.'],['Was ist Phishing?','Der Versuch, über Täuschung Zugangsdaten oder andere sensible Informationen zu stehlen.',['Eine sichere Verschlüsselungsmethode.','Ein normales Softwareupdate.','Eine Suchmaschine für Bilder.'],'Phishing nutzt häufig gefälschte Nachrichten oder Webseiten, um Vertrauen auszunutzen.']],
  [['Warum zeigen soziale Plattformen nicht allen Nutzern exakt dieselben Inhalte?','Auswahl- und Empfehlungssysteme berücksichtigen Signale und Plattformziele.',['Weil das Internet für jede Person andere Naturgesetze hat.','Weil alle Beiträge zufällig gelöscht werden.','Weil nur bezahlte Beiträge technisch angezeigt werden können.'],'Feeds werden typischerweise gefiltert und personalisiert; Auswahlkriterien können sich ändern.'],['Was ist ein guter erster Schritt bei einer überraschenden Behauptung?','Die ursprüngliche Quelle suchen und unabhängige Berichte vergleichen.',['Sofort weiterleiten.','Nur die Kommentare lesen.','Die Aussage glauben, wenn sie oft wiederholt wird.'],'Quellenvergleich hilft, Kontextfehler und falsche Zuschreibungen zu erkennen.'],['Warum sind lange, unterschiedliche Passwörter sinnvoll?','Ein kompromittiertes Passwort gefährdet dann nicht automatisch mehrere Konten.',['Lange Passwörter machen 2FA unmöglich.','Passwörter sollten auf allen Seiten identisch sein.','Nur Sonderzeichen bestimmen Sicherheit.'],'Einzigartige Passwörter begrenzen den Schaden eines einzelnen Datenlecks.']],
  [['Was ist ein Deepfake?','Synthetisch erzeugtes oder verändertes Medienmaterial, das reale Darstellung vortäuschen kann.',['Jede unscharfe Aufnahme.','Ein besonders langer Text.','Ein verschlüsseltes Backup.'],'Generative Verfahren können Bild, Video oder Audio täuschend verändern; Kontext und Herkunft sollten geprüft werden.'],['Was bedeutet Bestätigungsfehler (confirmation bias)?','Informationen, die die eigene Sicht stützen, werden leichter beachtet oder akzeptiert.',['Man erinnert sich immer an alles korrekt.','Algorithmen sind grundsätzlich neutral.','Widerspruch beweist automatisch eine Lüge.'],'Menschen neigen dazu, bestätigende Informationen stärker zu gewichten; bewusster Quellenvergleich kann gegensteuern.'],['Warum ist eine Prozentangabe ohne Bezugsgröße problematisch?','Man weiß nicht, auf welche Ausgangsmenge sie sich bezieht.',['Prozentwerte sind immer falsch.','Nur absolute Zahlen sind erlaubt.','Bezugsgrößen spielen bei Prozenten keine Rolle.'],'„50 % mehr“ ist ohne Ausgangswert und Kontext schwer einzuordnen.']],
  [['Warum kann ein Empfehlungssystem Aufmerksamkeit verstärken, ohne die Wahrheit einer Aussage zu prüfen?','Optimierungsziele wie Interaktion sind nicht automatisch Wahrheitsprüfungen.',['Weil Computer keine Zahlen verarbeiten.','Weil jede Empfehlung manuell geschrieben wird.','Weil wahre Inhalte nie Interaktionen auslösen.'],'Reichweite oder Engagement und inhaltliche Verlässlichkeit sind unterschiedliche Ziele.'],['Welche Aussage zu KI-Ausgaben ist am vernünftigsten?','Auch überzeugend formulierte Antworten sollten bei wichtigen Fakten überprüft werden.',['KI kann prinzipiell keine Fehler machen.','Nur kurze KI-Antworten sind wahr.','Eine Quelle ist unnötig, wenn der Text professionell klingt.'],'Sprachliche Sicherheit ist kein Beleg für sachliche Richtigkeit.'],['Was hilft gegen Informationsüberlastung?','Quellen bewusst auswählen, Benachrichtigungen begrenzen und Zeit zum Prüfen einplanen.',['Möglichst viele Feeds gleichzeitig öffnen.','Jede Meldung sofort beantworten.','Nur Überschriften lesen.'],'Aufmerksamkeitsmanagement schafft Raum für Einordnung und vertieftes Verstehen.']]
 ],
 geography:[
  [['Was zeigt eine Karte mit Maßstab?','Wie Kartenentfernungen zu realen Entfernungen stehen.',['Nur die Höhe von Bergen.','Welche Sprache Menschen sprechen.','Wie alt eine Stadt ist.'],'Der Maßstab beschreibt das Verhältnis zwischen Darstellung und Wirklichkeit.'],['Was ist der Äquator?','Eine gedachte Linie um die Erde bei 0° geografischer Breite.',['Die Grenze zwischen allen Staaten.','Der höchste Gebirgszug.','Die Linie des Nullmeridians.'],'Der Äquator teilt die Erde in Nord- und Südhalbkugel.'],['Was beschreibt Wetter?','Den kurzfristigen Zustand der Atmosphäre an einem Ort.',['Nur langfristige Klimamittel.','Ausschließlich Temperatur.','Die Lage von Kontinenten.'],'Wetter umfasst beispielsweise Temperatur, Niederschlag, Wind und Bewölkung zu einem bestimmten Zeitpunkt.']],
  [['Wofür werden Längen- und Breitengrade genutzt?','Um Positionen auf der Erde zu beschreiben.',['Um Währungen umzurechnen.','Um Zeitgeschichte zu ordnen.','Um chemische Elemente zu benennen.'],'Geografische Koordinaten bestehen aus Breite und Länge.'],['Warum entstehen Jahreszeiten?','Durch die Neigung der Erdachse beim Umlauf um die Sonne.',['Weil die Erde im Winter plötzlich viel langsamer rotiert.','Weil Wolken die Sonne für Monate abschalten.','Nur durch den Abstand zur Sonne.'],'Die Achsneigung verändert Sonnenstand und Tageslänge im Jahreslauf.'],['Was ist eine Metropolregion?','Ein dicht verflochtener Großstadt- und Umlandbereich.',['Jede unbewohnte Insel.','Ein einzelner Bauernhof.','Nur ein Gebirge.'],'Metropolregionen verbinden Kernstädte mit funktional eng verbundenem Umland.']],
  [['Warum treten viele Erdbeben an Plattengrenzen auf?','Dort bewegen sich Erdplatten gegeneinander und Spannungen können sich lösen.',['Weil dort immer Vulkane künstlich gebaut werden.','Weil Meereswasser Erdbeben direkt erzeugt.','Weil Kontinente unbeweglich sind.'],'Plattentektonische Bewegungen bauen Spannungen auf, die sich ruckartig lösen können.'],['Was ist eine globale Lieferkette?','Ein Produktions- und Transportnetz über mehrere Orte oder Länder hinweg.',['Nur der Weg eines Pakets innerhalb eines Hauses.','Eine Liste von Ladenöffnungszeiten.','Eine lokale Wetterkarte.'],'Viele Produkte verbinden Rohstoffe, Verarbeitung, Transport und Verkauf über weite Räume.'],['Warum wachsen manche Städte stark?','Arbeitsplätze, Infrastruktur, Migration und politische oder wirtschaftliche Bedingungen wirken zusammen.',['Städte wachsen immer aus nur einem Grund.','Wetter hat alleinige Kontrolle über Bevölkerung.','Alle Menschen ziehen zwangsläufig in Hauptstädte.'],'Stadtentwicklung ist das Ergebnis mehrerer miteinander verbundener Faktoren.']],
  [['Warum kann Wasserknappheit trotz ausreichenden Niederschlags entstehen?','Verteilung, Speicherung, Infrastruktur, Nutzung und Jahreszeiten beeinflussen Verfügbarkeit.',['Niederschlag garantiert überall jederzeit Trinkwasser.','Wasser kann nicht gespeichert werden.','Nur die Einwohnerzahl spielt eine Rolle.'],'Ressourcenprobleme hängen nicht nur von Gesamtmengen, sondern auch von Ort, Zeit und Nutzung ab.'],['Was bedeutet räumliche Ungleichheit?','Chancen, Einkommen, Infrastruktur oder Ressourcen sind zwischen Regionen unterschiedlich verteilt.',['Alle Orte haben automatisch dieselben Bedingungen.','Nur Höhenunterschiede auf Karten.','Eine mathematische Gleichung.'],'Räumliche Unterschiede können wirtschaftliche und gesellschaftliche Folgen haben.'],['Warum beeinflussen Verkehrswege die Entwicklung von Regionen?','Sie verändern Erreichbarkeit, Kosten und Austauschmöglichkeiten.',['Weil Straßen Klima vollständig bestimmen.','Weil Handel ohne Orte stattfindet.','Weil Entfernung keine Rolle spielt.'],'Infrastruktur verändert, wie Menschen, Güter und Informationen Räume verbinden.']]
 ],
 economy:[
  [['Was ist ein Budget?','Ein Plan für verfügbare Einnahmen und Ausgaben.',['Eine Garantie, nie Geld auszugeben.','Nur eine Liste von Wünschen.','Ein Kredit ohne Rückzahlung.'],'Ein Budget hilft, begrenzte Mittel auf verschiedene Zwecke zu verteilen.'],['Ein Produkt kostet 80 €, 25 % Rabatt. Was zahlst du?','60 €',['20 €','55 €','75 €'],'25 % von 80 € sind 20 €. 80 € − 20 € = 60 €.'],['Was bedeutet „Preis pro Stück“?','Gesamtpreis geteilt durch die Anzahl der Stücke.',['Gesamtpreis mal Stückzahl.','Immer der billigste Marktpreis.','Nur der Versandpreis.'],'Ein Stückpreis macht Packungsgrößen besser vergleichbar.']],
  [['Was bedeutet Inflation vereinfacht?','Das allgemeine Preisniveau steigt über einen Zeitraum.',['Jeder einzelne Preis muss steigen.','Geld wird physisch größer.','Alle Löhne steigen automatisch gleich stark.'],'Inflation bezieht sich auf die Entwicklung eines breiten Preisniveaus, nicht zwingend auf jeden Einzelpreis.'],['Was sind Zinsen bei einem Kredit?','Ein Preis für die zeitweise Überlassung von Geld.',['Eine kostenlose Rückzahlung.','Nur eine Steuer.','Eine garantierte Rendite für den Kreditnehmer.'],'Kreditzinsen sind Kosten zusätzlich zur Rückzahlung des geliehenen Betrags.'],['Was sind Opportunitätskosten?','Der Nutzen der besten nicht gewählten Alternative.',['Nur Gebühren auf einer Rechnung.','Jede Ausgabe in bar.','Ein Preisfehler im Shop.'],'Wer eine knappe Ressource für A nutzt, verzichtet auf die beste Alternative B.']],
  [['Was bewirkt ein höherer Preis bei sonst gleichen Bedingungen häufig auf der Nachfrageseite?','Die nachgefragte Menge kann sinken.',['Sie muss immer steigen.','Produktion wird unmöglich.','Der Preis verliert jede Bedeutung.'],'Im einfachen Nachfragemodell sinkt die nachgefragte Menge häufig bei höheren Preisen; reale Märkte haben zusätzliche Faktoren.'],['Warum sollte man bei einem Vertrag Bedingungen vor Abschluss lesen?','Pflichten, Kosten, Laufzeit und Kündigungsregeln können entscheidend sein.',['Weil Überschriften rechtlich immer alles enthalten.','Weil mündliche Versprechen jeden Vertrag automatisch ersetzen.','Weil Bedingungen nach Abschluss nie eine Rolle spielen.'],'Vertragsdetails bestimmen Rechte und Pflichten und sollten vor der Entscheidung bekannt sein.'],['Was beschreibt Diversifikation bei Geldanlagen?','Risiken werden auf verschiedene Anlagen verteilt.',['Das gesamte Geld wird in eine einzige Anlage gesteckt.','Risiko wird vollständig abgeschafft.','Gewinne werden garantiert.'],'Streuung kann Einzelrisiken reduzieren, beseitigt aber nicht jedes Marktrisiko.']],
  [['Warum ist „hohe Rendite ohne Risiko“ ein Warnsignal?','Rendite und Risiko stehen typischerweise in einem Zusammenhang; Garantien sollten geprüft werden.',['Weil Rendite immer illegal ist.','Weil Risiko nur bei kleinen Beträgen existiert.','Weil Werbung grundsätzlich falsch ist.'],'Ungewöhnlich hohe sichere Versprechen verdienen besondere Prüfung von Anbieter, Bedingungen und Risiken.'],['Was ist bei einer wirtschaftlichen Entscheidung sinnvoll?','Kosten, Nutzen, Risiken, Zeit und Alternativen gemeinsam betrachten.',['Nur den niedrigsten sichtbaren Preis beachten.','Folgekosten grundsätzlich ignorieren.','Entscheidungen nie mit Zielen verbinden.'],'Gute Entscheidungen berücksichtigen mehrere relevante Faktoren und Alternativen.'],['Warum können Durchschnittswerte täuschen?','Sie können große Unterschiede innerhalb einer Gruppe verdecken.',['Durchschnittswerte sind mathematisch immer falsch.','Sie zeigen automatisch jede Einzelbeobachtung.','Sie dürfen nie verwendet werden.'],'Ein Mittelwert ist nützlich, sollte aber zusammen mit Verteilung und Kontext betrachtet werden.']]
 ]
};

const curriculumQuestionBanks={
 english:[
  genericBanks.english[0],
  [
   ['Which question is correct?','Where do you live?',['Where you do live?','Where does you live?','Where living you?'],'In einer Frage mit „do“ steht danach die Grundform: Where do you live?'],
   ['Choose the sentence about something happening now.','They are waiting for the bus.',['They wait for the bus every day.','They waited for the bus yesterday.','They will wait tomorrow.'],'„Are waiting“ ist Present Continuous und beschreibt hier eine laufende Handlung.']
  ],
  genericBanks.english[1],
  [
   ['In “Mia lost her key, so she called Sam”, what does “she” refer to?','Mia',['the key','Sam','nobody'],'Das Pronomen „she“ bezieht sich im Satz auf Mia.'],
   ['Which sentence gives a reason?','We stayed inside because it was raining.',['We stayed inside, but it was raining.','We stayed inside after lunch.','We stayed inside near the door.'],'„Because“ leitet einen Grund ein.']
  ],
  genericBanks.english[2],
  [
   ['Which phrase is best for asking someone to explain again?','Could you explain that in another way, please?',['Say it again now.','That makes no sense.','You are wrong.'],'Die Formulierung bittet klar und höflich um eine andere Erklärung.'],
   ['“The result might change” means …','the change is possible but not certain',['the change is impossible','the change is guaranteed','the result already changed'],'„Might“ drückt eine Möglichkeit aus, keine Gewissheit.']
  ],
  genericBanks.english[3],
  [
   ['Which sentence separates evidence from interpretation best?','The chart shows a decline; the reason for it is not given.',['The chart proves the manager caused the decline.','The decline must continue forever.','Everyone clearly wanted the decline.'],'Die Aussage nennt, was die Grafik zeigt, ohne eine unbelegte Ursache hinzuzufügen.'],
   ['What does “the wording is ambiguous” mean?','it can reasonably be understood in more than one way',['it is written in capital letters','it is definitely false','it contains no verbs'],'„Ambiguous“ bedeutet mehrdeutig.']
  ]
 ],
 nature:[
  genericBanks.nature[0],
  [
   ['Warum nimmt der Körper beim Atmen Sauerstoff auf?','Zellen benötigen ihn für wichtige Schritte der Energiegewinnung.',['Damit Knochen magnetisch werden.','Weil Sauerstoff nur die Stimme erzeugt.','Damit Wasser im Körper gefriert.'],'Sauerstoff wird unter anderem bei der Zellatmung genutzt, um Energie aus Nährstoffen verfügbar zu machen.'],
   ['Was geschieht beim Schmelzen von Eis?','Ein Stoff wechselt vom festen in den flüssigen Zustand.',['Ein neues chemisches Element entsteht.','Die Masse muss verschwinden.','Wasser wird zu einem Gas.'],'Schmelzen ist eine Änderung des Aggregatzustands, keine neue Stoffart.']
  ],
  genericBanks.nature[1],
  [
   ['Warum ist ein Nahrungsnetz oft aussagekräftiger als eine einzelne Nahrungskette?','Viele Organismen haben mehrere Nahrungsbeziehungen.',['Jedes Tier frisst nur genau eine Art.','Nahrungsnetze zeigen nur Pflanzen.','Energie fließt in Ökosystemen nicht.'],'In realen Ökosystemen sind Nahrungsketten miteinander zu Netzen verbunden.'],
   ['Welche Rolle spielen Zersetzer im Stoffkreislauf?','Sie bauen organisches Material ab und machen Stoffe wieder verfügbar.',['Sie stoppen jeden Stoffkreislauf.','Sie erzeugen Materie aus dem Nichts.','Sie sind ausschließlich Räuber.'],'Zersetzer tragen dazu bei, gebundene Nährstoffe wieder in Kreisläufe zurückzuführen.']
  ],
  genericBanks.nature[2],
  [
   ['Welche Aussage zum Kohlenstoffkreislauf ist richtig?','Kohlenstoff wird zwischen Atmosphäre, Lebewesen, Böden und Gewässern ausgetauscht.',['Kohlenstoff kommt nur in der Atmosphäre vor.','Pflanzen enthalten keinen Kohlenstoff.','Der Kreislauf hat keine Verbindung zum Klima.'],'Kohlenstoff ist in mehreren Speichern gebunden und wird durch natürliche und menschliche Prozesse ausgetauscht.'],
   ['Warum kann Verdunstung Teil des Wasserkreislaufs sein?','Flüssiges Wasser gelangt als Wasserdampf in die Atmosphäre.',['Wasser wird dabei vernichtet.','Verdunstung findet nur im Winter statt.','Wasserdampf ist kein Wasser.'],'Bei der Verdunstung wechselt Wasser in den gasförmigen Zustand und kann später wieder kondensieren.']
  ],
  genericBanks.nature[3],
  [
   ['Warum verwendet ein Experiment möglichst eine Kontrollgruppe?','Damit sich der Einfluss der untersuchten Veränderung besser vergleichen lässt.',['Damit jedes Ergebnis automatisch richtig ist.','Damit keine Messung mehr nötig ist.','Damit alle Bedingungen gleichzeitig verändert werden.'],'Eine geeignete Kontrollbedingung hilft, Unterschiede auf die untersuchte Variable zurückzuführen.'],
   ['Warum erhöht eine größere geeignete Stichprobe oft die Aussagekraft?','Zufällige Besonderheiten einzelner Beobachtungen fallen weniger stark ins Gewicht.',['Weil große Stichproben jede Verzerrung ausschließen.','Weil dann keine Unsicherheit mehr existiert.','Weil nur große Zahlen wissenschaftlich sind.'],'Mehr geeignete Beobachtungen können Zufallsschwankungen reduzieren, beseitigen aber nicht automatisch systematische Fehler.']
  ]
 ],
 history:[
  genericBanks.history[0],
  [
   ['Warum haben historische Ereignisse oft mehrere Ursachen?','Politische, wirtschaftliche, soziale und andere Faktoren können zusammenwirken.',['Jedes Ereignis hat genau eine Ursache.','Nur einzelne Personen können Geschichte verändern.','Folgen entstehen immer vor ihren Ursachen.'],'Historische Erklärungen berücksichtigen häufig mehrere miteinander verbundene Faktoren.'],
   ['Was ist der Unterschied zwischen Ursache und Folge?','Die Ursache trägt zum Entstehen eines Ereignisses bei; die Folge tritt daraus hervor.',['Beides bedeutet dasselbe.','Folgen liegen immer zeitlich davor.','Ursachen können nie untersucht werden.'],'Die Unterscheidung hilft, zeitliche und sachliche Zusammenhänge sauber zu erklären.']
  ],
  genericBanks.history[1],
  [
   ['Warum können technische Erfindungen Gesellschaften verändern?','Sie können Arbeit, Kommunikation, Produktion und Alltag beeinflussen.',['Erfindungen wirken grundsätzlich nur in Laboren.','Technik verändert nie wirtschaftliche Abläufe.','Jede Erfindung hat überall dieselbe Wirkung.'],'Technik wirkt zusammen mit sozialen, wirtschaftlichen und politischen Bedingungen.'],
   ['Was bedeutet historischer Wandel?','Bestimmte Strukturen oder Lebensweisen verändern sich über die Zeit.',['Alles verändert sich gleichzeitig vollständig.','Vergangenheit bleibt immer unverändert sichtbar.','Nur Jahreszahlen können sich ändern.'],'Geschichte untersucht sowohl Veränderungen als auch Kontinuitäten.']
  ],
  genericBanks.history[2],
  [
   ['Warum ist eine zeitgenössische Quelle nicht automatisch objektiv?','Auch Zeitzeugen haben Perspektiven, Interessen und begrenzte Informationen.',['Zeitzeugen können sich nie irren.','Alte Texte enthalten automatisch alle Fakten.','Objektivität hängt nur vom Alter der Quelle ab.'],'Nähe zum Ereignis kann wertvoll sein, ersetzt aber keine Quellenkritik.'],
   ['Was hilft, unterschiedliche historische Perspektiven fair zu vergleichen?','Entstehungssituation, Interessen und Wissensstand der Beteiligten berücksichtigen.',['Nur die heutige Lieblingsmeinung auswählen.','Alle Aussagen als gleich gut belegt behandeln.','Widersprüche grundsätzlich ignorieren.'],'Perspektiven werden im jeweiligen Kontext untersucht und mit Belegen abgeglichen.']
  ],
  genericBanks.history[3],
  [
   ['Was ist „Presentism“ in der Geschichtsbetrachtung am ehesten?','Vergangenheit ausschließlich mit heutigen Erwartungen zu beurteilen, ohne ihren Kontext zu beachten.',['Historische Quellen zeitlich zu ordnen.','Mehrere Quellen miteinander zu vergleichen.','Datierungen genauer zu machen.'],'Heutige Werte können Teil eines Urteils sein; problematisch wird es, wenn der historische Kontext dabei ausgeblendet wird.'],
   ['Was macht eine historische These belastbarer?','Sie nennt Belege, berücksichtigt Gegenargumente und macht ihre Schlussfolgerung nachvollziehbar.',['Sie wird möglichst oft wiederholt.','Sie vermeidet jede Quelle.','Sie erklärt Widersprüche für bedeutungslos.'],'Belastbare historische Argumentation verbindet überprüfbare Belege mit transparenter Begründung.']
  ]
 ],
 civics:[
  genericBanks.civics[0],
  [
   ['Warum können Regeln in einer Gemeinschaft sinnvoll sein?','Sie können Erwartungen klären und Rechte sowie Sicherheit verschiedener Personen schützen.',['Weil Regeln immer jede Freiheit abschaffen.','Weil Regeln grundsätzlich nicht begründet werden müssen.','Damit Konflikte nicht mehr existieren können.'],'Regeln können Zusammenleben ordnen; ihre Begründung und Verhältnismäßigkeit bleiben wichtig.'],
   ['Was bedeutet ein Recht im Alltag?','Eine geschützte Möglichkeit oder ein Anspruch, der durch Regeln oder Gesetze anerkannt wird.',['Eine Garantie, immer den eigenen Willen durchzusetzen.','Nur eine freundliche Bitte.','Etwas, das ausschließlich Behörden besitzen.'],'Rechte schützen Handlungsmöglichkeiten oder Ansprüche und stehen oft neben Rechten anderer.']
  ],
  genericBanks.civics[1],
  [
   ['Wozu dient Gewaltenteilung grundsätzlich?','Staatliche Macht wird auf verschiedene Bereiche verteilt und gegenseitig kontrollierbar.',['Damit eine Stelle alle Entscheidungen allein trifft.','Damit Gerichte Gesetze beliebig ignorieren.','Damit Wahlen unnötig werden.'],'Die Verteilung staatlicher Funktionen soll Macht begrenzen und Kontrolle ermöglichen.'],
   ['Warum ist Minderheitenschutz in einer Demokratie wichtig?','Mehrheitsentscheidungen sollen grundlegende Rechte von Minderheiten nicht beliebig aufheben.',['Weil Mehrheiten nie entscheiden dürfen.','Weil Minderheiten automatisch jede Entscheidung bestimmen.','Weil Rechte nur bei Einstimmigkeit gelten.'],'Demokratie verbindet Mehrheitsentscheidungen mit rechtsstaatlichen Grenzen und Grundrechten.']
  ],
  genericBanks.civics[2],
  [
   ['Was kann ein fairer Kompromiss leisten?','Er berücksichtigt wichtige Interessen mehrerer Seiten, ohne jeden Wunsch vollständig zu erfüllen.',['Er macht automatisch alle Beteiligten glücklich.','Er bedeutet, dass nur die stärkere Seite gewinnt.','Er verhindert jede spätere Meinungsänderung.'],'Kompromisse versuchen, konkurrierende Interessen in einer tragfähigen Lösung zusammenzuführen.'],
   ['Warum ist ein transparentes Verfahren bei Interessenkonflikten wichtig?','Beteiligte können Regeln und Gründe einer Entscheidung nachvollziehen.',['Damit das Ergebnis geheim bleibt.','Damit Belege keine Rolle spielen.','Damit nur eine Gruppe sprechen darf.'],'Nachvollziehbare Verfahren können Legitimität und Kontrolle verbessern, auch wenn nicht alle mit dem Ergebnis einverstanden sind.']
  ],
  genericBanks.civics[3],
  [
   ['Welche Frage trennt Fakten und Werte in einer Debatte am besten?','Was ist überprüfbar passiert, und welche Ziele oder Maßstäbe bewerten wir anschließend?',['Welche Meinung klingt am lautesten?','Welche Seite hat mehr Follower?','Welche Behauptung passt besser zu mir?'],'Sachfragen und Werturteile können zusammengehören, sollten aber nicht miteinander verwechselt werden.'],
   ['Was gehört zu einem begründeten gesellschaftlichen Urteil?','Kriterien offenlegen, relevante Fakten prüfen und Folgen für verschiedene Gruppen berücksichtigen.',['Nur die eigene Betroffenheit nennen.','Gegenargumente ausblenden.','Eine Behauptung oft genug wiederholen.'],'Ein begründetes Urteil macht Maßstäbe und Belege nachvollziehbar.']
  ]
 ],
 media:[
  genericBanks.media[0],
  [
   ['Warum erhöht Zwei-Faktor-Authentisierung den Kontoschutz?','Zusätzlich zum ersten Faktor wird ein weiterer unabhängiger Faktor verlangt.',['Weil Passwörter dadurch öffentlich werden.','Weil danach keine Phishing-Angriffe mehr möglich sind.','Weil jedes Gerät automatisch vertrauenswürdig ist.'],'Ein zweiter Faktor erschwert den Zugriff, wenn nur das Passwort bekannt geworden ist; er ersetzt dennoch nicht jede weitere Vorsicht.'],
   ['Warum sollte dasselbe Passwort nicht für viele Dienste verwendet werden?','Wird es bei einem Dienst bekannt, können sonst mehrere Konten gefährdet sein.',['Weil Passwörter nur einmal eingetippt werden dürfen.','Weil lange Passwörter nur für ein Konto funktionieren.','Weil Browser identische Passwörter verbieten.'],'Einzigartige Passwörter begrenzen den Schaden, wenn Zugangsdaten eines Dienstes kompromittiert werden.']
  ],
  genericBanks.media[1],
  [
   ['Warum kann ein personalisierter Feed ein verzerrtes Bild der Welt erzeugen?','Er zeigt nur einen ausgewählten Ausschnitt, der nach Plattformsignalen sortiert wird.',['Weil jeder Nutzer exakt dieselben Inhalte sieht.','Weil Personalisierung automatisch Fakten prüft.','Weil Algorithmen keine Auswahl treffen können.'],'Empfehlungssysteme priorisieren Inhalte nach bestimmten Signalen und Zielen; das ist keine vollständige Abbildung aller verfügbaren Informationen.'],
   ['Was ist vor dem öffentlichen Teilen eines Fotos besonders sinnvoll?','Prüfen, welche persönlichen Informationen darauf erkennbar sind und wer es sehen kann.',['Immer den genauen Wohnort dazuschreiben.','Privatsphäre-Einstellungen grundsätzlich ignorieren.','Das Bild mehrfach hochladen, damit es sicherer wird.'],'Fotos können mehr Informationen preisgeben als beabsichtigt; Sichtbarkeit und Inhalt sollten bewusst gewählt werden.']
  ],
  genericBanks.media[2],
  [
   ['Warum kann ein Deepfake überzeugend wirken und trotzdem falsch sein?','Bild oder Ton können künstlich erzeugt oder verändert sein, ohne das dargestellte Ereignis zu belegen.',['Digitale Bilder können nie bearbeitet werden.','Ein realistisches Gesicht beweist immer die Quelle.','Deepfakes enthalten grundsätzlich ein sichtbares Warnzeichen.'],'Realistische Darstellung ist kein Beleg dafür, dass ein Ereignis tatsächlich so stattgefunden hat.'],
   ['Was ist bei einer wichtigen KI-Antwort ein guter nächster Schritt?','Zentrale Tatsachen mit geeigneten unabhängigen Quellen überprüfen.',['Nur auf selbstbewusste Formulierungen achten.','Die Antwort ungeprüft weiterleiten.','Davon ausgehen, dass Fehler technisch ausgeschlossen sind.'],'Generative Systeme können plausible, aber falsche Angaben erzeugen; wichtige Fakten brauchen Verifikation.']
  ],
  genericBanks.media[3],
  [
   ['Warum ist die ursprüngliche Quelle einer Statistik wichtig?','Dort lassen sich Definition, Zeitraum, Stichprobe und Methode besser prüfen.',['Weil Weiterverbreitung Zahlen automatisch verändert.','Weil nur Primärquellen Diagramme enthalten dürfen.','Weil Prozentwerte ohne Quelle immer falsch sind.'],'Der Ursprung liefert Kontext, der in Screenshots oder Kurzposts häufig fehlt.'],
   ['Welche Strategie hilft, Aufmerksamkeit bewusster zu steuern?','Benachrichtigungen und Feeds gezielt begrenzen und feste Zeiten für wichtige Informationen wählen.',['Jede Meldung sofort öffnen.','Mehrere Feeds parallel laufen lassen.','Nur anhand der Zahl neuer Meldungen entscheiden.'],'Bewusste Auswahl und Unterbrechungen reduzieren unnötige Reize und schaffen Zeit für vertieftes Prüfen.']
  ]
 ],
 geography:[
  genericBanks.geography[0],
  [
   ['Was beschreibt eine Klimazone?','Ein größeres Gebiet mit typischen langfristigen Klimamerkmalen.',['Das Wetter einer einzigen Stunde.','Nur die politische Grenze eines Staates.','Die Höhe eines einzelnen Berges.'],'Klimazonen fassen langfristige Muster von Temperatur, Niederschlag und weiteren Faktoren räumlich zusammen.'],
   ['Wozu dient eine Kartenlegende?','Sie erklärt Symbole, Farben und Darstellungen auf der Karte.',['Sie berechnet automatisch die Entfernung.','Sie zeigt nur den Kartentitel.','Sie ersetzt den Maßstab.'],'Die Legende hilft, kartografische Zeichen korrekt zu lesen.']
  ],
  genericBanks.geography[1],
  [
   ['Warum können Flüsse Landschaften verändern?','Fließendes Wasser kann Material abtragen, transportieren und ablagern.',['Flüsse bewegen grundsätzlich kein Material.','Erosion findet nur durch Wind statt.','Wasser verändert ausschließlich die Temperatur.'],'Erosion, Transport und Ablagerung formen Flusstäler und andere Landschaften.'],
   ['Was beschreibt Plattentektonik?','Die Bewegung großer Teile der festen Erdoberfläche auf geologischen Zeitskalen.',['Die tägliche Bewegung von Wolken.','Nur die Entstehung von Flüssen.','Eine Methode zur Wettervorhersage.'],'Bewegungen von Lithosphärenplatten hängen unter anderem mit Erdbeben, Gebirgsbildung und Vulkanismus zusammen.']
  ],
  genericBanks.geography[2],
  [
   ['Was kann ein Push-Faktor bei Migration sein?','Eine Bedingung am Herkunftsort, die Menschen zum Wegzug bewegen kann.',['Eine Garantie für Migration.','Nur ein touristisches Reiseziel.','Eine Koordinate auf einer Karte.'],'Push- und Pull-Faktoren beschreiben mögliche Einflüsse; individuelle Migrationsentscheidungen können komplex sein.'],
   ['Warum sind Häfen wichtige Knoten globaler Lieferketten?','Dort werden große Warenströme zwischen See- und Landverkehr verbunden.',['Weil Waren nur per Schiff transportiert werden dürfen.','Weil Entfernung im Handel keine Rolle spielt.','Weil Häfen keine Infrastruktur benötigen.'],'Häfen verknüpfen Transportwege und beeinflussen Erreichbarkeit, Zeit und Kosten.']
  ],
  genericBanks.geography[3],
  [
   ['Warum können Maßnahmen gegen Hochwasser flussabwärts andere Folgen haben als am Bauort?','Flüsse sind verbundene Systeme; Eingriffe können Wasserstände und Fließwege an anderen Orten verändern.',['Weil Wasser nur lokal reagiert.','Weil Hochwasser nie mehrere Regionen betrifft.','Weil Deiche Niederschlag verhindern.'],'Räumliche Planung muss Wechselwirkungen im gesamten Einzugsgebiet berücksichtigen.'],
   ['Warum reicht für Stadtplanung nicht nur die Bevölkerungszahl?','Auch Wege, Wohnen, Arbeit, Grünflächen, Versorgung und unterschiedliche Bedürfnisse beeinflussen den Raum.',['Weil Einwohnerzahlen grundsätzlich unwichtig sind.','Weil Städte keine Infrastruktur brauchen.','Weil alle Stadtteile identische Anforderungen haben.'],'Städte sind räumliche Systeme mit vielen miteinander verbundenen Funktionen.']
  ]
 ],
 economy:[
  genericBanks.economy[0],
  [
   ['Zwei Packungen kosten 6 € für 3 Stück und 8 € für 5 Stück. Welche ist pro Stück günstiger?','Die Packung für 8 € mit 5 Stück.',['Die Packung für 6 € mit 3 Stück.','Beide kosten pro Stück gleich viel.','Das kann man mit Stückpreisen nicht vergleichen.'],'6 € ÷ 3 = 2 € pro Stück. 8 € ÷ 5 = 1,60 € pro Stück.'],
   ['Ein Preis steigt von 50 € auf 55 €. Um wie viel Prozent steigt er?','10 %',['5 %','11 %','50 %'],'Die Erhöhung beträgt 5 €. Bezogen auf 50 € sind das 5 ÷ 50 = 0,10 = 10 %.']
  ],
  genericBanks.economy[1],
  [
   ['Was bedeutet sinkende Kaufkraft bei gleichem Einkommen?','Mit demselben Geld können im Durchschnitt weniger Waren und Dienstleistungen gekauft werden.',['Das Einkommen wird automatisch höher.','Jeder einzelne Preis muss gefallen sein.','Geld verliert seine Rechenfunktion.'],'Steigt das allgemeine Preisniveau stärker als das Einkommen, sinkt dessen reale Kaufkraft.'],
   ['Warum ist bei einem Kredit nicht nur die Monatsrate wichtig?','Laufzeit, Zinssatz und weitere Kosten bestimmen die Gesamtbelastung mit.',['Weil die Monatsrate nie bezahlt wird.','Weil Zinsen keinen Einfluss auf Kosten haben.','Weil längere Laufzeiten immer billiger sind.'],'Eine niedrige Rate kann durch eine längere Laufzeit mit höheren Gesamtkosten verbunden sein.']
  ],
  genericBanks.economy[2],
  [
   ['Was bedeutet Knappheit in der Ökonomie?','Verfügbare Mittel reichen nicht aus, um alle Wünsche gleichzeitig vollständig zu erfüllen.',['Es gibt überhaupt keine Güter.','Alle Preise sind gleich hoch.','Menschen haben keine Bedürfnisse.'],'Knappheit zwingt zu Entscheidungen darüber, wofür begrenzte Ressourcen eingesetzt werden.'],
   ['Was sind Fixkosten eines Unternehmens?','Kosten, die kurzfristig nicht direkt mit jeder zusätzlich produzierten Einheit steigen.',['Kosten, die pro Stück immer exakt gleich sind.','Nur Steuern auf Gewinne.','Erlöse aus Verkäufen.'],'Beispiele können Miete oder bestimmte Grundgebühren sein; variable Kosten verändern sich stärker mit der Produktionsmenge.']
  ],
  genericBanks.economy[3],
  [
   ['Was ist ein negativer externer Effekt?','Eine Handlung verursacht Kosten für Dritte, die nicht vollständig im Preis berücksichtigt sind.',['Jede freiwillige Zahlung.','Ein Rabatt im Einzelhandel.','Eine private Ersparnis ohne Auswirkungen auf andere.'],'Externe Effekte entstehen, wenn Folgen einer Entscheidung andere betreffen, ohne vollständig in der Marktentscheidung enthalten zu sein.'],
   ['Warum sollte man bei Entscheidungen auch Opportunitätskosten beachten?','Eine gewählte Möglichkeit bedeutet oft, auf den Nutzen der besten Alternative zu verzichten.',['Weil jede Alternative denselben Nutzen hat.','Weil nur ausgegebenes Geld Kosten erzeugt.','Weil Zeit nie knapp ist.'],'Auch Zeit, Fläche oder Aufmerksamkeit sind knappe Ressourcen; ihre alternative Verwendung hat einen Wert.']
  ]
 ]
};
function generic(kind,count){const banks=curriculumQuestionBanks[kind]||genericBanks[kind];if(!banks)return null;const ti=tier(count),bank=banks[Math.min(7,ti)]||banks[banks.length-1],q=bank[r(0,bank.length-1)];return pack(kind,count,q[0],q[1],q[2],q[3],{bankTier:ti});}

function ageStartTier(ageBand,kind){return ageBands[ageBand]?.base?.[kind]??0;}
function createTopicProgress(kind){return Object.fromEntries((curriculum[kind]||[]).map(stage=>[stage.id,{correct:0,wrong:0,attempts:0,mastery:0}]));}
function createKnowledge(ageBand=null,legacy={}){const domainsState={};for(const id of Object.keys(domains)){const old=Number(legacy[id])||0,base=ageStartTier(ageBand,id);domainsState[id]={correct:old,wrong:0,attempts:old,mastery:old,level:Math.max(base,tier(old)),correctStreak:0,wrongStreak:0,recent:null,topics:createTopicProgress(id)};}return{version:2,ageBand:ageBands[ageBand]?ageBand:null,domains:domainsState};}
function normalizeKnowledge(raw,ageBand=null,legacy={}){const out=createKnowledge(ageBand||raw?.ageBand,legacy);if(raw&&typeof raw==='object'){out.ageBand=ageBands[ageBand]?ageBand:ageBands[raw.ageBand]?raw.ageBand:out.ageBand;for(const id of Object.keys(domains)){const value=raw.domains?.[id];if(value&&typeof value==='object'){const topics=createTopicProgress(id),correct=Math.max(0,Number(value.correct)||0),wrong=Math.max(0,Number(value.wrong)||0),attempts=Math.max(Math.max(0,Number(value.attempts)||0),correct+wrong),hasAnswered=attempts>0,storedLevel=Math.max(0,Math.min(7,Number.isFinite(Number(value.level))?Number(value.level):out.domains[id].level)),level=hasAnswered?storedLevel:ageStartTier(out.ageBand,id);for(const [topicId,stats] of Object.entries(value.topics||{}))if(topics[topicId])topics[topicId]={correct:Math.max(0,Number(stats.correct)||0),wrong:Math.max(0,Number(stats.wrong)||0),attempts:Math.max(0,Number(stats.attempts)||0),mastery:Math.max(0,Number(stats.mastery)||0)};out.domains[id]={...out.domains[id],correct,wrong,attempts,mastery:Math.max(0,Number(value.mastery)||0),level,correctStreak:Math.max(0,Number(value.correctStreak)||0),wrongStreak:Math.max(0,Number(value.wrongStreak)||0),recent:typeof value.recent==='string'?value.recent:null,topics};}}}return out;}
function knowledgeCount(source,kind){if(source?.domains?.[kind])return Number(source.domains[kind].mastery)||0;return Number(source?.mastery?.[kind])||0;}
function effectiveCount(source,kind,ageBand=null){const count=knowledgeCount(source,kind);if(source?.domains?.[kind]){const d=source.domains[kind],placement=Math.max(0,Math.min(7,Number.isFinite(Number(d.level))?Number(d.level):ageStartTier(ageBand||source.ageBand,kind)));return thresholds[placement]||0;}const band=ageBand||source?.ageBand;return Math.max(count,thresholds[Math.min(7,ageStartTier(band,kind))]||0);}
function knowledgeTrack(kind,source,ageBand=null){return track(kind,effectiveCount(source,kind,ageBand));}
function topicStats(knowledge,kind,topicId){const d=knowledge?.domains?.[kind];return d?.topics?.[topicId]||null;}
function recordWrong(knowledge,kind,topicId=null){const d=knowledge?.domains?.[kind];if(!d)return false;d.wrong++;d.attempts++;d.correctStreak=0;d.wrongStreak=(d.wrongStreak||0)+1;const stage=curriculumStage(kind,d.level),id=topicId||stage?.id;if(id&&d.topics?.[id]){d.topics[id].wrong++;d.topics[id].attempts++;}if(d.wrongStreak>=2){d.level=Math.max(0,(Number(d.level)||0)-1);d.wrongStreak=0;}return true;}
function recordKnowledge(knowledge,kind,topicId=null){const d=knowledge?.domains?.[kind];if(!d)return false;d.correct++;d.attempts++;d.mastery+=1;d.wrongStreak=0;d.correctStreak=(d.correctStreak||0)+1;const stage=curriculumStage(kind,d.level),id=topicId||stage?.id;if(id&&d.topics?.[id]){d.topics[id].correct++;d.topics[id].attempts++;d.topics[id].mastery++;}if(d.correctStreak>=3){d.level=Math.min(7,(Number(d.level)||0)+1);d.correctStreak=0;}return true;}
function potentialTotal(potential){return attributeOrder.reduce((sum,id)=>sum+(Number(potential?.[id])||0),0);}
function createPotential(speciesId='generic',rng=Math.random){const src=potentialTemplates[speciesId]||potentialTemplates.generic,out={...src};const transfer=(from,to,amount)=>{const room=999-out[to],available=out[from]-500,move=Math.max(0,Math.min(amount,room,available));out[from]-=move;out[to]+=move;};for(let i=0;i<18;i++){const from=Math.floor(rng()*10),to=Math.floor(rng()*10);if(from===to)continue;transfer(attributeOrder[from],attributeOrder[to],5+Math.floor(rng()*26));}if(rng()<.08){const to=attributeOrder[Math.floor(rng()*10)];for(let i=0;i<8&&out[to]<930;i++){const from=attributeOrder[Math.floor(rng()*10)];if(from!==to)transfer(from,to,18+Math.floor(rng()*25));}}return out;}
function createAttributes(speciesId='generic',raw=null){if(raw&&typeof raw==='object'&&attributeOrder.every(id=>raw[id]&&Number.isFinite(Number(raw[id].value)))){const out={};for(const id of attributeOrder){const potential=Math.max(1,Math.min(999,Number(raw[id].potential)||potentialTemplates[speciesId]?.[id]||800));out[id]={value:Math.max(1,Math.min(potential,Number(raw[id].value)||1)),progress:Math.max(0,Number(raw[id].progress)||0),potential};}return out;}const potential=createPotential(speciesId),start=startTemplates[speciesId]||startTemplates.generic,out={};for(const id of attributeOrder)out[id]={value:Math.min(potential[id],start[id]),progress:0,potential:potential[id]};return out;}
function normalizePet(raw={},speciesId='generic'){const solved={};for(const id of Object.keys(domains))solved[id]=Math.max(0,Number(raw.solved?.[id]??raw.skills?.[id])||0);const total=Number.isFinite(Number(raw.total))?Math.max(0,Number(raw.total)):Object.values(solved).reduce((a,b)=>a+b,0);const mastery={};for(const id of Object.keys(domains))mastery[id]=Math.max(0,Number(raw.mastery?.[id]??solved[id])||0);const out={...raw,xp:Math.max(0,Number(raw.xp)||0),solved,total,skillPoints:Number.isFinite(Number(raw.skillPoints))?Math.max(0,Number(raw.skillPoints)):Math.floor(total/5),unlocked:Array.isArray(raw.unlocked)?[...raw.unlocked]:[],mastery,recent:{...(raw.recent||{})},attributes:createAttributes(speciesId,raw.attributes),attributeMastery:{...(raw.attributeMastery||{})}};if(!raw.attributes){for(let i=0;i<solved.math;i++)trainAttribute(out,'attack',2);for(let i=0;i<solved.logic;i++)trainAttribute(out,'defense',2);for(let i=0;i<solved.language;i++)trainAttribute(out,'vitality',2);}return out;}
function createPet(legacy={}){return normalizePet(legacy,legacy.speciesId||legacy.id||'generic');}
function attributeCost(value){if(value<250)return 2;if(value<500)return 3;if(value<700)return 4;if(value<850)return 5;if(value<950)return 6;return 8;}
function trainAttribute(pet,attributeId,amount=2){const a=pet?.attributes?.[attributeId];if(!a)return null;const before=a.value,oldProgress=a.progress,development=Math.max(0,Number(amount)||0);if(a.value>=a.potential){pet.attributeMastery[attributeId]=(pet.attributeMastery[attributeId]||0)+development;return{attributeId,development:0,mastery:development,before,after:a.value,progress:a.progress,needed:0,capped:true,levels:0};}a.progress+=development;let levels=0;while(a.value<a.potential){const need=attributeCost(a.value);if(a.progress<need)break;a.progress-=need;a.value++;levels++;}if(a.value>=a.potential)a.progress=0;return{attributeId,development,before,after:a.value,progress:a.progress,needed:a.value>=a.potential?0:attributeCost(a.value),capped:a.value>=a.potential,levels,previousProgress:oldProgress};}
function validTrainingAttributes(kind){return [...(domains[kind]?.attributes||[])];}
function defaultAttribute(kind,pet){const candidates=validTrainingAttributes(kind);if(!candidates.length)return'focus';return candidates.reduce((best,id)=>!best||((pet?.attributes?.[id]?.potential||0)>(pet?.attributes?.[best]?.potential||0))?id:best,null);}
function award(pet,kind,attempts=0){const before=Math.floor(pet.total/5);pet.solved[kind]=(pet.solved[kind]||0)+1;pet.total++;pet.xp+=4;pet.mastery[kind]=(pet.mastery[kind]||0)+(attempts===0?1:.5);const earned=Math.floor(pet.total/5)-before;pet.skillPoints+=earned;return earned;}
function awardLearning(pet,knowledge,kind,attributeId,topicId=null){recordKnowledge(knowledge,kind,topicId);const earned=award(pet,kind,0),target=validTrainingAttributes(kind).includes(attributeId)?attributeId:defaultAttribute(kind,pet),attribute=trainAttribute(pet,target,2);return{skillPoints:earned,attribute,target};}
function unlock(pet,id,abilityId){const a=abilities[id]?.find(x=>x.id===abilityId);if(!a||pet.unlocked.includes(abilityId)||pet.skillPoints<a.cost||(a.requires&&!pet.unlocked.includes(a.requires)))return false;pet.skillPoints-=a.cost;pet.unlocked.push(abilityId);return true;}
function fallbackQuestion(kind,count,recent){const t=tier(count);if(kind==='math'){const rows=[['17 + 8 = ?',25,[24,26,27],'Addiere 8 zu 17: 17 + 8 = 25.'],['7 × 6 = ?',42,[36,40,48],'7 Gruppen mit je 6 ergeben 42.'],['8 + 4 × 5 = ?',28,[60,40,24],'Punkt vor Strich: 4 × 5 = 20, danach 8 + 20 = 28.'],['(9 + 3) × 4 = ?',48,[39,44,52],'Zuerst die Klammer: 9 + 3 = 12. Dann 12 × 4 = 48.'],['Wie viel ist 2/5 von 30?',12,[6,10,15],'Ein Fünftel von 30 ist 6. Zwei Fünftel sind 12.'],['Wie viel sind 35 % von 200?',70,[35,65,75],'10 % von 200 sind 20; 30 % sind 60 und 5 % sind 10. Zusammen 70.'],['18 + 24 ÷ 6 × 3 = ?',30,[21,27,42],'Division und Multiplikation zuerst von links: 24 ÷ 6 = 4, 4 × 3 = 12, dann 18 + 12 = 30.'],['Finde x: 6 × x + 5 = 47',7,[6,8,9],'Ziehe 5 ab: 42. Teile durch 6: x = 7.']][t];return pack(kind,count,rows[0],rows[1],rows[2],rows[3]);}
 if(kind==='logic'){const rows=[['Welche Zahl folgt? 5, 9, 13, ?',17,[14,16,18],'Die Reihe wächst jeweils um 4.'],['Die Schritte wechseln +1, +3: 4, 5, 8, 9, ?',12,[10,11,13],'Nach +1 folgt +3: 9 + 3 = 12.'],['Welche Zahl folgt? 3, 6, 12, ?',24,[18,21,27],'Jede Zahl wird verdoppelt.'],['Du schaust nach Süden und drehst dich einmal 90° nach rechts. Wohin schaust du?','Westen',['Norden','Osten','Süden'],'Von Süden führt eine Rechtsdrehung nach Westen.'],['Alle Lichtkäfer leuchten. Nia ist ein Lichtkäfer. Was folgt sicher?','Nia leuchtet.',['Nur Nia leuchtet.','Nia leuchtet nicht.','Alle leuchtenden Wesen sind Lichtkäfer.'],'Die allgemeine Regel gilt auch für Nia.'],['Lumi kommt vor Pyro. Terra kommt nach Pyro. Wer ist in der Mitte?','Pyro',['Lumi','Terra','Nicht bestimmbar'],'Die Reihenfolge lautet Lumi → Pyro → Terra.'],['Es gibt 4 Jacken und 3 Abzeichen. Wie viele Kombinationen aus je einer Jacke und einem Abzeichen gibt es?',12,[7,9,16],'Zu jeder der 4 Jacken passen 3 Abzeichen: 4 × 3 = 12.'],['Wenn ein Signal rot ist, stoppt der Zug. Der Zug stoppt nicht. Was folgt sicher?','Das Signal ist nicht rot.',['Das Signal ist sicher grün.','Der Zug hat kein Signal.','Die Regel gilt umgekehrt immer.'],'Wäre das Signal rot, müsste der Zug stoppen. Da er nicht stoppt, ist es nicht rot.']][t];return pack(kind,count,rows[0],rows[1],rows[2],rows[3]);}
 if(kind==='language'){const bank=languageBank[t],idx=Math.max(0,bank.findIndex(x=>x[0]===recent)),q=bank[(idx+1)%bank.length];return pack(kind,count,q[0],q[1],q[2],q[3]);}
 const banks=curriculumQuestionBanks[kind]||genericBanks[kind];if(banks){const bi=Math.min(7,t),bank=banks[bi]||banks[banks.length-1],idx=Math.max(0,bank.findIndex(x=>x[0]===recent)),q=bank[(idx+1)%bank.length];return pack(kind,count,q[0],q[1],q[2],q[3],{bankTier:bi});}return null;}
function generate(kind,source,ageBand=null,avoidPrompt=null){if(!domains[kind])return null;const count=effectiveCount(source,kind,ageBand),recent=avoidPrompt||source?.domains?.[kind]?.recent||source?.recent?.[kind]||null,fn={math,logic,language}[kind];let q;for(let i=0;i<8;i++){q=fn?fn(Math.floor(count)):generic(kind,Math.floor(count));if(q&&q.prompt!==recent)break;}if(q?.prompt===recent)q=fallbackQuestion(kind,Math.floor(count),recent);if(source?.domains?.[kind])source.domains[kind].recent=q?.prompt||null;else if(source?.recent)source.recent[kind]=q?.prompt||null;return q;}
window.KnowstersProgress={thresholds,titles,domains,difficultyLabels,curriculum,curriculumStage,ageBands,ageStartTier,attributeDefs,attributeMap,attributeOrder,potentialTemplates,startTemplates,abilities,trees,basics,prepareSets,equip,track,knowledgeTrack,topicStats,createKnowledge,normalizeKnowledge,recordWrong,recordKnowledge,createPet,normalizePet,createPotential,potentialTotal,attributeCost,trainAttribute,validTrainingAttributes,defaultAttribute,award,awardLearning,unlock,generate,tier,math,logic,language,generic};
})();
