// The axes creative cases are composed from. Every value is a fact about the job, never a taste answer:
// the designer decides concept, direction and dials. Brands, places and people here are invented.

// Artifact types. `lanes` lists the lanes a case of this type may use; `motion` marks cases recorded over time;
// `context` means the domain's content is background for the designer, not a list of things the page must show.
export const ARTIFACTS = [
  { id: 'landing', label: 'landing page', ask: (b) => `Design the landing page for ${b}.`, lanes: ['new', 'refine', 'fix'] },
  { id: 'app-home', label: 'app home', ask: (b) => `Design the home screen of the ${b} app: what a signed-in person sees first.`, lanes: ['new', 'refine', 'fix'] },
  { id: 'dense-dashboard', label: 'data-dense dashboard', ask: (b) => `Design the operations dashboard ${b} staff keep open all day. It has to show a lot at once.`, lanes: ['new'] },
  { id: 'onboarding', label: 'onboarding flow', ask: (b) => `Design the first-run onboarding flow for ${b}: every step in one page, moved through with buttons.`, lanes: ['new'] },
  { id: 'pricing', context: true, label: 'pricing page', ask: (b) => `Design the pricing page for ${b}.`, lanes: ['new', 'refine', 'fix'] },
  { id: 'product-page', label: 'product page', ask: (b) => `Design the page for one product sold by ${b}, from first look to adding it to the basket.`, lanes: ['new', 'refine', 'fix'] },
  { id: 'editorial', label: 'long-form article', ask: (b) => `Design a long-form editorial article published by ${b}. Write a plausible article of at least 900 words.`, lanes: ['new'] },
  { id: 'intro-animation', context: true, label: 'opening animation', ask: (b) => `Design and build an opening animation for ${b} that plays once when the page loads and settles on the first screen.`, lanes: ['new'], motion: { trigger: { type: 'load' }, durationMs: 6000 } },
  { id: 'micro-interaction', context: true, label: 'micro-interaction', ask: (b) => `Design and build one micro-interaction for ${b}: the moment someone completes the main action, from the control through its feedback to the done state. Show it in a small, realistic piece of the surrounding screen.`, lanes: ['new'], motion: { trigger: { type: 'click', selector: '[data-eval-trigger]' }, durationMs: 2500 }, extra: 'Put `data-eval-trigger` on the element a person clicks to start the interaction, so the recorder can find it.' },
  { id: 'deck', label: 'slide deck', ask: (b) => `Design a six-slide deck master for ${b}: title, section, text with picture, big number, quote, closing.`, lanes: ['new'], extra: 'Put all six 1920×1080 slides in the one page, stacked, each scaled to the screen width.' },
  { id: 'event-poster', context: true, label: 'event poster page', ask: (b) => `Design the page for an event ${b} is running. It should work like a poster.`, lanes: ['new', 'refine', 'fix'] },
  { id: 'portfolio', label: 'portfolio', ask: (b) => `Design the portfolio front page for ${b}, showing its past work.`, lanes: ['new'] },
  { id: 'settings', context: true, label: 'settings screen', ask: (b) => `Design the account settings screen for ${b}.`, lanes: ['new'] },
  { id: 'empty-error', context: true, label: 'empty and error states', ask: (b) => `Design the empty, loading and error states of the main ${b} screen, all shown in one page.`, lanes: ['new'] },
  { id: 'mobile-screen', label: 'mobile app screen', ask: (b) => `Design the main screen of the ${b} phone app. Phone first; on a desktop show it sensibly, not stretched.`, lanes: ['new'] },
  { id: 'email', label: 'email', ask: (b) => `Design an HTML email ${b} sends to its customers.`, lanes: ['new'], extra: 'Build it the way a real HTML email is built (tables and inline styles, at most 600px wide), shown centred in the page.' },
  { id: 'dataviz', label: 'data visualisation', ask: (b) => `Design an interactive data visualisation in which ${b} explains one dataset about its work. Invent plausible data and say so in a footnote.`, lanes: ['new'] },
];

