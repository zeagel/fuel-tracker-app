import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { Menu, Button, Icon } from 'semantic-ui-react';
import { initActiveItem, setActiveItem } from '../../reducers/naviReducer';
import { logoutUser } from '../../reducers/loginReducer';
import { clearNotification } from '../../reducers/notificationReducer';
import './NavBar.css';

const NavBar = ({ userName }) => {
  // Active navi item is handled via Redux store. This is so that it
  // is possible to highlight correct navi item also in the situations
  // when there is clicked a custom navi link outside the navibar, i.e.
  // on Refueling list when there are no vehicles yet.
  const activePage = useSelector(state => state.navi);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!activePage) {
      dispatch(initActiveItem('/refueling-list'));
    }
  },[activePage, dispatch]);

  const handleLogOutOnClick = () => {
    dispatch(logoutUser());
  };

  return (
    <>
      <Menu pointing secondary>
        <Menu.Item
          as={NavLink} to='/refueling-list'
          position='left'
          className='menu-item-spacing'
          active={activePage === '/refueling-list'}
          onClick={() => {
            dispatch(setActiveItem('/refueling-list'));
            dispatch(clearNotification());
          }}
        >
          <Icon name='car' />
          Tankkaukset
        </Menu.Item>
        <Menu.Item
          id="loggedUser"
          as={NavLink} to='/my-details'
          position='right'
          className='menu-item-spacing'
          active={activePage === '/my-details'}
          onClick={() => {
            dispatch(setActiveItem('/my-details'));
            dispatch(clearNotification());
          }}
        >
          <Icon name='user circle outline' />
          {userName}
        </Menu.Item>
        <Menu.Item>
          <Button
            onClick={handleLogOutOnClick}
            compact={true}
            icon='log out'
            content='Poistu'
          />
        </Menu.Item>
      </Menu>
    </>
  );
};

export default NavBar;