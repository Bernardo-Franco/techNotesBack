const asyncHandler = require('express-async-handler');
const note = require('../models/Note');
const userModel = require('../models/User');
const User = require('../models/User');

const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await note.find().lean().exec();
    if (!notes?.length) {
        return res.status(200).json({ message: 'No notes created in the DDBB' });
    }
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))
    res.json(notesWithUser)
})

const createNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body;

    if (!user || !title || !text) {
        return res.status(404).json({ message: 'all fields are required' });
    }

    // check for duplicate title
    const duplicate = await note.findOne({ title }).collation({ locale:'en', strength:2 }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate note title'})
    }

    const checkUser = await userModel.findById(user).lean().exec();
    
    if (!checkUser) { 
        return res.status(404).json({ message: 'User does not exist' });
    }

    const newNote = await note.create({user, title, text})

    if (newNote) {
        res.status(200).json({ message:'note created successfully', newNote})
    }
});

const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body;

    if (!id || !user || !title || !text) {
        return res.status(400).json({ message: 'all fields are required' });
    }

    const checkUser = await userModel.findById(user).lean().exec();

    if (!checkUser) { 
        return res.status(404).json({ message: 'User does not exist' });
    }

    const noteToUpdate = await note.findById(id).exec();
    
    if (!noteToUpdate) {
        return res.status(404).json({ message: 'note not found'});
    }

    noteToUpdate.user = user;
    noteToUpdate.title = title;
    noteToUpdate.text = text;
    if (completed) {noteToUpdate.completed = completed;}

    const response = await noteToUpdate.save();

    res.json({ message: `${response.title} updated`  });
    
});

const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body;
    const noteToDelete = await note.findById(id);
    if (!noteToDelete) {
        return res.status(404).json({ message: 'note not found'});
    }
    const response = await noteToDelete.delete();
    res.json({ message: 'note deleted', response})
    
});

module.exports = { getAllNotes, createNote, updateNote, deleteNote };