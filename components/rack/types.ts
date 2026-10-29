import type { Plate } from '@/lib/site-config';

/** What the slot rack needs per service (plain JSON from the server). */
export interface RackSeries {
	id: string;
	slug: string;
	label: string;
	price: number;
	durationMin: number;
	maxDurationMin: number | null;
	allowCustomDuration: boolean;
	capacity: number;
	advanceSeconds: number;
	siteIds: string[];
	coachIds: string[];
}

export interface RackOffering {
	key: string;
	title: string;
	short: string;
	tagline: string;
	description: string;
	plate: Plate;
	includes: string[];
	whatToBring: string[];
	lengths: number[] | null;
	stepMin: number;
	people: number;
	image: string | null;
	series: RackSeries[];
}

export interface RackCoach {
	id: string;
	slug: string;
	name: string;
	firstName: string;
	image: string | null;
	tier: string | null;
	role: string | null;
	siteIds: string[];
}

export interface RackSite {
	id: string;
	key: string;
	name: string;
	nickname: string;
	online: boolean;
}
