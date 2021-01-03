import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import loginReducer from './reducers/loginReducer';
import userReducer from './reducers/userReducer';
import usersReducer from './reducers/usersReducer';
import naviReducer from './reducers/naviReducer';
import notificationReducer from './reducers/notificationReducer';
import refuelingReducer from './reducers/refuelingReducer';
import listStateReducer from './reducers/listStateReducer';

const reducer = combineReducers({
  login: loginReducer,
  note: notificationReducer,
  user: userReducer,
  users: usersReducer,
  navi: naviReducer,
  refueling: refuelingReducer,
  listStates: listStateReducer
});

export const store = createStore(
  reducer,
  composeWithDevTools(
    applyMiddleware(thunk)
  )
);

//store.subscribe(() => console.log(store.getState()))