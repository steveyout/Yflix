import axios, { AxiosInstance, AxiosError } from "axios";
import { MovieOrTV, DetailsAggregated, Genre } from "./types/movie";

const axiosInstance: AxiosInstance = axios.create({
  timeout: 15000,
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as any;

    if (!config) {
      return Promise.reject(error);
    }

    // Initialize or increment retry count
    config.__retryCount = config.__retryCount || 0;

    // Retry on network errors or 5xx server errors
    const isNetworkOrServerError = !error.response || (error.response.status >= 500);

    if (config.__retryCount < MAX_RETRIES && isNetworkOrServerError) {
      config.__retryCount += 1;
      console.warn(
        `[API Retry] Request failed (${error.message}). Retrying ${config.__retryCount}/${MAX_RETRIES} in ${RETRY_DELAY_MS}ms... URL: ${config.url}`
      );

      // Delay before next attempt
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

      // Retry the request using the same configuration
      return axiosInstance(config);
    }

    return Promise.reject(error);
  }
);

export const api = {
  // Config Status helper
  getConfigStatus: (): Promise<{ configured: boolean; baseUrl: string }> =>
    axiosInstance.get("/api/config-status").then((res) => res.data),

  // Movie catalog requests (backed by automatic retry logic)
  getTrending: (type = "all", timeWindow = "day"): Promise<{ results: MovieOrTV[] }> =>
    axiosInstance.get(`/api/movies/trending?type=${type}&time_window=${timeWindow}`).then((res) => res.data),

  getNowPlaying: (): Promise<{ results: MovieOrTV[] }> =>
    axiosInstance.get("/api/movies/now-playing").then((res) => res.data),

  getTopRated: (): Promise<{ results: MovieOrTV[] }> =>
    axiosInstance.get("/api/movies/top-rated?type=movie").then((res) => res.data),

  getUpcoming: (): Promise<{ results: MovieOrTV[] }> =>
    axiosInstance.get("/api/movies/upcoming").then((res) => res.data),

  getTrendingTV: (): Promise<{ results: MovieOrTV[] }> =>
    axiosInstance.get("/api/movies/trending-tv").then((res) => res.data),

  getPopularTV: (): Promise<{ results: MovieOrTV[] }> =>
    axiosInstance.get("/api/movies/popular-tv").then((res) => res.data),

  getTopRatedTV: (): Promise<{ results: MovieOrTV[] }> =>
    axiosInstance.get("/api/movies/top-rated-tv").then((res) => res.data),

  getGenres: (): Promise<{ movie: Genre[]; tv: Genre[] }> =>
    axiosInstance.get("/api/movies/genres").then((res) => res.data),

  getGenreDiscover: (genreId: number, categoryType: "movie" | "tv"): Promise<{ results: MovieOrTV[] }> =>
    axiosInstance.get(`/api/movies/genre/${genreId}?type=${categoryType}`).then((res) => res.data),

  search: (query: string): Promise<{ results: MovieOrTV[] }> =>
    axiosInstance.get(`/api/movies/search?query=${encodeURIComponent(query)}`).then((res) => res.data),

  getDetails: (mediaType: string, id: number): Promise<DetailsAggregated> =>
    axiosInstance.get(`/api/movies/details/${mediaType}/${id}`).then((res) => res.data),

  getSeasonEpisodes: (id: number, seasonNumber: number): Promise<any> =>
    axiosInstance.get(`/api/movies/tv/${id}/season/${seasonNumber}`).then((res) => res.data),
};

export default api;
