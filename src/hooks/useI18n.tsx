import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type Language = "en" | "ru";

const LANGUAGE_STORAGE_KEY = "ton-vault-language";

const getDefaultLanguage = (): Language => {
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (stored === "en" || stored === "ru") {
    return stored;
  }

  return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
};

export const translations = {
  en: {
    common: {
      close: "Close",
      backHome: "Back Home",
      telegram: "Telegram",
      devMode: "Dev Mode",
      comingSoon: "Coming soon",
      placeholder: "Placeholder",
      total: "total",
      coins: "Coins",
      keys: "Keys",
      shards: "Shards",
      levelShort: "Lv.",
      configHint:
        "Make sure Supabase env vars are configured and Telegram auth is available, or enable local dev login in your Edge Function env.",
      syncingVault: "Syncing your vault...",
      syncNoticeTitle: "Sync Notice",
      actionFailed: "Action Failed",
      refresh: "Refresh",
      liveRaid: "Live raid"
    },
    app: {
      title: "TON Vault",
      tagline: "Raid. Risk. Cash out.",
      devAuthTitle: "Dev Auth",
      devAuthBody:
        "Browser dev auth is enabled. This mode is for local testing only and should be disabled before production launch.",
      configNoteTitle: "Config Note",
      launchWarningTitle: "Launch Warning",
      languageLabel: "Language"
    },
    nav: {
      home: { label: "Home", short: "HM" },
      raid: { label: "Raid", short: "RD" },
      referrals: { label: "Refs", short: "RF" },
      leaderboard: { label: "Ranks", short: "LB" },
      shop: { label: "Shop", short: "SP" }
    },
    home: {
      mainVault: "Main Vault",
      heroTitle: "Launch a fast 9-cell raid",
      heroBody: "Spend 1 Key, dodge the bomb, and bank the loot before greed wins.",
      heroBadge: "10-30s loop",
      startRaid: "Start Raid",
      resumeRaid: "Resume Active Raid",
      raidWaitingTitle: "Raid Waiting",
      raidWaitingBody: (coins: number, shards: number) =>
        `Your vault run is still active with ${coins} coins and ${shards} shards in the bag. Jump back in before you lose the momentum.`,
      quickFacts: {
        vaultLevel: "Vault Level",
        referralBonus: "Referral Bonus",
        lastClaim: "Last Claim",
        referralSquad: "Referral Squad"
      },
      referralBonusValue: (keys: number) => `+${keys} keys`,
      referralSquadValue: (total: number) => `${total} total`,
      referralSquadBody: (active: number) => `${active} already raiding for rewards.`,
      megaVault: {
        title: "Daily Mega Vault",
        body: "A larger limited-time vault with layered bomb traps and leaderboard multipliers."
      },
      airdrop: {
        title: "Airdrop Score",
        body:
          "Snapshot system coming soon. This preview score only reflects account activity, raids, shards, and valid referrals for future utility planning."
      },
      rewardClaimed: "Daily reward claimed",
      rewardClaimedBody: (label: string) => `${label} has been added to your account.`
    },
    rewards: {
      dailyTitle: "Daily Reward",
      dayLabel: (day: number) => `Day ${day}`,
      ready: "Ready",
      claimDaily: "Claim Daily Reward",
      onCooldown: "On Cooldown",
      rewardedBoost: "Rewarded Boost",
      rewardedBoostBody: (minutes: number) =>
        `One rewarded claim every ${minutes} minutes in MVP mode.`,
      rewardedBoostDisabled:
        "Rewarded ad claims are scaffolded, but the live ad provider is not connected in this build.",
      setupNeeded: "Setup needed",
      verifyingBoost: "Verifying Boost...",
      adsComingSoon: "Ads Coming Soon",
      watchAdFor: (label: string) => `Watch Ad for ${label}`,
      adCooldown: "Ad Cooldown",
      rewardedClaimed: "Rewarded boost claimed",
      rewardedClaimedBody: (label: string) =>
        `${label} has been granted after the rewarded action cleared.`
    },
    level: {
      title: "Vault Level",
      body: "Raid more, stack coins, and collect shards to unlock a permanent coin boost.",
      nextLevel: (points: number) => `${points} pts to next vault level`,
      maxLevel: "Max vault tier reached",
      coinBoost: (percent: number) => `+${percent}% coin boost`,
      progressLabel: (level: number) => `Level ${level} progress`,
      modalTitle: (level: number) => `Vault Level ${level}`,
      modalBody: (percent: number) =>
        `Your vault bonus just increased. Future coin finds now get a +${percent}% boost.`
    },
    raid: {
      loop: "Raid Loop",
      heroTitle: "Open cells. Dodge the bomb. Take the bag.",
      heroBody: "Each raid costs 1 Key. Cash out whenever the run feels rich enough.",
      spendKey: "Spend 1 Key",
      spendingKey: "Spending Key...",
      noKeys: "No Keys Available",
      raidInProgress: "Raid In Progress",
      noKeysHint: "Claim your daily reward or use referrals to get more keys.",
      feed: "Vault Feed",
      started: "A fresh vault is live. Open a safe cell to start stacking the bag.",
      scanning: "Scanning vault cell...",
      revealed: (label: string, coins: number, shards: number) =>
        `Revealed ${label}. Current bag: ${coins} coins, ${shards} shards.`,
      bombBody: "The bomb triggered and this run paid nothing.",
      bombTitle: "Vault detonated",
      bombModal: "The bomb wiped this run. Your current raid loot is gone.",
      wonBody: "Every safe cell is clear. The full raid payout was auto-banked.",
      wonTitle: "Vault cleared",
      wonModal: "You opened every safe cell and auto-banked the full reward.",
      cashingOut: "Locking in your bag...",
      cashedOut: (coins: number, shards: number) =>
        `Reward locked in: ${coins} coins and ${shards} shards.`,
      bankedTitle: "Reward banked",
      bankedModal: (coins: number, shards: number) =>
        `You secured ${coins} coins and ${shards} shards.`,
      riskMore: "Risk More",
      takeReward: "Take Reward",
      lockingReward: "Locking Reward...",
      stats: {
        coinsInBag: "Coins in bag",
        shardsInBag: "Shards in bag",
        multiplier: "Multiplier",
        safeOpens: "Safe opens"
      },
      decisionPoint: "Decision point",
      decisionTitle: "Take reward or risk more",
      decisionBody: "You can keep tapping unopened cells, but one hidden bomb ends the run.",
      howItWorks: "How it works",
      howTitle: "1 bomb. 8 safe cells. Your call every tap.",
      howCoin: "Coins stack your current run.",
      howMultiplier: "Multipliers boost the bag you are holding.",
      howShard: "Rare shard cells feed future airdrop utility.",
      howBomb: "If you hit the bomb, that raid pays nothing.",
      blast: "Bomb triggered"
    },
    referrals: {
      title: "Invite Raiders",
      heroTitle: "Grow your vault network",
      heroBody: "Invite a new player and earn 2 Keys. They start with +1 Key too.",
      code: "Your referral code",
      copyLink: "Copy Link",
      shareTelegram: "Share in Telegram",
      copiedTitle: "Referral link copied",
      copiedBody: "Your referral link is copied and ready to drop into chats.",
      loopTitle: "Referral Loop",
      loopBody:
        "Every qualified join credits the inviter with 2 Keys and the invitee with 1 Key. Only the first valid referral counts, self-referrals are blocked, and the bonus is granted once server-side.",
      shareError: "Share Error",
      totalReferrals: "Total referrals",
      activeReferrals: "Active referrals",
      bonusEarned: "Bonus earned",
      rewardRule: "Reward rule",
      rewardRuleBody: "Inviter +2 Keys, invitee +1 Key on first valid join.",
      deepLinkFormat: "Deep link format",
      deepLinkConfigured:
        "Your bot username is configured. Keep the ref_CODE pattern intact when wiring bot deep links.",
      deepLinkMissing:
        "Set your live bot username in both frontend and Edge Function env vars, then keep the ref_CODE pattern intact.",
      configureBot:
        "Configure your Telegram bot username to unlock the real referral link.",
      linkUnavailable:
        "Referral link is not available until VITE_TELEGRAM_BOT_USERNAME and TELEGRAM_BOT_USERNAME are configured.",
      shareUnavailable: "Telegram sharing stays disabled until the bot username is configured."
    },
    leaderboard: {
      title: "Leaderboard",
      heroTitle: "Top coin raiders",
      heroBody: "Ranked by total coins earned across all completed raids.",
      refreshBoard: "Refresh Board",
      refreshing: "Refreshing...",
      loading: "Loading leaderboard...",
      unavailable: "Leaderboard is unavailable right now.",
      yourRank: "Your rank",
      coins: "coins"
    },
    shop: {
      title: "Shop",
      heroTitle: "Monetization-ready shell",
      heroBody:
        "UI is live now, while payment flows stay intentionally abstracted for a Telegram Stars rollout.",
      updateTitle: "Shop Update",
      prepareStars: "Prepare Stars Checkout",
      prepareFuture: "Prepare Future Offer",
      notesTitle: "Future architecture notes",
      note1: "Telegram Stars should request an invoice server-side before opening checkout in Telegram.",
      note2: "Completed payments should be verified server-side and granted idempotently through economy logs.",
      note3: "Rewarded ads can coexist with key packs, but payout grants should stay on the backend.",
      note4: "TON Connect and jetton flows should remain separate from the soft-currency MVP economy.",
      monetizationTitle: "Monetization Ready",
      monetizationBody:
        "Key packs, premium raid modes, and shield items already have UI entry points. Hook the buttons into Telegram Stars or rewarded ads when the purchase backend is ready.",
      preparedTitle: "Shop action prepared",
      prepareError: "Unable to prepare purchase flow."
    },
    notFound: {
      title: "Vault route not found",
      body: "This screen does not exist yet. Jump back to the main dashboard and keep raiding."
    }
  },
  ru: {
    common: {
      close: "Закрыть",
      backHome: "На главную",
      telegram: "Telegram",
      devMode: "Dev Mode",
      comingSoon: "Скоро",
      placeholder: "Заглушка",
      total: "всего",
      coins: "Монеты",
      keys: "Ключи",
      shards: "Шарды",
      levelShort: "Ур.",
      configHint:
        "Проверь, что env-переменные Supabase настроены и Telegram auth доступен, либо включи local dev login в env для Edge Functions.",
      syncingVault: "Синхронизируем хранилище...",
      syncNoticeTitle: "Статус синка",
      actionFailed: "Действие не выполнено",
      refresh: "Обновить",
      liveRaid: "Активный рейд"
    },
    app: {
      title: "TON Vault",
      tagline: "Рейд. Риск. Кэшаут.",
      devAuthTitle: "Dev Auth",
      devAuthBody:
        "Браузерная dev-авторизация включена. Этот режим нужен только для локального теста и должен быть выключен перед релизом.",
      configNoteTitle: "Заметка по конфигу",
      launchWarningTitle: "Предупреждение",
      languageLabel: "Язык"
    },
    nav: {
      home: { label: "Домой", short: "ДМ" },
      raid: { label: "Рейд", short: "РД" },
      referrals: { label: "Рефы", short: "РФ" },
      leaderboard: { label: "Топ", short: "ТО" },
      shop: { label: "Шоп", short: "ШП" }
    },
    home: {
      mainVault: "Главное хранилище",
      heroTitle: "Запусти быстрый рейд 3x3",
      heroBody: "Потрать 1 Ключ, обойди бомбу и забери лут до того, как жадность победит.",
      heroBadge: "цикл 10-30с",
      startRaid: "Начать рейд",
      resumeRaid: "Вернуться в рейд",
      raidWaitingTitle: "Рейд ждет",
      raidWaitingBody: (coins: number, shards: number) =>
        `Текущий забег еще активен: в сумке ${coins} монет и ${shards} шардов. Возвращайся, пока темп не потерян.`,
      quickFacts: {
        vaultLevel: "Уровень Vault",
        referralBonus: "Реферальный бонус",
        lastClaim: "Последний клейм",
        referralSquad: "Реферальная команда"
      },
      referralBonusValue: (keys: number) => `+${keys} ключей`,
      referralSquadValue: (total: number) => `${total} всего`,
      referralSquadBody: (active: number) => `${active} уже ходят в рейды.`,
      megaVault: {
        title: "Daily Mega Vault",
        body: "Большое ограниченное хранилище с несколькими ловушками и повышенными множителями для лидерборда."
      },
      airdrop: {
        title: "Airdrop Score",
        body:
          "Система снапшотов появится позже. Пока это только preview-оценка по активности, рейдам, шардам и валидным рефералам."
      },
      rewardClaimed: "Ежедневная награда получена",
      rewardClaimedBody: (label: string) => `${label} уже добавлено на аккаунт.`
    },
    rewards: {
      dailyTitle: "Ежедневная награда",
      dayLabel: (day: number) => `День ${day}`,
      ready: "Готово",
      claimDaily: "Забрать награду",
      onCooldown: "Перезарядка",
      rewardedBoost: "Рекламный буст",
      rewardedBoostBody: (minutes: number) =>
        `Один рекламный клейм каждые ${minutes} минут в MVP-режиме.`,
      rewardedBoostDisabled:
        "Рекламные награды уже подготовлены, но live-провайдер еще не подключен в этом билде.",
      setupNeeded: "Нужна настройка",
      verifyingBoost: "Проверяем буст...",
      adsComingSoon: "Реклама позже",
      watchAdFor: (label: string) => `Смотреть за ${label}`,
      adCooldown: "Кулдаун рекламы",
      rewardedClaimed: "Буст получен",
      rewardedClaimedBody: (label: string) =>
        `${label} начислено после успешной проверки рекламного действия.`
    },
    level: {
      title: "Уровень хранилища",
      body: "Ходи в рейды, копи монеты и собирай шарды, чтобы открыть постоянный бонус к монетам.",
      nextLevel: (points: number) => `${points} очков до следующего уровня`,
      maxLevel: "Максимальный уровень достигнут",
      coinBoost: (percent: number) => `+${percent}% к монетам`,
      progressLabel: (level: number) => `Прогресс уровня ${level}`,
      modalTitle: (level: number) => `Уровень Vault ${level}`,
      modalBody: (percent: number) =>
        `Бонус хранилища вырос. Теперь будущие монеты получают +${percent}% сверху.`
    },
    raid: {
      loop: "Цикл рейда",
      heroTitle: "Открывай клетки. Избегай бомбы. Забирай добычу.",
      heroBody: "Каждый рейд стоит 1 Ключ. Кэшауться можно в любой момент.",
      spendKey: "Потратить 1 Ключ",
      spendingKey: "Тратим ключ...",
      noKeys: "Нет ключей",
      raidInProgress: "Рейд уже идет",
      noKeysHint: "Забери daily reward или используй рефералку, чтобы получить ключи.",
      feed: "Лента Vault",
      started: "Новое хранилище готово. Открой безопасную клетку и начни собирать сумку.",
      scanning: "Сканируем клетку...",
      revealed: (label: string, coins: number, shards: number) =>
        `Открыто: ${label}. Сейчас в сумке ${coins} монет и ${shards} шардов.`,
      bombBody: "Бомба сработала, этот забег ничего не принес.",
      bombTitle: "Хранилище взорвалось",
      bombModal: "Бомба стерла текущий забег. Вся добыча из этого рейда потеряна.",
      wonBody: "Все безопасные клетки открыты. Полная награда автоматически зачислена.",
      wonTitle: "Хранилище очищено",
      wonModal: "Ты открыл все безопасные клетки и автоматически забрал всю награду.",
      cashingOut: "Фиксируем добычу...",
      cashedOut: (coins: number, shards: number) =>
        `Награда зафиксирована: ${coins} монет и ${shards} шардов.`,
      bankedTitle: "Награда зачислена",
      bankedModal: (coins: number, shards: number) =>
        `Ты закрепил ${coins} монет и ${shards} шардов.`,
      riskMore: "Рискнуть еще",
      takeReward: "Забрать награду",
      lockingReward: "Фиксируем награду...",
      stats: {
        coinsInBag: "Монеты в сумке",
        shardsInBag: "Шарды в сумке",
        multiplier: "Множитель",
        safeOpens: "Безопасных открытий"
      },
      decisionPoint: "Точка решения",
      decisionTitle: "Забрать награду или рискнуть",
      decisionBody: "Можно открыть еще одну клетку, но одна скрытая бомба завершит забег.",
      howItWorks: "Как это работает",
      howTitle: "1 бомба. 8 безопасных клеток. Решение за тобой.",
      howCoin: "Монеты увеличивают текущую сумку.",
      howMultiplier: "Множители усиливают уже накопленную добычу.",
      howShard: "Редкие шарды идут в будущую utility-механику.",
      howBomb: "Если попадаешь на бомбу, рейд ничего не выплачивает.",
      blast: "Бомба!"
    },
    referrals: {
      title: "Приглашай рейдеров",
      heroTitle: "Расти свою сеть Vault",
      heroBody: "Пригласи нового игрока и получи 2 Ключа. Он стартует с +1 Ключом.",
      code: "Твой реферальный код",
      copyLink: "Копировать ссылку",
      shareTelegram: "Поделиться в Telegram",
      copiedTitle: "Ссылка скопирована",
      copiedBody: "Реферальная ссылка скопирована и готова к отправке в чат.",
      loopTitle: "Реферальный цикл",
      loopBody:
        "Каждое валидное приглашение дает инвайтеру 2 Ключа, а новому игроку 1 Ключ. Засчитывается только первое корректное приглашение, self-referral заблокирован, бонус начисляется один раз на сервере.",
      shareError: "Ошибка шаринга",
      totalReferrals: "Всего рефералов",
      activeReferrals: "Активные рефералы",
      bonusEarned: "Заработано бонусов",
      rewardRule: "Правило награды",
      rewardRuleBody: "Инвайтер +2 Ключа, приглашенный +1 Ключ при первом валидном входе.",
      deepLinkFormat: "Формат deep link",
      deepLinkConfigured:
        "Имя бота уже настроено. Сохрани паттерн ref_CODE при wiring deep links.",
      deepLinkMissing:
        "Укажи live-username бота и на фронте, и в env Edge Functions, затем сохрани паттерн ref_CODE.",
      configureBot:
        "Настрой username Telegram-бота, чтобы открыть реальную реферальную ссылку.",
      linkUnavailable:
        "Реферальная ссылка недоступна, пока VITE_TELEGRAM_BOT_USERNAME и TELEGRAM_BOT_USERNAME не настроены.",
      shareUnavailable: "Шаринг в Telegram будет недоступен, пока не настроено имя бота."
    },
    leaderboard: {
      title: "Лидерборд",
      heroTitle: "Топ по монетам",
      heroBody: "Рейтинг строится по общему числу монет, заработанных во всех завершенных рейдах.",
      refreshBoard: "Обновить топ",
      refreshing: "Обновляем...",
      loading: "Загружаем лидерборд...",
      unavailable: "Лидерборд сейчас недоступен.",
      yourRank: "Твой ранг",
      coins: "монет"
    },
    shop: {
      title: "Магазин",
      heroTitle: "Каркас под монетизацию",
      heroBody:
        "UI уже готов, а платежные потоки пока сознательно оставлены абстрактными под будущий запуск Telegram Stars.",
      updateTitle: "Обновление магазина",
      prepareStars: "Подготовить Stars checkout",
      prepareFuture: "Подготовить future offer",
      notesTitle: "Заметки по архитектуре",
      note1: "Telegram Stars должны сначала запрашивать invoice на сервере, а уже потом открывать оплату в Telegram.",
      note2: "Завершенные платежи нужно подтверждать на сервере и начислять идемпотентно через economy logs.",
      note3: "Rewarded ads могут жить рядом с key packs, но награды все равно должны идти только через backend.",
      note4: "TON Connect и jetton-флоу должны оставаться отдельно от soft-currency экономики MVP.",
      monetizationTitle: "Готово к монетизации",
      monetizationBody:
        "У key pack, premium raid mode и shield item уже есть входные точки в UI. Когда backend для покупок будет готов, эти кнопки можно привязать к Telegram Stars или rewarded ads.",
      preparedTitle: "Действие магазина подготовлено",
      prepareError: "Не удалось подготовить purchase flow."
    },
    notFound: {
      title: "Маршрут не найден",
      body: "Такой экран пока не существует. Вернись на главный экран и продолжай рейды."
    }
  }
} as const;

type I18nValue = {
  copy: (typeof translations)[Language];
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => getDefaultLanguage());

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const value = useMemo<I18nValue>(
    () => ({
      copy: translations[language],
      language,
      locale: language === "ru" ? "ru-RU" : "en-US",
      setLanguage: setLanguageState
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
};
