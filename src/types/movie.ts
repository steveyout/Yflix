// src/types/movie.ts

export interface Genre {
  id: number;
  name: string;
}

export interface MovieOrTV {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type?: "movie" | "tv";
  genre_ids?: number[];
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult?: boolean;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  air_date: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  vote_average: number;
  runtime?: number;
}

export interface Season {
  id: number;
  air_date: string;
  episode_count: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
}

export interface MovieDetail {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  tagline: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number; // for movie
  episode_run_time?: number[]; // for TV
  genres: Genre[];
  vote_average: number;
  status: string;
  number_of_seasons?: number; // for TV
  number_of_episodes?: number; // for TV
  seasons?: Season[]; // for tv
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
}

export interface DetailsAggregated {
  details: MovieDetail;
  credits: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  recommendations: {
    results: MovieOrTV[];
  };
  videos: {
    results: TMDBVideo[];
  };
}
