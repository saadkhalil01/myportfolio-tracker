/**
 * Known company websites for favicon fallback when stock-logo CDNs miss a symbol.
 * Prefer official domains listed on PSX company profiles.
 */
const DOMAIN_BY_SYMBOL = {
  // Fertilizers / chemicals
  EFERT: 'engrofertilizers.com',
  ENGRO: 'engro.com',
  FFC: 'ffc.com.pk',
  FATIMA: 'fatima-group.com',
  FFBL: 'ffbl.com',
  DOL: 'descon.com',
  EPCL: 'engropolymer.com',
  LOTCHEM: 'lotchem.com',

  // Cement
  MLCF: 'kmlg.com',
  LUCK: 'lucky-cement.com',
  DGKC: 'dgcement.com',
  FCCL: 'fccl.com.pk',
  CHCC: 'cheratcement.com',
  PIOC: 'pioneercement.com',
  KOHC: 'kohatcement.com',
  BWCL: 'bestway.com.pk',
  ACPL: 'attalock.com',

  // Autos / engineering
  SAZEW: 'sazgarautos.com',
  MTL: 'millat.com.pk',
  INDU: 'toyota-indus.com',
  HCAR: 'honda.com.pk',
  PSMC: 'suzukipakistan.com',
  GHNI: 'ghani.com.pk',
  AGIL: 'agul.com.pk',

  // Power / energy
  HUBC: 'hubpower.com',
  KAPCO: 'kapco.com.pk',
  KEL: 'ke.com.pk',
  NPL: 'nishatpower.com',
  NCPL: 'ncpl.com.pk',
  PKGP: 'pakgenpower.com',
  SPWL: 'sapphire.com.pk',

  // Oil & gas
  PSO: 'psopk.com',
  OGDC: 'ogdcl.com',
  PPL: 'ppl.com.pk',
  MARI: 'mpcl.com.pk',
  POL: 'pakoil.com.pk',
  APL: 'apl.com.pk',
  SHEL: 'shell.com.pk',
  ATRL: 'attockrefinery.com',
  NRL: 'nrlpak.com',

  // Banks
  MCB: 'mcb.com.pk',
  UBL: 'ubldirect.com',
  HBL: 'hbl.com',
  MEBL: 'meezanbank.com',
  BAFL: 'bankalfalah.com',
  BAHL: 'bankalhabib.com',
  ABL: 'abl.com',
  BIPL: 'bankislami.com.pk',
  FABL: 'faysalbank.com',
  SCBPL: 'sc.com',
  NBP: 'nbp.com.pk',
  BOP: 'bop.com.pk',
  ASKARI: 'askarisbank.com.pk',
  SBL: 'samba.com.pk',
  SNBL: 'soneribank.com',
  JSBL: 'jsbl.com',

  // Tech / misc
  SYS: 'systems.com.pk',
  TRG: 'trgpk.com',
  NETSOL: 'netsoltech.com',
  AVN: 'avn.com.pk',
  OCTOPUS: 'octopusz.com',
  TPL: 'tplcorp.com',

  // Pharma / FMCG
  SEARL: 'searlpharma.com',
  AGP: 'agp.com.pk',
  GLAXO: 'gsk.com.pk',
  ABOT: 'abbott.com.pk',
  HINOON: 'highnoon.com.pk',
  NESTLE: 'nestle.pk',
  COLG: 'colgate.com.pk',
  UNITY: 'unityfoods.com',
  FEROZ: 'feroze1888.com',
  NATF: 'nationalfoods.com.pk',
  SHEZ: 'shezan.com',
  ISL: 'interloop.com.pk',
  GATI: 'gatronova.com',

  // Steel / textile / other
  ASTL: 'amrelisteels.com',
  INIL: 'internationalindustries.com',
  NML: 'nishatmillsltd.com',
  GATM: 'gulahmed.com',
  KTML: 'kmlg.com',
  ILP: 'interloop.com.pk',
  PACE: 'pacepakistan.com',
  DAWH: 'dawoodhercules.com',
  THALL: 'thal.com.pk',
  PAKT: 'paktel.com',
  PTC: 'ptc.com.pk',
  TELE: 'telenor.com.pk',
  JDW: 'jdwgroup.com',
};

export function normalizeSymbol(name = '') {
  return String(name)
    .trim()
    .toUpperCase()
    .replace(/\.PK$/i, '')
    .replace(/[^A-Z0-9]/g, '');
}

function faviconUrls(domain) {
  return [
    `https://icon.horse/icon/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  ];
}

/** Ordered logo URL candidates for a PSX ticker. */
export function logoCandidates(name) {
  const sym = normalizeSymbol(name);
  if (!sym || sym.length < 2) return [];

  const urls = [
    `https://companiesmarketcap.com/img/company-logos/64/${sym}.PK.png`,
    `https://companieslogo.com/api/starter/stock-symbol/${sym}.PK`,
  ];

  const domain = DOMAIN_BY_SYMBOL[sym];
  if (domain) {
    urls.push(...faviconUrls(domain));
  }

  // Production: resolve website from PSX profile, then favicon (covers MLCF, SAZEW, etc.)
  urls.push(`/.netlify/functions/psx-logo?symbol=${encodeURIComponent(sym)}`);

  return urls;
}
