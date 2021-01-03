import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Grid,
  Header,
  Segment,
  Divider
} from 'semantic-ui-react';
import AddVechicleModal from './AddVehicleModal';
import VehicleList from './VehicleList';
import Notification from '../Notification/Notification';
import ChangePwdModal from './ChangePwdModal';
import { initSimpleUserList } from '../../reducers/usersReducer';
import './MyDetails.css';
import RemoveAccountModal from './RemoveAccountModal';

const MyDetails = ({ user }) => {
  const note = useSelector(state => state.note);
  const users = useSelector(state => state.users);
  const dispatch = useDispatch();

  useEffect(() => {
    // Simple user list (for processing co-owners) is initialized only if the
    // list is empty AND logged in user details (including token) are available
    if (users.length === 0 && Object.keys(user).length !== 0) {
      dispatch(initSimpleUserList());
    }
  },[users, user, dispatch]);

  if (!user) {
    return null;
  }

  return (
    <div>
      <Grid textAlign='center' verticalAlign='top'>
        <Grid.Column style={{ maxWidth: 350 }}>
          <Header as='h2' color='orange' textAlign='center'>
            Omat tiedot
          </Header>
          <Segment raised>
            <div className='my-details-row'>
              <div className='row-label'>
                Nimi:
              </div>
              <div>
                {user.name}
              </div>
            </div>
            <div className='my-details-row'>
              <div className='row-label'>
                Käyttäjätunnus:
              </div>
              <div>
                {user.username}
              </div>
            </div>

            <Divider />
            <div className='my-details-row'>
              <div className='my-details-sub-row'>
                <ChangePwdModal user={user} />
                <RemoveAccountModal />
              </div>
            </div>
            <Divider />

            <div className='my-details-row'>
              <div className='row-label'>
                Ajoneuvot:
              </div>
              <VehicleList user={user} users={users} />
              <div className='my-details-row'>
                <AddVechicleModal user={user} users={users} />
              </div>
            </div>
            {note ? <Notification /> : null}
          </Segment>
        </Grid.Column>
      </Grid>
    </div>
  );
};

export default MyDetails;