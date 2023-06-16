import { RequestHandler } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import NoteModel from "../models/note";
import UserModel from "../models/user";
import { assertIsDefined } from "../util/assertIsDefined";

export const getNotes: RequestHandler = async (req, res, next) => {
	const page = parseInt(req.query.page as string) || 1;
	const limit = parseInt(req.query.limit as string) || 5;

	try {
		const notes = await NoteModel.find()
			.skip((page - 1) * limit)
			.limit(limit)
			.exec();
		res.status(200).json(notes);
	} catch (error) {
		next(error);
	}
};

export const getUserNotes: RequestHandler = async (req, res, next) => {
	const userName = req.params.userName;
	const page = parseInt(req.query.page as string) || 1;
	const limit = parseInt(req.query.limit as string) || 5;
	try {
		const user = await UserModel.findOne({
			username: { $regex: new RegExp(userName, "i") },
		}).exec();

		if (!user) {
			return res.status(404).json({ message: "Usuario no encontrado" });
		}

		const userId = user._id;
		const notes = await NoteModel.find({ userId: userId })
			.skip((page - 1) * limit)
			.limit(limit)
			.exec();
		res.status(200).json(notes);
	} catch (error) {
		next(error);
	}
};

export const getNote: RequestHandler = async (req, res, next) => {
	const noteId = req.params.noteId;

	try {
		if (!mongoose.isValidObjectId(noteId)) {
			throw createHttpError(400, "Invalid note id");
		}

		const note = await NoteModel.findById(noteId).exec();

		if (!note) {
			throw createHttpError(404, "Note not found");
		}

		res.status(200).json(note);
	} catch (error) {
		next(error);
	}
};

interface CreateNoteBody {
	title?: string;
	img?: string;
}

export const createNote: RequestHandler<
	unknown,
	unknown,
	CreateNoteBody,
	unknown
> = async (req, res, next) => {
	const title = req.body.title;
	const img = req.body.img;
	const authenticatedUserId = req.session.userId;

	try {
		assertIsDefined(authenticatedUserId);

		if (!title) {
			throw createHttpError(400, "Note must have a title");
		}

		if (!img) {
			throw createHttpError(400, "Note must have a doodle");
		}

		const newNote = await NoteModel.create({
			userId: authenticatedUserId,
			title: title,
			img: img,
		});

		res.status(201).json(newNote);
	} catch (error) {
		next(error);
	}
};

interface UpdateNoteParams {
	noteId: string;
}

interface UpdateNoteBody {
	title?: string;
	img?: string;
}

export const updateNote: RequestHandler<
	UpdateNoteParams,
	unknown,
	UpdateNoteBody,
	unknown
> = async (req, res, next) => {
	const noteId = req.params.noteId;
	const newTitle = req.body.title;
	const newImg = req.body.img;
	const authenticatedUserId = req.session.userId;

	try {
		assertIsDefined(authenticatedUserId);

		if (!mongoose.isValidObjectId(noteId)) {
			throw createHttpError(400, "Invalid note id");
		}

		if (!newTitle) {
			throw createHttpError(400, "Note must have a title");
		}

		if (!newImg) {
			throw createHttpError(400, "Note must have a doodle");
		}

		const note = await NoteModel.findById(noteId).exec();

		if (!note) {
			throw createHttpError(404, "Note not found");
		}

		if (!note.userId.equals(authenticatedUserId)) {
			throw createHttpError(401, "You cannot access this note");
		}

		note.title = newTitle;
		note.img = newImg;

		const updatedNote = await note.save();

		res.status(200).json(updatedNote);
	} catch (error) {
		next(error);
	}
};

export const deleteNote: RequestHandler = async (req, res, next) => {
	const noteId = req.params.noteId;
	const authenticatedUserId = req.session.userId;

	try {
		assertIsDefined(authenticatedUserId);

		if (!mongoose.isValidObjectId(noteId)) {
			throw createHttpError(400, "Invalid note id");
		}

		const note = await NoteModel.findById(noteId).exec();

		if (!note) {
			throw createHttpError(404, "Note not found");
		}

		if (!note.userId.equals(authenticatedUserId)) {
			throw createHttpError(401, "You cannot access this note");
		}

		await note.deleteOne();

		res.sendStatus(204);
	} catch (error) {
		next(error);
	}
};
