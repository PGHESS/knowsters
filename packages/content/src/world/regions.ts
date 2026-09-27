/** Regionen der Welt (Bible §5, §13). Im Slice existiert nur Lichtquell · Werkstattviertel. */
export interface RegionDef {
  /** `region.<name>` */
  id: string;
  name: string;
  subtitle: string;
  /** Art Direction in einem Satz. */
  look: string;
  /** Arena-Themes, die in dieser Region vorkommen. */
  arenaThemes: readonly string[];
  /** Encounter-IDs. */
  encounters: readonly string[];
  /** Runtime-Environment (Bible §12), sobald vorhanden. */
  environment: string | null;
}

export const REGIONS: Record<string, RegionDef> = {
  'region.lichtquell': {
    id: 'region.lichtquell',
    name: 'Lichtquell',
    subtitle: 'Werkstattviertel',
    look: 'Moderne Stadt mit Magie: Pflaster, Metall, Lichtadern, Werkstätten, Infrastruktur. Keine mittelalterliche Fantasy.',
    arenaThemes: ['workshop', 'plaza'],
    encounters: ['workshop-flicker', 'pilot-3d'],
    environment: 'environments/lichtquell',
  },
  'region.bridge': {
    id: 'region.bridge',
    name: 'Die letzte Brücke',
    subtitle: 'Prolog · Stadttor',
    look: 'Steinplatten, Risse, Tor, Geländer, Höhenkante, Abendlicht.',
    arenaThemes: ['bridge'],
    encounters: ['prolog-bridge'],
    environment: 'environments/bridge',
  },
};
