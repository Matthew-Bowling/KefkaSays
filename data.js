const IMAGE_DATA = [
  { file: "images/AccelerationBomb.png", primary: "Stillness",       modified: "Movement"        },
  { file: "images/Blue.png",             primary: "Blue",            modified: "Purple"           },
  { file: "images/CompressedWater.png",  primary: "Stack",           modified: "Spread"           },
  { file: "images/CursedShriek.png",     primary: "Look Away",       modified: "Look At"          },
  { file: "images/Die.png",              primary: "Die",             modified: "Don't Die"        },
  { file: "images/DontDie.png",          primary: "Don't Die",       modified: "Die"              },
  { file: "images/FireChariot.png",      primary: "Chariot Twister", modified: "Donut"            },
  { file: "images/ForkedLightning.png",  primary: "Spread",          modified: "Stack"            },
  { file: "images/Purple.png",           primary: "Purple",          modified: "Blue"             },
  { file: "images/WaterDonut.png",       primary: "Donut",           modified: "Chariot Twister"  },
];

const WRONG_REACTIONS = [
  "Uwee hee hee hee hee! Wrong, you magnificent fool!",
  "WRONG! Even the Magitek Armor knows better than that.",
  "Ha! Did your neurons take the day off?",
  "Incorrect! But don't feel bad — failure IS the natural order.",
  "Oh, you poor witless thing. Muahahaha...",
  "WRONG! Life... dreams... hope... your score... all meaningless! ♪",
  "Not even close! I'm having such a good time.",
  "Wrong answer. I love it. Do it again.",
  "Ha ha HA! My Light of Judgment has more wisdom than you.",
  "Incorrect! But don't worry — I'll give you something to remember me by."
];

const RIGHT_REACTIONS = [
  "...Correct. How tediously predictable.",
  "Right answer. I hate you a little.",
  "Hmph. A stopped clock is right twice a day.",
  "Fine. You knew that one. Don't let it go to your head.",
  "Correct... but it means NOTHING. Nothing at all!",
  "...Lucky guess. I refuse to acknowledge your intellect.",
  "Right. How dull. How utterly, profoundly dull.",
  "Correct! This displeases me greatly.",
  "Ugh. You're actually thinking. Stop that.",
  "...I suppose even the worthless find answers sometimes."
];

const FINAL_REACTIONS = [
  {
    minPct: 0,  maxPct: 30,
    verdict: "SPECTACULAR FAILURE",
    color: "#cc2200",
    text: "MUAHAHAHAHAHA! MAGNIFICENT! A score like that takes genuine, dedicated incompetence! You've made this worthless world just a little MORE worthless. I'm almost proud of you. Almost."
  },
  {
    minPct: 31, maxPct: 50,
    verdict: "MEDIOCRE WRETCH",
    color: "#cc6600",
    text: "Half marks. How perfectly, agonizingly average. You're not stupid enough to be funny and not smart enough to be interesting. This is the most middle-of-the-road disappointment I've ever witnessed. Fitting."
  },
  {
    minPct: 51, maxPct: 70,
    verdict: "MILDLY IMPRESSIVE",
    color: "#886600",
    text: "More than half correct? I... hmm. I'll admit that's more than I expected from someone who stared at that first image for that long. Don't get comfortable. The world is still pointless."
  },
  {
    minPct: 71, maxPct: 90,
    verdict: "INFURIATING COMPETENCE",
    color: "#22aa55",
    text: "High marks. Disgusting. You actually KNOW things. That's incredibly inconvenient for me. I was looking forward to laughing more. You've robbed me of joy. Are you happy with yourself? ...I still win, though. I always win."
  },
  {
    minPct: 91, maxPct: 100,
    verdict: "I REFUSE TO ACCEPT THIS",
    color: "#d4af37",
    text: "...WHAT. WHAT IS THIS. PERFECT?! OR NEAR-PERFECT?! This is IMPOSSIBLE! Unacceptable! You must have cheated! No one... NO ONE beats Kefka at his own game! I'll have to destroy another world just to calm down. Muahahaha... this isn't over."
  }
];