// Domains: a wide, unusual spread. `premise` follows the brand name; `content` lists facts to work with.
export const DOMAINS = [
  { id: 'rope-access', field: 'rope-access window cleaning', premise: 'sends rope-access crews to clean the glass of high-rise towers', action: 'request a quote for a building', audiences: ['facility managers of office towers', 'property developers'], content: ['crew safety certificates', 'towers cleaned this year', 'a weather-delay policy'] },
  { id: 'seed-library', field: 'seed library', premise: 'lends heirloom seeds to gardeners, who return seeds from their harvest', action: 'borrow a packet of seeds', audiences: ['allotment gardeners', 'school garden teachers'], content: ['the seed catalogue with growing notes', 'a return calendar', 'stories from growers'] },
  { id: 'pigeon-racing', field: 'pigeon racing club', premise: 'runs a racing-pigeon club with weekend races and live arrival times', action: 'enter a bird in the next race', audiences: ['long-time fanciers in their sixties', 'newcomers who inherited a loft'], content: ['the race calendar', 'live results by loft', 'release-point weather'] },
  { id: 'night-meals', field: 'hospital night-shift meals', premise: 'delivers hot meals to hospital staff working night shifts', action: 'order a meal to a ward before 2 a.m.', audiences: ['nurses on twelve-hour nights', 'junior doctors'], content: ['tonight’s menu', 'delivery slots per ward', 'dietary labels'] },
  { id: 'bow-rehair', field: 'violin bow rehairing', premise: 'rehairs and repairs bows for string players', action: 'book a rehair', audiences: ['professional orchestral players', 'parents of music students'], content: ['turnaround times', 'horsehair grades', 'a before-and-after of a repaired tip'] },
  { id: 'tidal-energy', field: 'tidal energy monitoring', premise: 'monitors a field of underwater tidal turbines', action: 'acknowledge an alert', audiences: ['control-room engineers', 'the grid operator’s duty manager'], content: ['output per turbine', 'tide tables', 'maintenance windows'] },
  { id: 'funeral-coop', field: 'funeral cooperative', premise: 'is a member-owned cooperative arranging simple, fairly priced funerals', action: 'talk to an arranger', audiences: ['families who just lost someone', 'people planning their own funeral'], content: ['fixed prices', 'what happens in the first 48 hours', 'member stories'] },
  { id: 'snow-plough', field: 'municipal snow clearing', premise: 'is the city service that clears snow from streets and footpaths', action: 'see when your street will be cleared', audiences: ['residents', 'bus dispatchers'], content: ['live plough positions', 'priority routes', 'how to report an icy path'] },
  { id: 'cable-repair', field: 'subsea cable repair', premise: 'repairs broken undersea data cables with a fleet of cable ships', action: 'request an emergency repair', audiences: ['network operators', 'insurers'], content: ['ship positions and readiness', 'average repair time', 'depth ratings'] },
  { id: 'sign-language', field: 'sign language learning', premise: 'teaches children sign language with short daily lessons', action: 'start the first lesson', audiences: ['hearing parents of deaf children', 'primary school classes'], content: ['a lesson path', 'signs of the week', 'progress for parents'] },
  { id: 'synth-repair', field: 'vintage synthesizer repair', premise: 'restores vintage analogue synthesizers', action: 'send an instrument in for a check', audiences: ['touring musicians', 'collectors'], content: ['models serviced', 'the repair queue', 'a parts archive'] },
  { id: 'community-fridge', field: 'community fridges', premise: 'runs a network of public fridges where anyone can leave or take food', action: 'find the nearest fridge with food in it', audiences: ['neighbours with spare food', 'students on a tight budget'], content: ['fridge locations and stock levels', 'what may be left', 'volunteer shifts'] },
  { id: 'foraging-tours', field: 'mushroom foraging tours', premise: 'leads small mushroom-foraging walks in old forests', action: 'book a place on a walk', audiences: ['curious city couples', 'amateur cooks'], content: ['the season calendar', 'a safety promise', 'what you will find'] },
  { id: 'film-restoration', field: 'archival film restoration', premise: 'scans and restores damaged film reels for archives', action: 'ask for a restoration estimate', audiences: ['film archive curators', 'documentary producers'], content: ['formats handled', 'before-and-after frames', 'turnaround per reel'] },
  { id: 'sailing-weather', field: 'sailing weather', premise: 'forecasts wind and sea state for small-boat sailors, bay by bay', action: 'check today’s window for a passage', audiences: ['weekend sailors', 'sailing school instructors'], content: ['wind by hour', 'tides', 'a go or no-go summary'] },
  { id: 'falconry', field: 'falconry school', premise: 'teaches falconry on a hillside farm', action: 'book a first flight experience', audiences: ['families looking for a gift', 'people training to keep birds'], content: ['the birds by name', 'course levels', 'what to wear'] },
  { id: 'courier-coop', field: 'bike courier cooperative', premise: 'is a cooperative of cargo-bike couriers delivering across the city', action: 'book a same-hour delivery', audiences: ['small shops', 'law firms sending documents'], content: ['zones and prices', 'live rider count', 'the carbon saved'] },
  { id: 'rare-books', field: 'rare-book auctions', premise: 'auctions rare books and manuscripts', action: 'place a bid on a lot', audiences: ['private collectors', 'university librarians'], content: ['the next sale’s lots', 'condition notes', 'the auction timetable'] },
  { id: 'sleep-clinic', field: 'sleep clinic', premise: 'diagnoses and treats sleep disorders with at-home tests', action: 'order an at-home sleep test', audiences: ['people who snore', 'shift workers who cannot sleep'], content: ['how the test works', 'what a result means', 'costs and insurance'] },
  { id: 'glacier-station', field: 'glacier research station', premise: 'is a research station measuring a retreating glacier', action: 'follow this season’s measurements', audiences: ['school classes', 'other researchers'], content: ['ice thickness over time', 'the crew on station', 'a live camera note'] },
  { id: 'allotments', field: 'allotment association', premise: 'manages a site of allotment garden plots', action: 'join the waiting list for a plot', audiences: ['first-time growers', 'current plot holders'], content: ['plot sizes and fees', 'the waiting list position', 'site rules'] },
  { id: 'esports-refs', field: 'esports referee training', premise: 'trains and certifies referees for esports tournaments', action: 'enrol in the certification course', audiences: ['tournament organisers', 'gamers who want to referee'], content: ['course modules', 'certified referee count', 'upcoming events needing referees'] },
  { id: 'honey-coop', field: 'beekeepers’ honey cooperative', premise: 'sells single-hive honey from member beekeepers', action: 'order a jar from a named hive', audiences: ['food gift buyers', 'local cafés'], content: ['hives and their flowers', 'harvest dates', 'tasting notes'] },
  { id: 'night-bus', field: 'night bus network', premise: 'runs the city’s night buses', action: 'plan a trip home after midnight', audiences: ['hospitality workers', 'students'], content: ['night routes', 'live arrivals', 'safety features on board'] },
  { id: 'prosthetics', field: 'prosthetics workshop', premise: 'designs and fits custom prosthetic limbs', action: 'book a fitting consultation', audiences: ['new amputees and their families', 'para-athletes'], content: ['the fitting process', 'device types', 'patient stories'] },
  { id: 'tea-estate', field: 'direct-trade tea', premise: 'buys tea directly from small estates and sells it by harvest', action: 'subscribe to a seasonal harvest box', audiences: ['tea enthusiasts', 'office kitchens'], content: ['estates and growers', 'flush dates', 'brewing guides'] },
  { id: 'court-interpreters', field: 'court interpreting', premise: 'supplies certified interpreters to courts and tribunals', action: 'book an interpreter for a hearing', audiences: ['court clerks', 'immigration lawyers'], content: ['languages covered', 'availability this week', 'certification levels'] },
  { id: 'observatory', field: 'public observatory', premise: 'opens a hilltop observatory to the public on clear nights', action: 'reserve a telescope slot', audiences: ['families with curious kids', 'amateur astronomers'], content: ['tonight’s sky', 'cloud forecast', 'what you will see'] },
  { id: 'kiln-rental', field: 'ceramics studio', premise: 'rents kiln space and wheels to potters', action: 'book a firing slot', audiences: ['hobby potters', 'professional ceramicists'], content: ['kiln sizes and schedules', 'membership tiers', 'glaze library'] },
  { id: 'lighthouse-stays', field: 'lighthouse holiday stays', premise: 'rents out decommissioned lighthouses as holiday homes', action: 'book a stay', audiences: ['couples wanting quiet', 'birdwatchers'], content: ['the lighthouses', 'availability', 'getting there by boat'] },
  { id: 'crop-drones', field: 'crop survey drones', premise: 'flies drones over farms to spot crop stress early', action: 'schedule a survey flight', audiences: ['arable farmers', 'agronomists'], content: ['field health maps', 'flight schedule', 'cost per hectare'] },
  { id: 'harp-maker', field: 'harp making', premise: 'builds concert and folk harps by hand', action: 'commission a harp', audiences: ['harpists', 'music schools'], content: ['models and woods', 'build waiting time', 'the workshop process'] },
  { id: 'battery-swap', field: 'scooter battery swapping', premise: 'runs street lockers where scooter riders swap flat batteries for charged ones', action: 'find a locker with a charged battery', audiences: ['delivery riders', 'commuters'], content: ['locker map and stock', 'swap price', 'battery health'] },
  { id: 'polar-cruises', field: 'polar expedition cruises', premise: 'runs small-ship expedition cruises to the polar regions', action: 'reserve a cabin', audiences: ['retired adventurers', 'wildlife photographers'], content: ['itineraries', 'the ship and cabins', 'what a landing day is like'] },
  { id: 'soil-lab', field: 'soil carbon testing', premise: 'tests soil carbon for farmers selling carbon credits', action: 'order a sampling kit', audiences: ['regenerative farmers', 'carbon credit buyers'], content: ['how sampling works', 'results by field', 'lab accreditation'] },
  { id: 'senior-chess', field: 'chess club for seniors', premise: 'runs a chess club and online games for people over sixty-five', action: 'join a game this afternoon', audiences: ['retirees new to computers', 'grandchildren signing up a grandparent'], content: ['the club ladder', 'game times', 'puzzle of the day'] },
  { id: 'island-ferry', field: 'island ferry', premise: 'runs the ferry between a mainland harbour and three small islands', action: 'buy a ticket for the next sailing', audiences: ['islanders', 'day-trippers'], content: ['the timetable', 'weather cancellations', 'car deck space'] },
  { id: 'type-foundry', field: 'type foundry', premise: 'designs and licenses typefaces', action: 'license a typeface', audiences: ['brand designers', 'publishers'], content: ['the typeface families', 'licence prices', 'a type tester'] },
  { id: 'circus-school', field: 'circus school', premise: 'teaches aerial and acrobatic circus skills', action: 'book a trial class', audiences: ['adults looking for a new sport', 'teenagers'], content: ['class levels', 'the timetable', 'the coaches'] },
  { id: 'organ-transport', field: 'medical courier', premise: 'transports donor organs and blood between hospitals', action: 'request a time-critical transport', audiences: ['transplant coordinators', 'hospital logistics leads'], content: ['live transports', 'chain-of-custody steps', 'response times'] },
];

