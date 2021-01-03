import axios from 'axios';
import loginService from './login';
const baseUrl = '/api/vehicles';

const addVehicle = async (reqObject) => {
  const config = {
    headers: { Authorization: loginService.getToken() }
  };

  const res = await axios.post(baseUrl, reqObject, config);
  return res.data;
};

const updateVehicle = async (reqObject) => {
  const config = {
    headers: { Authorization: loginService.getToken() }
  };

  const res = await axios.put(
    `${baseUrl}/${reqObject.vehicle.id}/update`,
    reqObject,
    config
  );
  return res.data;
};

const removeVehicle = async (vehicleId) => {
  const config = {
    headers: { Authorization: loginService.getToken() }
  };

  const res = await axios.delete(`${baseUrl}/${vehicleId}`, config);
  return res.data;
};

export default {
  addVehicle,
  updateVehicle,
  removeVehicle
};