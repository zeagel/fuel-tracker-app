import jwt_decode from 'jwt-decode';
import loginService from '../services/login';
import { setNotification } from './notificationReducer';
import { initializeUser } from './userReducer';

const loginReducer = (state = null, action) => {
  switch(action.type) {

    case 'LOGIN_USER':
      window.localStorage.setItem(
        'loggedFTAUser', JSON.stringify(action.data)
      );
      loginService.setToken(action.data);
      window.location.href = '/';
      return action.data;

    case 'LOGOUT_USER':
      window.localStorage.removeItem('loggedFTAUser');
      window.localStorage.removeItem('currentFTAPage');
      window.location.href = '/';
      return null;

    default:
      return state;
  }
};

// Action creators for loginReducer
export const loginUser = userObject => {
  return async dispatch => {
    try {
      const response = await loginService.login(userObject);
      dispatch({
        type: 'LOGIN_USER',
        data: response.token
      });
    } catch (error) {
      dispatch(setNotification({
        type: 'error',
        header: 'Kirjautuminen epäonnistui',
        content: 'Virheellinen käyttäjätunnus tai salasana',
        timeout: 3.5
      }));
    }
  };
};

export const setLoggedInUser = () => {
  return async dispatch => {
    const loggedUserJSON = window.localStorage.getItem('loggedFTAUser');
    if (loggedUserJSON) {
      const token = JSON.parse(loggedUserJSON);
      loginService.setToken(token);
      const user = jwt_decode(token);
      dispatch(initializeUser(user.id));
    }
  };
};

export const logoutUser = () => {
  return async dispatch => {
    dispatch({
      type: 'LOGOUT_USER',
      data: null
    });
  };
};

export default loginReducer;