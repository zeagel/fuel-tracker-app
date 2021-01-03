import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { Grid, Header, Segment, Message, Icon } from 'semantic-ui-react';
import VehicleRow from './VehicleRow';
import { setActiveItem } from '../../reducers/naviReducer';
import { initListStates } from '../../reducers/listStateReducer';
import './RefuelingList.css';
import EditRefuelingModal from './EditRefuelingModal';
import Notification from '../Notification/Notification';

const RefuelingList = ({ user }) => {
  const listStates = useSelector(state => state.listStates);
  const note = useSelector(state => state.note);

  const dispatch = useDispatch();

  useEffect(() => {
    // Define init states for vehicle specific refueling blocks and store the
    // state info in Redux storage in order to keep track which block is expanded
    // and which one is collapsed.
    if (user.vehicles && user.vehicles.length > 0 && listStates.length === 0) {
      const lists = user.vehicles.map(v => {
        if (user.primaryVehicle === v.id) {
          return { id: v.id, state: 'open' };
        } else {
          return { id: v.id, state: 'closed' };
        }
      });

      dispatch(initListStates(lists));
    }
  },[listStates, user.vehicles, user.primaryVehicle, dispatch]);

  if (!user.vehicles || user.vehicles.length === 0) {

    return (
      <Grid id='refueling-list-container' textAlign='center' verticalAlign='middle'>
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as='h2' color='orange' textAlign='center'>
            Viimeaikaiset tankkaukset
          </Header>
          <Message info>
            <Icon name='exclamation' />
            Ei lisättyjä ajoneuvoja.
            <NavLink
              to='/my-details'
              className='add-new-link'
              onClick={() => dispatch(setActiveItem('/my-details'))}
            > Lisää uusi?</NavLink>
          </Message>
        </Grid.Column>
      </Grid>
    );
  }

  const OwnedVehicleBlock = () => {
    const foundOwnedVehicles = user.vehicles.filter(vehicle =>
      vehicle.owner.id === user.id
    );

    if (foundOwnedVehicles.length === 0) {
      return null;
    }

    // Sort vehicles in alphabetical order.
    foundOwnedVehicles.sort((a, b) => a.name.localeCompare(b.name));

    return (
      <>
        <div className='sub-header'>
          Omistamani ajoneuvot
        </div>
        <Segment raised>
          {foundOwnedVehicles.map(vehicle => {
            return <VehicleRow
              key={vehicle.id}
              vehicle={vehicle}
              primary={user.primaryVehicle}
              listStates={listStates}
              user={user}
            />;
          })}
        </Segment>
      </>
    );
  };

  const CoOwnedVehicleBlock = () => {
    const foundCoOwnedVehicles = user.vehicles.filter(vehicle =>
      vehicle.owner.id !== user.id
    );

    if (foundCoOwnedVehicles.length === 0) {
      return null;
    }

    // Sort vehicles in alphabetical order.
    foundCoOwnedVehicles.sort((a, b) => a.name.localeCompare(b.name));

    return (
      <>
        <div className='sub-header'>
          Käyttämäni ajoneuvot
        </div>
        <Segment raised>
          {foundCoOwnedVehicles.map(vehicle => {
            return <VehicleRow
              key={vehicle.id}
              vehicle={vehicle}
              primary={user.primaryVehicle}
              listStates={listStates}
              user={user}
            />;
          })}
        </Segment>
      </>
    );
  };

  return (
    <>
      <Grid id='refueling-list-container' textAlign='center' verticalAlign='middle'>
        <Grid.Column>
          <Header as='h2' color='orange' textAlign='center'>
            Viimeaikaiset tankkaukset
          </Header>

          <OwnedVehicleBlock />

          <CoOwnedVehicleBlock />

          {note ? <Notification /> : null}

        </Grid.Column>
      </Grid>

      <EditRefuelingModal />
    </>
  );
};

export default RefuelingList;