export const TONES = [
  'warm and plain-spoken', 'dry and witty', 'austere and precise', 'exuberant', 'quietly luxurious', 'rebellious',
  'nerdy and meticulous', 'nostalgic', 'clinical and trustworthy', 'playful and childlike', 'earthy and handmade',
  'futurist', 'solemn and respectful', 'sporty and fast', 'bookish', 'theatrical', 'slow and calm', 'loud and confident',
  'eccentric', 'industrial', 'romantic', 'mischievous', 'grand and civic', 'scrappy and do-it-yourself',
];

// Optional creative constraints. About half the cases get none.
export const CONSTRAINTS = [
  'type only: no pictures or illustrations, typography carries everything',
  'one colour, plus black and white',
  'dark only',
  'very dense: show a lot at once',
  'playful',
  'luxury',
  'brutalist',
  '320px first: design for a 320px-wide screen, then scale up',
  'monospace type only',
  'no rounded corners anywhere',
  'it must survive being printed in black and white',
  'only two type sizes',
  'huge type',
  'no gradients and no shadows',
];

// A sentence of extra fact that makes each brand more specific.
export const QUIRKS = [
  'It is family-run, now in its third generation.', 'It was founded last year by two former nurses.', 'It is run as a cooperative.',
  'It is a one-person business.', 'It just opened its second location.', 'It is funded by a city grant.',
  'It started as a hobby and grew by word of mouth.', 'It is the oldest business of its kind in the region.',
  'It works from a converted railway depot.', 'It operates in a windy harbour town.', 'It works across three countries.',
  'Its founder is a retired engineer.',
];

