import api from "./api";

export const searchService = {
  globalSearch: (query) =>
    api.get("/search", { params: { q: query } }).then((r) => r.data),
};
