/**
 * METTLE: brand copy and gym knowledge for the template.
 *
 * Business data (classes, prices, capacities, coaches, sites, the Remote link,
 * logo and banner) loads from the Opencals storefront API. This file holds only
 * what the API has no field for: the discipline → plate mapping, intensity,
 * coach bios and tiers, site copy, Training Block recipes and the memberships
 * preview. A gym that forks the template rewrites this file and keeps the code.
 *
 * Lookups are keyed by API slugs: collection slugs (disciplines), location
 * slugs (sites), staff slugs (coaches) and the class key that `lib/catalog.ts`
 * derives from variant slugs (`barbell-club-collingwood-jo` → `barbell-club`).
 * Anything the API returns that has no entry here still renders, with fallbacks.
 *
 * Every number on the site (places left, prices, sessions this week) comes from
 * the API. Don't put made-up stats here.
 */

import type { LocationDetailResponse } from '@opencals/storefront-sdk';

/* ------------------------------------------------------------------ Types */

/** Calibrated bumper-plate colours: the discipline language across the site. */
export type Plate = 'red' | 'blue' | 'yellow' | 'green' | 'white' | 'black' | 'steel';

/** How a discipline's products are booked. */
export type DisciplineMode = 'timetable' | 'rack' | 'events';

export interface DisciplineMeta {
	label: string;
	plate: Plate;
	/** "25 kg" etc: the plate it borrows its colour from. */
	plateWeight: string;
	mode: DisciplineMode;
	/** Where the discipline is booked. */
	href: string;
	tagline: string;
	blurb: string;
}

export interface ClassMeta {
	/** Discipline (collection slug). The collection wins when the API has it. */
	discipline: string;
	/** Short name for timetable blocks ("Barbell Club"). */
	short: string;
	/** 1 (easy) – 5 (all out). */
	intensity: 1 | 2 | 3 | 4 | 5;
	/** "All levels", "Some experience", "Sparring experience"… */
	level: string;
	tagline: string;
	whatToBring: string[];
	/** Shown before booking when the class has an entry requirement. */
	prerequisite?: string;
}

export interface ServiceMeta {
	/** Extra slug prefixes that belong to this service (`pt-` → personal-training). */
	prefixes?: string[];
	/** Discipline (collection slug). The collection wins when the API has it. */
	discipline: string;
	short: string;
	tagline: string;
	/** Bullet points for the service card. */
	includes: string[];
	/** Minutes between suggested start times in the slot rack (default 30). */
	startStep?: number;
	/** Lengths offered (minutes) for custom-duration products. Filtered to the product's own min/max. */
	lengths?: number[];
	whatToBring?: string[];
	/** Partner sessions: one booking for two people (sent as customAttributes.people = "2"). */
	people?: 2;
}

export interface CoachMeta {
	tier: 'coach' | 'senior' | 'head';
	role: string;
	bio: string;
	specialities: string[];
	/** Discipline slugs this coach leads with. */
	disciplines: string[];
	credentials: string[];
	quote: string;
}

export interface SiteMeta {
	key: string;
	name: string;
	/** "The Engine House" */
	nickname: string;
	suburb: string;
	blurb: string;
	transit: string;
	parking: string;
	hours: string;
	facilities: string[];
	images: string[];
	online?: boolean;
}

export interface BlockLine {
	/** What fills this line. */
	pick:
		| { type: 'class'; disciplines: string[]; classKeys?: string[] }
		| { type: 'service'; serviceKey: string };
	count: number;
	label: string;
}

export interface TrainingBlock {
	key: string;
	name: string;
	plate: Plate;
	tagline: string;
	description: string;
	lines: BlockLine[];
}

export interface MembershipTier {
	key: string;
	name: string;
	plate: Plate;
	/** Indicative only: memberships aren't on sale yet. */
	priceHint: string;
	cadence: string;
	includes: string[];
}

/* ------------------------------------------------------------------ Config */

