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
      'дата і час відкриття',
      'дата та час відкриття',
      'дата час відкриття',
      'дата та час відкриття ордера',
      'дата і час відкриття ордера',
      'дата час відкриття ордера',
      'дата та час відкриття ордеру',
      'дата і час відкриття ордеру',
      'дата час відкриття ордеру',
      'дата и время открытия',
      'дата время открытия',
      'відкриття',
      'відкрито',
      'открытие',
      'открыто',
      'opened at',
      'open at',
      'opened',
      'open datetime',
      'open timestamp',
      'open time utc',
      'open datetime utc',
      'open timestamp utc',
      'order open timestamp',
      'order open',
      'start timestamp',
      'started at',
      'position open time',
      'deal open time',
    ],
    openDate: [
      'дата відкриття',
      'дата відкр',
      'дата відкриття ордера',
      'дата відкриття ордеру',
      'дата створення',
      'дата открытия',
      'дата откр',
      'open date',
      'opened date',
      'opening date',
      'date open',
      'order open date',
      'order date',
      'created date',
      'start date',
      'entry date',
    ],
    openTime: [
      'час відкриття',
      'час відкр',
      'час відкриття ордера',
      'час відкриття ордеру',
      'час створення',
      'время открытия',
      'время откр',
      'open time',
      'opened time',
      'opening time',
      'time open',
      'order open time',
      'order time',
      'order timestamp',
      'created at',
      'created time',
      'created',
      'start time',
      'start',
      'entry time',
      'entry',
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
      'дата і час закриття',
      'дата та час закриття',
      'дата час закриття',
      'дата та час закриття ордера',
      'дата і час закриття ордера',
      'дата час закриття ордера',
      'дата та час закриття ордеру',
      'дата і час закриття ордеру',
      'дата час закриття ордеру',
      'дата и время закрытия',
      'дата время закрытия',
      'закриття',
      'закрито',
      'закрытие',
      'закрыто',
      'closed at',
      'close at',
      'closed',
      'close datetime',
      'close timestamp',
      'close time utc',
      'close datetime utc',
      'close timestamp utc',
      'order close timestamp',
      'order close',
      'end timestamp',
      'ended at',
      'position close time',
      'deal close time',
    ],
    closeDate: [
      'дата закриття',
      'дата закр',
      'дата закриття ордера',
      'дата закриття ордеру',
      'дата закрытия',
      'close date',
      'closed date',
      'closing date',
      'date close',
      'order close date',
      'end date',
      'exit date',
    ],
    closeTime: [
      'час закриття',
      'час закр',
      'час закриття ордера',
      'час закриття ордеру',
      'время закрытия',
      'время закр',
      'close time',
      'closed time',
      'closing time',
      'time close',
      'order close time',
      'end time',
      'end',
      'exit time',
      'exit',
    ],
    tradeDate: [
      'дата',
      'дата угоди',
      'дата ордера',
      'date',
      'trade date',
      'deal date',
      'datetime',
      'timestamp',
      'час',
      'время',
      'time',
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
    openedAt: [
      'openedat',
      'opendatetime',
      'opentimestamp',
      'orderopentimestamp',
      'createdat',
      'starttimestamp',
      'startedat',
    ],
    openDate: ['opendate', 'dateopen', 'orderopendate', 'orderdate'],
    openTime: ['opentime', 'timeopen', 'orderopentime', 'ordertime', 'starttime', 'entrytime'],
    openPrice: ['openprice', 'openrate'],
    closedAt: [
      'closedat',
      'closedatetime',
      'closetimestamp',
      'orderclosetimestamp',
      'endtimestamp',
      'endedat',
    ],
    closeDate: ['closedate', 'dateclose', 'orderclosedate'],
    closeTime: ['closetime', 'timeclose', 'orderclosetime', 'endtime', 'exittime'],
    tradeDate: ['date', 'tradedate', 'dealdate'],
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
    'openDate',
    'openTime',
    'closeDate',
    'closeTime',
    'tradeDate',
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
