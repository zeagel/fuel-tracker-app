import axios from 'axios';
import jwt_decode from 'jwt-decode';
const baseUrl = '/api/login';

let token = null;

const setToken = newToken => {
  token = `bearer ${newToken}`;
  return token;
};

const getToken = () => {
  return token;
};

const decodeToken = () => {
  return jwt_decode(token);
};

const login = async (userObject) => {
  const res = await axios.post(baseUrl, userObject);
  return res.data;
};

const verifyPwd = async (userObject) => {
  const config = {
    headers: { Authorization: getToken() }
  };

  try {
    await axios.post(`${baseUrl}/verify`, userObject, config);
    return true;

  } catch (error) {
    return false;
  }
};

export default {
  login,
  verifyPwd,
  setToken,
  getToken,
  decodeToken
};