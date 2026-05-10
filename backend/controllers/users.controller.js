const userService = require('../services/user.service');
const { dbErrorResponse } = require('../middleware/error.middleware');

function handleUserError(res, err) {
  if (err && err.statusCode) {
    return res.status(err.statusCode).json(err.payload);
  }
  return dbErrorResponse(res, err);
}

async function listUsers(req, res) {
  try {
    const users = await userService.listUsers();
    return res.json(users);
  } catch (err) {
    return handleUserError(res, err);
  }
}

async function createUser(req, res) {
  try {
    const user = await userService.createUser(req.body);
    return res.json(user);
  } catch (err) {
    return handleUserError(res, err);
  }
}

async function addFace(req, res) {
  try {
    const result = await userService.addFace(req.params.id, req.body);
    return res.json(result);
  } catch (err) {
    return handleUserError(res, err);
  }
}

async function updateUser(req, res) {
  try {
    const result = await userService.updateUser(req.params.id, req.body);
    return res.json(result);
  } catch (err) {
    return handleUserError(res, err);
  }
}

async function deleteUser(req, res) {
  try {
    const result = await userService.deleteUser(req.params.id);
    return res.json(result);
  } catch (err) {
    return handleUserError(res, err);
  }
}

module.exports = {
  listUsers,
  createUser,
  addFace,
  updateUser,
  deleteUser
};
