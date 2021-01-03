import axios from 'axios';
import loginService from './login';
const baseUrl = '/api/users';

const getSimpleUserList = async () => {
  const config = {
    headers: { Authorization: loginService.getToken() }
  };

  const res = await axios.get(`${baseUrl}/simple`, config);
  return res.data;
};

const getUserById = async () => {
  const config = {
    headers: { Authorization: loginService.getToken() }
  };

  const user = loginService.decodeToken();

  const res = await axios.get(`${baseUrl}/${user.id}`, config);
  return res.data;
};

const addUser = async (userObject) => {
  const res = await axios.post(baseUrl, userObject);
  return res.data;
};

const updateUser = async (userObject) => {
  const config = {
    headers: { Authorization: loginService.getToken() }
  };

  const user = loginService.decodeToken();

  const res = await axios.put(`${baseUrl}/${user.id}/update`, userObject, config);

  return res.data;
};

const removeUser = async () => {
  const config = {
    headers: { Authorization: loginService.getToken() }
  };

  const user = loginService.decodeToken();

  const res = await axios.delete(`${baseUrl}/${user.id}`, config);

  return res.data;
};

export default {
  getSimpleUserList,
  getUserById,
  addUser,
  updateUser,
  removeUser
};