/**
 * Statuseffekte auf Einheiten. Die Engine führt sie als Felder auf `BattleUnit`
 * (analyzed, root, buff, immovable, shield); hier stehen Anzeige und Semantik.
 */
export interface StatusDef {
  /** `status.<name>` */
  id: string;
  /** Feld auf BattleUnit. */
  field: 'analyzed' | 'root' | 'buff' | 'immovable' | 'shield';
  name: string;
  icon: string;
  desc: string;
  /** Ob der Wert in Runden (true) oder als Menge (false) zu lesen ist. */
  durationInRounds: boolean;
}

export const STATUSES: Record<string, StatusDef> = {
  'status.analyzed': { id: 'status.analyzed', field: 'analyzed', name: 'Analysiert', icon: '◉', desc: 'Erleidet +2 Schaden von Wächterangriffen.', durationInRounds: true },
  'status.rooted': { id: 'status.rooted', field: 'root', name: 'Festgehalten', icon: '⌁', desc: 'Setzt die nächste Bewegung aus.', durationInRounds: true },
  'status.ignited': { id: 'status.ignited', field: 'buff', name: 'Entfacht', icon: '✹', desc: 'Nächster Angriff +2 Schaden.', durationInRounds: false },
  'status.anchored': { id: 'status.anchored', field: 'immovable', name: 'Verankert', icon: '◆', desc: 'Kann nicht verschoben werden.', durationInRounds: true },
  'status.shield': { id: 'status.shield', field: 'shield', name: 'Schild', icon: '🛡', desc: 'Fängt Schaden ab, bevor LP sinken.', durationInRounds: false },
};
