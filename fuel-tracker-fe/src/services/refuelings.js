import axios from 'axios';
import loginService from './login';
const baseUrl = '/api/refuelings';

const addRefueling = async (reqObject) => {
  const config = {
    headers: { Authorization: loginService.getToken() }
  };

  const res = await axios.post(baseUrl, reqObject, config);
  return res.data;
};

const updateRefueling = async (reqObject) => {
  const config = {
    headers: { Authorization: loginService.getToken() }
  };

  const res = await axios.put(
    `${baseUrl}/${reqObject.refueling.id}/update`,
    reqObject,
    config
  );
  return res.data;
};

const removeRefueling = async (refuelingId) => {
  const config = {
    headers: { Authorization: loginService.getToken() }
  };

  const res = await axios.delete(`${baseUrl}/${refuelingId}`, config);
  return res.data;
};

export default {
  addRefueling,
  updateRefueling,
  removeRefueling
};