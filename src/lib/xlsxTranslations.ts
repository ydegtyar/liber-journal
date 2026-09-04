import { Locale } from '../types/preferences';

export interface XlsxTranslations {
  // Monthly Sheets
  monthNames: string[];
  accountSummaryTitle: string;
  initialDepositLabel: (dateStr?: string) => string;
  currentDepositLabel: string;
  returnPctLabel: string;
  totalPnlLabel: string;

  monthlySummaryTitle: string;
  monthlyPnlLabel: string;
  monthlyOrdersLabel: string;
  monthlyExplanation: string;

  weeklySummaryTitle: string;
  weeklyHeaders: [string, string, string, string];
  weekLabel: (weekNum: number) => string;
  weeklyExplanation: string;

  matrixDateHeader: string;
  matrixOrdersHeader: string;
  matrixDailyPnlHeader: string;
  matrixTotalLabel: string;
  noTradesLabel: string;

  // Sheet 2: Trades Ledger
  tradesHeaders: string[];

  // Sheet 3: Analytics
  analyticsTitle: string;
  analyticsMetrics: {
    currentAccountBalance: string;
    netProfitLoss: string;
    totalReturnRoi: string;
    totalClosedTrades: string;
    winningTrades: string;
    losingTrades: string;
    breakevenTrades: string;
    winRateExclBe: string;
    grossProfit: string;
    grossLoss: string;
    profitFactor: string;
    averageWin: string;
    averageLoss: string;
  };
}

