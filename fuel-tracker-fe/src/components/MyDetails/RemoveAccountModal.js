import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Modal,
  Grid,
  Message,
  Icon
} from 'semantic-ui-react';
import Notification from '../Notification/Notification';
import { clearNotification } from '../../reducers/notificationReducer';
import { removeUserAccount } from '../../reducers/userReducer';

const RemoveAccountModal = () => {
  const [openModal, setOpenModal] = useState(false);
  const [actionButtonsDisabled, setActionButtonDisabled] = useState(false);
  const note = useSelector(state => state.note);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!note) {
      // Re-active modal action buttons again when the removal note
      // has been cleared.
      setActionButtonDisabled(false);
    }
  },[note]);

  const handleCancelOnClick = () => {
    setOpenModal(false);
  };

  const handleDelOnClick = () => {
    // Disable modal action buttons until the removal note has been cleared.
    setActionButtonDisabled(true);
    dispatch(removeUserAccount());
  };

  return (
    <Modal
      closeIcon={true}
      onClose={() => {
        setOpenModal(false);
        dispatch(clearNotification());
      }}
      onOpen={() => setOpenModal(true)}
      open={openModal}
      size='tiny'
      closeOnDimmerClick={false}
      closeOnEscape={false}
      trigger={
        <div
          className='data-row'
          onClick={() => dispatch(clearNotification())}
        >
          Poista tunnus
        </div>
      }
    >
      <Modal.Header>Poista käyttäjätunnus</Modal.Header>
      <Modal.Content>
        <Grid textAlign='center' verticalAlign='top'>
          <Grid.Column>

            <Message icon color='red'>
              <Icon name='warning sign' />
              <Message.Content style={{ textAlign: 'left' }}>
                <Message.Header>
                  Varoitus!
                </Message.Header>
                Oletko varma, että haluat poistaa käyttäjätunnuksesi ja kaikki
                siihen liitetyt ajoneuvot ja niiden tankkaukset?
              </Message.Content>
            </Message>

            {note ? <Notification /> : null}

          </Grid.Column>
        </Grid>
      </Modal.Content>
      <Modal.Actions>
        <Button
          color='black'
          content='Peruuta'
          icon='cancel'
          onClick={handleCancelOnClick}
          disabled={actionButtonsDisabled}
        />

        <Button
          color='red'
          content='Poista'
          icon='trash alternate'
          onClick={handleDelOnClick}
          disabled={actionButtonsDisabled}
        />

      </Modal.Actions>
    </Modal>
  );
};

export default RemoveAccountModal;