export const siteConfig = {
	name: 'METTLE',
	tagline: 'Strength, fight & recovery club',
	description:
		'A boutique strength, fight and recovery club in Melbourne. Barbell, boxing, conditioning, mobility, a contrast suite and a sports lab across the Engine House in Collingwood and the Yard in Cremorne.',
	url: process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
	locale: 'en_AU',
	/** BCP 47 locale for Intl formatting. */
	intlLocale: 'en-AU',
	country: 'AU',
	/** Fallbacks only; the store's settings win when they load. */
	currency: 'AUD',
	/** Every time on the site renders in this zone, on the server and in the browser. */
	timezone: 'Australia/Melbourne',

	logo: { text: 'METTLE', descriptor: 'Strength · Fight · Recovery' },

	contact: {
		email: 'hello@mettle.club',
		phone: '+61 3 9016 4400',
		hours: 'Mon–Fri 06:00–21:00 · Sat 07:00–17:00 · Sun 08:00–16:00',
		instagram: 'https://instagram.com/mettle.club',
	},

	/** Template media in public/ (photos, hero video). Missing files fall back to the rubber placeholder. */
	media: {
		heroVideo: '/videos/hero.mp4',
		heroPoster: '/videos/hero-poster.jpg',
		disciplines: {
			strength: '/images/gallery/platform.jpg',
			fight: '/images/gallery/ring.jpg',
			conditioning: '/images/gallery/engine-room.jpg',
			mobility: '/images/gallery/yoga.jpg',
			recovery: '/images/gallery/contrast.jpg',
			coaching: '/images/gallery/coach.jpg',
			lab: '/images/gallery/lab.jpg',
			events: '/images/classes/event-hybrid-race-day.jpg',
		} as Record<string, string>,
		memberships: '/images/hero/memberships.jpg',
	},

	/** Location `type` values from the API. */
	locationTypes: {
		online: 'online',
		physical: 'physical',
		delivery: 'delivery',
	} satisfies Record<string, LocationDetailResponse['type']>,

	/**
	 * Disciplines by collection slug, in display order. The plate is the colour of
	 * everything in that collection; the mode decides how it's booked.
	 */
	disciplines: {
		strength: {
			label: 'Strength',
			plate: 'red',
			plateWeight: '25 kg',
			mode: 'timetable',
			href: '/disciplines/strength',
			tagline: 'Barbells, kettlebells, the heavy stuff.',
			blurb: 'Coached lifting in small groups: Barbell Club, kettlebell complexes, the Olympic Lifting Lab and Strongman Saturday in the Rig Yard.',
		},
		fight: {
			label: 'Fight',
			plate: 'blue',
			plateWeight: '20 kg',
			mode: 'timetable',
			href: '/disciplines/fight',
			tagline: 'Boxing and Muay Thai under the ring lights.',
			blurb: 'From your first jab to technical sparring. Boxing Fundamentals, Bag Rounds, Muay Thai, sparring for the experienced and Junior Boxing for 12–16s.',
		},
		conditioning: {
			label: 'Conditioning',
			plate: 'yellow',
			plateWeight: '15 kg',
			mode: 'timetable',
			href: '/disciplines/conditioning',
			tagline: 'The engine. Ski, row, bike, sled, sprint.',
			blurb: 'Interval work in the Engine Room, a hybrid race simulation on the Yard and a sprint lab on the turf.',
		},
		mobility: {
			label: 'Mobility',
			plate: 'green',
			plateWeight: '10 kg',
			mode: 'timetable',
			href: '/disciplines/mobility',
			tagline: 'Range, breath, and the way back down.',
			blurb: "Lifter's Yoga, Mobility Flow and Breath & Downshift: the sessions that keep you lifting and punching for years.",
		},
		recovery: {
			label: 'Recovery',
			plate: 'white',
			plateWeight: '5 kg',
			mode: 'rack',
			href: '/recovery',
			tagline: 'Heat, ice and a quiet room.',
			blurb: 'The contrast suite (sauna and cold plunge) at the Engine House, two private infrared suites on the Yard roof, and open-floor passes at both sites.',
		},
		coaching: {
			label: 'Coaching',
			plate: 'black',
			plateWeight: 'Training plate',
			mode: 'rack',
			href: '/coaching',
			tagline: 'One coach, your programme.',
			blurb: 'Personal training for 30, 60 or 90 minutes with a coach, senior coach or head coach. Partner sessions, fight padwork, semi-private strength and ring hire.',
		},
		lab: {
			label: 'Lab',
			plate: 'steel',
			plateWeight: 'Calibration',
			mode: 'rack',
			href: '/lab',
			tagline: 'Measure it before you change it.',
			blurb: 'InBody scans, movement screens, VO2 max testing and nutrition consults. And the free First Round intro, where everyone starts.',
		},
		events: {
			label: 'Events',
			plate: 'steel',
			plateWeight: 'One-offs',
			mode: 'events',
			href: '/events',
			tagline: 'Clinics, race days and the odd fight night.',
			blurb: 'Dated workshops with our head coaches: deadlift clinics, fight-night prep, a hybrid race day and cold-water breathwork.',
		},
	} satisfies Record<string, DisciplineMeta>,

	/** Disciplines whose products run as weekly group classes on the Floor. */
	timetableDisciplines: ['strength', 'fight', 'conditioning', 'mobility', 'coaching'],

	/** Class copy by class key (product group key). Order = order on the Floor within a lane. */
	classes: {
		'barbell-club': {
			discipline: 'strength',
			short: 'Barbell Club',
			intensity: 4,
			level: 'All levels',
			tagline: 'Squat, press, pull. A coached barbell session with a rack each.',
			whatToBring: ['Flat shoes', 'A lifting belt if you use one'],
		},
		'kettlebell-complex': {
			discipline: 'strength',
			short: 'KB Complex',
			intensity: 4,
			level: 'All levels',
			tagline: 'Swings, cleans and carries strung into complexes. Grip ends first.',
			whatToBring: ['Flat shoes'],
		},
		'olympic-lifting-lab': {
			discipline: 'strength',
			short: 'Oly Lab',
			intensity: 3,
			level: 'Some experience',
			tagline: 'Snatch and clean & jerk, broken down at six to a platform.',
			whatToBring: ['Lifting shoes if you have them', 'Wrist wraps'],
			prerequisite: 'You can back squat and press with a barbell. New to the bar? Book Barbell Club first.',
		},
		'strongman-saturday': {
			discipline: 'strength',
			short: 'Strongman',
			intensity: 5,
			level: 'All levels',
			tagline: 'Yoke, sandbags, sled and the log on the Yard turf.',
			whatToBring: ['Old shirt (sandbags)', 'Long socks'],
		},
		'boxing-fundamentals': {
			discipline: 'fight',
			short: 'Boxing Fundamentals',
			intensity: 3,
			level: 'Beginner friendly',
			tagline: 'Stance, guard, footwork and clean combinations. No contact.',
			whatToBring: ['Hand wraps (or add a pair)', 'Gloves (or hire a pair)'],
		},
		'bag-rounds': {
			discipline: 'fight',
			short: 'Bag Rounds',
			intensity: 5,
			level: 'All levels',
			tagline: 'Twelve three-minute rounds on the bag wall, called from the ring.',
			whatToBring: ['Hand wraps', 'Gloves (or hire a pair)'],
		},
		'muay-thai': {
			discipline: 'fight',
			short: 'Muay Thai',
			intensity: 4,
			level: 'All levels',
			tagline: 'Kicks, knees, elbows and the clinch, on pads with a partner.',
			whatToBring: ['Hand wraps', 'Gloves (or hire a pair)', 'Shin guards if you have them'],
		},
		'technical-sparring': {
			discipline: 'fight',
			short: 'Tech Sparring',
			intensity: 4,
			level: 'Sparring experience',
			tagline: 'Controlled, coached sparring at 50%. Headgear and mouthguard on.',
			whatToBring: ['16 oz gloves', 'Mouthguard', 'Headgear'],
			prerequisite: 'Six months of boxing or Muay Thai, and a coach has seen you move. Tell us your experience at checkout.',
		},
		'junior-boxing': {
			discipline: 'fight',
			short: 'Junior Boxing',
			intensity: 3,
			level: '12–16 years',
			tagline: 'Footwork, fitness and respect for 12–16s. No sparring.',
			whatToBring: ['Water bottle', 'A parent or guardian signs the waiver'],
		},
		'engine-room': {
			discipline: 'conditioning',
			short: 'Engine Room',
			intensity: 5,
			level: 'All levels',
			tagline: 'Ski, row and bike intervals on a screen-led clock.',
			whatToBring: ['Towel', 'Water'],
		},
		'hybrid-race-sim': {
			discipline: 'conditioning',
			short: 'Hybrid Race Sim',
			intensity: 5,
			level: 'All levels',
			tagline: 'Run, sled, burpee broad jumps, wall balls. Race-format work on the Yard.',
			whatToBring: ['Running shoes', 'Water'],
		},
		'sprint-lab': {
			discipline: 'conditioning',
			short: 'Sprint Lab',
			intensity: 4,
			level: 'All levels',
			tagline: 'Acceleration and top speed on the turf, filmed and fed back.',
			whatToBring: ['Running shoes'],
		},
		'lifters-yoga': {
			discipline: 'mobility',
			short: "Lifter's Yoga",
			intensity: 2,
			level: 'All levels',
			tagline: 'Hips, T-spine and ankles. Yoga written for people who squat.',
			whatToBring: ['Nothing: mats and blocks are here'],
		},
		'mobility-flow': {
			discipline: 'mobility',
			short: 'Mobility Flow',
			intensity: 2,
			level: 'All levels',
			tagline: 'Joint-by-joint control work that carries straight into your lifts.',
			whatToBring: ['Nothing: we have the kit'],
		},
		'breath-downshift': {
			discipline: 'mobility',
			short: 'Breath & Downshift',
			intensity: 1,
			level: 'All levels',
			tagline: 'Thirty minutes of breathwork to bring the system back down.',
			whatToBring: ['Warm layer'],
		},
		'semi-private-strength': {
			discipline: 'coaching',
			short: 'Semi-Private',
			intensity: 3,
			level: 'All levels',
			tagline: 'Four people, one coach, each on your own programme.',
			whatToBring: ['Your programme card (we keep a copy)'],
		},
	} satisfies Record<string, ClassMeta>,

	/** Rack-booked services by product group key (or slug). */
	services: {
		'personal-training': {
			discipline: 'coaching',
			short: 'Personal Training',
			tagline: 'One coach, one athlete, a session written for you.',
			includes: ['A programme written for you', 'Form check on every rep', 'Your coach keeps your programme between sessions'],
			lengths: [30, 60, 90],
			prefixes: ['pt-'],
		},
		'partner-pt': {
			discipline: 'coaching',
			short: 'Partner PT',
			tagline: 'Two of you, one coach, one price.',
			includes: ['Shared session for two', 'Programmes for both', 'Split it however you like'],
			people: 2,
		},
		'fight-padwork': {
			discipline: 'coaching',
			short: 'Fight Padwork',
			tagline: 'One-to-one on the pads with a fight coach. The fastest way to sharpen up.',
			includes: ['Pads and ring time', 'Combination drilling', 'Defence and footwork'],
			whatToBring: ['Hand wraps', 'Gloves (or hire a pair)'],
		},
		'ring-hire': {
			discipline: 'coaching',
			short: 'Ring Hire',
			tagline: 'The ring and the bag wall to yourselves, between classes.',
			includes: ['Full-size ring', 'Bag wall', 'Bring your own coach'],
			lengths: [60, 120],
			startStep: 30,
		},
		'contrast-suite': {
			discipline: 'recovery',
			short: 'Contrast Suite',
			tagline: 'Finnish sauna and a 6 °C plunge, rounds as you like. Six at a time.',
			includes: ['Sauna at 85 °C', 'Cold plunge at 6 °C', 'Towels and tea'],
			startStep: 60,
			whatToBring: ['Swimwear', 'Thongs'],
		},
		'infrared-suite': {
			discipline: 'recovery',
			short: 'Infrared Suite',
			tagline: 'A private infrared room for one or two, on the Yard roof.',
			includes: ['Private suite', 'Shower and towels', 'Speaker for your playlist'],
			lengths: [40, 80],
			startStep: 40,
		},
		'open-floor': {
			discipline: 'recovery',
			short: 'Open Floor',
			tagline: 'Two hours on the floor for your own programme. A coach is on duty.',
			includes: ['Racks, platforms, bag wall', 'Engine Room machines', 'Coach on the floor'],
			startStep: 60,
		},
		'first-round': {
			discipline: 'lab',
			short: 'First Round',
			tagline: 'A free 20-minute intro and tour. Everyone starts here.',
			includes: ['Tour of the floor', 'A chat about your goals', 'Your first session picked for you'],
			startStep: 30,
		},
		'inbody-scan': {
			discipline: 'lab',
			short: 'InBody Scan',
			tagline: 'Body composition in a minute, explained in fifteen.',
			includes: ['Lean mass, fat mass, water', 'Segmental breakdown', 'Printed report'],
			startStep: 15,
		},
		'movement-screen': {
			discipline: 'lab',
			short: 'Movement Screen',
			tagline: 'Squat, hinge, lunge, push, pull: filmed and scored, with a fix list.',
			includes: ['Seven-test screen', 'Video of every test', 'Your fix list'],
		},
		'vo2-max-test': {
			discipline: 'lab',
			short: 'VO2 Max Test',
			tagline: 'The lab test for your engine: VO2 max and heart-rate zones.',
			includes: ['Metabolic cart test on the bike or treadmill', 'Personal heart-rate zones', 'Written report'],
			startStep: 60,
			whatToBring: ['Running shoes', 'No big meal 2 hours before'],
		},
		'nutrition-consult': {
			discipline: 'lab',
			short: 'Nutrition Consult',
			tagline: 'A video call with our accredited sports dietitian.',
			includes: ['Food log review', 'Fuelling for training', 'Plan in your inbox'],
		},
	} satisfies Record<string, ServiceMeta>,

	/** Events (dated workshops) by product slug. */
	events: {
		'event-deadlift-clinic': { tagline: 'Two hours on the hinge with our head strength coach.', whatToBring: ['Flat shoes', 'Chalk is provided'] },
		'event-fight-night-prep': { tagline: 'A Saturday camp before the white-collar card: rounds, pads, nerves.', whatToBring: ['Wraps', 'Gloves', 'Mouthguard'] },
		'event-hybrid-race-day': { tagline: 'A full race simulation with timing, on the Yard.', whatToBring: ['Race shoes', 'Water'] },
		'event-cold-water-breathwork': { tagline: 'Breath, then the plunge, then breath again. Guided.', whatToBring: ['Swimwear', 'Warm layers'] },
	} as Record<string, { tagline: string; whatToBring: string[] }>,

	/** Sites by location slug. */
	sites: {
		'mettle-collingwood': {
			key: 'collingwood',
			name: 'The Engine House',
			nickname: 'Engine House',
			suburb: 'Collingwood',
			blurb:
				'A 1920s cable-tram engine house on Smith Street: twelve racks and platforms under the old crane rail, a full-size ring and bag wall, the Engine Room, the Lab, and the contrast suite where the boiler room used to be.',
			transit: 'Tram 86 to stop 22 (Smith St / Johnston St), two minutes. Collingwood station is a ten-minute walk.',
			parking: 'Two-hour street parking on Smith St; secure bike cage inside.',
			hours: 'Mon–Fri 06:00–21:00 · Sat 07:00–17:00 · Sun 08:00–16:00',
			facilities: ['Barbell floor + platform bay', 'Ring & bag wall', 'Engine Room (ski, row, bike)', 'Mezzanine studio', 'The Lab', 'Contrast suite'],
			images: ['/images/sites/collingwood.jpg', '/images/gallery/bags.jpg', '/images/gallery/chalk.jpg'],
		},
		'mettle-cremorne': {
			key: 'cremorne',
			name: 'The Yard',
			nickname: 'Yard',
			suburb: 'Cremorne',
			blurb:
				'An old timber yard on Cremorne Street: 30 metres of turf, a sled track, the Rig Yard, and two infrared suites and a plunge up on the rooftop deck.',
			transit: 'East Richmond station, four minutes. Tram 70 to Church St.',
			parking: 'Twelve spaces off Cremorne St.',
			hours: 'Mon–Fri 06:00–21:00 · Sat 07:00–17:00 · Sun 08:00–16:00',
			facilities: ['30 m turf + sled track', 'Rig Yard (strongman)', 'Rooftop deck: 2 infrared suites, mobility', 'Showers'],
			images: ['/images/sites/cremorne.jpg', '/images/gallery/turf.jpg', '/images/classes/infrared-suite-2.jpg'],
		},
		'mettle-online': {
			key: 'remote',
			name: 'Mettle Remote',
			nickname: 'Remote',
			suburb: 'Online',
			blurb: 'Video sessions for nutrition consults and programme check-ins. The link arrives with your booking.',
			transit: 'A video link, sent with your booking. Join from 10 minutes before.',
			parking: '',
			hours: 'By appointment',
			facilities: ['Video call', 'Shared notes'],
			images: ['/images/sites/online.jpg'],
			online: true,
		},
	} satisfies Record<string, SiteMeta>,

	/** Coaches by staff slug. */
	coaches: {
		'jo-mercer': {
			tier: 'head',
			role: 'Head of Strength',
			bio: 'Head of Strength. Two-time national masters weightlifting champion who has coached the barbell floor since Mettle opened. Jo runs Barbell Club and the Olympic Lifting Lab, and will rebuild your deadlift from the floor up.',
			specialities: ['Olympic lifting', 'Barbell strength', 'Powerlifting'],
			disciplines: ['strength'],
			credentials: ['AWF Level 2', 'ASCA Level 2'],
			quote: 'Leave one in the tank and come back on Thursday.',
		},
		'tane-wiremu': {
			tier: 'head',
			role: 'Head of Fight',
			bio: 'Head of Fight. Eleven years as a pro middleweight, now the calmest person in the ring. Tane built the Fight programme around one idea: technique first, then the rounds.',
			specialities: ['Boxing', 'Sparring', 'Fight conditioning'],
			disciplines: ['fight'],
			credentials: ['Boxing Australia Level 2', 'Cert IV Fitness'],
			quote: 'Hands up, chin down, breathe.',
		},
		'priya-raman': {
			tier: 'head',
			role: 'Head of Conditioning',
			bio: 'Head of Conditioning and a top-ten age-group hybrid racer. Priya programmes the Engine Room and the Hybrid Race Sim, and runs every VO2 max test in the Lab.',
			specialities: ['Hybrid racing', 'Engine work', 'VO2 testing'],
			disciplines: ['conditioning', 'lab'],
			credentials: ['BExSc', 'ASCA Level 2'],
			quote: 'The clock is the coach. I just read it out.',
		},
		'marco-bellini': {
			tier: 'senior',
			role: 'Senior Strength Coach',
			bio: 'Former state strongman competitor who looks after the Rig Yard. Marco’s Saturday sessions are stones, yokes and sleds, and somehow everyone comes back the next week.',
			specialities: ['Strongman', 'Kettlebells', 'Small-group strength'],
			disciplines: ['strength', 'coaching'],
			credentials: ['Strongman Australia judge', 'Cert IV Fitness'],
			quote: 'Pick it up. Carry it. Put it down nicely.',
		},
		'aisha-daniels': {
			tier: 'senior',
			role: 'Senior Fight Coach',
			bio: 'Trained in Bangkok camps for six years and still holds pads like she means it. Aisha teaches Muay Thai and Bag Rounds, and her padwork privates book out first.',
			specialities: ['Muay Thai', 'Padwork', 'Bag work'],
			disciplines: ['fight'],
			credentials: ['Kru (Muay Thai)', 'Cert IV Fitness'],
			quote: 'Every kick starts with the hip.',
		},
		'liam-doyle': {
			tier: 'senior',
			role: 'Senior Conditioning Coach',
			bio: 'Ex-lightweight rower who treats the Engine Room ergs like boats. Liam coaches pacing, breathing and the art of the honest last interval, and co-runs VO2 testing.',
			specialities: ['Rowing', 'Intervals', 'Endurance'],
			disciplines: ['conditioning'],
			credentials: ['Rowing Australia coach', 'ASCA Level 1'],
			quote: 'Pace the first one. Earn the last one.',
		},
		'mei-chen': {
			tier: 'senior',
			role: 'Senior Mobility Coach',
			bio: 'Physiotherapy-trained yoga teacher who speaks fluent lifter. Mei’s classes open hips and shoulders for the work you actually do here, and her movement screens find the thing that keeps nagging.',
			specialities: ['Yoga for lifters', 'Mobility', 'Movement screening'],
			disciplines: ['mobility', 'lab'],
			credentials: ['BPhysio', 'RYT 500'],
			quote: 'Range you can control is range you can keep.',
		},
		'sam-okoye': {
			tier: 'coach',
			role: 'Strength Coach',
			bio: 'Sam is who we send nervous first-timers to. Patient cueing, a big laugh, and kettlebell complexes that sneak up on you.',
			specialities: ['Kettlebells', 'Barbell basics', 'First-timers'],
			disciplines: ['strength'],
			credentials: ['Cert IV Fitness'],
			quote: 'Nervous is normal. Let’s lift.',
		},
		'ruby-hart': {
			tier: 'coach',
			role: 'Boxing Coach',
			bio: 'Amateur boxing state champion who runs Junior Boxing and the early Bag Rounds. Ruby’s rounds are fast, her feedback faster.',
			specialities: ['Boxing', 'Junior boxing', 'Bag work'],
			disciplines: ['fight'],
			credentials: ['Boxing Australia Level 1', 'Working with Children Check'],
			quote: 'Footwork first. Power comes free.',
		},
		'kai-nakamura': {
			tier: 'coach',
			role: 'Speed Coach',
			bio: 'Former 400 m sprinter who owns the turf at The Yard. Kai coaches acceleration, sled pushes and race-day transitions.',
			specialities: ['Sprinting', 'Sled work', 'Hybrid racing'],
			disciplines: ['conditioning'],
			credentials: ['ASCA Level 1'],
			quote: 'Fast is a skill. We practise it.',
		},
		'hana-novak': {
			tier: 'coach',
			role: 'Breath & Mobility Coach',
			bio: 'Breathwork and mobility coach who teaches the slow stuff that makes the fast stuff possible. Hana runs Breath & Downshift in the studio, on the rooftop and live online.',
			specialities: ['Mobility', 'Breathwork', 'Cold exposure'],
			disciplines: ['mobility'],
			credentials: ['Oxygen Advantage instructor', 'Cert IV Fitness'],
			quote: 'Slow the breath, then everything else.',
		},
		'georgie-walsh': {
			tier: 'coach',
			role: 'Dietitian & Engine Coach',
			bio: 'Accredited sports dietitian and Engine Room coach. Georgie runs every nutrition consult (remote) and reads your InBody scan back to you in plain English.',
			specialities: ['Sports nutrition', 'Engine work', 'Body composition'],
			disciplines: ['lab', 'conditioning'],
			credentials: ['Accredited Sports Dietitian', 'Cert IV Fitness'],
			quote: 'Measure, change one thing, measure again.',
		},
	} satisfies Record<string, CoachMeta>,

	tiers: {
		coach: { label: 'Coach', blurb: 'Qualified, experienced, on the floor every day.' },
		senior: { label: 'Senior coach', blurb: 'Specialists with five-plus years and a speciality.' },
		head: { label: 'Head coach', blurb: 'The two people who wrote the programmes.' },
	},

	/**
	 * Training Block thresholds: the automatic "Block" discounts in the store
	 * (minimum-purchase discounts). Shown as collars on the Bar. The cart totals
	 * are always the truth; these only drive the progress copy.
	 */
	blockThresholds: [
		{ amount: 100, percent: 10, label: 'Loaded' },
		{ amount: 250, percent: 15, label: 'Heavy' },
	],

	/** Curated Training Blocks: bundles booked in one order so the threshold discount applies. */
	blocks: [
		{
			key: 'fight-week',
			name: 'Fight Week',
			plate: 'blue',
			tagline: 'Three fight sessions and a contrast round to finish.',
			description: 'Pick any three fight classes in the next fortnight, then sit in the heat and the ice on the way out.',
			lines: [
				{ pick: { type: 'class', disciplines: ['fight'] }, count: 3, label: 'Fight class' },
				{ pick: { type: 'service', serviceKey: 'contrast-suite' }, count: 1, label: 'Contrast Suite' },
			],
		},
		{
			key: 'strong-start',
			name: 'Strong Start',
			plate: 'red',
			tagline: 'Get screened, then three hours with a coach.',
			description: 'A movement screen first, so your coach knows where to start, then three PT sessions to build your programme.',
			lines: [
				{ pick: { type: 'service', serviceKey: 'movement-screen' }, count: 1, label: 'Movement Screen' },
				{ pick: { type: 'service', serviceKey: 'personal-training' }, count: 3, label: 'Personal Training' },
			],
		},
		{
			key: 'engine-block',
			name: 'Engine Block',
			plate: 'yellow',
			tagline: 'Four conditioning classes and a body-comp baseline.',
			description: 'An InBody scan to set the baseline, then four conditioning classes: Engine Room, Sprint Lab or Hybrid Race Sim.',
			lines: [
				{ pick: { type: 'service', serviceKey: 'inbody-scan' }, count: 1, label: 'InBody Scan' },
				{ pick: { type: 'class', disciplines: ['conditioning'] }, count: 4, label: 'Conditioning class' },
			],
		},
		{
			key: 'recovery-ritual',
			name: 'Recovery Ritual',
			plate: 'green',
			tagline: 'Mobility, breath and heat, twice.',
			description: 'Two mobility classes and two recovery sessions, for the week you need to come back down.',
			lines: [
				{ pick: { type: 'class', disciplines: ['mobility'] }, count: 2, label: 'Mobility class' },
				{ pick: { type: 'service', serviceKey: 'contrast-suite' }, count: 2, label: 'Contrast Suite' },
			],
		},
	] satisfies TrainingBlock[],

	/** Memberships are a preview: launching 2027, not on sale. */
	memberships: {
		launch: 'Launching 2027',
		intro: 'Memberships are on the way. Until then, every session is pay-as-you-go, and Training Blocks get you the bar discount.',
		tiers: [
			{
				key: 'iron',
				name: 'Iron',
				plate: 'green',
				priceHint: 'from A$49',
				cadence: 'per week',
				includes: ['8 classes a month', 'Open Floor any time', '10% off recovery'],
			},
			{
				key: 'steel',
				name: 'Steel',
				plate: 'blue',
				priceHint: 'from A$69',
				cadence: 'per week',
				includes: ['Unlimited classes', 'One contrast round a week', 'Quarterly InBody scan', '10% off PT'],
			},
			{
				key: 'mettle',
				name: 'Mettle',
				plate: 'red',
				priceHint: 'from A$149',
				cadence: 'per week',
				includes: ['Unlimited classes and recovery', 'Two PT sessions a month', 'Lab testing each block', 'Guest passes'],
			},
		] satisfies MembershipTier[],
		founding: ['Founding rate held for life', 'Your name on the Engine House wall', 'First pick of the 2027 fight-night card'],
	},

	policies: {
		/** Free cancel/move up to this many hours before (product `cancelGap` wins when loaded). */
		cancelHours: 12,
		/** How far ahead the Floor shows classes. */
		bookingWindowDays: 28,
		/** Hold time in the cart, copy only (the cart's `expiresAt` is the truth). */
		holdMinutes: 15,
	},

	/** "3 left" turns urgent at or below this. */
	lowSeatsThreshold: 3,

	/** Remote sessions: the Join button opens this many minutes before the start. */
	joinWindowMinutes: 10,

	/** Midday shift: class START, local time, both ends inclusive (matches the automatic discount). */
	offPeak: { weekdays: [1, 2, 3, 4, 5], from: '11:00', to: '14:30', label: 'Midday shift', discountLabel: '20% off midday classes', percent: 20 },

	/** First-order offer copy (the discount itself is automatic). */
	introOffer: {
		title: 'First rep',
		percent: 25,
		headline: '25% off your first order',
		body: 'Your first order of classes is 25% off, applied at checkout. Or start with the free First Round intro.',
	},

	/** A code to mention in copy (it lives in the store). */
	promoCode: 'METTLE10',

	/** The free intro, by service key. */
	introService: 'first-round',

	/** The Floor axis (local hours). */
	floor: { startHour: 6, endHour: 22 },

	/** Appointment `customAttributes` keys the template writes. */
	customAttributeKeys: {
		/** "1" or "2": a partner session is one booking for two people. */
		people: 'people',
	},

	plates: {
		red: { hex: '#D7262E', ink: '#FFFFFF' },
		blue: { hex: '#1F5FBF', ink: '#FFFFFF' },
		yellow: { hex: '#F2C230', ink: '#121212' },
		green: { hex: '#1E9E5A', ink: '#FFFFFF' },
		white: { hex: '#F7F7F2', ink: '#121212' },
		black: { hex: '#0A0A0A', ink: '#F2EFE8' },
		steel: { hex: '#8A9399', ink: '#121212' },
	} satisfies Record<Plate, { hex: string; ink: string }>,

	nav: [
		{ label: 'Schedule', href: '/schedule' },
		{ label: 'Coaching', href: '/coaching' },
		{ label: 'Recovery', href: '/recovery' },
		{ label: 'Lab', href: '/lab' },
		{ label: 'Blocks', href: '/blocks' },
		{ label: 'Memberships', href: '/memberships' },
	],

	footerNav: [
		{ label: 'Coaches', href: '/coaches' },
		{ label: 'Events', href: '/events' },
		{ label: 'The Engine House', href: '/sites/collingwood' },
		{ label: 'The Yard', href: '/sites/cremorne' },
	],
};