export const XLSX_TRANSLATIONS: Record<Locale, XlsxTranslations> = {
  en: {
    monthNames: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    accountSummaryTitle: 'Account Summary',
    initialDepositLabel: (dateStr?: string) => `Initial Deposit (${dateStr || 'Initial'})`,
    currentDepositLabel: 'Current Deposit',
    returnPctLabel: 'Total Return %',
    totalPnlLabel: 'Total P&L',

    monthlySummaryTitle: 'Monthly Summary',
    monthlyPnlLabel: 'Monthly P&L',
    monthlyOrdersLabel: 'Monthly Orders',
    monthlyExplanation:
      'Explanation: Total net profit and closed order count across the period. Formulas dynamically sum daily results.',

    weeklySummaryTitle: 'Weekly Summary',
    weeklyHeaders: ['Week', 'Dates', 'Orders/Week', 'P&L/Week'],
    weekLabel: (weekNum: number) => `Week ${weekNum}`,
    weeklyExplanation:
      'Explanation: Weekly P&L tracks weekly consistency, trading frequency, and profit per week to evaluate system stability.',

    matrixDateHeader: 'Date',
    matrixOrdersHeader: 'Orders',
    matrixDailyPnlHeader: 'Daily P&L',
    matrixTotalLabel: 'Total',
    noTradesLabel: 'No trades',

    tradesHeaders: [
      'Deal ID',
      'Instrument',
      'Direction',
      'Opened At',
      'Closed At',
      'Open Price',
      'Close Price',
      'Margin ($)',
      'Leverage',
      'Gross Return ($)',
      'Net PnL ($)',
      'Tag',
      'Notes',
    ],

    analyticsTitle: 'Trading Account Performance Analytics',
    analyticsMetrics: {
      currentAccountBalance: 'Current Account Balance',
      netProfitLoss: 'Net Profit / Loss',
      totalReturnRoi: 'Total Return (ROI %)',
      totalClosedTrades: 'Total Closed Trades',
      winningTrades: 'Winning Trades',
      losingTrades: 'Losing Trades',
      breakevenTrades: 'Breakeven (BE) Trades',
      winRateExclBe: 'Win Rate % (Excl. BE)',
      grossProfit: 'Gross Profit',
      grossLoss: 'Gross Loss',
      profitFactor: 'Profit Factor',
      averageWin: 'Average Win',
      averageLoss: 'Average Loss',
    },
  },

  uk: {
    monthNames: [
      'Січень',
      'Лютий',
      'Березень',
      'Квітень',
      'Травень',
      'Червень',
      'Липень',
      'Серпень',
      'Вересень',
      'Жовтень',
      'Листопад',
      'Грудень',
    ],
    accountSummaryTitle: 'Статистика рахунку',
    initialDepositLabel: (dateStr?: string) => `Депозит на початок (${dateStr || 'Початковий'})`,
    currentDepositLabel: 'Поточний депозит',
    returnPctLabel: 'Прибуток %',
    totalPnlLabel: 'Сумарний прибуток',

    monthlySummaryTitle: 'За місяць',
    monthlyPnlLabel: 'Прибуток за місяць',
    monthlyOrdersLabel: 'Закрито угод',
    monthlyExplanation:
      'Пояснення: Загальний чистий прибуток та сумарна кількість закритих угод за період. Формули динамічно підсумовують щоденні результати.',

    weeklySummaryTitle: 'Тижневі підсумки',
    weeklyHeaders: ['Тиждень', 'Діапазон', 'Угод/Тиждень', '$/Тиждень'],
    weekLabel: (weekNum: number) => `Тиждень ${weekNum}`,
    weeklyExplanation:
      'Пояснення: Щотижневий P&L показує динаміку прибутковості та торгове навантаження за кожен тиждень для оцінки стабільності стратегії.',

    matrixDateHeader: 'Дата',
    matrixOrdersHeader: 'Закрито угод',
    matrixDailyPnlHeader: 'Прибуток $',
    matrixTotalLabel: 'Всього',
    noTradesLabel: 'Угоди відсутні',

    tradesHeaders: [
      'ID угоди',
      'Інструмент',
      'Напрямок',
      'Відкрито',
      'Закрито',
      'Ціна відкриття',
      'Ціна закриття',
      'Маржа ($)',
      'Кредитне плече',
      'Валовий дохід ($)',
      'Чистий P&L ($)',
      'Тег',
      'Нотатки',
    ],

    analyticsTitle: 'Аналітика ефективності торгового рахунку',
    analyticsMetrics: {
      currentAccountBalance: 'Поточний баланс рахунку',
      netProfitLoss: 'Чистий прибуток / збиток',
      totalReturnRoi: 'Загальна прибутковість (ROI %)',
      totalClosedTrades: 'Всього закритих угод',
      winningTrades: 'Прибуткові угоди',
      losingTrades: 'Збиткові угоди',
      breakevenTrades: 'Беззбиткові (BE) угоди',
      winRateExclBe: 'Вінрейт % (без BE)',
      grossProfit: 'Валовий прибуток',
      grossLoss: 'Валовий збиток',
      profitFactor: 'Профіт-фактор',
      averageWin: 'Середній прибуток',
      averageLoss: 'Середній збиток',
    },
  },

  ru: {
    monthNames: [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ],
    accountSummaryTitle: 'Статистика счета',
    initialDepositLabel: (dateStr?: string) => `Депозит на начало (${dateStr || 'Начальный'})`,
    currentDepositLabel: 'Текущий депозит',
    returnPctLabel: 'Доходность %',
    totalPnlLabel: 'Суммарная прибыль',

    monthlySummaryTitle: 'За месяц',
    monthlyPnlLabel: 'Прибыль за месяц',
    monthlyOrdersLabel: 'Закрыто сделок',
    monthlyExplanation:
      'Пояснение: Общая чистая прибыль и суммарное количество закрытых сделок за период. Формулы динамически суммируют ежедневные результаты.',

    weeklySummaryTitle: 'Итоги по неделям',
    weeklyHeaders: ['Неделя', 'Диапазон', 'Сделок/Неделя', '$/Неделя'],
    weekLabel: (weekNum: number) => `Неделя ${weekNum}`,
    weeklyExplanation:
      'Пояснение: Еженедельный P&L показывает динамику прибыльности и торговую нагрузку за каждую неделю для оценки стабильности стратегии.',

    matrixDateHeader: 'Дата',
    matrixOrdersHeader: 'Закрыто сделок',
    matrixDailyPnlHeader: 'Прибыль $',
    matrixTotalLabel: 'Всего',
    noTradesLabel: 'Сделки отсутствуют',

    tradesHeaders: [
      'ID сделки',
      'Инструмент',
      'Направление',
      'Открыто',
      'Закрыто',
      'Цена открытия',
      'Цена закрытия',
      'Маржа ($)',
      'Кредитное плечо',
      'Валовый доход ($)',
      'Чистый P&L ($)',
      'Тег',
      'Заметки',
    ],

    analyticsTitle: 'Аналитика эффективности торгового счета',
    analyticsMetrics: {
      currentAccountBalance: 'Текущий баланс счета',
      netProfitLoss: 'Чистая прибыль / убыток',
      totalReturnRoi: 'Общая доходность (ROI %)',
      totalClosedTrades: 'Всего закрытых сделок',
      winningTrades: 'Прибыльные сделки',
      losingTrades: 'Убыточные сделки',
      breakevenTrades: 'Безубыточные (BE) сделки',
      winRateExclBe: 'Винрейт % (без BE)',
      grossProfit: 'Валовая прибыль',
      grossLoss: 'Валовый убыток',
      profitFactor: 'Профит-фактор',
      averageWin: 'Средняя прибыль',
      averageLoss: 'Средний убыток',
    },
  },
};

export function getXlsxTranslations(locale?: string): XlsxTranslations {
  if (!locale) return XLSX_TRANSLATIONS.en;
  if (locale.startsWith('uk')) return XLSX_TRANSLATIONS.uk;
  if (locale.startsWith('ru')) return XLSX_TRANSLATIONS.ru;
  return XLSX_TRANSLATIONS.en;
}

export function formatMonthSheetName(monthKey: string, locale: Locale = 'en'): string {
  const parts = monthKey.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const t = getXlsxTranslations(locale);
    const monthName = t.monthNames[monthIndex] || parts[1];
    return `${monthName} ${year}`;
  }
  return monthKey;
}
