const { ProjectNote, User } = require("../models");

exports.getNotes = async (req, res) => {
  try {
    const notes = await ProjectNote.findAll({
      where: { projectId: req.params.id },
      include: [{ model: User, as: "Author", attributes: ["id", "name"] }],
      order: [["updatedAt", "DESC"]],
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notes" });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { title, content } = req.body || {};
    if (!title) return res.status(400).json({ message: "Title is required" });
    const note = await ProjectNote.create({
      title, content: content || "",
      projectId: req.params.id,
      createdById: req.user.id,
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: "Failed to create note" });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const note = await ProjectNote.findOne({ where: { id: req.params.noteId, projectId: req.params.id } });
    if (!note) return res.status(404).json({ message: "Note not found" });
    const { title, content } = req.body || {};
    if (title) note.title = title;
    if (content !== undefined) note.content = content;
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Failed to update note" });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const deleted = await ProjectNote.destroy({ where: { id: req.params.noteId, projectId: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete note" });
  }
};
