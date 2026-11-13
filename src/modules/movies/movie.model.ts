import { Schema, model, models, type Model, type Types } from "mongoose";

export interface MovieDoc {
  _id: Types.ObjectId;
  title: string;
  overview: string;
  posterUrl: string;
  year: number;
  genres: string[];
  director: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const MovieSchema = new Schema<MovieDoc>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    overview: { type: String, trim: true, default: "" },
    posterUrl: { type: String, trim: true, default: "" },
    year: { type: Number, required: true },
    genres: { type: [String], default: [] },
    director: { type: String, trim: true, default: "" },
    rating: { type: Number, min: 0, max: 10, default: 0 },
  },
  { timestamps: true, collection: "movies" }
);

const Movie: Model<MovieDoc> = (models.Movie as Model<MovieDoc>) || model<MovieDoc>("Movie", MovieSchema);

export default Movie;