export type SiteConfig = typeof siteConfig;

/* ------------------------------------------------------------------ Lookups */

export function disciplineMeta(slug: string | null | undefined): DisciplineMeta | null {
	if (!slug) return null;
	return (siteConfig.disciplines as Record<string, DisciplineMeta>)[slug] ?? null;
}

export function classMeta(classKey: string | null | undefined): ClassMeta | null {
	if (!classKey) return null;
	return (siteConfig.classes as Record<string, ClassMeta>)[classKey] ?? null;
}

export function serviceMeta(key: string | null | undefined): ServiceMeta | null {
	if (!key) return null;
	return (siteConfig.services as Record<string, ServiceMeta>)[key] ?? null;
}

export function siteMeta(locationSlug: string | null | undefined): SiteMeta | null {
	if (!locationSlug) return null;
	return (siteConfig.sites as Record<string, SiteMeta>)[locationSlug] ?? null;
}

export function siteMetaByKey(key: string | null | undefined): (SiteMeta & { slug: string }) | null {
	if (!key) return null;
	for (const [slug, meta] of Object.entries(siteConfig.sites as Record<string, SiteMeta>)) if (meta.key === key) return { ...meta, slug };
	return null;
}

export function coachMeta(staffSlug: string | null | undefined): CoachMeta | null {
	if (!staffSlug) return null;
	const all = siteConfig.coaches as Record<string, CoachMeta>;
	return all[staffSlug] ?? all[staffSlug.replace(/^staff-/, '')] ?? null;
}

export function plateHex(plate: Plate): string {
	return siteConfig.plates[plate].hex;
}

/** The plate for a discipline slug (steel when unknown). */
export function plateFor(discipline: string | null | undefined): Plate {
	return disciplineMeta(discipline)?.plate ?? 'steel';
}