// Brand names are composed from syllables, so they keep changing and stay invented.
export const NAME_PARTS = {
  onsets: ['b', 'br', 'c', 'd', 'dr', 'f', 'fl', 'g', 'gr', 'h', 'k', 'l', 'm', 'n', 'p', 'pl', 'qu', 'r', 's', 'sk', 'sl', 'st', 't', 'tr', 'v', 'w', 'z'],
  vowels: ['a', 'e', 'i', 'o', 'u', 'ai', 'ea', 'ou'],
  codas: ['', '', 'l', 'n', 'r', 's', 'th', 'nd', 'rk', 'm', 'st'],
  soft: ['l', 'n', 'r', 'v', 'm', 's', 'd', 't'],
  tails: ['a', 'o', 'e', 'i', 'an', 'el', 'is', 'en', 'or'],
  endings: ['a', 'en', 'el', 'is', 'o', 'et', 'ine', 'wick', 'ford', 'ly', 'ar', 'um'],
  suffixes: ['', '', '', '', ' & Co', ' Works', ' Collective', ' House', ' Field', ' Studio'],
};

// Fix cases plant one of these problems in a generic starting page. `ask` is how a person would report it.
export const DEFECTS = [
  { id: 'stutter', ask: 'When I press "Open details" the side panel stutters and the page jumps. Fix it so it feels smooth.', motion: { file: 'out/index.html', trigger: { type: 'click', selector: '#open' }, durationMs: 1600 } },
  { id: 'phone-overflow', ask: 'On my phone the page scrolls sideways and some text is cut off. Fix it.' },
  { id: 'contrast-targets', ask: 'People say the page is hard to read and the buttons are fiddly on a phone. Fix it.' },
  { id: 'overlap', ask: 'At tablet width the headline runs into the panel next to it. Fix the layout.' },
];

// How a person might ask for a refine. None of these hint at the answer.
export const REFINE_ASKS = [
  (b) => `This page for ${b} looks like any template. Make it feel like it belongs to ${b}. Keep the content.`,
  (b) => `Our ${b} page feels generic. Make it more ours without changing what it says.`,
  (b) => `Make this ${b} page more vibey. Same content, same purpose.`,
  (b) => `The ${b} page works but nobody remembers it. Give it character; keep the content and structure.`,
];
