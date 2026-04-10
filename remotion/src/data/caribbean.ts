/**
 * Caribbean regulatory map data for the intro scene.
 * Extracted from /src/data/regulations.js — single source of truth for both
 * the live app and the demo video.
 *
 * Coordinates are on a 950×520 SVG viewBox.
 */

export type RegStatus = 'DEDICATED' | 'ECCU' | 'PARTIAL' | 'PERMITTED' | 'NONE';

export const REG_COLORS: Record<RegStatus, { primary: string; glow: string; label: string }> = {
  DEDICATED: {
    primary: '#00E5A0',
    glow: 'rgba(0,229,160,0.5)',
    label: 'Dedicated Crypto Law',
  },
  ECCU: {
    primary: '#38BDF8',
    glow: 'rgba(56,189,248,0.5)',
    label: 'ECCU Regional Framework',
  },
  PARTIAL: {
    primary: '#FACC15',
    glow: 'rgba(250,204,21,0.5)',
    label: 'CBDC / Partial Framework',
  },
  PERMITTED: {
    primary: '#FB923C',
    glow: 'rgba(251,146,60,0.5)',
    label: 'Permitted',
  },
  NONE: {
    primary: '#64748B',
    glow: 'rgba(100,116,139,0.4)',
    label: 'No Dedicated Framework',
  },
};

export interface CaribbeanCountry {
  id: string;
  name: string;
  status: RegStatus;
  x: number;
  y: number;
  r: number;
  flag: string;
}

export const CARIBBEAN_COUNTRIES: CaribbeanCountry[] = [
  { id: 'bahamas',    name: 'Bahamas',            status: 'DEDICATED', x: 290, y: 90,  r: 16, flag: '🇧🇸' },
  { id: 'bermuda',    name: 'Bermuda',            status: 'DEDICATED', x: 510, y: 38,  r: 11, flag: '🇧🇲' },
  { id: 'cayman',     name: 'Cayman Islands',     status: 'DEDICATED', x: 118, y: 248, r: 13, flag: '🇰🇾' },
  { id: 'anguilla',   name: 'Anguilla',           status: 'DEDICATED', x: 715, y: 200, r: 10, flag: '🇦🇮' },
  { id: 'antigua',    name: 'Antigua & Barbuda',  status: 'DEDICATED', x: 766, y: 268, r: 11, flag: '🇦🇬' },
  { id: 'skn',        name: 'St. Kitts & Nevis',  status: 'ECCU',      x: 740, y: 222, r: 10, flag: '🇰🇳' },
  { id: 'montserrat', name: 'Montserrat',         status: 'ECCU',      x: 758, y: 247, r: 9,  flag: '🇲🇸' },
  { id: 'dominica',   name: 'Dominica',           status: 'ECCU',      x: 776, y: 295, r: 10, flag: '🇩🇲' },
  { id: 'stlucia',    name: 'St. Lucia',          status: 'ECCU',      x: 788, y: 320, r: 10, flag: '🇱🇨' },
  { id: 'svg',        name: 'St. Vincent',        status: 'ECCU',      x: 778, y: 348, r: 10, flag: '🇻🇨' },
  { id: 'grenada',    name: 'Grenada',            status: 'ECCU',      x: 775, y: 378, r: 10, flag: '🇬🇩' },
  { id: 'cuba',       name: 'Cuba',               status: 'PARTIAL',   x: 195, y: 162, r: 22, flag: '🇨🇺' },
  { id: 'jamaica',    name: 'Jamaica',            status: 'PARTIAL',   x: 258, y: 290, r: 15, flag: '🇯🇲' },
  { id: 'dr',         name: 'Dominican Rep.',     status: 'PERMITTED', x: 460, y: 248, r: 15, flag: '🇩🇴' },
  { id: 'pr',         name: 'Puerto Rico',        status: 'PERMITTED', x: 570, y: 265, r: 12, flag: '🇵🇷' },
  { id: 'bvi',        name: 'BVI',                status: 'PERMITTED', x: 627, y: 235, r: 10, flag: '🇻🇬' },
  { id: 'barbados',   name: 'Barbados',           status: 'PERMITTED', x: 820, y: 368, r: 10, flag: '🇧🇧' },
  { id: 'tt',         name: 'Trinidad & Tobago',  status: 'PERMITTED', x: 790, y: 430, r: 12, flag: '🇹🇹' },
  { id: 'tci',        name: 'Turks & Caicos',     status: 'PERMITTED', x: 415, y: 175, r: 10, flag: '🇹🇨' },
  { id: 'haiti',      name: 'Haiti',              status: 'NONE',      x: 402, y: 248, r: 13, flag: '🇭🇹' },
  { id: 'belize',     name: 'Belize',             status: 'NONE',      x: 52,  y: 280, r: 10, flag: '🇧🇿' },
  { id: 'guyana',     name: 'Guyana',             status: 'NONE',      x: 870, y: 470, r: 10, flag: '🇬🇾' },
];
