import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Modal,
  Grid,
  Segment,
  Checkbox,
  Message
} from 'semantic-ui-react';
import { clearNotification, setNotification } from '../../reducers/notificationReducer';
import { addVehicleToUser } from '../../reducers/userReducer';
import Notification from '../Notification/Notification';
import VehicleInputBlock from './VehicleInputBlock';
import VehicleCoOwnerBlock from './VehicleCoOwnersBlock';

const AddVehicleModal = ({ user, users }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [faultyName, setFaultyName] = useState({ state: false, text: '' });
  const [licensePlateId, setLicensePlateId] = useState('');
  const [faultyLPId, setFaultyLPId] = useState({ state: false, text: '' });
  const [odoMeter, setOdoMeter] = useState('');
  const [faultyOdo, setFaultyOdo] = useState({ state: false, text: '' });
  const [coOwner, setCoOwner] = useState('');
  const [coOwners, setCoOwners] = useState([]);
  const [primaryVehicle, setPrimaryVehicle] = useState(false);
  const note = useSelector(state => state.note);
  const dispatch = useDispatch();

  // Aux function to reset all local storeges of the component.
  const resetAllStates = () => {
    dispatch(clearNotification());
    setName('');
    setLicensePlateId('');
    setOdoMeter('');
    setCoOwner('');
    setCoOwners([]);
    setPrimaryVehicle(false);
    setFaultyName({ state: false, text: '' });
    setFaultyLPId({ state: false, text: '' });
    setFaultyOdo({ state: false, text: '' });
  };

  const handleCancelOnClick = () => {
    resetAllStates();
    setOpen(false);
  };

  const handleResetOnClick = () => {
    resetAllStates();
  };

  const handleSaveOnClick = () => {
    if (!name || !licensePlateId || !odoMeter) {
      dispatch(setNotification({
        type: 'error',
        header: undefined,
        content: 'Virheellinen syöte',
        timeout: 3.5
      }));

    } else {
      dispatch(addVehicleToUser({
        vehicle: {
          name,
          licensePlateId,
          odoMeter,
          coOwners: coOwners.map(c => c.id)
        },
        primaryVehicle
      }));

      setName('');
      setLicensePlateId('');
      setOdoMeter('');
      setCoOwner('');
      setCoOwners([]);
      setPrimaryVehicle(false);
      setOpen(false);
    }
  };

  const handleAddCoOwnerOnClick = (e) => {

    // Make sure that given co-owner is not user himself.
    if (coOwner !== user.username) {

      // Make sure that given co-owner hasn't been added already.
      const coOwnerFound = coOwners.find(c => c.username === coOwner);
      if (!coOwnerFound) {

        // Make sure that given co-owner can be found from the service.
        const userFound = users.find(u => u.username === coOwner );
        if (userFound) {

          // Add new co-owner in the list and render it on the screen.
          const updatedCoOwners = [...coOwners];
          updatedCoOwners.push(userFound);
          setCoOwners(updatedCoOwners);
          setCoOwner('');

        } else {
          dispatch(setNotification({
            type: 'error',
            header: undefined,
            content: `Käyttäjää '${coOwner}' ei löydy. Tarkista antamasi tunnus.`,
            timeout: 3.5
          }));
        }

      } else {
        dispatch(setNotification({
          type: 'error',
          header: undefined,
          content: `Käyttäjä '${coOwnerFound.name}' on jo lisätty ajoneuvon toiseksi käyttäjäksi.`,
          timeout: 3.5
        }));
      }

    } else {
      dispatch(setNotification({
        type: 'error',
        header: undefined,
        content: 'Ajoneuvon omistajana et voi asettaa itseäsi toiseksi käyttäjäksi.',
        timeout: 3.5
      }));
    }
  };

  const handleDelCoOwnerOnClick = (user) => {
    let updatedCoOwners = [...coOwners];
    updatedCoOwners = updatedCoOwners.filter(c => c.id !== user.id);
    setCoOwners(updatedCoOwners);
  };

  const handlePrimaryVehicleOnChange = () => {
    primaryVehicle
      ? setPrimaryVehicle(false)
      : setPrimaryVehicle(true);
  };

  // Validator function for odometer input field.
  const handleVehicleNameOnBlur = () => {
    setFaultyName({ state: false, text: '' });

    if (!name) {
      setFaultyName({ state: true, text: 'Kenttä ei saa olla tyhjä.' });
    } else if (!(/^[\w]*(([a-zA-ZäöåÄÖÅ]+)|( )|(-))[\w]*$/).test(name)) {
      setFaultyName({ state: true, text: 'Nimi saa sisältää vain kirjaimia ja numeroita sekä yhden välilyönnin tai -viivan.' });
    } else if (name.length < 4) {
      setFaultyName({ state: true, text: 'Nimen oltava vähintään 4 merkkiä pitkä.' });
    } else if (name.length > 20) {
      setFaultyName({ state: true, text: 'Nimen enimmäispituus on 20 merkkiä.' });
    }
  };

  // Validator function for license plate id input field.
  const handleLPIdOnBlur = () => {
    setFaultyLPId({ state: false, text: '' });

    if (!licensePlateId) {
      setFaultyLPId({ state: true, text: 'Kenttä ei saa olla tyhjä.' });
    } else if (!(/(^[\D]{2,3}(-)[\d]{1,3}$)|(^[C][D](-)[\d]{1,4}$)/).test(licensePlateId)) {
      setFaultyLPId({ state: true, text: 'Rekisteritunnus tulee olla muodossa 2-3 kirjainta, väliviiva ja 1-3 numeroa (CD-alkuisena sallitaan 4 numeroa).' });
    }
  };

  // Validator function for odometer input field.
  const handleOdoMeterOnBlur = () => {
    setFaultyOdo({ state: false, text: '' });

    if (!odoMeter) {
      setFaultyOdo({ state: true, text: 'Kenttä ei saa olla tyhjä.' });
    } else if (isNaN(odoMeter)) {
      setFaultyOdo({ state: true, text: 'Matkamittarin lukema tulee olla numeerinen.' });
    } else if (Number(odoMeter) < 0) {
      setFaultyOdo({ state: true, text: 'Matkamittarin lukema ei saa olla negatiivinen.' });
    } else if (Number(odoMeter) > 5000000) {
      setFaultyOdo({ state: true, text: 'Matkamittarin lukema ei saa olla yli 5 000 000 km.' });
    }
  };

  // Aux function to identify is the new vehicle entry ready for saving.
  // This is used for controlling is the SAVE button enabled or disabled.
  const isEntryReadyForSave = () => {
    if (
      name && !faultyName.state &&
      licensePlateId && !faultyLPId.state &&
      odoMeter && !faultyOdo.state
    ) {
      return true;
    }
    return false;
  };

  return (
    <Modal
      closeIcon={true}
      onClose={() => {
        setOpen(false);
        dispatch(clearNotification());
      }}
      onOpen={() => setOpen(true)}
      open={open}
      size='tiny'
      closeOnDimmerClick={false}
      closeOnEscape={false}
      trigger={
        <Button
          color='blue'
          content='Lisää ajoneuvo'
          onClick={() => dispatch(clearNotification())}
        />
      }
    >
      <Modal.Header>Lisää ajoneuvo</Modal.Header>
      <Modal.Content>
        <Grid textAlign='center' verticalAlign='top'>
          <Grid.Column style={{ maxWidth: 400 }}>
            <Segment raised>

              <div className='vehicle-name-container'>
                <VehicleInputBlock
                  label='Ajoneuvon nimi:'
                  name='name'
                  value={name}
                  disabled={false}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleVehicleNameOnBlur}
                  blockStyle='vehicle-name'
                  inputError={faultyName.state}
                />
                <Checkbox
                  label='Ensisijainen'
                  className='primary-checkbox'
                  onChange={() => handlePrimaryVehicleOnChange()}
                />
              </div>

              {
                faultyName.state
                  ? <Message error content={faultyName.text} />
                  : null
              }

              <VehicleInputBlock
                label='Rekisterinumero:'
                name='licensePlateId'
                value={licensePlateId}
                disabled={false}
                onChange={(e) => setLicensePlateId(e.target.value)}
                onBlur={handleLPIdOnBlur}
                inputError={faultyLPId.state}
              />

              {
                faultyLPId.state
                  ? <Message error content={faultyLPId.text} />
                  : null
              }

              <VehicleInputBlock
                label='Matkamittarin lukema:'
                name='odoMeter'
                value={odoMeter}
                disabled={false}
                onChange={(e) => setOdoMeter(e.target.value)}
                onBlur={handleOdoMeterOnBlur}
                inputError={faultyOdo.state}
              />

              {
                faultyOdo.state
                  ? <Message error content={faultyOdo.text} />
                  : null
              }


              <VehicleCoOwnerBlock
                coOwner={coOwner}
                coOwners={coOwners}
                handleDelCoOwnerOnClick={handleDelCoOwnerOnClick}
                handleCoOwnerONChange={(e) => setCoOwner(e.target.value)}
                handleAddCoOwnerOnClick={handleAddCoOwnerOnClick}
              />

              {note ? <Notification /> : null}
            </Segment>
          </Grid.Column>
        </Grid>
      </Modal.Content>
      <Modal.Actions className='vehicle-modal-actions'>
        <Button
          color='black'
          content='Peruuta'
          icon='cancel'
          onClick={() => handleCancelOnClick()}
        />

        <Button
          color='blue'
          content='Tyhjennä'
          icon='erase'
          onClick={(e) => handleResetOnClick(e)}
        />

        <Button
          content="Tallenna"
          icon='checkmark'
          onClick={() => handleSaveOnClick()}
          positive
          disabled={!isEntryReadyForSave()}
        />
      </Modal.Actions>
    </Modal>
  );
};

export default AddVehicleModal;