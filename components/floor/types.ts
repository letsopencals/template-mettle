/** Lookups the Floor needs beside the occurrences (plain JSON from the server). */
export interface FloorCoach {
	id: string;
	slug: string;
	name: string;
	firstName: string;
	image: string | null;
	role: string | null;
}

export interface FloorSite {
	key: string;
	id: string;
	nickname: string;
	name: string;
	online: boolean;
}