const CHAOS_FINAL_REACTIONS = [
  { minScore: 0,  maxScore: 0,
    verdict: "IMMEDIATE DESTRUCTION",  color: "#cc2200",
    text: "Zero. Not one. You survived ZERO questions in CHAOS mode. I don't even have words. Actually I do: UWEE HEE HEE HEE HEE HEE! Beautiful. Absolutely beautiful failure." },
  { minScore: 1,  maxScore: 3,
    verdict: "CRUSHED BY CHAOS",       color: "#cc2200",
    text: "Muahahaha! A handful and then collapse! Chaos chewed you up and spat you out before you even got comfortable. This is what I live for." },
  { minScore: 4,  maxScore: 7,
    verdict: "BRIEFLY RELEVANT",       color: "#cc6600",
    text: "You lasted a few rounds before inevitably crumbling. Like a candle in a hurricane. Slightly impressive. Mostly pathetic. Uwee hee hee hee..." },
  { minScore: 8,  maxScore: 12,
    verdict: "ANNOYINGLY RESILIENT",   color: "#886600",
    text: "...You kept going for a while. That's... genuinely irritating. I built Chaos to break people quickly. You are being difficult on purpose, aren't you." },
  { minScore: 13, maxScore: 19,
    verdict: "CHAOS HARDENED",         color: "#22aa55",
    text: "I am furious. FURIOUS. You've outlasted dozens of rounds of pure chaos. Do you have no sense of self-preservation? Stop being competent immediately." },
  { minScore: 20, maxScore: Infinity,
    verdict: "YOU HAVE NO EQUAL",      color: "#d4af37",
    text: "...I refuse to accept this. TWENTY OR MORE? In CHAOS MODE? You are either cheating, inhuman, or somehow more chaotic than chaos itself. I am both enraged and, against every instinct I have... impressed. Muahahaha." },
];

// Wretch mode question sets.
// withQMark: true → player answers the modified value; false → primary value.
const WRETCH_QUESTIONS = [
  // Blue + Die → "Blue Die", with AccelerationBomb
  [
    { file: "images/Blue.png",             withQMark: false },
    { file: "images/Die.png",              withQMark: false },
    { file: "images/AccelerationBomb.png", withQMark: false },
  ],
  // Purple + DontDie → "Purple Don't Die", with CursedShriek
  [
    { file: "images/Purple.png",           withQMark: false },
    { file: "images/DontDie.png",          withQMark: false },
    { file: "images/CursedShriek.png",     withQMark: false },
  ],
  // FireChariot + WaterDonut — no color/life pair
  [
    { file: "images/FireChariot.png",      withQMark: false },
    { file: "images/WaterDonut.png",       withQMark: true  },
  ],
  // Blue + DontDie → "Blue Don't Die", with ForkedLightning
  [
    { file: "images/Blue.png",             withQMark: false },
    { file: "images/DontDie.png",          withQMark: false },
    { file: "images/ForkedLightning.png",  withQMark: false },
  ],
  // Purple + Die → "Purple Die", with CompressedWater
  [
    { file: "images/Purple.png",           withQMark: false },
    { file: "images/Die.png",              withQMark: false },
    { file: "images/CompressedWater.png",  withQMark: false },
  ],
];

// Image pairs that cannot appear together in the same multi-slot set.
const CONFLICTING_PAIRS = [
  ['images/Die.png',  'images/DontDie.png'],
  ['images/Blue.png', 'images/Purple.png'],
];

// Display order for multi-slot questions. Lower = further left.
// Fire/Water share the same value so their relative order stays random.
const FILE_DISPLAY_ORDER = {
  'images/Blue.png':              0,
  'images/Purple.png':            0,
  'images/Die.png':               1,
  'images/DontDie.png':           1,
  'images/CursedShriek.png':      2,
  'images/ForkedLightning.png':   3,
  'images/CompressedWater.png':   4,
  'images/AccelerationBomb.png':  5,
  'images/FireChariot.png':       6,
  'images/WaterDonut.png':        6,
};

// Blue/Purple get no numbered timer label
const NO_TIMER_FILES = new Set(['images/Blue.png', 'images/Purple.png']);

// All possible combined answers for the color+life pair
const COMBINED_CHOICES = ["Blue Die", "Blue Don't Die", "Purple Die", "Purple Don't Die"];

const COLOR_FILES = new Set(['images/Blue.png', 'images/Purple.png']);
const LIFE_FILES  = new Set(['images/Die.png',  'images/DontDie.png']);

const TIMER_BY_DIFFICULTY = { easy: 30, normal: 20, chaos: 10 };

const TIME_UP_REACTIONS = [
  "Tick tock... too slow, you dithering fool!",
  "Muahahaha! Time's up! The world doesn't wait for the witless!",
  "Time! What a concept. You wasted all of yours.",
  "You just... froze. Like a statue. How fitting for someone so worthless.",
  "Time expired. Like your chances. Like everything. Uwee hee hee hee...",
  "I've seen Magitek Armor think faster than you. Pathetic.",
];
