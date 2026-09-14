/**
 * Column mapping definitions and aliases for broker exports.
 * Easily extensible for new broker profiles or column formats.
 */

interface ColumnMappingProfile {
  name: string;
  aliases: Record<string, string[]>;
}

const LIBERTEX_PROFILE: ColumnMappingProfile = {
  name: 'Libertex',
  aliases: {
    instrument: ['інструмент', 'инструмент', 'instrument', 'symbol', 'asset', 'pair'],
    dealId: [
      'номер угоди',
      'номер сделки',
      'deal id',
      'order id',
      'ticket',
      'id',
      'position id',
      'deal',
    ],
    direction: ['напрямок', 'направление', 'direction', 'type', 'side', 'action'],
    openedAt: [
      'дата відкриття',
      'час відкриття',
      'дата і час відкриття',
      'дата та час відкриття',
      'дата час відкриття',
      'відкриття',
      'відкрито',
      'дата відкр',
      'час відкр',
      'дата открытия',
      'время открытия',
      'дата и время открытия',
      'дата время открытия',
      'открытие',
      'открыто',
      'дата откр',
      'время откр',
      'open time',
      'open date',
      'opened at',
      'open at',
      'opened time',
      'opened date',
      'opening time',
      'opening date',
      'opened',
      'open datetime',
      'open timestamp',
      'entry time',
      'entry date',
      'entry',
      'position open time',
      'deal open time',
    ],
    openPrice: [
      'ціна відкриття',
      'цена открытия',
      'open price',
      'open rate',
      'opening price',
      'entry price',
      'open',
    ],
    closedAt: [
      'дата закриття',
      'час закриття',
      'дата і час закриття',
      'дата та час закриття',
      'дата час закриття',
      'закриття',
      'закрито',
      'дата закр',
      'час закр',
      'дата закрытия',
      'время закрытия',
      'дата и время закрытия',
      'дата время закрытия',
      'закрытие',
      'закрыто',
      'дата закр',
      'время закр',
      'close time',
      'close date',
      'closed at',
      'close at',
      'closed time',
      'closed date',
      'closing time',
      'closing date',
      'closed',
      'close datetime',
      'close timestamp',
      'exit time',
      'exit date',
      'exit',
      'position close time',
      'deal close time',
      // Generic single date/time columns when only one date is present
      'date',
      'дата',
      'time',
      'час',
      'время',
      'datetime',
      'timestamp',
    ],
    closePrice: [
      'ціна закриття',
      'цена закрытия',
      'close price',
      'close rate',
      'closing price',
      'exit price',
      'close',
    ],
    margin: [
      'сума ($)',
      'сума',
      'сумма ($)',
      'сумма',
      'margin',
      'amount',
      'invested',
      'invested ($)',
      'collateral',
      'size',
    ],
    leverage: ['коефіцієнт', 'коэффициент', 'leverage', 'multiplier'],
    grossReturn: ['результат ($)', 'результат', 'gross return', 'return', 'result', 'result ($)'],
    pnl: [
      'прибуток ($)',
      'прибуток',
      'прибыль ($)',
      'прибыль',
      'pnl',
      'profit',
      'profit ($)',
      'net profit',
      'net return',
    ],
  },
};

const STANDARD_CANONICAL_PROFILE: ColumnMappingProfile = {
  name: 'Standard Canonical',
  aliases: {
    instrument: ['instrument', 'symbol', 'asset'],
    dealId: ['dealid', 'id', 'ticket'],
    direction: ['direction', 'side', 'type'],
    openedAt: ['openedat', 'opentime', 'opendate', 'opened', 'openingtime'],
    openPrice: ['openprice', 'openrate'],
    closedAt: ['closedat', 'closetime', 'closedate', 'closed', 'closingtime'],
    closePrice: ['closeprice', 'closerate'],
    margin: ['margin', 'amount', 'invested'],
    leverage: ['leverage', 'multiplier'],
    grossReturn: ['grossreturn', 'result'],
    pnl: ['pnl', 'profit', 'netprofit'],
  },
};

const PROFILES: ColumnMappingProfile[] = [LIBERTEX_PROFILE, STANDARD_CANONICAL_PROFILE];

/**
 * Normalizes a header string by stripping separators and punctuation.
 */
function normalizeHeader(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[_\-/:()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches a raw header string to a canonical field name.
 * 1. Checks exact match across aliases.
 * 2. Checks if normalized string contains the alias as a distinct phrase or substring,
 *    prioritizing date/time fields before generic price fields.
 */
export function matchCanonicalField(rawHeader: string): string | null {
  const normalized = normalizeHeader(rawHeader);
  if (!normalized) return null;

  // Phase 1: Exact matches
  for (const profile of PROFILES) {
    for (const [canonicalField, aliasList] of Object.entries(profile.aliases)) {
      for (const alias of aliasList) {
        if (normalized === normalizeHeader(alias)) {
          return canonicalField;
        }
      }
    }
  }

  // Phase 2: Prefix / Substring matches
  // Notice: check openedAt / closedAt before openPrice / closePrice to prevent 'open time'
  // from matching bare 'open' in openPrice.
  const priorityOrder = [
    'openedAt',
    'closedAt',
    'instrument',
    'dealId',
    'direction',
    'openPrice',
    'closePrice',
    'margin',
    'leverage',
    'grossReturn',
    'pnl',
  ];

  for (const field of priorityOrder) {
    for (const profile of PROFILES) {
      const aliasList = profile.aliases[field];
      if (!aliasList) continue;
      for (const alias of aliasList) {
        const normAlias = normalizeHeader(alias);
        // Avoid matching 1-4 character generic words as substrings of longer unrelated words
        if (normAlias.length > 4 && (normalized === normAlias || normalized.includes(normAlias))) {
          return field;
        }
      }
    }
  }

  return null;
}
