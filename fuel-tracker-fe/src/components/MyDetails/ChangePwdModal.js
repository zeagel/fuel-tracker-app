import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Modal,
  Input,
  Grid,
  Segment
} from 'semantic-ui-react';
import userService from '../../services/users';
import loginService from '../../services/login';
import { clearNotification, setNotification } from '../../reducers/notificationReducer';
import Notification from '../Notification/Notification';

const ChangePwdModal = ({ user }) => {
  const [openModal, setOpenModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const note = useSelector(state => state.note);

  const dispatch = useDispatch();

  const handleCancelOnClick = () => {
    dispatch(clearNotification());
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setOpenModal(false);
  };

  const handleSaveOnClick = async (event) => {
    dispatch(clearNotification());
    event.preventDefault();

    // Ensure that all input fields are filled.
    if (!currentPwd || !newPwd || !confirmPwd) {
      dispatch(setNotification({
        type: 'error',
        header: undefined,
        content: 'Virhe! Kaikki kolme kenttää on täytettävä.',
        timeout: 3.5
      }));

    // All fields filled -> let's verify inputs.
    } else  {

      // Ensure that the current password is valid.
      const result = await loginService.verifyPwd({ user: { password: currentPwd } });
      if (!result) {
        dispatch(setNotification({
          type: 'error',
          header: undefined,
          content: 'Nykyinen salasana on virheellinen.',
          timeout: 3.5
        }));

      // Ensure that new password fulfills criterias.
      } else if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,12}/.test(newPwd)) {
        dispatch(setNotification({
          type: 'error',
          header: undefined,
          content: 'Uuden salasanan tulee olla 6-12 merkkiä pitkä ja siinä oltava vähintään yksi kirjain, yksi numero ja yksi erikoismerkki.',
          timeout: 3.5
        }));

      // Ensure that new password and confirmation are same.
      } else if (newPwd !== confirmPwd) {
        dispatch(setNotification({
          type: 'error',
          header: undefined,
          content: 'Salasana ja sen toisto eivät vastaa toisiaan.',
          timeout: 3.5
        }));

      // Ensure that new password is different than the current one.
      } else if (newPwd === currentPwd) {
        dispatch(setNotification({
          type: 'error',
          header: undefined,
          content: 'Uusi salasana on sama kuin nykyinen.',
          timeout: 3.5
        }));

      // Verification OK -> let's set the new password.
      } else {
        const result = await userService.updateUser({ user: { password: newPwd } });

        if (result) {
          dispatch(setNotification({
            type: 'info',
            header: undefined,
            content: 'Salasana vaihdettu onnistuneesti.',
            timeout: 3.5
          }));

          setCurrentPwd('');
          setNewPwd('');
          setConfirmPwd('');

        } else {
          dispatch(setNotification({
            type: 'error',
            header: undefined,
            content: 'Palvelinvirhe! Salasanan vaihto epäonnistui. Yritä myöhemmin uudelleen.',
            timeout: 3.5
          }));
        }
      }
    }
  };

  return (
    <Modal
      closeIcon={true}
      onClose={() => {
        setOpenModal(false);
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
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
          Vaihda salasana
        </div>
      }
    >
      <Modal.Header>Vaihda salasana</Modal.Header>
      <Modal.Content>
        <Grid textAlign='center' verticalAlign='top'>
          <Grid.Column style={{ maxWidth: 400 }}>
            <Segment raised>
              <div>
                <div className='row-label'>
                  Nykyinen salasana:
                </div>
                <Input
                  className='change-pwd-input'
                  name='currentPwd'
                  type='password'
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                />
              </div>
              <div>
                <div className='row-label'>
                  Uusi salasana:
                </div>
                <Input
                  className='change-pwd-input'
                  name='newPwd'
                  type='password'
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                />
              </div>
              <div>
                <div className='row-label'>
                  Toista uusi salasana:
                </div>
                <Input
                  className='change-pwd-input'
                  name='confirmPwd'
                  type='password'
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                />
              </div>
              {note ? <Notification /> : null}
            </Segment>
          </Grid.Column>
        </Grid>
      </Modal.Content>
      <Modal.Actions>
        <Button
          content='Peruuta'
          color='black'
          icon='cancel'
          onClick={handleCancelOnClick}
        />

        <Button
          content="Tallenna"
          icon='checkmark'
          onClick={handleSaveOnClick}
          positive
          disabled={(currentPwd === '' && newPwd === '' && confirmPwd === '') ? true : false }
        />
      </Modal.Actions>
    </Modal>
  );
};

export default ChangePwdModal;