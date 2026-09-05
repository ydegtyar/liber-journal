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
    dealId: ['номер угоди', 'номер сделки', 'deal id', 'order id', 'ticket', 'id'],
    direction: ['напрямок', 'направление', 'direction', 'type', 'side'],
    openedAt: ['дата відкриття', 'дата открытия', 'open time', 'opened at', 'open date'],
    openPrice: ['ціна відкриття', 'цена открытия', 'open price', 'open rate', 'open'],
    closedAt: ['дата закриття', 'дата закрытия', 'close time', 'closed at', 'close date'],
    closePrice: ['ціна закриття', 'цена закрытия', 'close price', 'close rate', 'close'],
    margin: ['сума ($)', 'сума', 'сумма ($)', 'сумма', 'margin', 'amount', 'invested'],
    leverage: ['коефіцієнт', 'коэффициент', 'leverage', 'multiplier'],
    grossReturn: ['результат ($)', 'результат', 'gross return', 'return', 'result'],
    pnl: ['прибуток ($)', 'прибуток', 'прибыль ($)', 'прибыль', 'pnl', 'profit', 'net profit'],
  },
};

const STANDARD_CANONICAL_PROFILE: ColumnMappingProfile = {
  name: 'Standard Canonical',
  aliases: {
    instrument: ['instrument', 'symbol'],
    dealId: ['dealid', 'id', 'ticket'],
    direction: ['direction', 'side'],
    openedAt: ['openedat', 'opentime'],
    openPrice: ['openprice'],
    closedAt: ['closedat', 'closetime'],
    closePrice: ['closeprice'],
    margin: ['margin', 'amount'],
    leverage: ['leverage'],
    grossReturn: ['grossreturn', 'result'],
    pnl: ['pnl', 'profit'],
  },
};

const PROFILES: ColumnMappingProfile[] = [LIBERTEX_PROFILE, STANDARD_CANONICAL_PROFILE];

/**
 * Matches a raw header string to a canonical field name.
 */
export function matchCanonicalField(rawHeader: string): string | null {
  const normalized = rawHeader.trim().toLowerCase().replace(/\s+/g, ' ');

  for (const profile of PROFILES) {
    for (const [canonicalField, aliasList] of Object.entries(profile.aliases)) {
      for (const alias of aliasList) {
        if (normalized === alias || normalized.includes(alias)) {
          return canonicalField;
        }
      }
    }
  }

  return null;
}
