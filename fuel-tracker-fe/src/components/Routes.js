import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Switch, Route, Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginForm from './LoginForm';
import NavBar from './NavBar/NavBar';
import RegistrationForm from './RegistrationForm/RegistrationForm';
import RefuelingList from './RefuelingList/RefuelingList';
import MyDetails from './MyDetails/MyDetails';
import { setLoggedInUser } from '../reducers/loginReducer';

const Routes = () => {
  const user = useSelector(state => state.user);
  const activePage = useSelector(state => state.navi);

  const dispatch = useDispatch();

  useEffect(() => {
    // Set user details if user is found from the local storage.
    if (Object.keys(user).length === 0) {
      dispatch(setLoggedInUser());
    }
  }, [user, dispatch]);

  return (
    <div>
      {
        // Display navbar only if user is logged in
        Object.keys(user).length !== 0
          ? <NavBar userName={user.name} />
          : null
      }

      {
        // Redirect user to login page is not logged in yet.
        Object.keys(user).length === 0
          ? <Redirect to='/login' />
          : <Redirect to={activePage} />
      }

      <Switch>
        <Route path='/login'>
          <LoginForm />
        </Route>
        <Route path='/register'>
          <RegistrationForm />
        </Route>
        <Route path='/my-details'>
          <MyDetails user={user} />
        </Route>
        <Route path='/refueling-list'>
          <RefuelingList user={user} />
        </Route>
      </Switch>
    </div>
  );
};

export default Routes;
