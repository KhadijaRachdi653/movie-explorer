import { Schema, model, models, type Model, type Types } from "mongoose";
import { SORT_OPTIONS, type SortOption } from "./discovery.types";

export const MAX_SAVED_SEARCHES_PER_USER = 20;

// Filtres enregistrés (mêmes critères que GET /api/search, sans la page)
export interface SearchFiltersDoc {
  query?: string;
  genre?: number;
  year?: number;
  minRating?: number;
  sortBy: SortOption;
}

export interface SavedSearchDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  filters: SearchFiltersDoc;
  createdAt: Date;
  updatedAt: Date;
}

const SearchFiltersSchema = new Schema<SearchFiltersDoc>(
  {
    query: { type: String, trim: true, maxlength: 100 },
    genre: { type: Number, min: 1 },
    year: { type: Number, min: 1900 },
    minRating: { type: Number, min: 0, max: 10 },
    sortBy: { type: String, enum: SORT_OPTIONS, default: "popularity" },
  },
  { _id: false }
);

const SavedSearchSchema = new Schema<SavedSearchDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    filters: { type: SearchFiltersSchema, required: true },
  },
  { timestamps: true, collection: "savedSearches" }
);

// Règle métier : pas deux recherches du même nom pour un utilisateur (insensible à la casse)
SavedSearchSchema.index({ userId: 1, name: 1 }, { unique: true, collation: { locale: "fr", strength: 2 } });

const SavedSearch: Model<SavedSearchDoc> =
  (models.SavedSearch as Model<SavedSearchDoc>) || model<SavedSearchDoc>("SavedSearch", SavedSearchSchema);

export default SavedSearch;
